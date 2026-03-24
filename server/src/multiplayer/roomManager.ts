import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { calculateLevelProgression, calculateNewMmr, getRankFromMmr, applyPenalty } from '../utils/progression';
import { prisma } from '../db';

// ─────────────────────── Ranked Queue ───────────────────────
const RANK_ORDER = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'RUBY', 'DIAMOND', 'MASTER', 'GRANDMASTER'];
function getRankIndex(rank: string) { const i = RANK_ORDER.indexOf(rank.toUpperCase()); return i === -1 ? 0 : i; }
function ranksCompatible(r1: string, r2: string) { return Math.abs(getRankIndex(r1) - getRankIndex(r2)) <= 1; }

interface RankedQueueEntry {
    socketId: string; userId: string; username: string; avatar: string;
    rank: string; mmr: number; level: number; rankConfig: any; playerCount: 2 | 4;
}
const rankedQueue2 : RankedQueueEntry[] = [];
const rankedQueue4 : RankedQueueEntry[] = [];

// ─────────────────────────── Types ───────────────────────────
type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'joker';
interface GameCard { id: string; number: number | 'JOKER'; color: CardColor; }

interface RoomPlayer {
    socketId: string;
    userId: string;
    username: string;
    avatar: string;
    sleeve: string;
    frame?: string; // serialized FrameConfig JSON
    pet?: string;   // serialized PetConfig JSON
    slot: string; // 'p0', 'p1', 'p2', 'p3'
}

interface Room {
    id: string;
    name: string;
    hostSocketId: string;
    players: RoomPlayer[];
    maxPlayers: 2 | 4;
    turnTime: 30 | 45 | 60;
    isPrivate: boolean;
    password?: string;
    status: 'waiting' | 'in-game';
    ranked?: boolean;
    createdAt: number;
    gameState?: GameState;
    turnIntervalId?: ReturnType<typeof setInterval>;
    spectators?: Map<string, { userId: string; username: string }>;
}

interface GameState {
    deck: GameCard[];
    hands: Record<string, GameCard[]>;
    tableSets: GameCard[][];
    activeSlot: string;
    hasPlayedThisTurn: boolean;
    slotTimers: Record<string, { timeLeft: number; bankTime: number }>;
    slotTurnTime: Record<string, number>; // per-player effective turn time (base + VIP bonus)
    slotOrder: string[];
    afkStrikes: Record<string, number>;
    forfeitedSlots: Set<string>;
}

interface SocketUser {
    userId: string;
    username: string;
    avatar: string;
    currentRoomId?: string;
}

// ─────────────────────── In-Memory Store ────────────────────
const rooms = new Map<string, Room>();
const socketUsers = new Map<string, SocketUser>();
// userId → socketId for targeted notification delivery
const userSockets = new Map<string, string>();
// socketIds that are currently transitioning to the game page (don't leaveRoom on disconnect)
const transitioning = new Set<string>();
// Module-level io instance set in setupMultiplayer
let ioInstance: Server | null = null;

export function emitToUser(userId: string, event: string, payload: unknown) {
    if (!ioInstance) return;
    const sid = userSockets.get(userId);
    if (sid) ioInstance.to(sid).emit(event, payload);
}

// ─────────────────────── Card Helpers ───────────────────────
function generateDeck(playerCount: number = 4): GameCard[] {
    const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
    const deck: GameCard[] = [];
    let id = 0;
    const copies = playerCount === 2 ? 2 : 3;
    for (let copy = 0; copy < copies; copy++) {
        for (const color of colors) {
            for (let num = 1; num <= 10; num++) {
                deck.push({ id: `c${id++}`, number: num, color });
            }
        }
    }
    for (let j = 0; j < 5; j++) deck.push({ id: `j${id++}`, number: 'JOKER', color: 'joker' });
    return deck.sort(() => Math.random() - 0.5);
}

function dealCards(deck: GameCard[], count: number) {
    const d = [...deck];
    const hands: Record<string, GameCard[]> = {};
    for (let i = 0; i < count; i++) hands[`p${i}`] = [];
    for (let round = 0; round < 7; round++) {
        for (let i = 0; i < count; i++) {
            const card = d.pop();
            if (card) hands[`p${i}`].push(card);
        }
    }
    return { deck: d, hands };
}

function isValidGroup(cards: GameCard[]): boolean {
    if (cards.length < 3) return false;
    const jokers = cards.filter(c => c.number === 'JOKER');
    if (jokers.length > 1) return false;
    const numbers = cards.map(c => c.number).filter(n => n !== 'JOKER');
    const isSet = numbers.length === 0 || numbers.every(n => n === numbers[0]);
    if (isSet) {
        const cols = cards.filter(c => c.color !== 'joker').map(c => c.color);
        if (new Set(cols).size === cols.length && cards.length <= 4) return true;
    }
    const colorSet = new Set(cards.filter(c => c.color !== 'joker').map(c => c.color));
    if (colorSet.size <= 1) {
        let jk = jokers.length;
        const nums = cards.filter(c => c.number !== 'JOKER').map(c => c.number as number).sort((a, b) => a - b);
        let valid = true;
        for (let i = 0; i < nums.length - 1; i++) {
            const diff = nums[i + 1] - nums[i];
            if (diff === 0) { valid = false; break; }
            if (diff > 1) { jk -= (diff - 1); if (jk < 0) { valid = false; break; } }
        }
        if (valid) return true;
    }
    return false;
}

function calcScore(hand: GameCard[]) {
    return hand.reduce((s, c) => s + (c.number === 'JOKER' ? 20 : (c.number as number)), 0);
}

async function fetchPlayerFrame(userId: string): Promise<string | undefined> {
    try {
        const inv = await prisma.inventory.findFirst({
            where: { userId, itemType: 'FRAME', isEquipped: true },
        });
        if (!inv) return undefined;
        const item = await prisma.storeItem.findUnique({ where: { id: inv.itemId } });
        return item?.frameConfig ?? undefined;
    } catch { return undefined; }
}

async function fetchPlayerPet(userId: string): Promise<string | undefined> {
    try {
        const inv = await prisma.inventory.findFirst({
            where: { userId, itemType: 'PET', isEquipped: true },
        });
        if (!inv) return undefined;
        const item = await prisma.storeItem.findUnique({ where: { id: inv.itemId } });
        return item?.petConfig ?? undefined;
    } catch { return undefined; }
}

// ──────────────────── Broadcast Helpers ─────────────────────
function getRoomPublic(room: Room) {
    return {
        id: room.id,
        name: room.name,
        host: room.players.find(p => p.socketId === room.hostSocketId)?.username || '?',
        players: room.players.length,
        maxPlayers: room.maxPlayers,
        turnTime: room.turnTime,
        isPrivate: room.isPrivate,
        status: room.status,
    };
}

function getRoomState(room: Room) {
    return {
        id: room.id,
        name: room.name,
        hostSocketId: room.hostSocketId,
        turnTime: room.turnTime,
        maxPlayers: room.maxPlayers,
        isPrivate: room.isPrivate,
        status: room.status,
        players: room.players.map(p => ({
            socketId: p.socketId, userId: p.userId, username: p.username, avatar: p.avatar, slot: p.slot,
        })),
    };
}

function broadcastRoomList(io: Server) {
    io.emit('lobby:rooms', Array.from(rooms.values()).filter(r => r.status === 'waiting').map(getRoomPublic));
}

function broadcastRoomState(io: Server, room: Room) {
    io.to(room.id).emit('lobby:room_updated', getRoomState(room));
}

function broadcastGameState(io: Server, room: Room) {
    if (!room.gameState) return;
    const gs = room.gameState;
    for (const player of room.players) {
        const pSkt = io.sockets.sockets.get(player.socketId);
        if (!pSkt) continue;
        pSkt.emit('game:state', {
            hand: gs.hands[player.slot] || [],
            players: room.players.map(p => ({
                slot: p.slot, username: p.username, avatar: p.avatar, sleeve: p.sleeve, frame: p.frame, pet: p.pet,
                cardCount: (gs.hands[p.slot] || []).length,
            })),
            deckCount: gs.deck.length,
            tableSets: gs.tableSets,
            activeSlot: gs.activeSlot,
            hasPlayedThisTurn: gs.hasPlayedThisTurn,
            slotTimers: gs.slotTimers,
            slotTurnTime: gs.slotTurnTime,
        });
    }
    // Broadcast to spectators (no hand data)
    if (room.spectators) {
        const spectatorPayload = {
            hand: [],
            players: room.players.map(p => ({
                slot: p.slot, username: p.username, avatar: p.avatar, sleeve: p.sleeve, frame: p.frame, pet: p.pet,
                cardCount: (gs.hands[p.slot] || []).length,
            })),
            deckCount: gs.deck.length,
            tableSets: gs.tableSets,
            activeSlot: gs.activeSlot,
            hasPlayedThisTurn: gs.hasPlayedThisTurn,
            slotTimers: gs.slotTimers,
            slotTurnTime: gs.slotTurnTime,
        };
        for (const [socketId] of room.spectators) {
            const specSkt = io.sockets.sockets.get(socketId);
            if (specSkt) specSkt.emit('game:state', spectatorPayload);
        }
    }
}

// ──────────────────────── Game Engine ───────────────────────
function advanceTurn(io: Server, room: Room) {
    if (!room.gameState) return;
    const gs = room.gameState;
    const idx = gs.slotOrder.indexOf(gs.activeSlot);
    gs.activeSlot = gs.slotOrder[(idx + 1) % gs.slotOrder.length];
    gs.hasPlayedThisTurn = false;
    gs.slotTimers[gs.activeSlot].timeLeft = gs.slotTurnTime[gs.activeSlot] ?? room.turnTime;
    broadcastGameState(io, room);
    startTurnTimer(io, room);
}

function startTurnTimer(io: Server, room: Room) {
    if (room.turnIntervalId) clearInterval(room.turnIntervalId);
    room.turnIntervalId = setInterval(() => {
        if (!room.gameState) { clearInterval(room.turnIntervalId!); return; }
        const gs = room.gameState;
        const timer = gs.slotTimers[gs.activeSlot];
        if (!timer) return;
        if (timer.timeLeft > 0) {
            timer.timeLeft--;
            io.to(room.id).emit('game:timer_tick', { activeSlot: gs.activeSlot, timeLeft: timer.timeLeft, bankTime: timer.bankTime });
        } else if (timer.bankTime > 0) {
            timer.bankTime--;
            io.to(room.id).emit('game:timer_tick', { activeSlot: gs.activeSlot, timeLeft: 0, bankTime: timer.bankTime });
        } else {
            // Timer fully expired — track AFK; auto-pass or kick after 3 consecutive timeouts
            gs.afkStrikes[gs.activeSlot] = (gs.afkStrikes[gs.activeSlot] || 0) + 1;
            if (gs.afkStrikes[gs.activeSlot] >= 3) {
                clearInterval(room.turnIntervalId!);
                forfeitPlayerInGame(io, room, gs.activeSlot, 'afk').catch(err => console.error('AFK forfeit error:', err));
                return;
            }
            // Auto-pass: draw if didn't play
            const activePlayer = room.players.find(p => p.slot === gs.activeSlot);
            if (!gs.hasPlayedThisTurn && gs.deck.length > 0 && activePlayer) {
                const card = gs.deck.pop()!;
                gs.hands[gs.activeSlot].push(card);
                const pSkt = io.sockets.sockets.get(activePlayer.socketId);
                if (pSkt) pSkt.emit('game:drew_card', { card });
            }
            advanceTurn(io, room);
        }
    }, 1000);
}

// ── Card-type helpers ──
function isRun(cards: GameCard[]): boolean {
    const nonJokers = cards.filter(c => c.number !== 'JOKER');
    if (nonJokers.length === 0) return false;
    const colorSet = new Set(nonJokers.map(c => c.color));
    if (colorSet.size > 1) return false;
    const nums = nonJokers.map(c => c.number as number).sort((a, b) => a - b);
    let jk = cards.length - nonJokers.length;
    for (let i = 0; i < nums.length - 1; i++) {
        const diff = nums[i + 1] - nums[i];
        if (diff === 0) return false;
        if (diff > 1) { jk -= (diff - 1); if (jk < 0) return false; }
    }
    return true;
}

function isSameNumberGroup(cards: GameCard[]): boolean {
    const nonJokers = cards.filter(c => c.number !== 'JOKER');
    return nonJokers.length > 0 && nonJokers.every(c => c.number === nonJokers[0].number);
}

// Called on every game:play_cards event to update card-based missions in real time
async function updateCardPlayMissions(userId: string, playedCards: GameCard[], setsWithPlayed: GameCard[][]) {
    try {
        const today = new Date().toISOString().substring(0, 10);
        const todayMissions = await prisma.userDailyMission.findMany({
            where: { userId, date: today, completed: false },
            include: { mission: true },
        });
        for (const um of todayMissions) {
            const t = um.mission.type;
            const param = (um.mission as any).parameter || '';
            let increment = 0;

            if (t === 'PLAY_COLOR') {
                increment = playedCards.filter(c => c.color === param).length;
            } else if (t === 'PLAY_JOKER') {
                increment = playedCards.filter(c => c.number === 'JOKER').length;
            } else if (t === 'PLAY_CARDS_TOTAL') {
                increment = playedCards.length;
            } else if (t === 'PLAY_SEQUENCE') {
                const minLen = parseInt(param) || 3;
                increment = setsWithPlayed.filter(s => s.length >= minLen && isRun(s)).length;
            } else if (t === 'PLAY_FOUR_OF_KIND') {
                increment = setsWithPlayed.filter(s => s.length === 4 && isSameNumberGroup(s)).length;
            }

            if (increment > 0) {
                const newProgress = um.progress + increment;
                const nowCompleted = !um.completed && newProgress >= um.mission.requirement;
                await prisma.userDailyMission.update({
                    where: { id: um.id },
                    data: { progress: newProgress, completed: newProgress >= um.mission.requirement },
                });
                if (nowCompleted) {
                    emitToUser(userId, 'notification:mission_complete', {
                        title: um.mission.title,
                        xpReward: um.mission.xpReward,
                        gemsReward: um.mission.gemsReward,
                    });
                }
            }
        }
    } catch (err) {
        console.error('Card mission progress error:', err);
    }
}

async function updateMissionProgress(userId: string, ctx: { won: boolean; isRanked: boolean }) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayMissions = await prisma.userDailyMission.findMany({
            where: { userId, date: today, completed: false },
            include: { mission: true },
        });
        for (const um of todayMissions) {
            const t = um.mission.type;
            const increment =
                (t === 'WIN_RANKED' && ctx.won && ctx.isRanked) ||
                (t === 'WIN_ANY' && ctx.won) ||
                (t === 'PLAY_RANKED' && ctx.isRanked) ||
                (t === 'PLAY_ANY');
            if (increment) {
                const newProgress = um.progress + 1;
                const nowCompleted = !um.completed && newProgress >= um.mission.requirement;
                await prisma.userDailyMission.update({
                    where: { id: um.id },
                    data: { progress: newProgress, completed: newProgress >= um.mission.requirement },
                });
                if (nowCompleted) {
                    emitToUser(userId, 'notification:mission_complete', {
                        title: um.mission.title,
                        xpReward: um.mission.xpReward,
                        gemsReward: um.mission.gemsReward,
                    });
                }
            }
        }
    } catch (err) {
        console.error('Mission progress error:', err);
    }
}

const ACHIEVEMENT_DEFS = [
    { title: 'Primeira Vitória', type: 'SILVER', description: 'Ganhe sua primeira partida.', threshold: 1, ranked: false },
    { title: '10 Vitórias', type: 'GOLD', description: 'Ganhe 10 partidas no total.', threshold: 10, ranked: false },
    { title: '50 Vitórias', type: 'GOLD', description: 'Ganhe 50 partidas no total.', threshold: 50, ranked: false },
    { title: 'Estreante Ranked', type: 'SILVER', description: 'Ganhe sua primeira partida ranked.', threshold: 1, ranked: true },
    { title: '10 Vitórias Ranked', type: 'GOLD', description: 'Ganhe 10 partidas ranked.', threshold: 10, ranked: true },
    { title: '50 Vitórias Ranked', type: 'GOLD', description: 'Ganhe 50 partidas ranked.', threshold: 50, ranked: true },
];

async function checkAchievements(userId: string, rankedWins: number, totalWins: number) {
    try {
        for (const def of ACHIEVEMENT_DEFS) {
            const existing = await prisma.userAchievement.findFirst({ where: { userId, title: def.title } });
            if (existing) continue;
            const count = def.ranked ? rankedWins : totalWins;
            if (count >= def.threshold) {
                const created = await prisma.userAchievement.create({
                    data: { userId, title: def.title, type: def.type, description: def.description },
                }).catch(() => null);
                if (created) {
                    emitToUser(userId, 'notification:achievement', {
                        title: def.title,
                        type: def.type,
                        description: def.description,
                    });
                }
            }
        }
    } catch (err) {
        console.error('Achievement check error:', err);
    }
}

async function updatePlayersAfterGame(
    room: Room,
    ranked: { slot: string; username: string; score: number }[],
    isRanked: boolean,
    forfeitedSlots: Set<string> = new Set(),
) {
    const penaltyRank = isRanked
        ? await prisma.rankingConfig.findFirst({ where: { mmrPenalty: true }, orderBy: { minMmr: 'asc' } })
        : null;
    const penaltyMinMmr = penaltyRank ? penaltyRank.minMmr : Infinity;
    const playerCount = room.maxPlayers;
    const winnerSlot = ranked[0]?.slot;
    const vipConfig = isRanked ? await prisma.vipConfig.findFirst({ where: { isActive: true } }) : null;

    // ── Ideia A: calcular duração da partida e escalar MMR do vencedor ──
    // Se todos os adversários desconectaram muito rápido → o winner recebe menos MMR
    const gameDurationSecs = Math.floor((Date.now() - room.createdAt) / 1000);
    const mmrTimeMultiplier = gameDurationSecs < 30 ? 0 : gameDurationSecs < 90 ? 0.5 : 1.0;

    // ── Ideia D: detectar vitória por forfeit puro (todos adversários desconectaram) ──
    const isPureForfeitWin = forfeitedSlots.size > 0 && forfeitedSlots.size >= room.maxPlayers - 1;

    // Create a single MatchHistory record for this game
    const winnerUserId = room.players.find(p => p.slot === winnerSlot)?.userId ?? null;
    await prisma.matchHistory.create({
        data: {
            mode: isRanked ? 'RANKED' : 'CASUAL',
            winnerId: winnerUserId,
            duration: gameDurationSecs,
            isForfeitWin: isPureForfeitWin,
            players: { connect: room.players.map(p => ({ id: p.userId })) },
        }
    }).catch(err => console.error('MatchHistory create error:', err));

    await Promise.all(ranked.map(async (r, idx) => {
        const position = (idx + 1) as 1 | 2 | 3 | 4;
        const player = room.players.find(p => p.slot === r.slot);
        if (!player) return;
        const forfeited = forfeitedSlots.has(r.slot);
        const isWinner = r.slot === winnerSlot && !forfeited;

        // Parse pet config outside the transaction (no DB access needed)
        let petXpBonus = 0;
        let petGemsBonus = 0;
        if (player.pet) {
            try {
                const pet = JSON.parse(player.pet);
                if (pet.effectType === 'XP_BONUS' && typeof pet.effectValue === 'number') petXpBonus = pet.effectValue;
                if (pet.effectType === 'GEMS_BONUS' && typeof pet.effectValue === 'number') petGemsBonus = pet.effectValue;
            } catch { /* malformed petConfig — ignore */ }
        }

        // Wrap read + compute + write in a transaction to prevent concurrent
        // overwrites (e.g. two tabs of the same user playing against each other)
        let mmrDelta = 0;
        let oldMmr = 0;
        let oldLevel = 0;
        let newLevelAfterGame = 0;
        try {
            await prisma.$transaction(async (tx) => {
                const user = await tx.user.findUnique({
                    where: { id: player.userId },
                    select: { mmr: true, level: true, xp: true, gems: true, vipExpiresAt: true },
                });
                if (!user) return;

                oldMmr = user.mmr;
                oldLevel = user.level;

                // VIP bonus
                const isVip = !!user.vipExpiresAt && user.vipExpiresAt > new Date();
                const vipXpBonus   = isVip ? (vipConfig?.xpBonus   ?? 0) : 0;
                const vipGemsBonus = isVip ? (vipConfig?.gemsBonus ?? 0) : 0;

                const updateData: Record<string, unknown> = {};

                if (isRanked) {
                    // ── MMR (non-forfeited only; forfeited already penalised via applyMmrPenalty) ──
                    if (!forfeited) {
                        const rawNewMmr = calculateNewMmr(user.mmr, position, playerCount, penaltyMinMmr);
                        const rawDelta = rawNewMmr - user.mmr;
                        // Ideia A: escalar ganho do winner baseado na duração da partida
                        // Perdedores legítimos ainda tomam penalidade normal — só o ganho do winner é escalado
                        const scaledDelta = position === 1
                            ? Math.round(rawDelta * mmrTimeMultiplier)
                            : rawDelta;
                        const newMmr = Math.max(0, user.mmr + scaledDelta);
                        const newRank = getRankFromMmr(newMmr);
                        mmrDelta = scaledDelta;
                        updateData.mmr = newMmr;
                        updateData.rank = newRank;
                    }

                    // ── XP — use playerCount (room.maxPlayers) so forfeit removals don't reduce XP ──
                    if (!forfeited) {
                        const baseXp = Math.max(0, 10 * (playerCount + 1 - position));
                        const xpGained = Math.round(baseXp * (1 + petXpBonus / 100 + vipXpBonus / 100));
                        const { newLevel, newXp } = calculateLevelProgression(user.level, user.xp, xpGained);
                        newLevelAfterGame = newLevel;
                        updateData.level = newLevel;
                        updateData.xp = newXp;
                    }

                    // ── Gems ──
                    if (!forfeited) {
                        const baseGems = r.slot === winnerSlot ? 30 : 20;
                        const gemsGained = Math.round(baseGems * (1 + petGemsBonus / 100 + vipGemsBonus / 100));
                        updateData.gems = user.gems + gemsGained;
                    }
                }

                if (Object.keys(updateData).length > 0) {
                    await tx.user.update({ where: { id: player.userId }, data: updateData });
                }
            });
        } catch (err) {
            console.error(`[updatePlayers] Failed to update ${player.username} (${player.userId}):`, err);
        }

        // Notify the player's socket about MMR / level / rank changes (ranked only)
        if (isRanked && !forfeited) {
            const pSkt = ioInstance?.sockets.sockets.get(player.socketId);
            if (pSkt) {
                pSkt.emit('game:mmr_update', {
                    oldMmr,
                    newMmr: oldMmr + mmrDelta,
                    mmrDelta,
                    oldRank: getRankFromMmr(oldMmr),
                    newRank: getRankFromMmr(oldMmr + mmrDelta),
                    oldLevel,
                    newLevel: newLevelAfterGame,
                });
            }
        }

        // Update daily mission progress (non-blocking)
        if (!forfeited) {
            updateMissionProgress(player.userId, { won: isWinner, isRanked });
        }

        // Check and grant achievements (non-blocking)
        if (isWinner) {
            const [totalWins, rankedWins] = await Promise.all([
                prisma.matchHistory.count({ where: { players: { some: { id: player.userId } }, winnerId: player.userId } }),
                prisma.matchHistory.count({ where: { players: { some: { id: player.userId } }, winnerId: player.userId, mode: 'RANKED' } }),
            ]).catch(() => [0, 0] as [number, number]);
            checkAchievements(player.userId, rankedWins as number, totalWins as number);

            // ── Ideia D: detectar padrão smurf pós-jogo ──
            // Se o winner venceu por forfeit puro E é ranked, verificar ratio nas últimas 10+ vitórias
            if (isRanked && isPureForfeitWin) {
                try {
                    const totalRankedWins = await prisma.matchHistory.count({
                        where: { winnerId: player.userId, mode: 'RANKED' },
                    });
                    const forfeitRankedWins = await prisma.matchHistory.count({
                        where: { winnerId: player.userId, mode: 'RANKED', isForfeitWin: true },
                    });
                    // Flag se: mínimo 5 vitórias ranked E mais de 70% vieram de forfeit puro
                    if (totalRankedWins >= 5 && (forfeitRankedWins / totalRankedWins) >= 0.7) {
                        await prisma.user.update({
                            where: { id: player.userId },
                            data: { smurfFlag: true },
                        }).catch(() => {});
                        console.log(`[anti-smurf] Flagged ${player.username} — ${forfeitRankedWins}/${totalRankedWins} forfeit wins`);
                    }
                } catch { /* non-blocking */ }
            }
        }
    }));
}

async function applyMmrPenalty(userId: string, penalty: number = 50): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { mmr: true, vipExpiresAt: true } });
    if (!user) return;
    // VIP players with noMmrLoss skip the penalty entirely
    if (user.vipExpiresAt && user.vipExpiresAt > new Date()) {
        const vipCfg = await prisma.vipConfig.findFirst({ where: { isActive: true, noMmrLoss: true } });
        if (vipCfg) return;
    }
    const newMmr = applyPenalty(user.mmr, penalty);
    const newRank = getRankFromMmr(newMmr);
    await prisma.user.update({ where: { id: userId }, data: { mmr: newMmr, rank: newRank } });
}

async function forfeitPlayerInGame(io: Server, room: Room, slot: string, reason: 'surrender' | 'disconnect' | 'afk') {
    if (!room.gameState) return;
    const gs = room.gameState;
    const forfeitedPlayer = room.players.find(p => p.slot === slot);
    if (!forfeitedPlayer) return;

    // Apply -50 MMR penalty (floored at current rank's minimum threshold)
    await applyMmrPenalty(forfeitedPlayer.userId, 50);

    // Track this slot as forfeited so updatePlayersAfterGame skips XP/Gems for them
    if (gs.forfeitedSlots) gs.forfeitedSlots.add(slot);

    // For surrender/afk: remove from socket.io room so they don't receive broadcast game:over
    // then send them their personal defeat event
    const forfeitSkt = reason !== 'disconnect' ? io.sockets.sockets.get(forfeitedPlayer.socketId) : null;
    if (forfeitSkt) {
        forfeitSkt.leave(room.id);
        forfeitSkt.emit('game:over', { winnerSlot: '', winnerUsername: '', ranks: [], reason: 'forfeited', forceDefeat: true });
    }

    // Remove forfeited player from room
    room.players = room.players.filter(p => p.slot !== slot);

    if (room.players.length === 0) {
        if (room.turnIntervalId) clearInterval(room.turnIntervalId);
        rooms.delete(room.id); broadcastRoomList(io); return;
    }
    if (room.players.length === 1) {
        // Only one player remains — they win; updatePlayersAfterGame gives them normal MMR
        endGame(io, room, room.players[0].slot); return;
    }

    // 4-player game with 2–3 remaining: notify and continue
    io.to(room.id).emit('game:player_forfeited', { slot, username: forfeitedPlayer.username, reason });
    const wasActive = gs.activeSlot === slot;
    const oldSlotOrder = [...gs.slotOrder];
    gs.slotOrder = gs.slotOrder.filter(s => s !== slot);
    delete gs.slotTimers[slot];
    delete gs.hands[slot];
    if (gs.afkStrikes) delete gs.afkStrikes[slot];

    if (wasActive) {
        // Find the next slot after the forfeited one (wrapping around)
        const oldIdx = oldSlotOrder.indexOf(slot);
        let nextSlot = gs.slotOrder[0];
        for (let offset = 1; offset < oldSlotOrder.length; offset++) {
            const candidate = oldSlotOrder[(oldIdx + offset) % oldSlotOrder.length];
            if (gs.slotOrder.includes(candidate)) { nextSlot = candidate; break; }
        }
        gs.activeSlot = nextSlot;
        gs.hasPlayedThisTurn = false;
        gs.slotTimers[nextSlot].timeLeft = gs.slotTurnTime[nextSlot] ?? room.turnTime;
        broadcastGameState(io, room);
        startTurnTimer(io, room);
    } else {
        broadcastGameState(io, room);
    }
}

function triggerTieBreaker(io: Server, room: Room) {
    if (!room.gameState) return;
    if (room.turnIntervalId) clearInterval(room.turnIntervalId);
    const gs = room.gameState;
    const ranked = room.players.map(p => ({ slot: p.slot, username: p.username, score: calcScore(gs.hands[p.slot] || []) })).sort((a, b) => a.score - b.score);
    io.to(room.id).emit('game:over', { winnerSlot: ranked[0].slot, winnerUsername: ranked[0].username, ranks: ranked, reason: 'deck_empty' });
    updatePlayersAfterGame(room, ranked, !!room.ranked, gs.forfeitedSlots ?? new Set()).catch(err => console.error('Failed to update MMR/XP after tiebreaker:', err));
    setTimeout(() => { rooms.delete(room.id); broadcastRoomList(io); }, 30000);
}

function endGame(io: Server, room: Room, winnerSlot?: string) {
    if (!room.gameState) return;
    if (room.turnIntervalId) clearInterval(room.turnIntervalId);
    const gs = room.gameState;
    const winner = room.players.find(p => p.slot === winnerSlot);
    const ranked = room.players.map(p => ({ slot: p.slot, username: p.username, score: calcScore(gs.hands[p.slot] || []) })).sort((a, b) => a.score - b.score);
    io.to(room.id).emit('game:over', { winnerSlot, winnerUsername: winner?.username || '?', ranks: ranked, reason: 'hand_empty' });
    updatePlayersAfterGame(room, ranked, !!room.ranked, gs.forfeitedSlots ?? new Set()).catch(err => console.error('Failed to update MMR/XP after game:', err));
    setTimeout(() => { rooms.delete(room.id); broadcastRoomList(io); }, 30000);
}

// ──────────────────────── Ranked Match Start ────────────────────────
async function startRankedMatch(io: Server, entries: RankedQueueEntry[]) {
    const playerCount = entries.length as 2 | 4;
    const turnTime = 45 as const;
    const roomId = crypto.randomUUID();

    const roomPlayers: RoomPlayer[] = entries.map((e, i) => ({
        socketId: e.socketId, userId: e.userId, username: e.username,
        avatar: e.avatar, sleeve: '', slot: `p${i}`,
    }));

    const { deck: remDeck, hands } = dealCards(generateDeck(playerCount), playerCount);
    const slotOrder = roomPlayers.map(p => p.slot);
    const slotTimers: Record<string, { timeLeft: number; bankTime: number }> = {};

    // Build per-player turn times based on VIP turnBonusSeconds
    const slotTurnTime: Record<string, number> = {};
    const vipCfgForTimer = await prisma.vipConfig.findFirst({ where: { isActive: true } });
    if (vipCfgForTimer && vipCfgForTimer.turnBonusSeconds > 0) {
        const userVipRows = await prisma.user.findMany({
            where: { id: { in: entries.map(e => e.userId) } },
            select: { id: true, vipExpiresAt: true }
        });
        const vipMap = new Map(userVipRows.map(u => [u.id, !!u.vipExpiresAt && u.vipExpiresAt > new Date()]));
        for (let i = 0; i < entries.length; i++) {
            slotTurnTime[`p${i}`] = turnTime + (vipMap.get(entries[i].userId) ? vipCfgForTimer.turnBonusSeconds : 0);
        }
    } else {
        for (let i = 0; i < entries.length; i++) slotTurnTime[`p${i}`] = turnTime;
    }

    for (const p of roomPlayers) slotTimers[p.slot] = { timeLeft: slotTurnTime[p.slot] ?? turnTime, bankTime: 30 };
    const firstSlot = slotOrder[Math.floor(Math.random() * slotOrder.length)];

    const afkStrikes: Record<string, number> = {};
    for (const p of roomPlayers) afkStrikes[p.slot] = 0;

    const room: Room = {
        id: roomId, name: 'Ranked Match', hostSocketId: roomPlayers[0].socketId,
        players: roomPlayers, maxPlayers: playerCount, turnTime,
        isPrivate: true, ranked: true, status: 'in-game', createdAt: Date.now(),
        gameState: { deck: remDeck, hands, tableSets: [], activeSlot: firstSlot, hasPlayedThisTurn: false, slotTimers, slotTurnTime, slotOrder, afkStrikes, forfeitedSlots: new Set() },
    };
    rooms.set(roomId, room);

    // Join socket rooms & mark transitioning
    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const skt = io.sockets.sockets.get(e.socketId);
        if (skt) { skt.join(roomId); transitioning.add(e.socketId); }
        socketUsers.set(e.socketId, { userId: e.userId, username: e.username, avatar: e.avatar, currentRoomId: roomId });
    }

    // Fetch frames and pets from DB
    await Promise.all(roomPlayers.map(async p => {
        [p.frame, p.pet] = await Promise.all([fetchPlayerFrame(p.userId), fetchPlayerPet(p.userId)]);
    }));

    // Player profiles for pre-game screen
    const playerProfiles = entries.map((e, i) => ({
        slot: `p${i}`, username: e.username, avatar: e.avatar,
        level: e.level, rank: e.rank, mmr: e.mmr, rankConfig: e.rankConfig,
        frame: roomPlayers[i].frame, pet: roomPlayers[i].pet,
        cardCount: 7, sleeve: '',
    }));

    // Emit match_found to each player
    for (let i = 0; i < entries.length; i++) {
        const skt = io.sockets.sockets.get(entries[i].socketId);
        if (skt) skt.emit('ranked:match_found', {
            roomId, slot: `p${i}`, hand: hands[`p${i}`],
            players: playerProfiles, deckCount: remDeck.length, tableSets: [],
            activeSlot: firstSlot, turnTime, slotTimers, slotTurnTime,
        });
    }

    // Start timer after 9s (pre-game screen 5s + nav + rejoin buffer)
    setTimeout(() => startTurnTimer(io, room), 9000);
}

// ──────────────────────── Main Setup ────────────────────────
export const setupMultiplayer = (io: Server) => {
    ioInstance = io;
    console.log('Multiplayer (Socket.io) initialized!');

    // ── Periodic ranked queue scanner: retries matching every 1s to handle race conditions ──
    setInterval(async () => {
        // 2-player queue
        while (rankedQueue2.length >= 2) {
            const a = rankedQueue2.shift()!;
            const b = rankedQueue2.shift()!;
            console.log(`[Queue Scanner] Matched ${a.username} vs ${b.username}`);
            startRankedMatch(io, [a, b]).catch(err => { console.error('Queue scanner match error:', err); rankedQueue2.unshift(a, b); });
        }
        // 4-player queue
        if (rankedQueue4.length >= 4) {
            const group = rankedQueue4.splice(0, 4);
            console.log(`[Queue Scanner] Matched 4-player group`);
            startRankedMatch(io, group).catch(err => { console.error('Queue scanner 4p match error:', err); rankedQueue4.unshift(...group); });
        }
    }, 1000);

    io.on('connection', (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);

        const getUser = () => socketUsers.get(socket.id) || null;
        const getRoom = () => {
            const user = getUser();
            if (!user?.currentRoomId) return null;
            return rooms.get(user.currentRoomId) || null;
        };

        const leaveCurrentRoom = () => {
            const room = getRoom();
            if (!room) return;
            const user = getUser();

            // In-game disconnect: handle as forfeit (penalty + proper game continuation)
            if (room.status === 'in-game' && room.gameState) {
                const player = room.players.find(p => p.socketId === socket.id);
                if (player) {
                    if (user) socketUsers.set(socket.id, { ...user, currentRoomId: undefined });
                    socket.leave(room.id);
                    forfeitPlayerInGame(io, room, player.slot, 'disconnect').catch(err => console.error('Disconnect forfeit error:', err));
                    return;
                }
            }

            // Normal lobby leave
            const wasHost = room.hostSocketId === socket.id;
            room.players = room.players.filter(p => p.socketId !== socket.id);
            if (user) socketUsers.set(socket.id, { ...user, currentRoomId: undefined });
            socket.leave(room.id);
            socket.emit('lobby:left', {});
            if (room.players.length === 0) {
                if (room.turnIntervalId) clearInterval(room.turnIntervalId);
                rooms.delete(room.id);
                broadcastRoomList(io);
                return;
            }
            room.players.forEach((p, i) => { p.slot = `p${i}`; });
            if (wasHost) room.hostSocketId = room.players[0].socketId;
            broadcastRoomState(io, room);
            broadcastRoomList(io);
        };

        // ── AUTHENTICATE ──
        socket.on('lobby:authenticate', (data: { token?: string; userId: string; username: string; avatar: string }) => {
            if (data.token) {
                try { jwt.verify(data.token, process.env.JWT_SECRET || 'secret'); }
                catch { socket.emit('lobby:error', { message: 'Invalid token' }); return; }
            }
            socketUsers.set(socket.id, { userId: data.userId, username: data.username, avatar: data.avatar });
            userSockets.set(data.userId, socket.id);
            socket.emit('lobby:authenticated', { ok: true });
            socket.emit('lobby:rooms', Array.from(rooms.values()).filter(r => r.status === 'waiting').map(getRoomPublic));

            // Auto-join this user's clan socket room (if they're in one)
            prisma.clanMember.findUnique({ where: { userId: data.userId } }).then(member => {
                if (member) socket.join(`clan:${member.clanId}`);
            }).catch(() => {});
        });

        // ── LIST ──
        socket.on('lobby:list', () => {
            socket.emit('lobby:rooms', Array.from(rooms.values()).filter(r => r.status === 'waiting').map(getRoomPublic));
        });

        // ── CREATE ──
        socket.on('lobby:create', (data: { name: string; maxPlayers: 2 | 4; turnTime: 30 | 45 | 60; isPrivate: boolean; password?: string }) => {
            const user = getUser();
            if (!user) { socket.emit('lobby:error', { message: 'Not authenticated' }); return; }
            leaveCurrentRoom();
            const roomId = crypto.randomUUID();
            const room: Room = {
                id: roomId,
                name: (data.name?.trim() || `${user.username}'s Room`).slice(0, 40),
                hostSocketId: socket.id,
                players: [{ socketId: socket.id, userId: user.userId, username: user.username, avatar: user.avatar, sleeve: '', slot: 'p0' }],
                maxPlayers: data.maxPlayers,
                turnTime: data.turnTime,
                isPrivate: data.isPrivate,
                password: data.isPrivate ? (data.password || '') : undefined,
                status: 'waiting',
                createdAt: Date.now(),
            };
            rooms.set(roomId, room);
            socketUsers.set(socket.id, { ...user, currentRoomId: roomId });
            socket.join(roomId);
            socket.emit('lobby:room_joined', getRoomState(room));
            broadcastRoomList(io);
        });

        // ── JOIN ──
        socket.on('lobby:join', (data: { roomId: string; password?: string }) => {
            const user = getUser();
            if (!user) { socket.emit('lobby:error', { message: 'Not authenticated' }); return; }
            const room = rooms.get(data.roomId);
            if (!room) { socket.emit('lobby:error', { message: 'Room not found' }); return; }
            if (room.status !== 'waiting') { socket.emit('lobby:error', { message: 'Game already in progress' }); return; }
            if (room.players.length >= room.maxPlayers) { socket.emit('lobby:error', { message: 'Room is full' }); return; }
            if (room.isPrivate && room.password && room.password !== data.password) { socket.emit('lobby:error', { message: 'Incorrect password' }); return; }
            if (room.players.find(p => p.socketId === socket.id)) { socket.emit('lobby:error', { message: 'Already in this room' }); return; }
            leaveCurrentRoom();
            const slot = `p${room.players.length}`;
            room.players.push({ socketId: socket.id, userId: user.userId, username: user.username, avatar: user.avatar, sleeve: '', slot });
            socketUsers.set(socket.id, { ...user, currentRoomId: room.id });
            socket.join(room.id);
            socket.emit('lobby:room_joined', getRoomState(room));
            broadcastRoomState(io, room);
            broadcastRoomList(io);
        });

        // ── LEAVE ──
        socket.on('lobby:leave', () => leaveCurrentRoom());

        // ── KICK ──
        socket.on('lobby:kick', (data: { targetSocketId: string }) => {
            const room = getRoom();
            if (!room || room.hostSocketId !== socket.id) { socket.emit('lobby:error', { message: 'Only the host can kick' }); return; }
            const target = room.players.find(p => p.socketId === data.targetSocketId);
            if (!target || target.socketId === socket.id) { socket.emit('lobby:error', { message: 'Cannot kick this player' }); return; }
            room.players = room.players.filter(p => p.socketId !== data.targetSocketId);
            room.players.forEach((p, i) => { p.slot = `p${i}`; });
            const tSkt = io.sockets.sockets.get(data.targetSocketId);
            if (tSkt) {
                tSkt.leave(room.id);
                const tUser = socketUsers.get(data.targetSocketId);
                if (tUser) socketUsers.set(data.targetSocketId, { ...tUser, currentRoomId: undefined });
                tSkt.emit('lobby:kicked', { message: 'You were removed from the lobby by the host.' });
            }
            broadcastRoomState(io, room);
            broadcastRoomList(io);
        });

        // ── START ──
        socket.on('lobby:start', async () => {
            const room = getRoom();
            if (!room) { socket.emit('lobby:error', { message: 'Not in a room' }); return; }
            if (room.hostSocketId !== socket.id) { socket.emit('lobby:error', { message: 'Only the host can start' }); return; }
            if (room.players.length < 2) { socket.emit('lobby:error', { message: 'Need at least 2 players' }); return; }
            room.status = 'in-game';
            const { deck: remDeck, hands } = dealCards(generateDeck(room.players.length), room.players.length);
            const slotOrder = room.players.map(p => p.slot);
            const slotTimers: Record<string, { timeLeft: number; bankTime: number }> = {};

            // Build per-player turn times based on VIP turnBonusSeconds
            const slotTurnTime: Record<string, number> = {};
            const vipCfgLobby = await prisma.vipConfig.findFirst({ where: { isActive: true } });
            if (vipCfgLobby && vipCfgLobby.turnBonusSeconds > 0) {
                const userIds = room.players.map(p => p.userId).filter(Boolean);
                const userVipRows = await prisma.user.findMany({
                    where: { id: { in: userIds } },
                    select: { id: true, vipExpiresAt: true }
                });
                const vipMap = new Map(userVipRows.map(u => [u.id, !!u.vipExpiresAt && u.vipExpiresAt > new Date()]));
                for (const p of room.players) {
                    slotTurnTime[p.slot] = room.turnTime + (vipMap.get(p.userId) ? vipCfgLobby.turnBonusSeconds : 0);
                }
            } else {
                for (const p of room.players) slotTurnTime[p.slot] = room.turnTime;
            }

            for (const p of room.players) slotTimers[p.slot] = { timeLeft: slotTurnTime[p.slot] ?? room.turnTime, bankTime: 30 };
            // Randomly pick who goes first
            const firstSlot = slotOrder[Math.floor(Math.random() * slotOrder.length)];
            // Give the first player their full turn timer
            slotTimers[firstSlot].timeLeft = slotTurnTime[firstSlot] ?? room.turnTime;
            const afkStrikes: Record<string, number> = {};
            for (const p of room.players) afkStrikes[p.slot] = 0;
            room.gameState = { deck: remDeck, hands, tableSets: [], activeSlot: firstSlot, hasPlayedThisTurn: false, slotTimers, slotTurnTime, slotOrder, afkStrikes, forfeitedSlots: new Set() };
            for (const player of room.players) {
                // Mark old socketId as transitioning so disconnect on navigate won't kick them
                transitioning.add(player.socketId);
                const pSkt = io.sockets.sockets.get(player.socketId);
                if (pSkt) pSkt.emit('game:start', {
                    roomId: room.id, slot: player.slot, hand: hands[player.slot],
                    players: room.players.map(p => ({ slot: p.slot, username: p.username, avatar: p.avatar, sleeve: p.sleeve, frame: p.frame, pet: p.pet, cardCount: 7 })),
                    deckCount: remDeck.length, tableSets: [], activeSlot: firstSlot, turnTime: room.turnTime, slotTimers, slotTurnTime,
                });
            }
            broadcastRoomList(io);
            // Start timer after slight delay to allow clients to navigate
            setTimeout(() => startTurnTimer(io, room), 3000);
            // Fetch frames and pets from DB in background and rebroadcast once ready
            Promise.all(room.players.map(async p => {
                [p.frame, p.pet] = await Promise.all([fetchPlayerFrame(p.userId), fetchPlayerPet(p.userId)]);
            }))
                .then(() => { if (room.gameState) broadcastGameState(io, room); })
                .catch(() => {});
        });

        // ── GAME: REJOIN (after page navigation) ──
        socket.on('game:rejoin', (data: { roomId: string; userId: string; token?: string; sleeve?: string; slot?: string }) => {
            const room = rooms.get(data.roomId);
            if (!room?.gameState) { socket.emit('game:error', { message: 'Game session not found' }); return; }
            // Primary: match by userId + slot (both must agree); fallback for legacy/same-browser testing
            let player = room.players.find(p => p.userId === data.userId && p.slot === data.slot);
            if (!player) player = room.players.find(p => p.slot === data.slot);
            if (!player) player = room.players.find(p => p.userId === data.userId);
            if (!player) { socket.emit('game:error', { message: 'You are not in this game' }); return; }
            // Update sleeve if provided
            if (data.sleeve) player.sleeve = data.sleeve;
            // Mark old socket as transitioning to prevent leaveRoom on its disconnect
            transitioning.add(player.socketId);
            // Update player's socket ID
            const oldUser = socketUsers.get(player.socketId);
            if (oldUser) { socketUsers.delete(player.socketId); socketUsers.set(socket.id, { ...oldUser, currentRoomId: room.id }); }
            else { socketUsers.set(socket.id, { userId: player.userId, username: player.username, avatar: player.avatar, currentRoomId: room.id }); }
            player.socketId = socket.id;
            socket.join(room.id);
            const gs = room.gameState;
            socket.emit('game:rejoined', {
                roomId: room.id, slot: player.slot, hand: gs.hands[player.slot] || [],
                players: room.players.map(p => ({ slot: p.slot, username: p.username, avatar: p.avatar, sleeve: p.sleeve, frame: p.frame, pet: p.pet, cardCount: (gs.hands[p.slot] || []).length })),
                deckCount: gs.deck.length, tableSets: gs.tableSets, activeSlot: gs.activeSlot,
                hasPlayedThisTurn: gs.hasPlayedThisTurn, slotTimers: gs.slotTimers, turnTime: room.turnTime,
            });
            // Fetch frame and pet from DB in background and rebroadcast once ready
            Promise.all([fetchPlayerFrame(player.userId), fetchPlayerPet(player.userId)]).then(([frame, pet]) => {
                if (frame !== undefined) player!.frame = frame;
                if (pet !== undefined) player!.pet = pet;
                if (room.gameState) broadcastGameState(io, room);
            }).catch(() => {});
        });

        // ── GAME: UPDATE SLEEVE (sent after equipped sleeve is fetched) ──
        socket.on('game:update_sleeve', (data: { sleeve: string }) => {
            const room = getRoom();
            if (!room?.gameState) return;
            const player = room.players.find(p => p.socketId === socket.id);
            if (player && data.sleeve) {
                player.sleeve = data.sleeve;
                broadcastGameState(io, room);
            }
        });

        // ── GAME: PLAY CARDS ──
        socket.on('game:play_cards', (data: { cardsFromHand: string[]; newTableSets: GameCard[][] }) => {
            const room = getRoom();
            if (!room?.gameState) return;
            const gs = room.gameState;
            const myPlayer = room.players.find(p => p.socketId === socket.id);
            if (!myPlayer || gs.activeSlot !== myPlayer.slot) { socket.emit('game:error', { message: "It's not your turn!" }); return; }
            const handIds = new Set(gs.hands[myPlayer.slot].map(c => c.id));
            if (!data.cardsFromHand.every(id => handIds.has(id))) { socket.emit('game:error', { message: 'Invalid card IDs' }); return; }
            if (!data.newTableSets.every(g => isValidGroup(g))) { socket.emit('game:error', { message: 'Invalid table arrangement' }); return; }
            // Integrity check: new table cards must be exactly (old table cards) ∪ (cards from hand)
            const oldTableIds = new Set(gs.tableSets.flat().map(c => c.id));
            const fromHandIds = new Set(data.cardsFromHand);
            const newTableIds = new Set(data.newTableSets.flat().map(c => c.id));
            const expectedIds = new Set([...oldTableIds, ...fromHandIds]);
            if (newTableIds.size !== expectedIds.size || [...newTableIds].some(id => !expectedIds.has(id))) {
                socket.emit('game:error', { message: 'Invalid card set: cards do not match' }); return;
            }
            // Capture played card objects BEFORE removing from hand
            const playedCards = gs.hands[myPlayer.slot].filter(c => data.cardsFromHand.includes(c.id));
            const playedIds = new Set(data.cardsFromHand);
            const setsWithPlayed = data.newTableSets.filter(s => s.some(c => playedIds.has(c.id)));
            // Update card-based missions in real time (fire-and-forget)
            updateCardPlayMissions(myPlayer.userId, playedCards, setsWithPlayed).catch(() => {});
            gs.hands[myPlayer.slot] = gs.hands[myPlayer.slot].filter(c => !data.cardsFromHand.includes(c.id));
            gs.tableSets = data.newTableSets;
            gs.hasPlayedThisTurn = true;
            gs.afkStrikes[myPlayer.slot] = 0; // reset AFK counter on manual action
            if (gs.hands[myPlayer.slot].length === 0) { endGame(io, room, myPlayer.slot); return; }
            broadcastGameState(io, room);
        });

        // ── GAME: PASS ──
        socket.on('game:pass', (data?: { finalTableSets?: GameCard[][] }) => {
            const room = getRoom();
            if (!room?.gameState) return;
            const gs = room.gameState;
            const myPlayer = room.players.find(p => p.socketId === socket.id);
            if (!myPlayer || gs.activeSlot !== myPlayer.slot) { socket.emit('game:error', { message: "It's not your turn!" }); return; }
            gs.afkStrikes[myPlayer.slot] = 0; // reset AFK counter on manual pass
            if (data?.finalTableSets) gs.tableSets = data.finalTableSets;
            if (!gs.hasPlayedThisTurn) {
                if (gs.deck.length > 0) {
                    const card = gs.deck.pop()!;
                    gs.hands[myPlayer.slot].push(card);
                    socket.emit('game:drew_card', { card });
                } else { triggerTieBreaker(io, room); return; }
            }
            advanceTurn(io, room);
        });

        // ── GAME: EMOTE ──
        socket.on('game:emote', (data: { emoji: string }) => {
            const room = getRoom();
            if (!room) return;
            const myPlayer = room.players.find(p => p.socketId === socket.id);
            if (!myPlayer) return;
            socket.to(room.id).emit('game:emote_received', { slot: myPlayer.slot, username: myPlayer.username, emoji: data.emoji });
        });

        // ── GAME: SURRENDER ──
        socket.on('game:surrender', () => {
            const room = getRoom();
            if (!room?.gameState) return;
            const myPlayer = room.players.find(p => p.socketId === socket.id);
            if (!myPlayer) return;
            forfeitPlayerInGame(io, room, myPlayer.slot, 'surrender').catch(err => console.error('Surrender error:', err));
        });

        // ── RANKED QUEUE ──
        socket.on('ranked:queue', async (data: { playerCount: 2 | 4; rank: string; mmr: number; level: number; rankConfig?: any }) => {
            const user = getUser();
            if (!user) { socket.emit('lobby:error', { message: 'Not authenticated' }); return; }

            // Always fetch real MMR/rank from DB — never trust client-supplied values
            const dbUser = await prisma.user.findUnique({
                where: { id: user.userId },
                select: { mmr: true, rank: true, level: true }
            });
            if (!dbUser) { socket.emit('lobby:error', { message: 'User not found' }); return; }
            const rankConfig = await prisma.rankingConfig.findFirst({
                where: { minMmr: { lte: dbUser.mmr } },
                orderBy: { minMmr: 'desc' }
            });

            const entry: RankedQueueEntry = {
                socketId: socket.id, userId: user.userId, username: user.username,
                avatar: user.avatar, rank: dbUser.rank, mmr: dbUser.mmr,
                level: dbUser.level, rankConfig: rankConfig ?? null,
                playerCount: data.playerCount,
            };

            // Remove any existing entries for this user from both queues
            const remove = (q: RankedQueueEntry[]) => { const i = q.findIndex(e => e.userId === user.userId); if (i !== -1) q.splice(i, 1); };
            remove(rankedQueue2); remove(rankedQueue4);

            console.log(`[ranked:queue] ${user.username} rank=${dbUser.rank} mmr=${dbUser.mmr} playerCount=${data.playerCount} | queue2 size=${rankedQueue2.length} queue4 size=${rankedQueue4.length}`);

            if (data.playerCount === 2) {
                rankedQueue2.push(entry);
                socket.emit('ranked:queued', { playerCount: 2 });
                console.log(`[ranked:queue] Added to queue2. Size now: ${rankedQueue2.length}`);
            } else {
                rankedQueue4.push(entry);
                socket.emit('ranked:queued', { playerCount: 4 });
            }
        });

        socket.on('ranked:cancel', () => {
            const user = getUser();
            if (!user) return;
            const remove = (q: RankedQueueEntry[]) => { const i = q.findIndex(e => e.userId === user.userId); if (i !== -1) q.splice(i, 1); };
            remove(rankedQueue2); remove(rankedQueue4);
            socket.emit('ranked:cancelled', {});
        });

        // ── SPECTATE ──
        socket.on('game:spectate', (data: { roomId: string; userId?: string; username?: string }) => {
            const room = rooms.get(data.roomId);
            if (!room?.gameState) { socket.emit('game:error', { message: 'Game not found or not in progress' }); return; }
            if (!room.spectators) room.spectators = new Map();
            room.spectators.set(socket.id, { userId: data.userId || '', username: data.username || 'Spectator' });
            socket.join(room.id);
            const gs = room.gameState;
            socket.emit('game:spectate_joined', {
                roomId: room.id,
                players: room.players.map(p => ({
                    slot: p.slot, username: p.username, avatar: p.avatar, sleeve: p.sleeve, frame: p.frame, pet: p.pet,
                    cardCount: (gs.hands[p.slot] || []).length,
                })),
                deckCount: gs.deck.length,
                tableSets: gs.tableSets,
                activeSlot: gs.activeSlot,
                slotTimers: gs.slotTimers,
                turnTime: room.turnTime,
            });
        });

        // ── DIRECT MESSAGE ──
        socket.on('dm:send', ({ toUserId, message }: { toUserId: string; message: string }) => {
            const user = getUser();
            if (!user) return;
            const msg = message?.trim().slice(0, 500);
            if (!msg) return;
            emitToUser(toUserId, 'dm:receive', {
                fromId: user.userId,
                from: user.username,
                avatar: user.avatar,
                message: msg,
                timestamp: new Date().toISOString(),
            });
        });

        // ── CLAN CHAT ──
        socket.on('clan:message', ({ message }: { message: string }) => {
            const user = getUser();
            if (!user) return;
            const msg = message?.trim().slice(0, 300);
            if (!msg) return;
            const clanRoom = [...socket.rooms].find(r => r.startsWith('clan:'));
            if (!clanRoom) return;
            io.to(clanRoom).emit('clan:message', {
                fromId: user.userId,
                from: user.username,
                avatar: user.avatar,
                message: msg,
                timestamp: new Date().toISOString(),
            });
        });

        // ── DISCONNECT ──
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
            if (transitioning.has(socket.id)) {
                transitioning.delete(socket.id);
            } else {
                leaveCurrentRoom();
            }
            // Remove from any spectated rooms
            for (const room of rooms.values()) {
                if (room.spectators?.has(socket.id)) {
                    room.spectators.delete(socket.id);
                }
            }
            socketUsers.delete(socket.id);
            // Remove from userSockets if this was the active socket for that user
            const disconnectedUser = socketUsers.get(socket.id) || Array.from(socketUsers.entries()).find(([sid]) => sid === socket.id)?.[1];
            for (const [uid, sid] of userSockets.entries()) {
                if (sid === socket.id) { userSockets.delete(uid); break; }
            }
        });

        // ── LEGACY ──
        socket.on('simulate_match_end', async (data: { userId: string; position: 1 | 2 | 3 | 4; mode: 'RANKED' | 'CASUAL' }) => {
            // kept for compatibility
        });
    });
};
