import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/leaderboard — top 100 players by MMR
router.get('/leaderboard', authenticateToken, async (_req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, username: true, avatarUrl: true, mmr: true, rank: true, level: true },
            orderBy: { mmr: 'desc' },
            take: 100,
        });
        const configs = await prisma.rankingConfig.findMany();
        const result = users.map((u, idx) => {
            const rankConfig = configs
                .filter(c => c.minMmr <= u.mmr)
                .sort((a, b) => b.minMmr - a.minMmr)[0] || null;
            return { position: idx + 1, ...u, rankConfig };
        });
        res.json(result);
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                matchHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: { players: { select: { id: true, username: true } } },
                },
                inventory: true
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const achievements = await prisma.userAchievement.findMany({
            where: { userId: user.id },
            orderBy: { date: 'desc' }
        });

        // Resolve equippedFrameConfig so the frontend can render the frame without extra fetches
        const equippedFrameInv = user.inventory.find(
            (inv: any) => inv.itemType === 'FRAME' && inv.isEquipped
        );
        let equippedFrameConfig: any = null;
        if (equippedFrameInv) {
            const frameItem = await prisma.storeItem.findUnique({ where: { id: equippedFrameInv.itemId } });
            if (frameItem?.frameConfig) {
                try { equippedFrameConfig = JSON.parse(frameItem.frameConfig); } catch {}
            }
        }

        const { passwordHash, ...safeUser } = user;

        // Resolve the rank config matching the user's current MMR
        const rankConfig = await prisma.rankingConfig.findFirst({
            where: { minMmr: { lte: user.mmr } },
            orderBy: { minMmr: 'desc' },
        });

        // Aggregate stats from full match history
        const [rankedPlayed, rankedWon, casualPlayed, casualWon] = await Promise.all([
            prisma.matchHistory.count({ where: { players: { some: { id: user.id } }, mode: 'RANKED' } }),
            prisma.matchHistory.count({ where: { players: { some: { id: user.id } }, mode: 'RANKED', winnerId: user.id } }),
            prisma.matchHistory.count({ where: { players: { some: { id: user.id } }, mode: 'CASUAL' } }),
            prisma.matchHistory.count({ where: { players: { some: { id: user.id } }, mode: 'CASUAL', winnerId: user.id } }),
        ]);
        const stats = {
            ranked: { played: rankedPlayed, won: rankedWon, winRate: rankedPlayed > 0 ? Math.round((rankedWon / rankedPlayed) * 100) : 0 },
            casual: { played: casualPlayed, won: casualWon, winRate: casualPlayed > 0 ? Math.round((casualWon / casualPlayed) * 100) : 0 },
        };

        // Self-heal: if accumulated XP exceeds the current-level threshold (level-up
        // not applied in a previous game), normalise and persist the correct values.
        let healedLevel = user.level;
        let healedXp = user.xp;
        while (healedXp >= healedLevel * 100) {
            healedXp -= healedLevel * 100;
            healedLevel++;
        }
        if (healedLevel !== user.level || healedXp !== user.xp) {
            await prisma.user.update({ where: { id: user.id }, data: { level: healedLevel, xp: healedXp } });
            (user as any).level = healedLevel;
            (user as any).xp = healedXp;
        }

        const recentMatches = (user.matchHistory || []).map((m: any) => ({
            id: m.id,
            mode: m.mode,
            won: m.winnerId === user.id,
            players: m.players.map((p: any) => p.username),
            duration: m.duration,
            createdAt: m.createdAt,
        }));
        
        res.json({ ...safeUser, achievements, equippedFrameConfig, rankConfig: rankConfig ?? null, stats, recentMatches });
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/users/me/language — update preferred language
router.patch('/me/language', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const { language } = req.body;
        if (!['en', 'pt', 'es'].includes(language)) {
            res.status(400).json({ error: 'Invalid language code' }); return;
        }
        await prisma.user.update({ where: { id: req.user.id }, data: { preferredLanguage: language } });
        res.json({ ok: true });
    } catch (err) {
        console.error('Language update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/users/me/password — change own password
router.put('/me/password', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ error: 'Current password and new password are required' }); return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({ error: 'New password must be at least 6 characters' }); return;
        }
        const bcrypt = await import('bcrypt');
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }
        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) { res.status(400).json({ error: 'Current password is incorrect' }); return; }
        const hash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: hash } });
        res.json({ success: true });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/users/profile/:username — public profile
router.get('/profile/:username', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { username: req.params.username },
            include: {
                matchHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: { players: { select: { id: true, username: true } } },
                },
                achievements: { orderBy: { date: 'desc' } },
            },
        });

        if (!user) { res.status(404).json({ error: 'User not found' }); return; }

        const rankConfig = await prisma.rankingConfig.findFirst({
            where: { minMmr: { lte: user.mmr } },
            orderBy: { minMmr: 'desc' },
        });

        const [wins, games, casualWins, casualGames] = await Promise.all([
            prisma.matchHistory.count({ where: { players: { some: { id: user.id } }, mode: 'RANKED', winnerId: user.id } }),
            prisma.matchHistory.count({ where: { players: { some: { id: user.id } }, mode: 'RANKED' } }),
            prisma.matchHistory.count({ where: { players: { some: { id: user.id } }, mode: 'CASUAL', winnerId: user.id } }),
            prisma.matchHistory.count({ where: { players: { some: { id: user.id } }, mode: 'CASUAL' } }),
        ]);

        const totalWins = wins + casualWins;
        const totalGames = games + casualGames;

        res.json({
            id: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            level: user.level,
            rank: user.rank,
            mmr: user.mmr,
            xp: user.xp,
            loginStreak: user.loginStreak,
            createdAt: user.createdAt,
            rankConfig: rankConfig ?? null,
            achievements: user.achievements,
            recentMatches: user.matchHistory.map(m => ({
                id: m.id,
                mode: m.mode,
                won: m.winnerId === user.id,
                players: m.players.map(p => p.username),
                createdAt: m.createdAt,
            })),
            stats: { wins: totalWins, games: totalGames, losses: totalGames - totalWins, winRate: totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0 },
        });
    } catch (err) {
        console.error('Public profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
