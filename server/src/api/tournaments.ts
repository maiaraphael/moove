import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get active and upcoming tournaments
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        const tournaments = await prisma.tournament.findMany({
            where: {
                status: { in: ['UPCOMING', 'ONGOING'] }
            },
            orderBy: {
                startDate: 'asc'
            }
        });

        // Convert the participants count via manual query or just returning the structure the frontend expects
        const decorated = await Promise.all(tournaments.map(async (t) => {
            const count = await prisma.tournamentParticipant.count({ where: { tournamentId: t.id }});
            const isEnrolled = userId
                ? !!(await prisma.tournamentParticipant.findUnique({ where: { userId_tournamentId: { userId, tournamentId: t.id } } }))
                : false;
            return {
                // Legacy display fields (used by admin dashboard)
                id: t.id,
                title: t.name,
                name: t.name,
                description: t.description,
                prize: `${t.prizePool.toLocaleString()} Credits`,
                scope: t.scope,
                time: t.status === 'ONGOING' ? 'Live Now' : new Date(t.startDate).toLocaleDateString(),
                action: t.status === 'ONGOING' ? 'SPECTATE' : 'REGISTER',
                actionColor: t.status === 'ONGOING' ? 'bg-[#120a1f] border border-[#b026ff]/50' : 'bg-[#b026ff]',
                img: t.imageUrl || 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=1974&auto=format&fit=crop',
                players: `${count}/${t.maxPlayers}`,
                // Raw numeric fields (used by tournaments page)
                prizePool: t.prizePool,
                entryFee: t.entryFee,
                maxPlayers: t.maxPlayers,
                currentPlayers: count,
                status: t.status,
                isEnrolled,
            };
        }));

        res.json(decorated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed' });
    }
});

// POST /api/tournaments/:id/join — enroll (deducts gems if entry fee > 0)
router.post('/:id/join', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const tournament = await prisma.tournament.findUnique({ where: { id: req.params.id } });
        if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
        if (tournament.status !== 'UPCOMING') return res.status(400).json({ error: 'Tournament is not open for enrollment' });

        const count = await prisma.tournamentParticipant.count({ where: { tournamentId: tournament.id } });
        if (count >= tournament.maxPlayers) return res.status(400).json({ error: 'Tournament is full' });

        const existing = await prisma.tournamentParticipant.findUnique({
            where: { userId_tournamentId: { userId, tournamentId: tournament.id } }
        });
        if (existing) return res.status(409).json({ error: 'Already enrolled' });

        if (tournament.entryFee > 0) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || user.gems < tournament.entryFee) {
                return res.status(400).json({ error: 'Insufficient gems', required: tournament.entryFee, current: user?.gems ?? 0 });
            }
            await prisma.$transaction([
                prisma.user.update({ where: { id: userId }, data: { gems: { decrement: tournament.entryFee } } }),
                prisma.tournamentParticipant.create({ data: { userId, tournamentId: tournament.id } })
            ]);
        } else {
            await prisma.tournamentParticipant.create({ data: { userId, tournamentId: tournament.id } });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to join tournament' });
    }
});

// DELETE /api/tournaments/:id/leave — cancel enrollment (refunds gems)
router.delete('/:id/leave', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const tournament = await prisma.tournament.findUnique({ where: { id: req.params.id } });
        if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
        if (tournament.status !== 'UPCOMING') return res.status(400).json({ error: 'Cannot leave an ongoing or completed tournament' });

        const participant = await prisma.tournamentParticipant.findUnique({
            where: { userId_tournamentId: { userId, tournamentId: tournament.id } }
        });
        if (!participant) return res.status(404).json({ error: 'Not enrolled' });

        if (tournament.entryFee > 0) {
            await prisma.$transaction([
                prisma.user.update({ where: { id: userId }, data: { gems: { increment: tournament.entryFee } } }),
                prisma.tournamentParticipant.delete({ where: { userId_tournamentId: { userId, tournamentId: tournament.id } } })
            ]);
        } else {
            await prisma.tournamentParticipant.delete({
                where: { userId_tournamentId: { userId, tournamentId: tournament.id } }
            });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to leave tournament' });
    }
});

// ─── Bracket generation helper ────────────────────────────────────────────────
async function generateBracket(tournamentId: string) {
    const participants = await prisma.tournamentParticipant.findMany({
        where: { tournamentId },
        select: { userId: true },
    });
    if (participants.length < 2) throw new Error('Need at least 2 participants');

    // Shuffle
    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    // Next power of 2
    let size = 1;
    while (size < shuffled.length) size *= 2;
    const numRounds = Math.log2(size);

    // Build slot array (null = BYE)
    const slots: (string | null)[] = shuffled.map(p => p.userId);
    while (slots.length < size) slots.push(null);

    // Round 1 matches
    const round1: { tournamentId: string; round: number; matchIndex: number; player1Id: string | null; player2Id: string | null; winnerId: string | null; status: 'PENDING' | 'BYE' }[] = [];
    for (let mi = 0; mi < size / 2; mi++) {
        const p1 = slots[mi * 2] ?? null;
        const p2 = slots[mi * 2 + 1] ?? null;
        const isBye = !p1 || !p2;
        round1.push({
            tournamentId, round: 1, matchIndex: mi,
            player1Id: p1, player2Id: p2,
            winnerId: isBye ? (p1 ?? p2) : null,
            status: isBye ? 'BYE' : 'PENDING',
        });
    }

    // Later rounds (empty placeholders)
    const laterRounds: { tournamentId: string; round: number; matchIndex: number; player1Id: null; player2Id: null; winnerId: null; status: 'PENDING' }[] = [];
    for (let round = 2; round <= numRounds; round++) {
        const count = size / Math.pow(2, round);
        for (let mi = 0; mi < count; mi++) {
            laterRounds.push({ tournamentId, round, matchIndex: mi, player1Id: null, player2Id: null, winnerId: null, status: 'PENDING' });
        }
    }

    await prisma.tournamentMatch.createMany({ data: [...round1, ...laterRounds] });

    // Advance BYE winners from round 1 → round 2
    for (const match of round1.filter(m => m.status === 'BYE' && m.winnerId)) {
        const nextMatchIndex = Math.floor(match.matchIndex / 2);
        const isP1Slot = match.matchIndex % 2 === 0;
        const nextRoundMatch = await prisma.tournamentMatch.findFirst({
            where: { tournamentId, round: 2, matchIndex: nextMatchIndex },
        });
        if (nextRoundMatch) {
            await prisma.tournamentMatch.update({
                where: { id: nextRoundMatch.id },
                data: isP1Slot ? { player1Id: match.winnerId } : { player2Id: match.winnerId },
            });
        }
    }

    await prisma.tournament.update({
        where: { id: tournamentId },
        data: { bracketGenerated: true, status: 'ONGOING' },
    });
}

// POST /api/tournaments/:id/bracket/generate — admin only
router.post('/:id/bracket/generate', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MODERATOR') {
            return res.status(403).json({ error: 'Admin only' });
        }
        const tournament = await prisma.tournament.findUnique({ where: { id: req.params.id } });
        if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
        if (tournament.bracketGenerated) return res.status(400).json({ error: 'Bracket already generated' });

        await generateBracket(req.params.id);
        res.json({ ok: true });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Failed to generate bracket' });
    }
});

// GET /api/tournaments/:id/bracket
router.get('/:id/bracket', authenticateToken, async (req, res) => {
    try {
        const matches = await prisma.tournamentMatch.findMany({
            where: { tournamentId: req.params.id },
            orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
        });
        if (matches.length === 0) { res.json({ rounds: {}, bracketSize: 0 }); return; }

        // Collect unique player ids to resolve usernames
        const playerIds = [...new Set(
            matches.flatMap(m => [m.player1Id, m.player2Id, m.winnerId].filter(Boolean) as string[])
        )];
        const users = await prisma.user.findMany({
            where: { id: { in: playerIds } },
            select: { id: true, username: true, avatarUrl: true, mmr: true },
        });
        const userMap = Object.fromEntries(users.map(u => [u.id, u]));

        const enriched = matches.map(m => ({
            ...m,
            player1: m.player1Id ? userMap[m.player1Id] ?? null : null,
            player2: m.player2Id ? userMap[m.player2Id] ?? null : null,
            winner: m.winnerId ? userMap[m.winnerId] ?? null : null,
        }));

        // Group by round
        const rounds: Record<number, typeof enriched> = {};
        for (const m of enriched) {
            if (!rounds[m.round]) rounds[m.round] = [];
            rounds[m.round].push(m);
        }

        const bracketSize = (matches.filter(m => m.round === 1).length) * 2;
        res.json({ rounds, bracketSize, totalRounds: Math.max(...matches.map(m => m.round)) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch bracket' });
    }
});

// PUT /api/tournaments/:id/matches/:matchId/result — admin sets winner
router.put('/:id/matches/:matchId/result', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MODERATOR') {
            return res.status(403).json({ error: 'Admin only' });
        }
        const { winnerId } = req.body as { winnerId: string };
        if (!winnerId) return res.status(400).json({ error: 'winnerId required' });

        const match = await prisma.tournamentMatch.findUnique({ where: { id: req.params.matchId } });
        if (!match) return res.status(404).json({ error: 'Match not found' });
        if (match.tournamentId !== req.params.id) return res.status(400).json({ error: 'Match not in this tournament' });
        if (match.status === 'COMPLETED') return res.status(400).json({ error: 'Match already completed' });
        if (match.player1Id !== winnerId && match.player2Id !== winnerId) {
            return res.status(400).json({ error: 'Winner must be one of the match players' });
        }

        await prisma.tournamentMatch.update({
            where: { id: match.id },
            data: { winnerId, status: 'COMPLETED' },
        });

        // Advance winner to next round
        const nextRound = match.round + 1;
        const nextMatchIndex = Math.floor(match.matchIndex / 2);
        const isP1Slot = match.matchIndex % 2 === 0;

        const nextMatch = await prisma.tournamentMatch.findFirst({
            where: { tournamentId: req.params.id, round: nextRound, matchIndex: nextMatchIndex },
        });

        if (nextMatch) {
            await prisma.tournamentMatch.update({
                where: { id: nextMatch.id },
                data: isP1Slot ? { player1Id: winnerId } : { player2Id: winnerId },
            });
        } else {
            // This was the final — complete the tournament
            await prisma.tournament.update({
                where: { id: req.params.id },
                data: { status: 'COMPLETED' },
            });
        }

        res.json({ ok: true, advanced: !!nextMatch });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to set result' });
    }
});

export default router;
