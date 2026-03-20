import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/battlepass/current
router.get('/current', authenticateToken, async (req, res) => {
    try {
        const battlePass = await prisma.battlePass.findFirst({
            where: { isActive: true },
            include: {
                tiers: {
                    orderBy: { level: 'asc' },
                    include: {
                        freeItem: true,
                        premiumItem: true,
                    }
                }
            },
            orderBy: { season: 'desc' }
        });

        if (!battlePass) {
            return res.status(404).json({ error: 'No active Battle Pass found' });
        }

        res.json(battlePass);
    } catch (error) {
        console.error('BattlePass fetch error:', error);
        res.status(500).json({ error: 'Internal server error while fetching BattlePass.' });
    }
});

// POST /api/battlepass/buy-premium — purchase premium track with gems
router.post('/buy-premium', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.isPremium) return res.status(400).json({ error: 'Already premium for this season' });

        const battlePass = await prisma.battlePass.findFirst({
            where: { isActive: true },
            orderBy: { season: 'desc' }
        });
        if (!battlePass) return res.status(404).json({ error: 'No active Battle Pass found' });

        if (battlePass.price > 0) {
            if (user.gems < battlePass.price) {
                return res.status(400).json({ error: 'Insufficient gems', required: battlePass.price, current: user.gems });
            }
            await prisma.user.update({
                where: { id: userId },
                data: { gems: { decrement: battlePass.price }, isPremium: true }
            });
        } else {
            await prisma.user.update({ where: { id: userId }, data: { isPremium: true } });
        }

        res.json({ success: true, price: battlePass.price });
    } catch (error) {
        console.error('Buy premium error:', error);
        res.status(500).json({ error: 'Failed to purchase premium pass' });
    }
});

export default router;
