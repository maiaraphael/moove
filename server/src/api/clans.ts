import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { emitToUser } from '../multiplayer/roomManager';

const router = Router();
router.use(authenticateToken);

const MEMBER_SELECT = {
    id: true, username: true, avatarUrl: true, mmr: true, rank: true, level: true,
};

// Recalculate and persist clan's totalMmr
async function recalcClanMmr(clanId: string) {
    const members = await prisma.clanMember.findMany({
        where: { clanId },
        include: { user: { select: { mmr: true } } },
    });
    const totalMmr = members.reduce((s, m) => s + m.user.mmr, 0);
    await prisma.clan.update({ where: { id: clanId }, data: { totalMmr } });
}

// GET /api/clans — clan leaderboard
router.get('/', async (_req, res) => {
    try {
        const clans = await prisma.clan.findMany({
            include: { members: { include: { user: { select: { mmr: true } } } } },
            orderBy: { totalMmr: 'desc' },
            take: 100,
        });
        res.json(clans.map(c => ({
            id: c.id, name: c.name, tag: c.tag,
            description: c.description, logoUrl: c.logoUrl, totalMmr: c.totalMmr,
            memberCount: c.members.length,
            avgMmr: c.members.length
                ? Math.round(c.members.reduce((s, m) => s + m.user.mmr, 0) / c.members.length)
                : 0,
        })));
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/clans/mine — my clan
router.get('/mine', async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const member = await prisma.clanMember.findUnique({
            where: { userId },
            include: {
                clan: {
                    include: {
                        members: {
                            include: { user: { select: MEMBER_SELECT } },
                            orderBy: { role: 'asc' },
                        },
                    },
                },
            },
        });
        if (!member) { res.json(null); return; }
        res.json({ ...member.clan, myRole: member.role });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/clans/:id
router.get('/:id', async (req, res) => {
    try {
        const clan = await prisma.clan.findUnique({
            where: { id: req.params.id },
            include: {
                members: {
                    include: { user: { select: MEMBER_SELECT } },
                    orderBy: { role: 'asc' },
                },
            },
        });
        if (!clan) { res.status(404).json({ error: 'Clan not found' }); return; }
        res.json(clan);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// POST /api/clans — create clan
router.post('/', async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const existing = await prisma.clanMember.findUnique({ where: { userId } });
        if (existing) { res.status(400).json({ error: 'Already in a clan' }); return; }

        const { name, tag, description } = req.body as { name?: string; tag?: string; description?: string };
        if (!name?.trim() || !tag?.trim()) { res.status(400).json({ error: 'Name and tag are required' }); return; }
        if (name.trim().length < 2 || name.trim().length > 32) {
            res.status(400).json({ error: 'Name must be 2–32 characters' }); return;
        }
        const cleanTag = tag.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (cleanTag.length < 2 || cleanTag.length > 5) {
            res.status(400).json({ error: 'Tag must be 2–5 alphanumeric characters' }); return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { mmr: true } });
        const clan = await prisma.clan.create({
            data: {
                name: name.trim(), tag: cleanTag,
                description: description?.trim() || null,
                totalMmr: user?.mmr ?? 0,
                members: { create: { userId, role: 'LEADER' } },
            },
            include: { members: { include: { user: { select: MEMBER_SELECT } } } },
        });
        res.json({ ...clan, myRole: 'LEADER' });
    } catch (err: any) {
        if (err?.code === 'P2002') { res.status(409).json({ error: 'Clan name or tag already taken' }); return; }
        console.error(err); res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/clans/:id/join
router.post('/:id/join', async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const already = await prisma.clanMember.findUnique({ where: { userId } });
        if (already) { res.status(400).json({ error: 'Already in a clan' }); return; }

        const clan = await prisma.clan.findUnique({ where: { id: req.params.id } });
        if (!clan) { res.status(404).json({ error: 'Clan not found' }); return; }

        await prisma.clanMember.create({ data: { userId, clanId: clan.id } });
        await recalcClanMmr(clan.id);

        // Notify all online clan members
        const members = await prisma.clanMember.findMany({ where: { clanId: clan.id } });
        const joiner = req.user!.username;
        for (const m of members) {
            if (m.userId !== userId) {
                emitToUser(m.userId, 'clan:member_joined', { username: joiner, clanName: clan.name });
            }
        }
        res.json({ ok: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// DELETE /api/clans/leave — leave my clan
router.delete('/leave', async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const member = await prisma.clanMember.findUnique({ where: { userId } });
        if (!member) { res.status(400).json({ error: 'Not in a clan' }); return; }

        if (member.role === 'LEADER') {
            const others = await prisma.clanMember.findMany({
                where: { clanId: member.clanId, userId: { not: userId } },
                orderBy: { role: 'asc' },
            });
            if (others.length === 0) {
                await prisma.clan.delete({ where: { id: member.clanId } });
                res.json({ ok: true, disbanded: true }); return;
            }
            await prisma.clanMember.update({ where: { id: others[0].id }, data: { role: 'LEADER' } });
        }
        await prisma.clanMember.delete({ where: { userId } });
        await recalcClanMmr(member.clanId);
        res.json({ ok: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// DELETE /api/clans/:id — disband (leader only)
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const member = await prisma.clanMember.findUnique({ where: { userId } });
        if (!member || member.clanId !== req.params.id || member.role !== 'LEADER') {
            res.status(403).json({ error: 'Only the clan leader can disband' }); return;
        }
        await prisma.clan.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// PUT /api/clans/:id/member/:memberId/role — promote/demote (leader only)
router.put('/:id/member/:memberId/role', async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const me = await prisma.clanMember.findUnique({ where: { userId } });
        if (!me || me.clanId !== req.params.id || me.role !== 'LEADER') {
            res.status(403).json({ error: 'Only the clan leader can change roles' }); return;
        }
        const { role } = req.body as { role?: string };
        if (!['OFFICER', 'MEMBER'].includes(role ?? '')) {
            res.status(400).json({ error: 'Invalid role. Use OFFICER or MEMBER' }); return;
        }
        const target = await prisma.clanMember.findUnique({ where: { id: req.params.memberId } });
        if (!target || target.clanId !== req.params.id) {
            res.status(404).json({ error: 'Member not found in this clan' }); return;
        }
        await prisma.clanMember.update({ where: { id: target.id }, data: { role: role as any } });
        res.json({ ok: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// DELETE /api/clans/:id/member/:userId — kick member (leader/officer)
router.delete('/:id/member/:targetUserId', async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const me = await prisma.clanMember.findUnique({ where: { userId } });
        if (!me || me.clanId !== req.params.id || me.role === 'MEMBER') {
            res.status(403).json({ error: 'Insufficient permissions' }); return;
        }
        const target = await prisma.clanMember.findUnique({ where: { userId: req.params.targetUserId } });
        if (!target || target.clanId !== req.params.id) {
            res.status(404).json({ error: 'Member not found' }); return;
        }
        if (target.role === 'LEADER') { res.status(400).json({ error: 'Cannot kick the leader' }); return; }
        await prisma.clanMember.delete({ where: { id: target.id } });
        await recalcClanMmr(req.params.id);
        res.json({ ok: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
