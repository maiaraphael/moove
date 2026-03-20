import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';

const router = Router();
console.log('Admin routes initialized');

// Middleware to ensure admin or moderator
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MODERATOR') {
        return res.status(403).json({ error: 'Access denied: requires Admin or Moderator role' });
    }
    next();
};

router.use(authenticateToken, requireAdmin);

// Dashboard Statistics Overview
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await prisma.user.count();
        const activeMatches = await prisma.matchHistory.count({ where: { mode: 'RANKED' } }); // Mock stat for now
        const storeItems = await prisma.storeItem.count();
        const activeTournaments = await prisma.tournament.count({ where: { status: 'ONGOING' }});

        res.json({ totalUsers, activeMatches, storeItems, activeTournaments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Users Management
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, email: true, mmr: true, rank: true, status: true, createdAt: true, role: true, credits: true, gems: true }
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create User (with role)
router.post('/users', async (req: AuthRequest, res) => {
    try {
        const { username, email, password, role } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        const allowedRoles = ['USER', 'MODERATOR', 'ADMIN'];
        const userRole = allowedRoles.includes(role) ? role : 'USER';

        // Only ADMIN can create ADMIN accounts
        if (userRole === 'ADMIN' && req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only administrators can create admin accounts' });
        }

        const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
        if (existing) {
            return res.status(409).json({ error: 'Username or email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: { username, email, passwordHash, role: userRole }
        });

        const { passwordHash: _, ...safeUser } = newUser;
        res.status(201).json(safeUser);
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Adjust User Currency (credits / gems)
router.put('/users/:id/currency', async (req, res) => {
    try {
        const { id } = req.params;
        const creditsAdjust = parseInt(String(req.body.creditsAdjust)) || 0;
        const gemsAdjust    = parseInt(String(req.body.gemsAdjust))    || 0;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const updated = await prisma.user.update({
            where: { id },
            data: {
                credits: Math.max(0, user.credits + creditsAdjust),
                gems:    Math.max(0, user.gems    + gemsAdjust)
            }
        });

        res.json({ success: true, credits: updated.credits, gems: updated.gems });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update currency' });
    }
});

// Set User MMR directly
router.put('/users/:id/mmr', async (req, res) => {
    try {
        const { id } = req.params;
        const mmr = parseInt(String(req.body.mmr));
        if (isNaN(mmr) || mmr < 0) {
            res.status(400).json({ error: 'MMR must be a non-negative integer' });
            return;
        }
        const updated = await prisma.user.update({
            where: { id },
            data: { mmr }
        });
        res.json({ success: true, mmr: updated.mmr });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update MMR' });
    }
});

// User Status Management (Ban / Active)
router.put('/users/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Expects 'ACTIVE', 'BANNED', 'SUSPENDED'

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { status }
        });
        
        res.json({ success: true, user: { id: updatedUser.id, status: updatedUser.status } });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// Update User Password
router.put('/users/:id/password', async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 chars' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { id },
            data: { passwordHash }
        });

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// Delete User
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id } });
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Store Items Management
router.get('/store', async (req, res) => {
    try {
        const items = await prisma.storeItem.findMany();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
});

router.post('/store', async (req, res) => {
    try {
        const { name, type, rarity, price, currency, imageUrl, frameConfig, petConfig, isFeatured, isActive } = req.body;
        const newItem = await prisma.storeItem.create({
            data: {
                name,
                type,
                rarity: rarity || 'Common',
                price: parseInt(String(price)) || 0,
                currency: currency || 'Credits',
                imageUrl:    imageUrl    || null,
                frameConfig: frameConfig || null,
                petConfig:   petConfig   || null,
                isFeatured:  Boolean(isFeatured),
                isActive:    isActive !== false,
            }
        });
        res.json(newItem);
    } catch (err) {
        console.error('Store create error:', err);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

router.put('/store/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        // Whitelist only valid StoreItem fields to avoid Prisma errors
        const { name, type, rarity, price, currency, description, imageUrl, frameConfig, petConfig, isFeatured, isActive } = req.body;
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (type !== undefined) updateData.type = type;
        if (rarity !== undefined) updateData.rarity = rarity;
        if (price !== undefined) updateData.price = parseInt(String(price));
        if (currency !== undefined) updateData.currency = currency;
        if (description !== undefined) updateData.description = description;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (frameConfig !== undefined) updateData.frameConfig = frameConfig;
        if (petConfig !== undefined) updateData.petConfig = petConfig;
        if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);

        const updated = await prisma.storeItem.update({
            where: { id: itemId },
            data: updateData
        });
        res.json(updated);
    } catch (err) {
        console.error('Store update error:', err);
        res.status(500).json({ error: 'Failed to update item' });
    }
});


router.delete('/store/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Must delete inventory records first (FK constraint)
        await prisma.inventory.deleteMany({ where: { itemId: id } });
        await prisma.storeItem.delete({ where: { id } });
        res.json({ success: true });
    } catch(err) {
        console.error('Store delete error:', err);
        res.status(500).json({ error: 'Failed to delete store item' });
    }
});

// Ranking Configuration Management
router.get('/ranks', async (req, res) => {
    try {
        const ranks = await prisma.rankingConfig.findMany({
            orderBy: { minMmr: 'asc' }
        });
        res.json(ranks);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch ranks' });
    }
});

router.post('/ranks', async (req, res) => {
    try {
        const { name, minMmr, color, iconUrl } = req.body;
        if (!name || minMmr === undefined) {
            res.status(400).json({ error: 'name and minMmr are required' });
            return;
        }
        const { mmrPenalty } = req.body;
        const newRank = await prisma.rankingConfig.create({
            data: {
                name,
                minMmr: parseInt(String(minMmr)),
                color: color || 'text-gray-400',
                iconUrl: iconUrl || null,
                mmrPenalty: Boolean(mmrPenalty),
                iconScale: iconUrl !== undefined && req.body.iconScale !== undefined ? parseFloat(String(req.body.iconScale)) : 1,
            }
        });
        res.json(newRank);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create rank' });
    }
});

router.delete('/ranks/:id', async (req, res) => {
    try {
        await prisma.rankingConfig.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: 'Failed to delete rank'})
    }
});

router.put('/ranks/:id', async (req, res) => {
    try {
        const { name, minMmr, color, iconUrl, mmrPenalty } = req.body;
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (minMmr !== undefined) updateData.minMmr = parseInt(String(minMmr));
        if (color !== undefined) updateData.color = color;
        if (iconUrl !== undefined) updateData.iconUrl = iconUrl;
        if (mmrPenalty !== undefined) updateData.mmrPenalty = Boolean(mmrPenalty);
        if (req.body.iconScale !== undefined) updateData.iconScale = parseFloat(String(req.body.iconScale));
        const updated = await prisma.rankingConfig.update({
            where: { id: req.params.id },
            data: updateData,
        });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update rank' });
    }
});

// ─── Battle Pass Management ───────────────────────────────────────────────

router.get('/battlepass', async (req, res) => {
    try {
        const passes = await prisma.battlePass.findMany({
            orderBy: { season: 'desc' },
            include: { _count: { select: { tiers: true } } }
        });
        res.json(passes);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch battle passes' });
    }
});

router.post('/battlepass', async (req, res) => {
    try {
        const { name, season, price } = req.body;
        if (!name || season === undefined) {
            return res.status(400).json({ error: 'name and season are required' });
        }
        const bp = await prisma.battlePass.create({
            data: { name, season: parseInt(String(season)), price: parseInt(String(price ?? 0)), isActive: req.body.isActive !== false }
        });
        res.json(bp);
    } catch (err: any) {
        if (err?.code === 'P2002') return res.status(409).json({ error: 'A season with that number already exists' });
        res.status(500).json({ error: 'Failed to create battle pass' });
    }
});

router.put('/battlepass/:id', async (req, res) => {
    try {
        const { name, season, isActive, price } = req.body;
        const data: any = {};
        if (name !== undefined) data.name = name;
        if (season !== undefined) data.season = parseInt(String(season));
        if (isActive !== undefined) data.isActive = Boolean(isActive);
        if (price !== undefined) data.price = parseInt(String(price));
        const updated = await prisma.battlePass.update({ where: { id: req.params.id }, data });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update battle pass' });
    }
});

router.delete('/battlepass/:id', async (req, res) => {
    try {
        // Tiers cascade-deleted via schema onDelete: Cascade
        await prisma.battlePass.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete battle pass' });
    }
});

router.get('/battlepass/:id/tiers', async (req, res) => {
    try {
        const tiers = await prisma.battlePassTier.findMany({
            where: { battlePassId: req.params.id },
            include: { freeItem: true, premiumItem: true },
            orderBy: { level: 'asc' }
        });
        res.json(tiers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tiers' });
    }
});

router.post('/battlepass/:id/tiers', async (req, res) => {
    try {
        const { level, freeItemId, premiumItemId, freeGems, premiumGems } = req.body;
        if (level === undefined) return res.status(400).json({ error: 'level is required' });
        const tier = await prisma.battlePassTier.create({
            data: {
                battlePassId: req.params.id,
                level: parseInt(String(level)),
                freeItemId: freeItemId || null,
                freeGems: parseInt(String(freeGems ?? 0)),
                premiumItemId: premiumItemId || null,
                premiumGems: parseInt(String(premiumGems ?? 0)),
            },
            include: { freeItem: true, premiumItem: true }
        });
        res.json(tier);
    } catch (err: any) {
        if (err?.code === 'P2002') return res.status(409).json({ error: `Level ${req.body.level} already exists in this Battle Pass` });
        res.status(500).json({ error: 'Failed to create tier' });
    }
});

router.put('/battlepass/:id/tiers/:tierId', async (req, res) => {
    try {
        const data: any = {};
        if ('freeItemId' in req.body) data.freeItemId = req.body.freeItemId || null;
        if ('freeGems' in req.body) data.freeGems = parseInt(String(req.body.freeGems ?? 0));
        if ('premiumItemId' in req.body) data.premiumItemId = req.body.premiumItemId || null;
        if ('premiumGems' in req.body) data.premiumGems = parseInt(String(req.body.premiumGems ?? 0));
        const updated = await prisma.battlePassTier.update({
            where: { id: req.params.tierId },
            data,
            include: { freeItem: true, premiumItem: true }
        });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update tier' });
    }
});

router.delete('/battlepass/:id/tiers/:tierId', async (req, res) => {
    try {
        await prisma.battlePassTier.delete({ where: { id: req.params.tierId } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete tier' });
    }
});

// Tournament Management
router.post('/tournaments', async (req, res) => {
    try {
        const parsedData = {
           ...req.body,
           startDate: new Date(req.body.startDate),
           endDate: new Date(req.body.endDate),
           entryFee: parseInt(req.body.entryFee),
           prizePool: parseInt(req.body.prizePool),
           maxPlayers: parseInt(req.body.maxPlayers)
        };
        const newTourney = await prisma.tournament.create({ data: parsedData });
        res.json(newTourney);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create tournament' });
    }
});

router.delete('/tournaments/:id', async (req, res) => {
    try {
        await prisma.tournament.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: 'Failed to delete tournament'})
    }
});

// ── VIP Config ──
router.get('/vip', async (_req, res) => {
    try {
        const vips = await prisma.vipConfig.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(vips);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch VIP configs' });
    }
});

router.post('/vip', async (req, res) => {
    try {
        const { name, description, imageUrl, price, durationDays, gemsBonus, xpBonus, noMmrLoss, isActive } = req.body;
        const vip = await prisma.vipConfig.create({
            data: {
                name,
                description: description || null,
                imageUrl: imageUrl || null,
                price: parseInt(String(price)) || 0,
                durationDays: parseInt(String(durationDays)) || 30,
                gemsBonus: parseInt(String(gemsBonus)) || 0,
                xpBonus: parseInt(String(xpBonus)) || 0,
                noMmrLoss: Boolean(noMmrLoss),
                isActive: isActive !== false,
            }
        });
        res.json(vip);
    } catch (err) {
        console.error('VIP create error:', err);
        res.status(500).json({ error: 'Failed to create VIP config' });
    }
});

router.put('/vip/:id', async (req, res) => {
    try {
        const { name, description, imageUrl, price, durationDays, gemsBonus, xpBonus, noMmrLoss, isActive } = req.body;
        const vip = await prisma.vipConfig.update({
            where: { id: req.params.id },
            data: {
                name,
                description: description || null,
                imageUrl: imageUrl || null,
                price: parseInt(String(price)) || 0,
                durationDays: parseInt(String(durationDays)) || 30,
                gemsBonus: parseInt(String(gemsBonus)) || 0,
                xpBonus: parseInt(String(xpBonus)) || 0,
                noMmrLoss: Boolean(noMmrLoss),
                isActive: Boolean(isActive),
            }
        });
        res.json(vip);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update VIP config' });
    }
});

router.delete('/vip/:id', async (req, res) => {
    try {
        await prisma.vipConfig.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete VIP config' });
    }
});

// ── Daily Missions CRUD ──
router.get('/missions', async (_req, res) => {
    try {
        const missions = await prisma.dailyMission.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(missions);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch missions' });
    }
});

router.post('/missions', async (req, res) => {
    try {
        const { title, description, type, parameter, requirement, xpReward, gemsReward, isActive } = req.body;
        const mission = await prisma.dailyMission.create({
            data: {
                title,
                description: description || '',
                type,
                parameter: parameter || null,
                requirement: parseInt(String(requirement)) || 1,
                xpReward: parseInt(String(xpReward)) || 0,
                gemsReward: parseInt(String(gemsReward)) || 0,
                isActive: isActive !== false,
            }
        });
        res.status(201).json(mission);
    } catch (err) {
        console.error('Create mission error:', err);
        res.status(500).json({ error: 'Failed to create mission' });
    }
});

router.put('/missions/:id', async (req, res) => {
    try {
        const { title, description, type, parameter, requirement, xpReward, gemsReward, isActive } = req.body;
        const mission = await prisma.dailyMission.update({
            where: { id: req.params.id },
            data: {
                title,
                description: description || '',
                type,
                parameter: parameter || null,
                requirement: parseInt(String(requirement)) || 1,
                xpReward: parseInt(String(xpReward)) || 0,
                gemsReward: parseInt(String(gemsReward)) || 0,
                isActive: isActive === true || isActive === 'true',
            }
        });
        res.json(mission);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update mission' });
    }
});

router.delete('/missions/:id', async (req, res) => {
    try {
        await prisma.dailyMission.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete mission' });
    }
});

export default router;
