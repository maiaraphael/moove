import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

function getTodayDate(): string {
    const iso = new Date().toISOString();
    return iso.substring(0, 10); // "2024-01-15"
}

// GET /api/missions/daily — get (or assign) today's 3 missions for this user
router.get('/daily', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const today = getTodayDate();

        // Fetch today's assigned missions
        let todayMissions = await prisma.userDailyMission.findMany({
            where: { userId, date: today },
            include: { mission: true },
            orderBy: { id: 'asc' },
        });

        // If none assigned yet (new day), assign 3 random active missions
        if (todayMissions.length === 0) {
            const activeMissions = await prisma.dailyMission.findMany({
                where: { isActive: true },
            });
            if (activeMissions.length === 0) return res.json([]);

            // Pick up to 3 at random
            const shuffled = [...activeMissions].sort(() => Math.random() - 0.5).slice(0, 3);
            await prisma.userDailyMission.createMany({
                data: shuffled.map(m => ({
                    userId,
                    missionId: m.id,
                    date: today,
                    progress: 0,
                    completed: false,
                    claimed: false,
                })),
                skipDuplicates: true,
            });

            todayMissions = await prisma.userDailyMission.findMany({
                where: { userId, date: today },
                include: { mission: true },
                orderBy: { id: 'asc' },
            });
        }

        res.json(todayMissions);
    } catch (err) {
        console.error('Daily missions error:', err);
        res.status(500).json({ error: 'Failed to fetch missions' });
    }
});

// POST /api/missions/:id/claim — claim a completed mission's reward
router.post('/:id/claim', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const today = getTodayDate();
        const userMission = await prisma.userDailyMission.findFirst({
            where: { id: req.params.id, userId, date: today },
            include: { mission: true },
        });

        if (!userMission) return res.status(404).json({ error: 'Mission not found' });
        if (!userMission.completed) return res.status(400).json({ error: 'Mission not completed yet' });
        if (userMission.claimed) return res.status(400).json({ error: 'Reward already claimed' });

        await prisma.userDailyMission.update({
            where: { id: userMission.id },
            data: { claimed: true, claimedAt: new Date() },
        });

        // Grant XP and gems rewards
        await prisma.user.update({
            where: { id: userId },
            data: {
                gems: { increment: userMission.mission.gemsReward },
                xp: { increment: userMission.mission.xpReward },
            },
        });

        res.json({
            success: true,
            xpReward: userMission.mission.xpReward,
            gemsReward: userMission.mission.gemsReward,
        });
    } catch (err) {
        console.error('Claim mission error:', err);
        res.status(500).json({ error: 'Failed to claim mission' });
    }
});

export default router;
