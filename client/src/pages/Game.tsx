import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Plus, Menu, Settings, Flag, Smile, Layers, GripHorizontal, Sparkles, Infinity as InfinityIcon, ArrowDownUp, Shuffle, Check, X, Zap } from 'lucide-react';
import { io as createSocket } from 'socket.io-client';
import FramedAvatar from '../components/ui/FramedAvatar';
import { parseFrameConfig } from '../utils/frameUtils';
import type { FrameConfig } from '../utils/frameUtils';
import PetViewer from '../components/ui/PetViewer';
import type { PetConfig } from '../components/ui/PetViewer';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useTranslation } from 'react-i18next';

const DEFAULT_SLEEVE = 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=200&auto=format&fit=crop';

const RANK_COLORS: Record<string, { primary: string; glow: string; bg: string }> = {
    IRON:        { primary: '#9ca3af', glow: 'rgba(156,163,175,0.4)', bg: 'rgba(156,163,175,0.15)' },
    BRONZE:      { primary: '#cd7f32', glow: 'rgba(205,127,50,0.5)',  bg: 'rgba(205,127,50,0.15)'  },
    SILVER:      { primary: '#e2e8f0', glow: 'rgba(226,232,240,0.4)', bg: 'rgba(226,232,240,0.12)' },
    GOLD:        { primary: '#fbbf24', glow: 'rgba(251,191,36,0.6)',  bg: 'rgba(251,191,36,0.15)'  },
    PLATINUM:    { primary: '#67e8f9', glow: 'rgba(103,232,249,0.5)', bg: 'rgba(103,232,249,0.14)' },
    EMERALD:     { primary: '#34d399', glow: 'rgba(52,211,153,0.5)',  bg: 'rgba(52,211,153,0.14)'  },
    RUBY:        { primary: '#fb7185', glow: 'rgba(251,113,133,0.6)', bg: 'rgba(251,113,133,0.15)' },
    DIAMOND:     { primary: '#818cf8', glow: 'rgba(129,140,248,0.6)', bg: 'rgba(129,140,248,0.15)' },
    MASTER:      { primary: '#c084fc', glow: 'rgba(192,132,252,0.6)', bg: 'rgba(192,132,252,0.15)' },
    GRANDMASTER: { primary: '#f59e0b', glow: 'rgba(245,158,11,0.7)',  bg: 'rgba(245,158,11,0.16)'  },
};

type CardColor = 'blue' | 'green' | 'yellow' | 'red' | 'joker';

interface GameCard {
    id: string;
    number: number | 'JOKER';
    color: CardColor;
}

interface Player {
    id: string;
    name: string;
    avatar: string;
    sleeve: string;
    frameConfig?: FrameConfig | null;
    petConfig?: PetConfig | null;
    cardCount: number;
    isActive: boolean;
    timeLeft: number; // main turn time (VIP may have more than 45s)
    bankTime: number; // extra time 30s
    maxTurnTime: number; // max for this player (base + VIP bonus)
}

// Generate the Moove Deck
const generateDeck = (playerCount: number = 4): GameCard[] => {
    const colors: CardColor[] = ['blue', 'green', 'yellow', 'red'];
    const deck: GameCard[] = [];
    let idCounter = 0;
    const copies = playerCount === 2 ? 2 : 3;

    // 1 to 10, 4 colors, 2 copies for 2-player / 3 copies for 4-player
    for (let c = 0; c < copies; c++) {
        for (const color of colors) {
            for (let num = 1; num <= 10; num++) {
                deck.push({ id: `c_${idCounter++}`, number: num, color });
            }
        }
    }
    // 5 Jokers
    for (let j = 0; j < 5; j++) {
        deck.push({ id: `j_${idCounter++}`, number: 'JOKER', color: 'joker' });
    }

    // Shuffle
    return deck.sort(() => Math.random() - 0.5);
};

// Deal cards
const dealCards = (deck: GameCard[], playersCount: number) => {
    const hands: Record<string, GameCard[]> = {};
    for (let i = 0; i < playersCount; i++) {
        hands[`p${i}`] = [];
    }

    // Dealing 1 by 1 up to 7 cards
    for (let round = 0; round < 7; round++) {
        for (let i = 0; i < playersCount; i++) {
            const card = deck.pop();
            if (card) hands[`p${i}`].push(card);
        }
    }
    return { deck, hands };
};

// Per-color card theme tokens
const CARD_THEME = {
    blue: {
        bg: 'linear-gradient(145deg, #010c1f 0%, #021530 50%, #010a1a 100%)',
        border: 'rgba(56,189,248,0.55)',
        shaft: 'rgba(56,189,248,0.13)',
        shaft2: 'rgba(99,102,241,0.08)',
        grid: 'rgba(56,189,248,0.18)',
        glow: 'drop-shadow(0 0 6px rgba(56,189,248,0.9)) drop-shadow(0 0 14px rgba(56,189,248,0.5))',
        numColor: '#7dd3fc',
        numShadow: '0 0 12px rgba(56,189,248,0.9)',
        accentLine: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.9), transparent)',
        dot: 'rgba(56,189,248,0.85)',
        edge: 'rgba(56,189,248,0.6)',
        outerShadow: '0 0 18px rgba(56,189,248,0.35)',
    },
    green: {
        bg: 'linear-gradient(145deg, #011209 0%, #011f0e 50%, #010e07 100%)',
        border: 'rgba(52,211,153,0.55)',
        shaft: 'rgba(52,211,153,0.12)',
        shaft2: 'rgba(16,185,129,0.07)',
        grid: 'rgba(52,211,153,0.17)',
        glow: 'drop-shadow(0 0 6px rgba(52,211,153,0.9)) drop-shadow(0 0 14px rgba(16,185,129,0.5))',
        numColor: '#6ee7b7',
        numShadow: '0 0 12px rgba(52,211,153,0.9)',
        accentLine: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.9), transparent)',
        dot: 'rgba(52,211,153,0.85)',
        edge: 'rgba(52,211,153,0.6)',
        outerShadow: '0 0 18px rgba(52,211,153,0.35)',
    },
    yellow: {
        bg: 'linear-gradient(145deg, #130e00 0%, #1f1500 50%, #110c00 100%)',
        border: 'rgba(251,191,36,0.55)',
        shaft: 'rgba(251,191,36,0.12)',
        shaft2: 'rgba(245,158,11,0.07)',
        grid: 'rgba(251,191,36,0.17)',
        glow: 'drop-shadow(0 0 6px rgba(251,191,36,0.9)) drop-shadow(0 0 14px rgba(245,158,11,0.5))',
        numColor: '#fcd34d',
        numShadow: '0 0 12px rgba(251,191,36,0.9)',
        accentLine: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.9), transparent)',
        dot: 'rgba(251,191,36,0.85)',
        edge: 'rgba(251,191,36,0.6)',
        outerShadow: '0 0 18px rgba(251,191,36,0.35)',
    },
    red: {
        bg: 'linear-gradient(145deg, #130101 0%, #200505 50%, #0f0101 100%)',
        border: 'rgba(248,113,113,0.55)',
        shaft: 'rgba(248,113,113,0.12)',
        shaft2: 'rgba(239,68,68,0.07)',
        grid: 'rgba(248,113,113,0.17)',
        glow: 'drop-shadow(0 0 6px rgba(248,113,113,0.9)) drop-shadow(0 0 14px rgba(239,68,68,0.5))',
        numColor: '#fca5a5',
        numShadow: '0 0 12px rgba(248,113,113,0.9)',
        accentLine: 'linear-gradient(90deg, transparent, rgba(248,113,113,0.9), transparent)',
        dot: 'rgba(248,113,113,0.85)',
        edge: 'rgba(248,113,113,0.6)',
        outerShadow: '0 0 18px rgba(248,113,113,0.35)',
    },
};



export default function Game() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const playersCount = parseInt(searchParams.get('players') || '4');
    const { user, refreshUser } = useUser();
    const { t } = useTranslation();
    const [equippedSleeve, setEquippedSleeve] = useState<string>(DEFAULT_SLEEVE);
    const [equippedFrameConfig, setEquippedFrameConfig] = useState<FrameConfig | null>(null);
    const [equippedPetConfig, setEquippedPetConfig] = useState<PetConfig | null>(null);

    // ── Multiplayer ──
    const roomId = searchParams.get('roomId');
    const myInitialSlot = searchParams.get('slot') || 'p0';
    const isSpectator = searchParams.get('type') === 'spectate';
    const isMultiplayer = !!roomId && (searchParams.get('type') === 'casual' || searchParams.get('type') === 'ranked' || isSpectator);
    const mpSocketRef = useRef<ReturnType<typeof createSocket> | null>(null);
    const [myServerSlot, setMyServerSlot] = useState<string>(myInitialSlot);
    const slotToLocalRef = useRef<Record<string, number>>({});
    // Refs so socket closures always read the latest values
    const equippedSleeveRef = useRef<string>(DEFAULT_SLEEVE);
    const equippedPetConfigRef = useRef<PetConfig | null>(null);
    const userRef = useRef(user);
    // Tracks the user's preferred hand order (card IDs) so server updates don't reset it
    const handOrderRef = useRef<string[]>([]);

    // Keep refs in sync with latest state
    useEffect(() => { equippedSleeveRef.current = equippedSleeve; }, [equippedSleeve]);
    useEffect(() => { equippedPetConfigRef.current = equippedPetConfig; }, [equippedPetConfig]);
    useEffect(() => { userRef.current = user; }, [user]);

    // Fetch equipped card sleeve from inventory
    useEffect(() => {
        const fetchEquippedItems = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/collection`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    const inventory = await res.json();
                    // storeItem is embedded in the collection response (includes inactive items)
                    const equippedBack = inventory.find((inv: any) => inv.itemType === 'CARD_BACK' && inv.isEquipped);
                    if (equippedBack?.storeItem?.imageUrl) setEquippedSleeve(equippedBack.storeItem.imageUrl);
                    const equippedFrame = inventory.find((inv: any) => inv.itemType === 'FRAME' && inv.isEquipped);
                    if (equippedFrame?.storeItem?.frameConfig) {
                        const parsed = parseFrameConfig(equippedFrame.storeItem.frameConfig);
                        if (parsed) setEquippedFrameConfig(parsed);
                    }
                    const equippedPet = inventory.find((inv: any) => inv.itemType === 'PET' && inv.isEquipped);
                    if (equippedPet?.storeItem?.petConfig) {
                        try {
                            const pc = typeof equippedPet.storeItem.petConfig === 'string'
                                ? JSON.parse(equippedPet.storeItem.petConfig)
                                : equippedPet.storeItem.petConfig;
                            setEquippedPetConfig(pc);
                        } catch { /* invalid petConfig — ignore */ }
                    }
                }
            } catch (e) { console.error('Failed to fetch equipped items', e); }
        };
        fetchEquippedItems();
    }, []);

    // ── Multiplayer Socket ──
    useEffect(() => {
        // Wait for user to load — userId is required for game:rejoin
        if (!isMultiplayer || !roomId || !user) return;
        const token = localStorage.getItem('token') || '';
        const skt = createSocket(import.meta.env.VITE_API_URL, { transports: ['websocket'] });
        mpSocketRef.current = skt;

        skt.on('connect', () => {
            if (isSpectator) {
                // Spectator joins silently — no slot, no hand
                skt.emit('game:spectate', { roomId, userId: userRef.current?.id, username: userRef.current?.name });
            } else {
                // Send slot (from URL) as the authoritative identity — prevents wrong-player on same browser testing
                skt.emit('game:rejoin', { roomId, userId: userRef.current?.id, token, sleeve: equippedSleeveRef.current, slot: myInitialSlot });
            }
        });

        skt.on('game:rejoined', (data: any) => {
            // Build slot→localIndex map (I'm always local index 0)
            const sortedPlayers = [
                data.players.find((p: any) => p.slot === data.slot),
                ...data.players.filter((p: any) => p.slot !== data.slot),
            ].filter(Boolean);
            const slotMap: Record<string, number> = {};
            sortedPlayers.forEach((p: any, i: number) => { slotMap[p.slot] = i; });
            slotToLocalRef.current = slotMap;
            setMyServerSlot(data.slot);
            // Use refs for latest equipped items at the time of this event
            const currentUser = userRef.current;
            const currentSleeve = equippedSleeveRef.current;
            setPlayers(sortedPlayers.map((p: any, i: number) => {
                let petConfig: PetConfig | null = null;
                if (i !== 0 && p.pet) {
                    try { petConfig = typeof p.pet === 'string' ? JSON.parse(p.pet) : p.pet; } catch { /* ignore */ }
                }
                return {
                    id: `p${i}`,
                    name: i === 0 ? (currentUser?.name || p.username) : p.username,
                    avatar: i === 0 ? (currentUser?.avatar || p.avatar) : p.avatar,
                    // Use server-broadcast sleeve for all players (including opponents)
                    sleeve: i === 0 ? currentSleeve : (p.sleeve || DEFAULT_SLEEVE),
                    frameConfig: i === 0 ? (currentUser?.equippedFrame ?? null) : parseFrameConfig(p.frame ?? null),
                    petConfig: i === 0 ? equippedPetConfigRef.current : petConfig,
                    cardCount: p.cardCount,
                    isActive: data.activeSlot === p.slot,
                    timeLeft: data.slotTimers[p.slot]?.timeLeft ?? data.turnTime,
                    bankTime: data.slotTimers[p.slot]?.bankTime ?? 30,
                    maxTurnTime: (data.slotTurnTime?.[p.slot] ?? data.turnTime) as number,
                };
            }));
            setAllHands({ p0: data.hand });
            handOrderRef.current = data.hand.map((c: GameCard) => c.id);
            setDeck(new Array(data.deckCount).fill({ id: 'mp_placeholder', number: 1, color: 'red' as const }));
            setTableSets(data.tableSets);
            setActivePlayerIndex(slotMap[data.activeSlot] ?? 0);
            setHasPlayedThisTurn(data.hasPlayedThisTurn);
        });

        // Spectator join handler — no hand data, all players at same visual priority
        skt.on('game:spectate_joined', (data: any) => {
            const slotMap: Record<string, number> = {};
            data.players.forEach((p: any, i: number) => { slotMap[p.slot] = i; });
            slotToLocalRef.current = slotMap;
            setPlayers(data.players.map((p: any, i: number) => {
                let petConfig: PetConfig | null = null;
                if (p.pet) {
                    try { petConfig = typeof p.pet === 'string' ? JSON.parse(p.pet) : p.pet; } catch { /* ignore */ }
                }
                return {
                    id: `p${i}`,
                    name: p.username,
                    avatar: p.avatar,
                    sleeve: p.sleeve || DEFAULT_SLEEVE,
                    frameConfig: parseFrameConfig(p.frame ?? null),
                    petConfig,
                    cardCount: p.cardCount,
                    isActive: data.activeSlot === p.slot,
                    timeLeft: data.slotTimers[p.slot]?.timeLeft ?? data.turnTime,
                    bankTime: data.slotTimers[p.slot]?.bankTime ?? 30,
                    maxTurnTime: (data.slotTurnTime?.[p.slot] ?? data.turnTime) as number,
                };
            }));
            setAllHands({});
            setDeck(new Array(data.deckCount).fill({ id: 'mp_placeholder', number: 1, color: 'red' as const }));
            setTableSets(data.tableSets);
            setActivePlayerIndex(slotMap[data.activeSlot] ?? 0);
            setHasPlayedThisTurn(false);
        });

        // Helper: re-apply user's saved order to a new hand array, appending unknown cards at the end
        const applyHandOrder = (newHand: GameCard[], orderIds: string[]): GameCard[] => {
            if (orderIds.length === 0) return newHand;
            const ordered: GameCard[] = [];
            for (const id of orderIds) {
                const card = newHand.find(c => c.id === id);
                if (card) ordered.push(card);
            }
            // Append cards the user doesn't have an order for yet (e.g. just drawn)
            for (const card of newHand) {
                if (!orderIds.includes(card.id)) ordered.push(card);
            }
            return ordered;
        };

        skt.on('game:state', (data: any) => {
            setActivePlayerIndex(slotToLocalRef.current[data.activeSlot] ?? 0);
            setPlayers(prev => {
                const updated = [...prev];
                for (const sp of data.players) {
                    const li = slotToLocalRef.current[sp.slot];
                    if (li !== undefined && updated[li]) {
                        const timer = data.slotTimers[sp.slot];
                        updated[li] = {
                            ...updated[li],
                            cardCount: sp.cardCount,
                            isActive: data.activeSlot === sp.slot,
                            timeLeft: timer?.timeLeft ?? updated[li].timeLeft,
                            bankTime: timer?.bankTime ?? updated[li].bankTime,
                            maxTurnTime: (data.slotTurnTime?.[sp.slot] ?? updated[li].maxTurnTime) as number,
                            // Update sleeve if server now has it (opponent just sent theirs)
                            sleeve: li === 0 ? updated[li].sleeve : (sp.sleeve || updated[li].sleeve),
                            frameConfig: li === 0 ? updated[li].frameConfig : (sp.frame ? parseFrameConfig(sp.frame) : updated[li].frameConfig),
                            petConfig: (() => {
                                if (li === 0) return updated[li].petConfig;
                                if (!sp.pet) return updated[li].petConfig;
                                try { return typeof sp.pet === 'string' ? JSON.parse(sp.pet) : sp.pet; } catch { return updated[li].petConfig; }
                            })(),
                        };
                    }
                }
                return updated;
            });
            // Preserve user's hand order — only update positions, don't scramble
            const orderedHand = applyHandOrder(data.hand, handOrderRef.current);
            handOrderRef.current = orderedHand.map((c: GameCard) => c.id);
            setAllHands(prev => ({ ...prev, p0: orderedHand }));
            setDeck(new Array(data.deckCount).fill({ id: 'mp_placeholder', number: 1, color: 'red' as const }));
            setTableSets(data.tableSets);
            setHasPlayedThisTurn(data.hasPlayedThisTurn);
        });

        skt.on('game:timer_tick', (data: { activeSlot: string; timeLeft: number; bankTime: number }) => {
            setPlayers(prev => {
                const li = slotToLocalRef.current[data.activeSlot];
                if (li === undefined) return prev;
                return prev.map((p, i) => i === li ? { ...p, timeLeft: data.timeLeft, bankTime: data.bankTime } : p);
            });
        });

        skt.on('game:drew_card', (data: { card: GameCard }) => {
            handOrderRef.current = [...handOrderRef.current, data.card.id];
            setAllHands(prev => ({ ...prev, p0: [...(prev['p0'] || []), data.card] }));
            setPlayers(prev => prev.map(p => p.id === 'p0' ? { ...p, cardCount: p.cardCount + 1 } : p));
        });

        skt.on('game:over', (data: { winnerSlot: string; winnerUsername: string; ranks: any[]; reason: string; forceDefeat?: boolean }) => {
            if (data.forceDefeat) {
                setGameOver({ winner: '', winnerId: 'nobody', reason: data.reason });
                return;
            }
            const localWinnerIdx = slotToLocalRef.current[data.winnerSlot] ?? 0;
            setGameOver({
                winner: data.winnerUsername,
                winnerId: `p${localWinnerIdx}`,
                ranks: data.ranks.map((r: any) => ({ name: r.username, score: r.score })),
                reason: data.reason,
            });
        });

        skt.on('game:player_forfeited', (data: { slot: string; username: string; reason: string }) => {
            const reasonText = data.reason === 'disconnect' ? 'disconnected' : data.reason === 'afk' ? 'removed for AFK' : 'surrendered';
            showToast(`${data.username} ${reasonText}`);
            const li = slotToLocalRef.current[data.slot];
            if (li != null) setPlayers(prev => prev.map(p => p.id === `p${li}` ? { ...p, cardCount: 0, isActive: false } : p));
        });

        skt.on('game:emote_received', (data: { slot: string; username: string; emoji: string }) => {
            const localIdx = slotToLocalRef.current[data.slot];
            if (localIdx == null) return;
            const key = `p${localIdx}`;
            setOpponentEmotes(prev => ({ ...prev, [key]: data.emoji }));
            if (opponentEmoteTimeoutsRef.current[key]) clearTimeout(opponentEmoteTimeoutsRef.current[key]);
            opponentEmoteTimeoutsRef.current[key] = setTimeout(() => {
                setOpponentEmotes(prev => ({ ...prev, [key]: null }));
            }, 4000);
        });

        skt.on('game:error', (data: { message: string }) => {
            showToast(`Error: ${data.message}`);
        });

        skt.on('game:mmr_update', (data: { oldMmr: number; newMmr: number; mmrDelta: number; oldRank: string; newRank: string; oldLevel: number; newLevel: number }) => {
            setMmrDelta(data.mmrDelta);
            // Sync user context with the updated DB values so Profile/Dashboard show fresh data
            refreshUser();
            const didLevelUp = data.newLevel > data.oldLevel;
            const didRankUp = data.newRank !== data.oldRank;
            if (didLevelUp) {
                setTimeout(() => {
                    setLevelUpInfo({ oldLevel: data.oldLevel, newLevel: data.newLevel });
                    setTimeout(() => setLevelUpInfo(null), 4200);
                }, 900);
            }
            if (didRankUp) {
                // Delay rank-up until after level-up animation finishes (if both occur)
                setTimeout(() => {
                    setRankUpInfo({ oldRank: data.oldRank, newRank: data.newRank });
                    setTimeout(() => setRankUpInfo(null), 5000);
                }, didLevelUp ? 4800 : 900);
            }
        });

        return () => { skt.disconnect(); mpSocketRef.current = null; };
    // Reconnect if user loads after mount (e.g. slower auth)
    }, [isMultiplayer, roomId, user?.id]);

    // Once sleeve is fetched, inform the server so opponents see the correct sleeve
    useEffect(() => {
        if (!isMultiplayer || !mpSocketRef.current?.connected) return;
        mpSocketRef.current.emit('game:update_sleeve', { sleeve: equippedSleeve });
        // Also update our own local player entry
        setPlayers(prev => prev.map(p => p.id === 'p0' ? { ...p, sleeve: equippedSleeve } : p));
    }, [equippedSleeve, isMultiplayer]);

    const [deck, setDeck] = useState<GameCard[]>([]);
    const [allHands, setAllHands] = useState<Record<string, GameCard[]>>({});
    const myHand = allHands['p0'] || [];
    const [gameOver, setGameOver] = useState<{ winner: string, winnerId: string, ranks?: { name: string, score: number }[], reason?: string } | null>(null);
    const [mmrDelta, setMmrDelta] = useState<number | null>(null);
    const [levelUpInfo, setLevelUpInfo] = useState<{ oldLevel: number; newLevel: number } | null>(null);
    const [rankUpInfo, setRankUpInfo] = useState<{ oldRank: string; newRank: string } | null>(null);
    const [showSurrenderModal, setShowSurrenderModal] = useState(false);
    const [isEmoteOpen, setIsEmoteOpen] = useState(false);
    const [activeEmote, setActiveEmote] = useState<string | null>(null);
    const emoteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Mobile detection for compact card hand ──
    const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024);
    useEffect(() => {
        const onResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    const isMobile = windowWidth < 640;
    const [opponentEmotes, setOpponentEmotes] = useState<Record<string, string | null>>({});
    const opponentEmoteTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => {
            setToastMessage(null);
        }, 5000);
    };

    const calculateHandScore = (hand: GameCard[]) => {
        return hand.reduce((sum, card) => {
            if (card.number === 'JOKER') return sum + 20;
            return sum + (card.number as number);
        }, 0);
    };

    const triggerGameOverTieBreaker = () => {
        const ranked = players.map(p => ({
            id: p.id,
            name: p.name,
            score: calculateHandScore(allHands[p.id] || [])
        })).sort((a, b) => a.score - b.score);
        setGameOver({ winner: ranked[0].name, winnerId: ranked[0].id, ranks: ranked.map(r => ({ name: r.name, score: r.score })), reason: 'deck_empty' });
    };

    const playEmote = (emoji: string) => {
        setIsEmoteOpen(false);
        setActiveEmote(emoji);
        if (emoteTimeoutRef.current) clearTimeout(emoteTimeoutRef.current);
        emoteTimeoutRef.current = setTimeout(() => {
            setActiveEmote(null);
        }, 5000);
        if (isMultiplayer) mpSocketRef.current?.emit('game:emote', { emoji });
    };

    // Mock opponents — p0 uses real user data, AI players use static data
    const [players, setPlayers] = useState<Player[]>([
        { id: 'p0', name: user?.name || 'You', avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=you`, sleeve: DEFAULT_SLEEVE, cardCount: 7, isActive: true, timeLeft: 45, bankTime: 30, maxTurnTime: 45 },
        { id: 'p1', name: 'NeonRider', avatar: 'https://i.pravatar.cc/150?u=1', sleeve: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=200&auto=format&fit=crop', cardCount: 7, isActive: false, timeLeft: 45, bankTime: 30, maxTurnTime: 45 },
        ...(playersCount === 4 ? [
            { id: 'p2', name: 'Glitch', avatar: 'https://i.pravatar.cc/150?u=3', sleeve: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?q=80&w=200&auto=format&fit=crop', cardCount: 7, isActive: false, timeLeft: 45, bankTime: 30, maxTurnTime: 45 },
            { id: 'p3', name: 'CyberSamurai', avatar: 'https://i.pravatar.cc/150?u=4', sleeve: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=200&auto=format&fit=crop', cardCount: 7, isActive: false, timeLeft: 45, bankTime: 30, maxTurnTime: 45 }
        ] : [])
    ]);

    const [activePlayerIndex, setActivePlayerIndex] = useState(0);
    const [tableSets, setTableSets] = useState<GameCard[][]>([]);
    const [hasPlayedThisTurn, setHasPlayedThisTurn] = useState(false);
    const [selectedCards, setSelectedCards] = useState<GameCard[]>([]);

    // ── Multi-Combine Mode ──
    interface StagedCard { card: GameCard; origin: 'hand' | number; }
    const [multiCombineActive, setMultiCombineActive] = useState(false);
    const [stagingCards, setStagingCards] = useState<StagedCard[]>([]);
    const [savedTableSets, setSavedTableSets] = useState<GameCard[][]>([]);
    const [savedHand, setSavedHand] = useState<GameCard[]>([]);

    // Sync p0 avatar + sleeve when user data or equippedSleeve loads
    useEffect(() => {
        if (user) {
            setPlayers(prev => prev.map(p =>
                p.id === 'p0'
                    ? { ...p, name: user.name, avatar: user.avatar, sleeve: equippedSleeve, petConfig: equippedPetConfig }
                    : p
            ));
        }
    }, [user?.avatar, user?.name, equippedSleeve, equippedPetConfig]);

    // Initialization (singleplayer only — multiplayer state comes from server via game:rejoined)
    useEffect(() => {
        if (isMultiplayer) return;
        const initialDeck = generateDeck(playersCount);
        const { deck: remainingDeck, hands } = dealCards(initialDeck, playersCount);
        setDeck(remainingDeck);
        setAllHands(hands);
    }, [playersCount, isMultiplayer]);

    useEffect(() => {
        if (isMultiplayer) return; // Server drives timer in multiplayer
        // Simple timer logic for active player
        const interval = setInterval(() => {
            setPlayers(prev => prev.map((p, idx) => {
                if (idx === activePlayerIndex) {
                    if (p.timeLeft > 0) return { ...p, timeLeft: p.timeLeft - 1 };
                    if (p.bankTime > 0) return { ...p, bankTime: p.bankTime - 1 };
                }
                return p;
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, [activePlayerIndex, isMultiplayer]);

    // Check for auto-pass when timer runs out (singleplayer only)
    useEffect(() => {
        if (isMultiplayer) return;
        if (activePlayerIndex === 0) {
            const p = players[0];
            if (p && p.timeLeft === 0 && p.bankTime === 0) {
                passTurn();
            }
        }
    }, [players[0]?.timeLeft, players[0]?.bankTime, isMultiplayer]);

    const handleDrawCard = () => {
        if (hasPlayedThisTurn) return; // Cannot draw if played
        passTurn();
    };

    const passTurn = () => {
        if (isMultiplayer) {
            mpSocketRef.current?.emit('game:pass', { finalTableSets: tableSets });
            return;
        }
        if (activePlayerIndex === 0 && !hasPlayedThisTurn) {
            if (deck.length > 0) {
                // Rule: if passed without playing, auto draw
                const newDeck = [...deck];
                const drawnCard = newDeck.pop()!;
                setDeck(newDeck);
                setAllHands(prev => ({ ...prev, p0: [...(prev['p0'] || []), drawnCard] }));
                setPlayers(prev => prev.map(p => p.id === 'p0' ? { ...p, cardCount: p.cardCount + 1 } : p));
            } else {
                triggerGameOverTieBreaker();
                return;
            }
        }

        // Reset timers for current player and pass
        setPlayers(prev => prev.map((p, idx) => {
            if (idx === activePlayerIndex) return { ...p, isActive: false, timeLeft: p.maxTurnTime || 45 };
            if (idx === (activePlayerIndex + 1) % playersCount) return { ...p, isActive: true };
            return p;
        }));
        setActivePlayerIndex((prev) => (prev + 1) % playersCount);
        setHasPlayedThisTurn(false);
    };

    const useExtraTime = () => {
        // Logic for bank time
    };

    // --- GAME OVER CHECK (singleplayer — multiplayer uses game:over socket event) ---
    useEffect(() => {
        if (isMultiplayer) return;
        const winner = players.find(p => p.cardCount === 0);
        if (winner) {
            setGameOver({ winner: winner.name, winnerId: winner.id });
        }
    }, [players, isMultiplayer]);

    // --- AI BOT LOGIC ---
    useEffect(() => {
        if (activePlayerIndex === 0 || gameOver) return; // 0 is User. Stop if game over.
        if (isMultiplayer) return; // No AI in multiplayer — server handles all turns

        const aiId = `p${activePlayerIndex}`;

        const timer = setTimeout(() => {
            const aiHand = allHands[aiId] || [];
            let playedGroup: GameCard[] | null = null;
            let playedToTable: { card: GameCard, setIndex: number } | null = null;

            // Basic brute force AI: Find first valid 3-card group 
            // Loop optimized for basic Set or Run discovery
            for (let i = 0; i < aiHand.length - 2; i++) {
                for (let j = i + 1; j < aiHand.length - 1; j++) {
                    for (let k = j + 1; k < aiHand.length; k++) {
                        const testGroup = [aiHand[i], aiHand[j], aiHand[k]];
                        if (isValidGroup(testGroup)) {
                            playedGroup = testGroup;
                            break;
                        }
                    }
                    if (playedGroup) break;
                }
                if (playedGroup) break;
            }

            if (!playedGroup) {
                for (let c = 0; c < aiHand.length; c++) {
                    for (let s = 0; s < tableSets.length; s++) {
                        const testSet = [...tableSets[s], aiHand[c]];
                        if (isValidGroup(testSet)) {
                            playedToTable = { card: aiHand[c], setIndex: s };
                            break;
                        }
                    }
                    if (playedToTable) break;
                }
            }

            if (playedGroup) {
                // Play cards
                setAllHands(prev => ({
                    ...prev,
                    [aiId]: prev[aiId].filter(c => !playedGroup!.find(pc => pc.id === c.id))
                }));
                const sortedGroup = sortGroupWithJoker(playedGroup);
                setTableSets(prev => [...prev, sortedGroup]);
                setPlayers(prev => prev.map(p => p.id === aiId ? { ...p, cardCount: p.cardCount - playedGroup!.length } : p));
            } else if (playedToTable) {
                // Play single card to existing table set
                setAllHands(prev => ({
                    ...prev,
                    [aiId]: prev[aiId].filter(c => c.id !== playedToTable!.card.id)
                }));
                setTableSets(prev => prev.map((set, idx) => {
                    if (idx === playedToTable!.setIndex) {
                        return sortGroupWithJoker([...set, playedToTable!.card]);
                    }
                    return set;
                }));
                setPlayers(prev => prev.map(p => p.id === aiId ? { ...p, cardCount: p.cardCount - 1 } : p));
            } else {
                // Draw card
                if (deck.length > 0) {
                    const newDeck = [...deck];
                    const drawnCard = newDeck.pop()!;
                    setDeck(newDeck);
                    setAllHands(prev => ({
                        ...prev,
                        [aiId]: [...(prev[aiId] || []), drawnCard]
                    }));
                    setPlayers(prev => prev.map(p => p.id === aiId ? { ...p, cardCount: p.cardCount + 1 } : p));
                } else {
                    triggerGameOverTieBreaker();
                    return;
                }
            }

            // Move to next player
            setPlayers(prev => prev.map((p, idx) => {
                if (idx === activePlayerIndex) return { ...p, isActive: false, timeLeft: p.maxTurnTime || 45 };
                if (idx === (activePlayerIndex + 1) % playersCount) return { ...p, isActive: true };
                return p;
            }));
            setActivePlayerIndex((prev) => (prev + 1) % playersCount);

        }, 2000); // 2 seconds AI think time

        return () => clearTimeout(timer);
    }, [activePlayerIndex, allHands, deck.length, playersCount, gameOver]);

    const toggleCardSelection = (card: GameCard) => {
        setSelectedCards(prev =>
            prev.find(c => c.id === card.id)
                ? prev.filter(c => c.id !== card.id)
                : [...prev, card]
        );
    };

    const isValidGroup = (cards: GameCard[]) => {
        if (cards.length < 3) return false;

        const jokers = cards.filter(c => c.number === 'JOKER');
        if (jokers.length > 1) return false; // Rule: Only one joker per group


        // Check if Set: all same number, different colors
        const numbers = cards.map(c => c.number).filter(n => n !== 'JOKER');
        const isSet = numbers.length === 0 || numbers.every(n => n === numbers[0]);

        if (isSet) {
            const colors = cards.filter(c => c.color !== 'joker').map(c => c.color);
            const isDifferentColors = new Set(colors).size === colors.length;
            if (isDifferentColors && cards.length <= 4) return true; // Max 4 cards in a set (4 colors)
        }

        // Check if Run: all same color, consecutive numbers
        const colorSet = new Set(cards.filter(c => c.color !== 'joker').map(c => c.color));
        if (colorSet.size === 1 || colorSet.size === 0) {
            const numKeys = cards.map(c => c.number);
            let jokersCount = numKeys.filter(n => n === 'JOKER').length;
            const pureNumbers = numKeys.filter(n => n !== 'JOKER').map(Number).sort((a, b) => a - b);

            // Validate sequence with jokers
            let valid = true;
            for (let i = 0; i < pureNumbers.length - 1; i++) {
                const diff = pureNumbers[i + 1] - pureNumbers[i];
                if (diff === 0) valid = false; // Duplicates not allowed in run
                else if (diff > 1) {
                    jokersCount -= (diff - 1); // Need jokers to fill gaps
                    if (jokersCount < 0) valid = false;
                }
            }
            if (valid) return true;
        }

        return false;
    };

    const sortGroupWithJoker = (group: GameCard[]) => {
        // If it's a set, order doesn't matter much, just put joker at end
        const isSet = new Set(group.filter(c => c.number !== 'JOKER').map(c => c.number)).size === 1;
        if (isSet) {
            return [...group].sort((a, b) => {
                if (a.number === 'JOKER') return 1;
                if (b.number === 'JOKER') return -1;
                return 0;
            });
        }

        // If it's a run, smartly position the joker in the gap
        const pureNumbers = group.filter(c => c.number !== 'JOKER').map(c => c.number as number).sort((a, b) => a - b);
        if (pureNumbers.length === 0) return group;

        let currentExpected = pureNumbers[0];
        const result: GameCard[] = [];
        const jokers = group.filter(c => c.number === 'JOKER');
        const pures = [...group.filter(c => c.number !== 'JOKER')].sort((a, b) => (a.number as number) - (b.number as number));

        let pureIdx = 0;
        while (pureIdx < pures.length || jokers.length > 0) {
            if (pureIdx < pures.length && pures[pureIdx].number === currentExpected) {
                result.push(pures[pureIdx]);
                pureIdx++;
            } else if (jokers.length > 0) {
                result.push(jokers.shift()!);
            } else {
                if (pureIdx < pures.length) { result.push(pures[pureIdx]); pureIdx++; }
            }
            currentExpected++;
        }
        result.push(...jokers); // append any remaining trailing jokers
        return result;
    };

    const sortMyHand = () => {
        setAllHands(prev => {
            const sorted = [...(prev['p0'] || [])].sort((a, b) => {
                if (a.color !== b.color) return a.color.localeCompare(b.color);
                if (a.number === 'JOKER') return 1;
                if (b.number === 'JOKER') return -1;
                return (a.number as number) - (b.number as number);
            });
            handOrderRef.current = sorted.map(c => c.id);
            return { ...prev, p0: sorted };
        });
    };

    const tryAddCardToSet = (card: GameCard, setIndex: number) => {
        if (!isMyTurn) {
            showToast("It's not your turn!");
            return;
        }
        const targetSet = tableSets[setIndex];
        const proposedSet = [...targetSet, card];
        if (isValidGroup(proposedSet)) {
            // Compute new table before setState so we can pass it to the server
            const newTableSets = tableSets.map((set, idx) => idx === setIndex ? sortGroupWithJoker(proposedSet) : set);
            setTableSets(newTableSets);
            // Remove from hand and deduct card count
            handOrderRef.current = handOrderRef.current.filter(id => id !== card.id);
            setAllHands(prev => ({
                ...prev,
                p0: prev['p0'].filter(c => c.id !== card.id)
            }));
            setPlayers(prev => prev.map(p => p.id === 'p0' ? { ...p, cardCount: p.cardCount - 1 } : p));
            setHasPlayedThisTurn(true);
            // Remove from selected list if it was selected
            setSelectedCards(prev => prev.filter(c => c.id !== card.id));
            // In multiplayer, inform the server — without this the next game:state_update
            // would restore the card into the hand (server still had it)
            if (isMultiplayer && mpSocketRef.current) {
                mpSocketRef.current.emit('game:play_cards', {
                    cardsFromHand: [card.id],
                    newTableSets,
                });
            }
        } else {
            showToast('Invalid move! This card does not fit in that set.');
        }
    };

    const handleCardDragEnd = (card: GameCard, info: any) => {
        if (!isMyTurn) return;

        const elements = document.elementsFromPoint(info.point.x, info.point.y);
        const setElement = elements.find(el => el.getAttribute('data-set-index') !== null);

        if (setElement) {
            const setIndex = parseInt(setElement.getAttribute('data-set-index')!, 10);
            tryAddCardToSet(card, setIndex);
        }
    };

    const splitIntoValidGroups = (cards: GameCard[]): GameCard[][] | null => {
        if (isValidGroup(cards)) return [cards];

        // Cannot split Sets (needs 3+, max 4 diff colors), only Runs over 3 cards
        if (cards.length < 3) return null;

        const colors = new Set(cards.filter(c => c.number !== 'JOKER').map(c => c.color));
        if (colors.size > 1) return null; // Mixed colors -> not a run

        const pures = [...cards.filter(c => c.number !== 'JOKER')].sort((a, b) => (a.number as number) - (b.number as number));
        const jokers = cards.filter(c => c.number === 'JOKER');

        let availableJokers = jokers.length;
        const groups: GameCard[][] = [];
        let currentGroup: GameCard[] = [];

        for (let i = 0; i < pures.length; i++) {
            if (currentGroup.length === 0) {
                currentGroup.push(pures[i]);
            } else {
                const prev = currentGroup[currentGroup.length - 1].number as number;
                const curr = pures[i].number as number;
                const diff = curr - prev;

                if (diff === 1) {
                    currentGroup.push(pures[i]);
                } else if (diff === 2 && availableJokers > 0) {
                    currentGroup.push(jokers[0]);
                    currentGroup.push(pures[i]);
                    availableJokers--;
                } else {
                    groups.push([...currentGroup]);
                    currentGroup = [pures[i]];
                }
            }
        }
        if (currentGroup.length > 0) groups.push([...currentGroup]);

        if (availableJokers > 0) {
            let targetGroup = groups.find(g => g.length === 2);
            if (!targetGroup && groups.length > 0) targetGroup = groups[0];
            if (targetGroup) {
                targetGroup.push(jokers[0]);
                availableJokers--;
            }
        }

        if (groups.length > 0 && groups.every(g => isValidGroup(g))) {
            return groups;
        }
        return null;
    };

    const partitionIntoValidGroups = (cards: GameCard[]): GameCard[][] | null => {
        if (cards.length === 0) return [];
        if (cards.length > 15) return null; // Prevent performance issues with naive solver

        const memo = new Map<string, GameCard[][] | null>();

        const solve = (available: GameCard[]): GameCard[][] | null => {
            if (available.length === 0) return [];

            const key = available.map(c => c.id).sort().join(',');
            if (memo.has(key)) return memo.get(key) || null;

            const firstCard = available[0];
            const remainingCards = available.slice(1);
            const n = remainingCards.length;
            const maxMask = 1 << n;

            for (let mask = 0; mask < maxMask; mask++) {
                // We need subsets of size at least 3 (so count of bits >= 2)
                let temp = mask;
                let count = 0;
                while (temp > 0) { count += temp & 1; temp >>= 1; }
                if (count < 2) continue;

                const subset = [firstCard];
                const nextAvailable = [];

                for (let i = 0; i < n; i++) {
                    if ((mask & (1 << i)) !== 0) {
                        subset.push(remainingCards[i]);
                    } else {
                        nextAvailable.push(remainingCards[i]);
                    }
                }

                if (isValidGroup(subset)) {
                    const res = solve(nextAvailable);
                    if (res !== null) {
                        const answer = [subset, ...res];
                        memo.set(key, answer);
                        return answer;
                    }
                }
            }

            memo.set(key, null);
            return null;
        };

        return solve(cards);
    };

    const playSelectedCards = () => {
        if (selectedCards.length === 0) return;

        let newGroups = [selectedCards];
        if (!isValidGroup(selectedCards)) {
            if (selectedCards.length > 15) {
                showToast('Too many cards selected. Select a maximum of 15 cards at a time to form multiple games.');
                return;
            }
            const partitioned = partitionIntoValidGroups(selectedCards);
            if (!partitioned) {
                showToast('Invalid combination! Could not organize the selected cards into valid games.');
                return;
            }
            newGroups = partitioned;
        }

        // TEST table sets validity
        let boardValid = true;
        const proposedSets: GameCard[][] = [];

        for (const set of tableSets) {
            const remaining = set.filter(c => !selectedCards.find(sc => sc.id === c.id));
            if (remaining.length === 0) continue;

            if (remaining.length === set.length) {
                proposedSets.push(remaining);
            } else {
                const split = splitIntoValidGroups(remaining);
                if (split) {
                    proposedSets.push(...split);
                } else {
                    boardValid = false;
                    break;
                }
            }
        }

        if (!boardValid) {
            showToast('Invalid Move: You cannot leave an incomplete or invalid game on the table!');
            return;
        }

        // Remove ONLY the exact cards that came from the user's hand
        const cardsToRemove = allHands['p0'].filter(c => selectedCards.find(sc => sc.id === c.id));
        const removedIds = new Set(cardsToRemove.map(c => c.id));
        handOrderRef.current = handOrderRef.current.filter(id => !removedIds.has(id));

        setAllHands(prev => ({
            ...prev,
            p0: prev['p0'].filter(c => !selectedCards.find(sc => sc.id === c.id))
        }));
        setPlayers(prev => prev.map(p => p.id === 'p0' ? { ...p, cardCount: p.cardCount - cardsToRemove.length } : p));

        // Remove from existing table sets
        setTableSets(proposedSets);

        // Add dynamically formed groups to table
        const sortedGroups = newGroups.map(sortGroupWithJoker);
        setTableSets(prev => [...prev, ...sortedGroups]);

        setSelectedCards([]);

        if (cardsToRemove.length > 0) {
            setHasPlayedThisTurn(true);
            // In multiplayer, also send to server
            if (isMultiplayer && mpSocketRef.current) {
                mpSocketRef.current.emit('game:play_cards', {
                    cardsFromHand: cardsToRemove.map(c => c.id),
                    newTableSets: [...proposedSets, ...sortedGroups],
                });
            }
        } else {
            showToast('Table organized! Play a card or pass your turn (draw) to finish.');
        }
    };

    // ── Multi-Combine Mode functions ──
    const enterMultiCombine = () => {
        if (!isMyTurn) return;
        setSavedTableSets(tableSets.map(s => [...s]));
        setSavedHand([...(allHands['p0'] || [])]);
        setStagingCards([]);
        setSelectedCards([]);
        setMultiCombineActive(true);
    };

    const cancelMultiCombine = () => {
        setTableSets(savedTableSets);
        setAllHands(prev => ({ ...prev, p0: savedHand }));
        setPlayers(prev => prev.map(p => p.id === 'p0' ? { ...p, cardCount: savedHand.length } : p));
        setStagingCards([]);
        setMultiCombineActive(false);
    };

    const stageTableCard = (card: GameCard, setIdx: number) => {
        setTableSets(prev => prev.map((s, i) => i === setIdx ? s.filter(c => c.id !== card.id) : s));
        setStagingCards(prev => [...prev, { card, origin: setIdx }]);
    };

    const stageHandCard = (card: GameCard) => {
        setAllHands(prev => ({ ...prev, p0: (prev['p0'] || []).filter(c => c.id !== card.id) }));
        handOrderRef.current = handOrderRef.current.filter(id => id !== card.id);
        setStagingCards(prev => [...prev, { card, origin: 'hand' }]);
    };

    const unstageCard = (staged: StagedCard) => {
        setStagingCards(prev => prev.filter(s => s.card.id !== staged.card.id));
        if (staged.origin === 'hand') {
            setAllHands(prev => ({ ...prev, p0: [...(prev['p0'] || []), staged.card] }));
            handOrderRef.current = [...handOrderRef.current, staged.card.id];
        } else {
            // Restore to original set index; if set was removed rebuild it
            setTableSets(prev => {
                const newSets = prev.map((s, i) => i === staged.origin ? [...s, staged.card] : s);
                // If the original set index no longer exists (e.g. all cards were staged), add a new set at that index restored from saved
                if (typeof staged.origin === 'number' && staged.origin >= prev.length) {
                    const restored = [...prev];
                    restored[staged.origin] = [staged.card];
                    return restored;
                }
                return newSets;
            });
        }
    };

    const commitMultiCombine = () => {
        const allStagedCards = stagingCards.map(s => s.card);
        if (allStagedCards.length < 3) {
            showToast('You need at least 3 cards in staging to form a combination!');
            return;
        }
        const handCardsStaged = stagingCards.filter(s => s.origin === 'hand').map(s => s.card);
        if (handCardsStaged.length === 0) {
            showToast('You must play at least 1 card from your hand!');
            return;
        }
        // Check remaining table sets are all valid (must be empty or valid group)
        const remainingSets = tableSets.filter(s => s.length > 0);
        for (const s of remainingSets) {
            if (!isValidGroup(s)) {
                showToast('Invalid move! Some sets on the table are incomplete. Try including them in the combination or cancel.');
                return;
            }
        }
        // Partition all staged cards into valid groups
        let newGroups: GameCard[][] | null;
        if (isValidGroup(allStagedCards)) {
            newGroups = [allStagedCards];
        } else {
            newGroups = partitionIntoValidGroups(allStagedCards);
        }
        if (!newGroups) {
            showToast('Could not form valid combinations with the selected cards. Reverting...');
            cancelMultiCombine();
            return;
        }
        const sortedNewGroups = newGroups.map(sortGroupWithJoker);
        const finalTableSets = [...remainingSets, ...sortedNewGroups];
        setTableSets(finalTableSets);
        setPlayers(prev => prev.map(p => p.id === 'p0' ? { ...p, cardCount: (allHands['p0'] || []).length } : p));
        setHasPlayedThisTurn(true);
        setStagingCards([]);
        setMultiCombineActive(false);
        if (allHands['p0'].length === 0 && !isMultiplayer) {
            // Singleplayer win check handled by useEffect
        }
        if (isMultiplayer && mpSocketRef.current) {
            mpSocketRef.current.emit('game:play_cards', {
                cardsFromHand: handCardsStaged.map(c => c.id),
                newTableSets: finalTableSets,
            });
        }
    };

    // Compact card for Multi-Combine table picking
    const renderCardMultiPick = (card: GameCard, setIdx: number) => {
        const colorMap: Record<string, string> = { red: '#ef4444', blue: '#60a5fa', green: '#4ade80', yellow: '#facc15', joker: '#b026ff' };
        const col = colorMap[card.color] ?? '#fff';
        return (
            <motion.div
                key={card.id}
                whileHover={{ y: -6, scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => stageTableCard(card, setIdx)}
                className="w-8 h-12 sm:w-10 sm:h-14 md:w-11 md:h-16 rounded-lg cursor-pointer flex flex-col items-center justify-center border-2 relative overflow-hidden select-none"
                style={{ background: 'rgba(0,0,0,0.7)', borderColor: col, boxShadow: `0 0 12px ${col}55` }}
                title="Click to take this card"
            >
                <span style={{ color: col, fontWeight: 900, fontSize: '0.85rem', lineHeight: 1 }}>{card.number === 'JOKER' ? 'J' : card.number}</span>
                <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-white/10 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[10px] font-black">+</span>
                </div>
            </motion.div>
        );
    };

    // Card Component
    const renderCard = (card: GameCard, isHand = false, isTable = false, compact = false) => {
        const isSelected = selectedCards.find(c => c.id === card.id) !== undefined;

        const sizeClasses = isTable
            ? "w-8 h-12 sm:w-10 sm:h-14 md:w-11 md:h-16"
            : compact
            ? "w-9 h-12 sm:w-14 sm:h-20 md:w-16 md:h-24"
            : "w-12 h-16 sm:w-14 sm:h-20 md:w-16 md:h-24";

        // ───── JOKER CARD — Premium Void Design ─────
        if (card.number === 'JOKER') {
            const jokerSize = isTable
                ? { w: 32, h: 48, stroke: 0.8, cornerText: '6px', centerW: 18, centerH: 18 }
                : compact
                ? { w: 36, h: 48, stroke: 0.9, cornerText: '7px', centerW: 22, centerH: 22 }
                : { w: 48, h: 64, stroke: 1.2, cornerText: '9px', centerW: 30, centerH: 30 };

            return (
                <motion.div
                    key={card.id}
                    layoutId={card.id}
                    drag={isHand}
                    dragConstraints={isHand ? undefined : { left: 0, right: 0, top: 0, bottom: 0 }}
                    dragSnapToOrigin={isHand ? true : undefined}
                    dragElastic={0.2}
                    onDragEnd={(e, info) => { if (isHand) handleCardDragEnd(card, info); }}
                    onClick={() => toggleCardSelection(card)}
                    whileHover={isTable ? { y: -2, scale: 1.04 } : { y: isSelected ? -20 : -12, scale: 1.06 }}
                    animate={{ y: isSelected ? -20 : 0 }}
                    className={`relative ${sizeClasses} rounded-lg sm:rounded-xl cursor-pointer active:cursor-grabbing border z-10 overflow-hidden transition-all duration-300
                        ${isSelected ? 'scale-105 z-20 border-white/80 shadow-[0_0_35px_rgba(255,255,255,0.5)]' : 'border-white/20 shadow-[0_0_20px_rgba(99,0,200,0.6)] hover:border-white/40'}
                    `}
                    style={{ background: 'linear-gradient(135deg, #0a0012 0%, #1a0035 40%, #0d001f 70%, #120028 100%)' }}
                >
                    {/* ── Layer 1: Diagonal colour shafts ── */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(120deg, transparent 30%, rgba(120,0,255,0.18) 50%, transparent 70%)',
                        }} />
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(240deg, transparent 35%, rgba(0,200,255,0.10) 55%, transparent 75%)',
                        }} />
                    </div>

                    {/* ── Layer 2: Fine grid ── */}
                    <div className="absolute inset-0 pointer-events-none opacity-10" style={{
                        backgroundImage: 'linear-gradient(rgba(180,100,255,0.4) 1px, transparent 1px), linear-gradient(90deg,rgba(180,100,255,0.4) 1px, transparent 1px)',
                        backgroundSize: '6px 6px'
                    }} />

                    {/* ── Layer 3: Holographic shimmer sweep (CSS animation) ── */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div style={{
                            position: 'absolute',
                            top: 0, left: '-100%',
                            width: '60%', height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 50%, transparent)',
                            animation: 'jokerShimmer 3.5s ease-in-out infinite',
                        }} />
                    </div>

                    {/* ── Center: Void Diamond SVG ── */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <svg
                            width={jokerSize.centerW}
                            height={jokerSize.centerH}
                            viewBox="0 0 60 60"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ filter: 'drop-shadow(0 0 8px rgba(180,80,255,0.9)) drop-shadow(0 0 18px rgba(100,0,255,0.6))' }}
                        >
                            {/* Outer diamond */}
                            <polygon points="30,2 58,30 30,58 2,30" stroke="rgba(200,130,255,0.9)" strokeWidth={jokerSize.stroke * 1.5} fill="rgba(80,0,160,0.25)" />
                            {/* Inner diamond rotated */}
                            <polygon points="30,12 48,30 30,48 12,30" stroke="rgba(150,80,255,0.6)" strokeWidth={jokerSize.stroke} fill="rgba(40,0,100,0.3)" />
                            {/* Cross-hair lines */}
                            <line x1="30" y1="2" x2="30" y2="58" stroke="rgba(180,100,255,0.25)" strokeWidth={jokerSize.stroke * 0.6} />
                            <line x1="2" y1="30" x2="58" y2="30" stroke="rgba(180,100,255,0.25)" strokeWidth={jokerSize.stroke * 0.6} />
                            {/* Circuit trace dots at corners of inner diamond */}
                            <circle cx="30" cy="12" r="2" fill="rgba(220,160,255,0.9)" />
                            <circle cx="48" cy="30" r="2" fill="rgba(220,160,255,0.9)" />
                            <circle cx="30" cy="48" r="2" fill="rgba(220,160,255,0.9)" />
                            <circle cx="12" cy="30" r="2" fill="rgba(220,160,255,0.9)" />
                            {/* Center core */}
                            <circle cx="30" cy="30" r="5" fill="rgba(200,100,255,0.8)" />
                            <circle cx="30" cy="30" r="2.5" fill="white" />
                            {/* Diagonal tick marks */}
                            <line x1="18" y1="18" x2="22" y2="22" stroke="rgba(150,80,255,0.7)" strokeWidth={jokerSize.stroke} strokeLinecap="round" />
                            <line x1="42" y1="18" x2="38" y2="22" stroke="rgba(150,80,255,0.7)" strokeWidth={jokerSize.stroke} strokeLinecap="round" />
                            <line x1="18" y1="42" x2="22" y2="38" stroke="rgba(150,80,255,0.7)" strokeWidth={jokerSize.stroke} strokeLinecap="round" />
                            <line x1="42" y1="42" x2="38" y2="38" stroke="rgba(150,80,255,0.7)" strokeWidth={jokerSize.stroke} strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* ── Edge glow lines ── */}
                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,100,255,0.7), transparent)' }} />
                    <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(100,0,255,0.5), transparent)' }} />
                    <div className="absolute top-0 bottom-0 left-0 w-px" style={{ background: 'linear-gradient(180deg, transparent, rgba(200,100,255,0.4), transparent)' }} />
                    <div className="absolute top-0 bottom-0 right-0 w-px" style={{ background: 'linear-gradient(180deg, transparent, rgba(200,100,255,0.4), transparent)' }} />

                    {/* Selection Checkmark */}
                    {isSelected && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-white text-black rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shadow-[0_0_15px_rgba(255,255,255,1)] border-2 border-[#120a1f] z-30">
                            ✓
                        </div>
                    )}
                </motion.div>
            );
        }

        // ───── REGULAR CARD — Premium Void Design ─────
        const theme = CARD_THEME[card.color as keyof typeof CARD_THEME];
        const numSize = isTable ? '1.15rem' : compact ? '1.5rem' : '2.2rem';
        const cornerSize = isTable ? '0.42rem' : compact ? '0.5rem' : '0.65rem';

        return (
            <motion.div
                key={card.id}
                layoutId={card.id}
                drag={isHand}
                dragConstraints={isHand ? undefined : { left: 0, right: 0, top: 0, bottom: 0 }}
                dragSnapToOrigin={isHand ? true : undefined}
                dragElastic={0.2}
                onDragEnd={(e, info) => { if (isHand) handleCardDragEnd(card, info); }}
                onClick={() => toggleCardSelection(card)}
                whileHover={isTable ? { y: -3, scale: 1.04 } : { y: isSelected ? -20 : -12, scale: 1.06 }}
                animate={{ y: isSelected ? -20 : 0 }}
                className={`relative ${sizeClasses} rounded-lg sm:rounded-xl cursor-pointer active:cursor-grabbing border z-10 overflow-hidden transition-all duration-200`}
                style={{
                    background: theme.bg,
                    borderColor: isSelected ? 'rgba(255,255,255,0.9)' : theme.border,
                    boxShadow: isSelected
                        ? '0 0 28px rgba(255,255,255,0.5), 0 0 8px rgba(255,255,255,0.3)'
                        : theme.outerShadow,
                    zIndex: isSelected ? 20 : 10,
                }}
            >
                {/* ── Fine circuit grid ── */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: `linear-gradient(${theme.grid} 1px, transparent 1px), linear-gradient(90deg, ${theme.grid} 1px, transparent 1px)`,
                    backgroundSize: '5px 5px',
                    opacity: 0.35,
                }} />

                {/* ── Diagonal colour shaft ── */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    background: `linear-gradient(130deg, transparent 25%, ${theme.shaft} 50%, transparent 75%)`,
                }} />
                <div className="absolute inset-0 pointer-events-none" style={{
                    background: `linear-gradient(230deg, transparent 30%, ${theme.shaft2} 55%, transparent 80%)`,
                }} />

                {/* ── Top accent LED strip ── */}
                <div className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none" style={{ background: theme.accentLine }} />
                {/* ── Bottom dim strip ── */}
                <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none" style={{ background: theme.accentLine, opacity: 0.3 }} />
                {/* ── Left edge ── */}
                <div className="absolute top-0 bottom-0 left-0 w-px pointer-events-none" style={{ background: `linear-gradient(180deg, ${theme.edge}, transparent 60%)` }} />

                {/* ── Top-left: corner number + dot ── */}
                <div className="absolute top-[4px] left-[4px] z-20 flex flex-col items-start select-none" style={{ gap: '1px' }}>
                    <span style={{
                        fontSize: cornerSize,
                        fontWeight: 900,
                        lineHeight: 1,
                        color: theme.numColor,
                        textShadow: theme.numShadow,
                        fontVariantNumeric: 'tabular-nums',
                    }}>{card.number}</span>
                    {/* tiny accent dot */}
                    <span style={{ display: 'block', width: isTable ? '3px' : '4px', height: isTable ? '3px' : '4px', borderRadius: '50%', background: theme.dot, boxShadow: `0 0 4px ${theme.dot}` }} />
                </div>

                {/* ── Center: big glow number ── */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <span style={{
                        fontSize: numSize,
                        fontWeight: 900,
                        lineHeight: 1,
                        color: theme.numColor,
                        textShadow: theme.numShadow,
                        filter: theme.glow,
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '-0.04em',
                    }}>{card.number}</span>
                </div>

                {/* ── Bottom-right: corner number rotated ── */}
                <div className="absolute bottom-[4px] right-[4px] z-20 flex flex-col items-end rotate-180 select-none" style={{ gap: '1px' }}>
                    <span style={{
                        fontSize: cornerSize,
                        fontWeight: 900,
                        lineHeight: 1,
                        color: theme.numColor,
                        textShadow: theme.numShadow,
                        fontVariantNumeric: 'tabular-nums',
                    }}>{card.number}</span>
                    <span style={{ display: 'block', width: isTable ? '3px' : '4px', height: isTable ? '3px' : '4px', borderRadius: '50%', background: theme.dot, boxShadow: `0 0 4px ${theme.dot}` }} />
                </div>

                {/* ── Selection Checkmark ── */}
                {isSelected && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-white text-black rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shadow-[0_0_15px_rgba(255,255,255,1)] border-2 border-[#120a1f] z-30">
                        ✓
                    </div>
                )}
            </motion.div>
        );
    };


    // Opponent Avatar Component
    const renderOpponent = (player: Player, position: 'topLeft' | 'topCenter' | 'topRight' | 'top') => {
        const isTurn = player.isActive;

        const rootClasses =
            position === 'topLeft' ? 'top-2 left-2 sm:top-4 sm:left-4 sm:left-6' :
                position === 'topRight' ? 'top-2 right-2 sm:top-4 sm:right-4 sm:right-6' :
                    'top-2 left-1/2 -translate-x-1/2 sm:top-4';

        const maxCardsShown = 3;

        const avatarBlock = (size: number) => (
            <div className={`relative flex-shrink-0 transition-all ${isTurn ? 'scale-110' : ''}`} style={{ width: size, height: size }}>
                <AnimatePresence>
                    {opponentEmotes[player.id] && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: -10 }}
                            animate={{ opacity: 1, scale: 1.4, y: size - 4 }}
                            exit={{ opacity: 0, scale: 0.5, y: 0 }}
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 z-50 text-2xl drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none"
                        >
                            {opponentEmotes[player.id]}
                        </motion.div>
                    )}
                </AnimatePresence>
                {player.frameConfig ? (
                    <FramedAvatar
                        src={player.avatar}
                        alt={player.name}
                        size={size}
                        rounded="full"
                        frameConfig={player.frameConfig}
                        className={isTurn ? 'shadow-[0_0_20px_rgba(176,38,255,0.6)]' : ''}
                    />
                ) : (
                    <div className={`w-full h-full rounded-full p-[3px] overflow-hidden ${isTurn ? 'bg-[#b026ff] shadow-[0_0_20px_rgba(176,38,255,0.6)]' : 'bg-white/10 border border-white/5'}`}>
                        <img src={player.avatar} alt={player.name} className="w-full h-full rounded-full object-cover" />
                    </div>
                )}
                {isTurn && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                        <circle cx="50" cy="50" r="48" fill="none" stroke="#fff" strokeWidth="4"
                            strokeDasharray="301" strokeDashoffset={301 - (301 * (player.timeLeft / (player.maxTurnTime || 45)))}
                        />
                    </svg>
                )}
            </div>
        );

        return (
            <div className={`absolute z-30 ${rootClasses}`}>
                {/* ── MOBILE: compact column (avatar + name + card count badge) ── */}
                <div className="flex sm:hidden flex-col items-center gap-0.5">
                    <div className="relative">
                        {avatarBlock(40)}
                        {/* card count badge */}
                        <div className="absolute -bottom-1 -right-1 bg-black/80 border border-white/20 text-white text-[8px] font-black min-w-[16px] h-4 px-0.5 rounded flex items-center justify-center">
                            {player.cardCount}
                        </div>
                    </div>
                    <span className="text-[8px] font-bold text-gray-300 max-w-[44px] truncate leading-tight">{player.name}</span>
                </div>

                {/* ── DESKTOP: full layout ── */}
                <div className="hidden sm:flex items-start gap-3 md:gap-4 flex-row">
                    {avatarBlock(56)}
                    <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-2">
                            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 flex flex-col min-w-[90px]">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{player.name}</span>
                                <div className="flex items-center gap-2">
                                    <Layers size={12} className="text-[#b026ff]" />
                                    <span className="text-xs font-black text-white">{player.cardCount} cards</span>
                                </div>
                            </div>
                            {player.petConfig?.modelUrl && (
                                <PetViewer petConfig={player.petConfig} size={48} withBackground={false} />
                            )}
                        </div>
                        <div className="flex flex-row items-center -space-x-3 mt-1 opacity-90">
                            {Array.from({ length: Math.min(player.cardCount, maxCardsShown) }).map((_, i) => (
                                <div key={i} className="w-8 h-12 md:w-10 md:h-14 rounded bg-gray-900 border border-white/10 shadow-lg overflow-hidden flex-shrink-0" style={{ zIndex: i }}>
                                    <img src={player.sleeve} className="w-full h-full object-cover opacity-80" alt="Sleeve" />
                                </div>
                            ))}
                            {player.cardCount > maxCardsShown && (
                                <div className="w-8 h-12 md:w-10 md:h-14 rounded bg-black/90 border border-[#b026ff]/30 flex items-center justify-center text-[10px] font-black text-[#b026ff] z-10 flex-shrink-0 ml-1">
                                    +{player.cardCount - maxCardsShown}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const myPlayer = players[0];
    const isMyTurn = myPlayer.isActive;

    return (
        <div className="fixed inset-0 bg-[#0a050f] text-white font-sans overflow-hidden">
            {/* --- IN-GAME TOAST NOTIFICATION --- */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.9, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                        exit={{ opacity: 0, y: -50, scale: 0.9, x: '-50%' }}
                        className="fixed top-24 left-1/2 z-[100] px-6 py-4 bg-red-950/90 backdrop-blur-xl border border-red-500/50 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.5)] flex items-center gap-3 w-[90%] max-w-md pointer-events-none"
                    >
                        <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center shrink-0">
                            <span className="text-red-400 font-bold">!</span>
                        </div>
                        <p className="text-red-200 text-sm font-bold leading-tight">{toastMessage}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- GAME OVER MODAL --- */}
            <AnimatePresence>
                {gameOver && (() => {
                    const isVictory = gameOver.winnerId === 'p0';
                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
                        >
                            {/* Ambient beam from top */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full"
                                    style={{ background: isVictory ? 'linear-gradient(to bottom, rgba(251,191,36,0.7), transparent 60%)' : 'linear-gradient(to bottom, rgba(239,68,68,0.7), transparent 60%)' }}
                                />
                                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full"
                                    style={{ background: isVictory ? 'radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(239,68,68,0.07) 0%, transparent 70%)' }}
                                />
                                {/* Scanlines */}
                                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)', backgroundSize: '100% 3px' }} />
                            </div>

                            <motion.div
                                initial={{ scale: 0.88, y: 32, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.05 }}
                                className="relative w-full max-w-md"
                            >
                                {/* Eyebrow label */}
                                <p className="text-center text-[10px] font-black tracking-[0.45em] uppercase mb-3"
                                    style={{ color: isVictory ? 'rgba(251,191,36,0.6)' : 'rgba(239,68,68,0.6)' }}
                                >
                                    {gameOver.reason === 'deck_empty' ? t('game.tieBreaker') : gameOver.reason === 'hand_empty' ? t('game.handCleared') : gameOver.reason === 'forfeited' ? t('game.forfeited') : t('game.matchResult')}
                                </p>

                                {/* Giant title */}
                                <div className="text-center mb-1 relative">
                                    <motion.h1
                                        initial={{ letterSpacing: '0.5em', opacity: 0 }}
                                        animate={{ letterSpacing: isVictory ? '0.08em' : '0.12em', opacity: 1 }}
                                        transition={{ delay: 0.12, duration: 0.5 }}
                                        className="text-[88px] leading-none font-black uppercase select-none"
                                        style={{
                                            background: isVictory
                                                ? 'linear-gradient(170deg, #fffbe6 0%, #fbbf24 35%, #d97706 70%, #92400e 100%)'
                                                : 'linear-gradient(170deg, #fff1f1 0%, #f87171 35%, #dc2626 70%, #7f1d1d 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            filter: isVictory
                                                ? 'drop-shadow(0 0 40px rgba(251,191,36,0.5))'
                                                : 'drop-shadow(0 0 40px rgba(239,68,68,0.5))',
                                        }}
                                    >
                                        {isVictory ? t('game.victory') : t('game.defeat')}
                                    </motion.h1>
                                </div>

                                {/* Divider line */}
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                    className="h-px w-full mb-5"
                                    style={{ background: isVictory ? 'linear-gradient(90deg, transparent, rgba(251,191,36,0.8), transparent)' : 'linear-gradient(90deg, transparent, rgba(239,68,68,0.8), transparent)' }}
                                />

                                {/* Panel */}
                                <div
                                    className="rounded-2xl overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(160deg, rgba(15,8,30,0.95) 0%, rgba(8,4,18,0.98) 100%)',
                                        border: isVictory ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(239,68,68,0.2)',
                                        boxShadow: isVictory
                                            ? '0 0 60px rgba(251,191,36,0.08), inset 0 1px 0 rgba(251,191,36,0.12)'
                                            : '0 0 60px rgba(239,68,68,0.08), inset 0 1px 0 rgba(239,68,68,0.12)'
                                    }}
                                >
                                    {/* Top accent */}
                                    <div className="h-px w-full" style={{ background: isVictory ? 'linear-gradient(90deg, transparent, rgba(251,191,36,0.6), transparent)' : 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)' }} />

                                    <div className="p-6">
                                        {/* Result message */}
                                        <p className="text-center text-sm font-bold mb-5 tracking-wide"
                                            style={{ color: isVictory ? 'rgba(251,191,36,0.75)' : 'rgba(156,163,175,0.9)' }}
                                        >
                                            {gameOver.reason === 'deck_empty'
                                                ? 'Deck depleted — winner decided by lowest score'
                                                : gameOver.reason === 'forfeited'
                                                    ? 'You left the battlefield. Your MMR took a hit.'
                                                    : (isVictory
                                                        ? `${gameOver.winner} emptied their hand — flawless execution.`
                                                        : `${gameOver.winner} emptied their hand first`)}
                                        </p>

                                        {/* Rankings — only shown for deck_empty tie-breaker */}
                                        {gameOver.reason === 'deck_empty' && gameOver.ranks && (
                                            <div className="flex flex-col gap-1.5 mb-5">
                                                {gameOver.ranks.map((rank, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.35 + idx * 0.07 }}
                                                        className="flex justify-between items-center px-4 py-2.5 rounded-xl"
                                                        style={{
                                                            background: idx === 0
                                                                ? (isVictory ? 'rgba(251,191,36,0.08)' : 'rgba(239,68,68,0.08)')
                                                                : 'rgba(255,255,255,0.03)',
                                                            border: idx === 0
                                                                ? (isVictory ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(239,68,68,0.25)')
                                                                : '1px solid rgba(255,255,255,0.05)',
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-black w-5 text-center"
                                                                style={{ color: idx === 0 ? (isVictory ? '#fbbf24' : '#f87171') : 'rgba(255,255,255,0.2)' }}
                                                            >#{idx + 1}</span>
                                                            <span className="font-bold text-sm text-white">{rank.name}</span>
                                                        </div>
                                                        <span className="font-black text-sm"
                                                            style={{ color: idx === 0 ? (isVictory ? '#fbbf24' : '#f87171') : 'rgba(156,163,175,0.6)' }}
                                                        >{rank.score} pts</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}

                                        {/* MMR delta badge (ranked only) */}
                                        {mmrDelta !== null && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 }}
                                                className="flex justify-center mb-4"
                                            >
                                                <span
                                                    className="px-4 py-1.5 rounded-full text-sm font-black tracking-wide"
                                                    style={{
                                                        background: mmrDelta >= 0
                                                            ? 'rgba(34,197,94,0.15)'
                                                            : 'rgba(239,68,68,0.15)',
                                                        border: mmrDelta >= 0
                                                            ? '1px solid rgba(34,197,94,0.4)'
                                                            : '1px solid rgba(239,68,68,0.4)',
                                                        color: mmrDelta >= 0 ? '#4ade80' : '#f87171',
                                                    }}
                                                >
                                                    {mmrDelta >= 0 ? `+${mmrDelta}` : mmrDelta} MMR
                                                </span>
                                            </motion.div>
                                        )}

                                        {/* Buttons */}
                                        <div className="flex gap-3 mt-1">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => { refreshUser(); navigate('/dashboard'); }}
                                                className="flex-1 py-3.5 rounded-xl font-black uppercase tracking-[0.12em] text-sm text-gray-400 hover:text-white transition-all"
                                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                                            >
                                                {t('game.exit')}
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            {/* --- LEVEL-UP OVERLAY --- */}
            <AnimatePresence>
                {levelUpInfo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.5 } }}
                        className="fixed inset-0 z-[305] flex items-center justify-center"
                        onClick={() => setLevelUpInfo(null)}
                        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(176,38,255,0.22) 0%, rgba(0,0,0,0.88) 65%)' }}
                    >
                        {/* Particle burst */}
                        {[...Array(16)].map((_, i) => {
                            const angle = (i / 16) * 360;
                            const r = 140 + (i % 3) * 28;
                            return (
                                <motion.div key={i}
                                    className="absolute rounded-full pointer-events-none"
                                    style={{ width: i % 2 === 0 ? 7 : 4, height: i % 2 === 0 ? 7 : 4, background: i % 3 === 0 ? '#b026ff' : i % 3 === 1 ? '#e879f9' : '#fbbf24', top: '50%', left: '50%' }}
                                    initial={{ x: -3, y: -3, scale: 0, opacity: 1 }}
                                    animate={{ x: Math.cos((angle * Math.PI) / 180) * r - 3, y: Math.sin((angle * Math.PI) / 180) * r - 3, scale: [0, 1.8, 0], opacity: [1, 1, 0] }}
                                    transition={{ duration: 1.2, delay: 0.1 + i * 0.03, ease: 'easeOut' }}
                                />
                            );
                        })}
                        <motion.div
                            initial={{ scale: 0.6, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 1.06, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.05 }}
                            className="relative text-center px-10 py-10 rounded-3xl select-none"
                            style={{ background: 'linear-gradient(160deg, rgba(20,8,36,0.97) 0%, rgba(10,4,20,0.99) 100%)', border: '1px solid rgba(176,38,255,0.35)', boxShadow: '0 0 80px rgba(176,38,255,0.3), inset 0 1px 0 rgba(176,38,255,0.2)', minWidth: 300 }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(176,38,255,0.9), transparent)' }} />
                            <p className="text-[10px] font-black tracking-[0.45em] uppercase mb-5" style={{ color: 'rgba(176,38,255,0.75)' }}>✦ LEVEL UP ✦</p>
                            <div className="flex items-center justify-center gap-6 mb-6">
                                <span className="text-5xl font-black" style={{ color: 'rgba(255,255,255,0.22)' }}>{levelUpInfo.oldLevel}</span>
                                <motion.span
                                    animate={{ x: [0, 6, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                                    className="text-2xl" style={{ color: 'rgba(176,38,255,0.8)' }}
                                >→</motion.span>
                                <motion.span
                                    initial={{ scale: 0.2, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.22, type: 'spring', stiffness: 320, damping: 18 }}
                                    className="text-[88px] leading-none font-black"
                                    style={{ color: '#fff', filter: 'drop-shadow(0 0 28px rgba(176,38,255,1)) drop-shadow(0 0 60px rgba(176,38,255,0.5))' }}
                                >{levelUpInfo.newLevel}</motion.span>
                            </div>
                            <motion.div className="mx-auto rounded-full overflow-hidden" style={{ background: 'rgba(176,38,255,0.15)', width: 180, height: 3 }}>
                                <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #b026ff, #e879f9)' }}
                                    initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 4.2, ease: 'linear' }}
                                />
                            </motion.div>
                            <p className="text-[10px] text-white/25 mt-3 tracking-widest uppercase">Toque para continuar</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- RANK-UP OVERLAY --- */}
            <AnimatePresence>
                {rankUpInfo && (() => {
                    const rt = RANK_COLORS[rankUpInfo.newRank] ?? RANK_COLORS['IRON'];
                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.5 } }}
                            className="fixed inset-0 z-[306] flex items-center justify-center"
                            onClick={() => setRankUpInfo(null)}
                            style={{ background: `radial-gradient(ellipse at 50% 50%, ${rt.bg} 0%, rgba(0,0,0,0.92) 65%)` }}
                        >
                            {/* Particle burst */}
                            {[...Array(20)].map((_, i) => {
                                const angle = (i / 20) * 360;
                                const r = 160 + (i % 4) * 24;
                                return (
                                    <motion.div key={i}
                                        className="absolute rounded-full pointer-events-none"
                                        style={{ width: i % 3 === 0 ? 9 : 5, height: i % 3 === 0 ? 9 : 5, background: rt.primary, top: '50%', left: '50%' }}
                                        initial={{ x: -4, y: -4, scale: 0, opacity: 1 }}
                                        animate={{ x: Math.cos((angle * Math.PI) / 180) * r - 4, y: Math.sin((angle * Math.PI) / 180) * r - 4, scale: [0, 2, 0], opacity: [1, 0.8, 0] }}
                                        transition={{ duration: 1.4, delay: 0.08 + i * 0.028, ease: 'easeOut' }}
                                    />
                                );
                            })}
                            <motion.div
                                initial={{ scale: 0.55, y: 40, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 1.06, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
                                className="relative text-center px-12 py-10 rounded-3xl select-none"
                                style={{ background: 'linear-gradient(160deg, rgba(14,6,24,0.98) 0%, rgba(8,3,15,0.99) 100%)', border: `1px solid ${rt.primary}50`, boxShadow: `0 0 100px ${rt.glow}, 0 0 200px ${rt.glow.replace('0.4','0.15').replace('0.5','0.15').replace('0.6','0.15').replace('0.7','0.15')}, inset 0 1px 0 ${rt.primary}35`, minWidth: 320 }}
                            >
                                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${rt.primary}, transparent)` }} />
                                <p className="text-[10px] font-black tracking-[0.45em] uppercase mb-3" style={{ color: `${rt.primary}bb` }}>✦ RANK UP ✦</p>
                                <div className="flex items-center justify-center gap-3 mb-3">
                                    <span className="text-xs font-bold tracking-widest uppercase opacity-40 text-white">{rankUpInfo.oldRank}</span>
                                    <span className="text-base" style={{ color: `${rt.primary}80` }}>→</span>
                                    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: rt.primary }}>{rankUpInfo.newRank}</span>
                                </div>
                                <motion.h1
                                    initial={{ letterSpacing: '0.9em', opacity: 0, scale: 0.7 }}
                                    animate={{ letterSpacing: '0.1em', opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.15, duration: 0.65, ease: 'easeOut' }}
                                    className="text-[70px] leading-none font-black uppercase mb-5"
                                    style={{ color: rt.primary, filter: `drop-shadow(0 0 40px ${rt.glow}) drop-shadow(0 0 80px ${rt.glow})` }}
                                >{rankUpInfo.newRank}</motion.h1>
                                <motion.div className="mx-auto rounded-full overflow-hidden" style={{ background: `${rt.primary}20`, width: 200, height: 3 }}>
                                    <motion.div className="h-full rounded-full" style={{ background: rt.primary }}
                                        initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 5, ease: 'linear' }}
                                    />
                                </motion.div>
                                <p className="text-[10px] mt-3 tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>Toque para continuar</p>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            {/* --- SURRENDER MODAL --- */}
            <AnimatePresence>
                {showSurrenderModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }} className="bg-[#120a1f] border border-red-500/30 p-8 rounded-3xl shadow-[0_0_80px_rgba(239,68,68,0.2)] text-center max-w-sm w-full relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                                <Flag className="text-red-500" size={32} />
                            </div>

                            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">
                                {t('game.surrender')}?
                            </h2>
                            <p className="text-gray-400 text-sm mb-8 font-bold">
                                {t('game.surrenderConfirm')}
                            </p>

                            <div className="flex gap-4">
                                <button onClick={() => setShowSurrenderModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase tracking-widest text-gray-300 hover:text-white transition-all">
                                    {t('game.cancel')}
                                </button>
                                <button onClick={() => { if (isMultiplayer) { mpSocketRef.current?.emit('game:surrender'); } else { navigate('/play'); } setShowSurrenderModal(false); }} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-black uppercase tracking-widest text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                                    {t('game.surrender')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Grid & Glows */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(176,38,255,0.06) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#b026ff]/10 blur-[150px] rounded-[100%] pointer-events-none" />

            {/* Top Bar removed to make space for top opponents */}

            {/* --- OPPONENTS --- */}
            {playersCount === 2 ? (
                renderOpponent(players[1], 'topCenter')
            ) : (
                <>
                    {renderOpponent(players[1], 'topLeft')}
                    {renderOpponent(players[2], 'topCenter')}
                    {renderOpponent(players[3], 'topRight')}
                </>
            )}

            {/* --- GAME TABLE (CENTER) --- */}
            <div className="absolute inset-x-2 sm:inset-x-12 top-20 sm:top-28 bottom-56 sm:bottom-48 border-2 border-white/5 rounded-3xl bg-white/[0.02] backdrop-blur-sm p-3 sm:p-8 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {multiCombineActive && (
                    <div className="text-center mb-3">
                        <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#b026ff] bg-[#b026ff]/10 border border-[#b026ff]/30 rounded-full px-4 py-1.5">
                            <ArrowDownUp size={12} />
                            Multi-Combine Mode — click table cards to pick them up
                        </span>
                    </div>
                )}
                <div className="w-full h-full flex flex-wrap content-start justify-center gap-2 sm:gap-4 gap-y-4 sm:gap-y-6">
                    {tableSets.map((set, sIdx) => {
                        if (set.length === 0) return null;
                        const isSetValid = isValidGroup(set);
                        const isSetIncompleteInMulti = multiCombineActive && set.length > 0 && set.length < 3;

                        return (
                            <div key={`set_${sIdx}`} data-set-index={sIdx} className={`flex items-center gap-0.5 p-1 sm:p-1.5 rounded-xl bg-white/[0.02] border relative transition-colors ${
                                isSetIncompleteInMulti ? 'border-orange-400/60 shadow-[0_0_15px_rgba(251,146,60,0.4)]' :
                                !isSetValid ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' :
                                'border-white/5 shadow-lg'
                            }`}>
                                {!isSetValid && !multiCombineActive && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-lg">Invalid</div>
                                )}
                                {isSetIncompleteInMulti && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-400 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-lg">Incompleto</div>
                                )}
                                {/* Visual connector hint */}
                                <div className="absolute -inset-2 rounded-2xl border border-[#b026ff]/0 hover:border-[#b026ff]/50 transition-colors cursor-pointer pointer-events-auto z-0" />
                                {set.map((card) => multiCombineActive && isMyTurn
                                    ? renderCardMultiPick(card, sIdx)
                                    : renderCard(card, false, true)
                                )}
                            </div>
                        );
                    })}
                    {tableSets.filter(s => s.length > 0).length === 0 && (
                        <div className="flex flex-col items-center text-white/20 mt-12">
                            <GripHorizontal size={48} className="mb-4 opacity-50" />
                            <p className="font-bold tracking-widest uppercase">{t('game.tableEmpty')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- PLAY COMBINATION BUTTON --- */}
            <AnimatePresence>
                {selectedCards.length >= 3 && isMyTurn && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
                        className="fixed bottom-[268px] sm:bottom-[212px] left-1/2 z-50 origin-bottom"
                    >
                        <button
                            onClick={playSelectedCards}
                            className="bg-[#b026ff] hover:bg-[#c95bff] text-white px-8 py-3 rounded-full font-black tracking-widest uppercase shadow-[0_0_40px_rgba(176,38,255,0.8)] border-2 border-white/20 transition-all hover:scale-105 active:scale-95"
                        >
                            {t('game.playCombination')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* === UNIFIED BOTTOM PANEL === */}
            {!isSpectator && (
            <div className="absolute bottom-0 left-0 right-0 z-50">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0814] via-[#0f0814]/96 to-transparent pointer-events-none" />
                <div className="relative flex flex-col">

                    {/* ── CONTROLS ROW ── */}
                    <div className="flex items-center justify-between px-3 pt-2 pb-1 gap-2 pointer-events-auto">

                        {/* LEFT: Avatar + Pet + Hand count */}
                        <div className="flex items-center gap-2 shrink-0">
                            <div className={`relative transition-all ${isMyTurn ? '-translate-y-1' : ''}`}>
                                {equippedFrameConfig ? (
                                    <FramedAvatar
                                        src={myPlayer.avatar}
                                        alt="You"
                                        size={64}
                                        rounded="full"
                                        frameConfig={equippedFrameConfig}
                                        className={isMyTurn ? 'shadow-[0_0_20px_rgba(176,38,255,0.6)]' : ''}
                                    />
                                ) : (
                                    <div className={`relative w-16 h-16 rounded-full p-1 overflow-hidden ${isMyTurn ? 'bg-[#b026ff] shadow-[0_0_20px_rgba(176,38,255,0.6)]' : 'bg-white/10'}`}>
                                        <img src={myPlayer.avatar} alt="You" className="w-full h-full rounded-full object-cover" />
                                    </div>
                                )}
                                {/* Active Emote render */}
                                <AnimatePresence>
                                    {activeEmote && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5, y: 10 }}
                                            animate={{ opacity: 1, scale: 1.5, y: -45 }}
                                            exit={{ opacity: 0, scale: 0.5, y: 0 }}
                                            className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 z-50 text-4xl drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] pointer-events-none"
                                        >
                                            {activeEmote}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {isMyTurn && (
                                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#120a1f] animate-pulse">
                                        {myPlayer.timeLeft}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                {equippedPetConfig?.modelUrl && (
                                    <PetViewer petConfig={equippedPetConfig} size={40} withBackground={false} />
                                )}
                                <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400">{t('game.myHand')}</span>
                                    <div className="flex items-center gap-1">
                                        <Layers size={12} className="text-[#b026ff]" />
                                        <span className="text-xs font-black">{myHand.length + stagingCards.filter(s => s.origin === 'hand').length} {t('game.cards')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CENTER: Sort + MultiCombine + Emote */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={sortMyHand}
                                className="group bg-[#120a1f]/80 hover:bg-[#b026ff]/30 backdrop-blur-xl px-3 py-2 rounded-2xl border border-white/10 hover:border-[#b026ff]/50 flex items-center gap-1.5 text-gray-400 hover:text-white transition-all text-xs font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(176,38,255,0.4)]"
                            >
                                <ArrowDownUp size={14} className="text-[#b026ff] group-hover:rotate-180 transition-transform duration-500" />
                                {t('game.sort')}
                            </button>
                            {isMyTurn && !multiCombineActive && (
                                <button
                                    onClick={enterMultiCombine}
                                    className="group relative overflow-hidden bg-gradient-to-r from-purple-900/60 to-[#b026ff]/20 hover:from-purple-800/70 hover:to-[#b026ff]/40 backdrop-blur-xl px-3 py-2 rounded-2xl border border-[#b026ff]/40 hover:border-[#b026ff]/80 flex items-center gap-1.5 text-[#c77dff] hover:text-white transition-all duration-300 text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(176,38,255,0.2)] hover:shadow-[0_0_20px_rgba(176,38,255,0.5)]"
                                    title="Multi-Combine Mode"
                                >
                                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                    <Shuffle size={13} className="group-hover:rotate-180 transition-transform duration-500" />
                                    {t('game.multi')}
                                </button>
                            )}
                            <div className="relative">
                                <button onClick={() => setIsEmoteOpen(!isEmoteOpen)} className="w-10 h-10 bg-[#120a1f] hover:bg-white/10 rounded-full border border-white/10 transition-colors flex items-center justify-center cursor-pointer group shadow-xl">
                                    <Smile className="text-gray-400 group-hover:text-white transition-colors" size={20} />
                                </button>
                                <AnimatePresence>
                                    {isEmoteOpen && (
                                        <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 10 }} className="absolute bottom-full left-0 mb-3 bg-[#120a1f]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-[0_0_30px_rgba(0,0,0,0.8)] grid grid-cols-3 gap-3 z-50 w-[148px]">
                                            {['😎', '😡', '😭', '💀', '🔥', '🤡'].map(emoji => (
                                                <button key={emoji} onClick={() => playEmote(emoji)} className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-white/10 rounded-xl transition-colors">
                                                    {emoji}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* RIGHT: Settings + Surrender + Deck + Turn actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => { }} className="p-2.5 bg-[#120a1f]/80 hover:bg-white/10 rounded-xl border border-white/10 transition-colors flex items-center justify-center text-gray-400 hover:text-white" title="Settings">
                                <Settings size={16} />
                            </button>
                            <button onClick={() => setShowSurrenderModal(true)} className="p-2.5 bg-red-900/20 hover:bg-red-500 rounded-xl border border-red-500/30 transition-colors flex items-center justify-center text-red-500 hover:text-white" title="Surrender">
                                <Flag size={16} />
                            </button>
                            {/* Desktop-only: Deck + turn actions */}
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="w-px h-7 bg-white/10" />
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">{t('game.deck')}</span>
                                    <div className="font-black text-base text-white">{deck.length}</div>
                                </div>
                                <div className="relative w-10 rounded-lg bg-gradient-to-br from-[#120a1f] to-[#2a0e42] border-2 border-white/20 flex items-center justify-center shadow-xl overflow-hidden group" style={{ height: 60 }}>
                                    <img src={players[0].sleeve} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Deck" />
                                    <div className="absolute inset-0 bg-black/20" />
                                </div>
                                {isMyTurn && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                                        <button
                                            onClick={useExtraTime}
                                            className="py-2 px-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-1 transition-all border bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-yellow-900 border-yellow-500/30 hover:shadow-[0_0_12px_rgba(234,179,8,0.5)]"
                                            title="Use 30s Bank Time"
                                        >
                                            <Timer size={14} /> +{myPlayer.bankTime}s
                                        </button>
                                        <button
                                            onClick={passTurn}
                                            className="py-2 px-4 rounded-xl font-black text-sm uppercase tracking-widest bg-[#b026ff] text-white hover:bg-[#9d1ce6] transition-colors shadow-[0_0_18px_rgba(176,38,255,0.4)] whitespace-nowrap"
                                        >
                                            {hasPlayedThisTurn ? t('game.endTurn') : t('game.passAndDraw')}
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── MOBILE-ONLY: Deck + Turn action row ── */}
                    <div className="flex sm:hidden items-center justify-between px-3 pb-1 gap-2 pointer-events-auto">
                        {/* Deck display */}
                        <div className="flex items-center gap-2">
                            <div className="relative w-8 rounded bg-gradient-to-br from-[#120a1f] to-[#2a0e42] border border-white/20 overflow-hidden flex-shrink-0" style={{ height: 44 }}>
                                <img src={players[0].sleeve} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Deck" />
                                <div className="absolute inset-0 bg-black/20" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-widest font-bold text-gray-500">{t('game.deck')}</span>
                                <span className="font-black text-sm text-white leading-none">{deck.length}</span>
                            </div>
                        </div>
                        {/* Turn actions (only when it's my turn) */}
                        {isMyTurn ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={useExtraTime}
                                    className="py-2 px-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-1 transition-all border bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                                    title="Use Bank Time"
                                >
                                    <Timer size={13} /> +{myPlayer.bankTime}s
                                </button>
                                <button
                                    onClick={passTurn}
                                    className="py-2 px-5 rounded-xl font-black text-sm uppercase tracking-widest bg-[#b026ff] text-white shadow-[0_0_18px_rgba(176,38,255,0.5)] whitespace-nowrap active:scale-95 transition-all"
                                >
                                    {hasPlayedThisTurn ? t('game.endTurn') : t('game.passAndDraw')}
                                </button>
                            </div>
                        ) : (
                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">{t('game.waiting')}</span>
                        )}
                    </div>

                    {/* Thin separator */}
                    <div className="h-px bg-white/5 mx-3" />

                    {/* ── MULTI-COMBINE STAGING AREA ── */}
                    <AnimatePresence>
                        {multiCombineActive && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                className="overflow-hidden"
                            >
                                {/* Glowing top border accent */}
                                <div className="mx-3 mt-2 mb-1 h-px bg-gradient-to-r from-transparent via-[#b026ff]/60 to-transparent" />
                                <div className="mx-3 mb-2 rounded-2xl border border-[#b026ff]/30 bg-gradient-to-b from-[#1a0a2e]/90 to-[#120a1f]/90 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_rgba(176,38,255,0.15)] relative">
                                    {/* Subtle animated bg glow */}
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(176,38,255,0.08)_0%,transparent_70%)] pointer-events-none" />

                                    {/* Header bar */}
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-[#b026ff]/20">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-center w-5 h-5 rounded-md bg-[#b026ff]/20 border border-[#b026ff]/40">
                                                <Zap size={11} className="text-[#b026ff]" />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#c77dff]">Multi Jogadas</span>
                                            {stagingCards.length > 0 && (
                                                <motion.span
                                                    key={stagingCards.length}
                                                    initial={{ scale: 1.4, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#b026ff] text-white text-[9px] font-black shadow-[0_0_8px_rgba(176,38,255,0.6)]"
                                                >
                                                    {stagingCards.length}
                                                </motion.span>
                                            )}
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={commitMultiCombine}
                                                disabled={stagingCards.length < 3}
                                                className="group flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 hover:bg-emerald-500 disabled:opacity-25 disabled:cursor-not-allowed text-emerald-400 hover:text-black border border-emerald-500/40 hover:border-emerald-400 transition-all duration-200 shadow-[0_0_8px_rgba(52,211,153,0.2)] hover:shadow-[0_0_14px_rgba(52,211,153,0.5)]"
                                            >
                                                <Check size={11} className="group-hover:scale-110 transition-transform" />
                                                Confirmar
                                            </button>
                                            <button
                                                onClick={cancelMultiCombine}
                                                className="group flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-500/10 hover:bg-red-500/80 text-red-400 hover:text-white border border-red-500/30 hover:border-red-400/60 transition-all duration-200"
                                            >
                                                <X size={11} className="group-hover:rotate-90 transition-transform duration-300" />
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>

                                    {/* Staging cards area */}
                                    <div className="px-3 py-2">
                                        {stagingCards.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-3 gap-1">
                                                <div className="flex items-center gap-2 opacity-40">
                                                    <div className="h-px w-8 bg-[#b026ff]/50" />
                                                    <Shuffle size={14} className="text-[#b026ff]" />
                                                    <div className="h-px w-8 bg-[#b026ff]/50" />
                                                </div>
                                                <p className="text-[10px] text-purple-400/50 font-bold tracking-wider">Toque em cartas da mesa ou da mão</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                                                <AnimatePresence mode="popLayout">
                                                    {stagingCards.map(({ card, origin }) => {
                                                        const colorMap: Record<string, string> = { red: '#ef4444', blue: '#60a5fa', green: '#4ade80', yellow: '#facc15', joker: '#b026ff' };
                                                        const col = colorMap[card.color] ?? '#fff';
                                                        const isFromHand = origin === 'hand';
                                                        return (
                                                            <motion.div
                                                                key={card.id}
                                                                layout
                                                                initial={{ scale: 0.4, opacity: 0, y: 10 }}
                                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                                exit={{ scale: 0.4, opacity: 0 }}
                                                                whileHover={{ scale: 1.12, y: -4 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => unstageCard({ card, origin })}
                                                                className="relative cursor-pointer flex-shrink-0 flex flex-col items-center justify-center rounded-xl border-2 select-none"
                                                                style={{
                                                                    background: `linear-gradient(135deg, rgba(0,0,0,0.85), ${col}18)`,
                                                                    borderColor: col,
                                                                    boxShadow: `0 0 12px ${col}44, inset 0 1px 0 ${col}22`,
                                                                    width: '38px', height: '54px',
                                                                }}
                                                                title="Clique para devolver"
                                                            >
                                                                {/* Origin badge */}
                                                                <div
                                                                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black border border-black/40"
                                                                    style={{ background: isFromHand ? '#7c3aed' : '#0369a1' }}
                                                                    title={isFromHand ? 'Da mão' : 'Da mesa'}
                                                                >
                                                                    {isFromHand ? '✋' : '🃏'}
                                                                </div>
                                                                <span style={{ color: col, fontWeight: 900, fontSize: '1rem', lineHeight: 1, textShadow: `0 0 8px ${col}88` }}>
                                                                    {card.number === 'JOKER' ? '★' : card.number}
                                                                </span>
                                                                {/* Hover X hint */}
                                                                <div className="absolute inset-0 rounded-xl bg-red-500/0 hover:bg-red-500/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                                                                    <X size={14} className="text-red-300" />
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </div>

                                    {/* Legend */}
                                    <div className="flex items-center gap-3 px-3 pb-2">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                                            <span className="text-[9px] text-gray-500 font-bold">Da mão</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-[9px] text-gray-500 font-bold">Da mesa</span>
                                        </div>
                                        <span className="text-[9px] text-gray-600 ml-auto">Clique para devolver</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── CARDS ROW ── */}
                    {(() => {
                        const compact = isMobile && myHand.length > 8;
                        return (
                        <div className="relative overflow-x-auto custom-scrollbar pb-3 pt-2 pointer-events-auto">
                            {/* Right-fade scroll hint when compact */}
                            {compact && (
                                <div className="absolute right-0 top-0 bottom-3 w-10 bg-gradient-to-l from-[#0f0814] to-transparent z-10 pointer-events-none" />
                            )}
                            <div className="flex items-end justify-start sm:justify-center min-w-max px-4">
                                <AnimatePresence>
                                    {myHand.map((card, i) => {
                                        const mid = (myHand.length - 1) / 2;
                                        const rotate = compact ? 0 : (myHand.length > 7 ? (i - mid) * (myHand.length > 12 ? 2.5 : 1.5) : 0);
                                        const overlap = compact
                                            ? -Math.min(10, Math.max(0, myHand.length - 8))
                                            : Math.min(4, Math.max(-24, 4 - Math.max(0, myHand.length - 7) * 3));
                                        return (
                                            <div
                                                key={card.id}
                                                style={{
                                                    transform: `rotate(${rotate}deg)`,
                                                    transformOrigin: 'bottom center',
                                                    marginLeft: i === 0 ? 0 : overlap,
                                                }}
                                                onClick={multiCombineActive && isMyTurn ? () => stageHandCard(card) : undefined}
                                            >
                                                {renderCard(card, !multiCombineActive, false, compact)}
                                            </div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                        );
                    })()}
                </div>
            </div>
            )} {/* end !isSpectator bottom panel */}

            {/* === SPECTATOR BANNER === */}
            {isSpectator && (
                <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
                    <div className="flex items-center justify-center py-2 bg-[#b026ff]/80 backdrop-blur-md border-b border-[#b026ff]/40">
                        <span className="text-xs font-black text-white tracking-[0.25em] uppercase">👁 {t('game.spectator')}</span>
                    </div>
                </div>
            )}
            <style>{`
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(176,38,255,0.5) rgba(0,0,0,0.2);
                }
                .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(176,38,255,0.3); border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(176,38,255,0.8); }

                @keyframes jokerShimmer {
                    0%   { left: -100%; opacity: 0; }
                    10%  { opacity: 1; }
                    50%  { left: 160%; opacity: 1; }
                    60%  { opacity: 0; }
                    100% { left: 160%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}
