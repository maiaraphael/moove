import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/battlepass/current
router.get('/current', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
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

        // Attach claimed tiers for this user
        let claimedTiers: { tierId: string; track: string }[] = [];
        if (userId) {
            const tierIds = battlePass.tiers.map(t => t.id);
            const claims = await prisma.battlePassClaim.findMany({
                where: { userId, tierId: { in: tierIds } },
                select: { tierId: true, track: true }
            });
            claimedTiers = claims;
        }

        res.json({ ...battlePass, claimedTiers });
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
            if (user.credits < battlePass.price) {
                return res.status(400).json({ error: 'Saldo insuficiente', required: battlePass.price, current: user.credits });
            }
            await prisma.user.update({
                where: { id: userId },
                data: { credits: { decrement: battlePass.price }, isPremium: true }
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

// POST /api/battlepass/claim/:tierId — claim free or premium reward for an unlocked tier
router.post('/claim/:tierId', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { track } = req.body; // "free" | "premium"
        if (track !== 'free' && track !== 'premium') {
            return res.status(400).json({ error: 'track must be "free" or "premium"' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const tier = await prisma.battlePassTier.findUnique({
            where: { id: req.params.tierId },
            include: { freeItem: true, premiumItem: true }
        });
        if (!tier) return res.status(404).json({ error: 'Tier not found' });

        // Check level requirement
        if (user.level < tier.level) {
            return res.status(403).json({ error: 'Tier not yet unlocked' });
        }

        // Check premium requirement
        if (track === 'premium' && !user.isPremium) {
            return res.status(403).json({ error: 'Premium pass required' });
        }

        // Check not already claimed
        const existing = await prisma.battlePassClaim.findUnique({
            where: { userId_tierId_track: { userId, tierId: tier.id, track } }
        });
        if (existing) return res.status(409).json({ error: 'Already claimed' });

        // Calculate rewards
        const gems = track === 'free' ? tier.freeGems : tier.premiumGems;
        const item = track === 'free' ? tier.freeItem : tier.premiumItem;
        const itemId = track === 'free' ? tier.freeItemId : tier.premiumItemId;

        // Apply rewards in a transaction
        await prisma.$transaction(async (tx) => {
            // Gems reward
            if (gems > 0) {
                await tx.user.update({ where: { id: userId }, data: { gems: { increment: gems } } });
            }
            // Item reward — add to inventory (skip if already owned)
            if (item && itemId) {
                const alreadyOwned = await tx.inventory.findUnique({
                    where: { userId_itemId_itemType: { userId, itemId, itemType: item.type } }
                });
                if (!alreadyOwned) {
                    await tx.inventory.create({
                        data: { userId, itemId, itemType: item.type }
                    });
                }
            }
            // Record claim
            await tx.battlePassClaim.create({
                data: { userId, tierId: tier.id, track }
            });
        });

        res.json({ success: true, gems, itemName: item?.name ?? null });
    } catch (error) {
        console.error('Claim error:', error);
        res.status(500).json({ error: 'Failed to claim reward' });
    }
});

export default router;
