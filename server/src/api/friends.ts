import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { emitToUser } from '../multiplayer/roomManager';

const router = Router();

// Shape of a friend entry returned to the client
async function formatFriend(userId: string, friend: any) {
    return {
        id: friend.id,
        username: friend.username,
        avatarUrl: friend.avatarUrl,
        level: friend.level,
        rank: friend.rank,
        mmr: friend.mmr,
    };
}

// GET /api/friends — list accepted friends
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const myId = req.user!.id;
        const rows = await prisma.friendship.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [{ requesterId: myId }, { addresseeId: myId }],
            },
            include: {
                requester: { select: { id: true, username: true, avatarUrl: true, level: true, rank: true, mmr: true } },
                addressee: { select: { id: true, username: true, avatarUrl: true, level: true, rank: true, mmr: true } },
            },
        });

        const friends = rows.map(r => {
            const friend = r.requesterId === myId ? r.addressee : r.requester;
            return friend;
        });

        res.json(friends);
    } catch (err) {
        console.error('Get friends error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/friends/requests/incoming — pending requests sent to me
router.get('/requests/incoming', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const myId = req.user!.id;
        const rows = await prisma.friendship.findMany({
            where: { addresseeId: myId, status: 'PENDING' },
            include: {
                requester: { select: { id: true, username: true, avatarUrl: true, level: true, rank: true } },
            },
        });
        res.json(rows.map(r => ({ friendshipId: r.id, ...r.requester })));
    } catch (err) {
        console.error('Incoming requests error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/friends/requests/outgoing — pending requests I sent
router.get('/requests/outgoing', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const myId = req.user!.id;
        const rows = await prisma.friendship.findMany({
            where: { requesterId: myId, status: 'PENDING' },
            include: {
                addressee: { select: { id: true, username: true, avatarUrl: true, level: true, rank: true } },
            },
        });
        res.json(rows.map(r => ({ friendshipId: r.id, ...r.addressee })));
    } catch (err) {
        console.error('Outgoing requests error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/friends/request — send friend request by username
router.post('/request', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const myId = req.user!.id;
        const { username } = req.body;

        if (!username || typeof username !== 'string') {
            res.status(400).json({ error: 'Username required' });
            return;
        }
        if (username.toLowerCase() === req.user!.username.toLowerCase()) {
            res.status(400).json({ error: 'Cannot add yourself' });
            return;
        }

        const target = await prisma.user.findUnique({ where: { username } });
        if (!target) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Check if any relationship already exists in either direction
        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: myId, addresseeId: target.id },
                    { requesterId: target.id, addresseeId: myId },
                ],
            },
        });
        if (existing) {
            if (existing.status === 'ACCEPTED') {
                res.status(400).json({ error: 'Already friends' });
            } else if (existing.status === 'PENDING') {
                res.status(400).json({ error: 'Request already pending' });
            } else {
                // DECLINED — allow a new request by updating status
                await prisma.friendship.update({ where: { id: existing.id }, data: { status: 'PENDING', requesterId: myId, addresseeId: target.id } });
                res.json({ ok: true });
            }
            return;
        }

        await prisma.friendship.create({ data: { requesterId: myId, addresseeId: target.id } });

        // Notify the target in real-time
        emitToUser(target.id, 'notification:friend_request', {
            fromId: myId,
            from: req.user!.username,
        });

        res.json({ ok: true });
    } catch (err) {
        console.error('Send friend request error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/friends/accept/:friendshipId
router.post('/accept/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const myId = req.user!.id;
        const row = await prisma.friendship.findUnique({ where: { id: req.params.id } });
        if (!row || row.addresseeId !== myId || row.status !== 'PENDING') {
            res.status(400).json({ error: 'Invalid request' });
            return;
        }
        await prisma.friendship.update({ where: { id: row.id }, data: { status: 'ACCEPTED' } });

        // Notify the requester that their request was accepted
        emitToUser(row.requesterId, 'notification:friend_accepted', {
            fromId: myId,
            from: req.user!.username,
        });

        res.json({ ok: true });
    } catch (err) {
        console.error('Accept friend error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/friends/decline/:friendshipId
router.post('/decline/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const myId = req.user!.id;
        const row = await prisma.friendship.findUnique({ where: { id: req.params.id } });
        if (!row || row.addresseeId !== myId || row.status !== 'PENDING') {
            res.status(400).json({ error: 'Invalid request' });
            return;
        }
        await prisma.friendship.update({ where: { id: row.id }, data: { status: 'DECLINED' } });
        res.json({ ok: true });
    } catch (err) {
        console.error('Decline friend error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/friends/:userId — remove friend or cancel outgoing request
router.delete('/:userId', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const myId = req.user!.id;
        const targetId = req.params.userId;
        const row = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: myId, addresseeId: targetId },
                    { requesterId: targetId, addresseeId: myId },
                ],
            },
        });
        if (!row) {
            res.status(404).json({ error: 'Friendship not found' });
            return;
        }
        await prisma.friendship.delete({ where: { id: row.id } });
        res.json({ ok: true });
    } catch (err) {
        console.error('Remove friend error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/friends/challenge/:userId — challenge a friend to a match
router.post('/challenge/:userId', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const myId = req.user!.id;
        const targetId = String(req.params.userId);

        // Must be friends
        const friendship = await prisma.friendship.findFirst({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { requesterId: myId, addresseeId: targetId },
                    { requesterId: targetId, addresseeId: myId },
                ],
            },
        });
        if (!friendship) { res.status(400).json({ error: 'Not friends' }); return; }

        const challengeId = Math.random().toString(36).slice(2, 8).toUpperCase();

        emitToUser(targetId, 'notification:friend_challenge', {
            fromId: myId,
            from: req.user!.username,
            challengeId,
        });

        res.json({ ok: true, challengeId });
    } catch (err) {
        console.error('Challenge error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
