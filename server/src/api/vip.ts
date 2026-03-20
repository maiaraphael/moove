import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/vip/active — active VIP config for shop display
router.get('/active', async (_req, res) => {
    try {
        const vip = await prisma.vipConfig.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(vip ?? null);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch VIP config' });
    }
});

// POST /api/vip/buy — purchase VIP subscription (deducts Credits)
router.post('/buy', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const vip = await prisma.vipConfig.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        if (!vip) return res.status(404).json({ error: 'No VIP plan available' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true, vipExpiresAt: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.credits < vip.price) return res.status(400).json({ error: 'Insufficient credits' });

        // Stack VIP time if already active, otherwise start from now
        const base = user.vipExpiresAt && user.vipExpiresAt > new Date() ? user.vipExpiresAt : new Date();
        const vipExpiresAt = new Date(base.getTime() + vip.durationDays * 24 * 60 * 60 * 1000);

        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { decrement: vip.price },
                vipExpiresAt,
            }
        });

        res.json({ success: true, vipExpiresAt });
    } catch (err) {
        console.error('VIP buy error:', err);
        res.status(500).json({ error: 'Failed to purchase VIP' });
    }
});

export default router;
