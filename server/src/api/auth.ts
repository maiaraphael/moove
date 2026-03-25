import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../db';
import { z } from 'zod';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = Router();

const registerSchema = z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(6),
    language: z.enum(['en', 'pt', 'es']).optional().default('en'),
});

router.post('/register', async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);

        // Check if user exists
        const existing = await prisma.user.findFirst({
            where: { OR: [{ email: data.email }, { username: data.username }] }
        });

        if (existing) {
            res.status(400).json({ error: 'Username or email already in use' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.password, salt);

        const user = await prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                passwordHash,
                preferredLanguage: data.language,
            }
        });

        const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, xp: user.xp, level: user.level, credits: user.credits, gems: user.gems, rank: user.rank, mmr: user.mmr, vipExpiresAt: user.vipExpiresAt ?? null, preferredLanguage: user.preferredLanguage } });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid data', details: err.errors });
            return;
        }
        console.error('==== REGISTRATION ERROR LOG ====');
        console.error(err.message || err);
        console.error('===============================');
        res.status(500).json({ error: 'Internal server error', log: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            res.status(400).json({ error: 'Missing login or password' });
            return;
        }

        const user = await prisma.user.findFirst({
            where: { OR: [{ email: login }, { username: login }] }
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // ── Daily login bonus ─────────────────────────────────────
        const now = new Date();
        const todayStr = now.toISOString().substring(0, 10);
        const lastStr = user.lastLogin ? user.lastLogin.toISOString().substring(0, 10) : null;
        let loginStreak = user.loginStreak ?? 0;
        let loginBonus: { xp: number; gems: number; streak: number } | null = null;

        if (lastStr !== todayStr) {
            // Check if last login was yesterday (streak continues)
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().substring(0, 10);

            if (lastStr === yesterdayStr) {
                loginStreak = loginStreak + 1;
            } else {
                loginStreak = 1; // reset streak
            }

            // Rewards scale with streak (caps at day 7) — only virtual currency (gems), never credits
            const day = Math.min(loginStreak, 7);
            const bonusXp   = day * 20;   // 20, 40, 60 ... 140
            const bonusGems = day * 5;    // 5, 10, 15 ... 35

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLogin: now,
                    loginStreak,
                    xp:   { increment: bonusXp },
                    gems: { increment: bonusGems },
                },
            });

            loginBonus = { xp: bonusXp, gems: bonusGems, streak: loginStreak };
        } else {
            // Same day re-login — just update lastLogin timestamp
            await prisma.user.update({ where: { id: user.id }, data: { lastLogin: now } });
        }

        const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.json({
            token,
            loginBonus,
            user: { id: user.id, username: user.username, email: user.email, role: user.role, xp: user.xp, level: user.level, credits: user.credits, gems: user.gems, rank: user.rank, mmr: user.mmr, vipExpiresAt: user.vipExpiresAt ?? null, preferredLanguage: user.preferredLanguage },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── FORGOT PASSWORD ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            res.status(400).json({ error: 'Email required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        // Always respond OK to prevent email enumeration
        if (!user) {
            res.json({ ok: true });
            return;
        }

        // Invalidate existing tokens for this user
        await prisma.passwordResetToken.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

        await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

        if (process.env.SMTP_HOST) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT || 587),
                secure: process.env.SMTP_SECURE === 'true',
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            });
            await transporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@moove.gg',
                to: user.email,
                subject: 'Moove — Reset your password',
                html: `<p>Click the link below to reset your password. It expires in 1 hour.</p>
                       <p><a href="${resetUrl}">${resetUrl}</a></p>
                       <p>If you didn't request this, ignore this email.</p>`,
            });
        } else {
            // Dev mode: log the link to console
            console.log(`\n[DEV] Password reset link for ${user.email}:\n${resetUrl}\n`);
        }

        res.json({ ok: true });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── RESET PASSWORD ──────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password || password.length < 6) {
            res.status(400).json({ error: 'Invalid request' });
            return;
        }

        const record = await prisma.passwordResetToken.findUnique({ where: { token } });
        if (!record || record.used || record.expiresAt < new Date()) {
            res.status(400).json({ error: 'Token invalid or expired' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await prisma.user.update({ where: { id: record.userId }, data: { passwordHash } });
        await prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } });

        res.json({ ok: true });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
