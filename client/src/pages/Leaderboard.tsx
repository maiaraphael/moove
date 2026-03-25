import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, Gamepad2, Trophy, User, Layers, ShoppingBag, Medal,
    TrendingUp, Search, Shield, Users, ChevronLeft, ChevronRight, Swords,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import TopHeader from '../components/ui/TopHeader';
import { LeaderboardSkeleton } from '../components/ui/PageLoader';
import { useUser } from '../hooks/useUser';
import { useTranslation } from 'react-i18next';
import PlayerProfileModal from '../components/ui/PlayerProfileModal';

interface LeaderboardEntry {
    position: number;
    id: string;
    username: string;
    avatarUrl: string | null;
    mmr: number;
    rank: string;
    level: number;
    rankConfig: { name: string; color: string; iconUrl: string | null; iconScale: number } | null;
}

const PAGE_SIZE = 50;

// Podium visual styles per slot: [silver, gold, bronze]
const TOP3_STYLES = [
    {
        badge: '🥈',
        gradient: 'from-gray-500/20 to-gray-600/5',
        border: 'border-gray-400/30',
        glow: 'shadow-[0_0_30px_rgba(156,163,175,0.1)]',
        labelColor: 'text-gray-300',
        mmrColor: 'text-gray-400',
        translateY: 'translate-y-4',
    },
    {
        badge: '👑',
        gradient: 'from-yellow-500/20 to-yellow-600/5',
        border: 'border-yellow-400/40',
        glow: 'shadow-[0_0_50px_rgba(234,179,8,0.2)]',
        labelColor: 'text-yellow-300',
        mmrColor: 'text-yellow-400',
        translateY: '',
    },
    {
        badge: '🥉',
        gradient: 'from-amber-700/20 to-amber-800/5',
        border: 'border-amber-600/30',
        glow: 'shadow-[0_0_30px_rgba(180,83,9,0.1)]',
        labelColor: 'text-amber-500',
        mmrColor: 'text-amber-600',
        translateY: 'translate-y-6',
    },
];

// Podium render order: silver(1), gold(0), bronze(2) → gold is center
const PODIUM_ORDER = [1, 0, 2];

export default function Leaderboard() {
    const { user, isLoading } = useUser();
    const { t } = useTranslation();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [profileUsername, setProfileUsername] = useState<string | null>(null);

    const myEntry = useMemo(() => entries.find(e => e.id === user?.id), [entries, user?.id]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return q ? entries.filter(e => e.username.toLowerCase().includes(q)) : entries;
    }, [entries, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageEntries = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const top3 = entries.slice(0, 3);

    useEffect(() => { setPage(1); }, [search]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/leaderboard`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) setEntries(await res.json());
            } catch (err) {
                console.error('Failed to fetch leaderboard', err);
            } finally {
                setIsFetching(false);
            }
        };
        if (!isLoading) fetchLeaderboard();
    }, [isLoading]);

    if (isLoading || !user) return <LeaderboardSkeleton />;

    return (
        <div className="min-h-screen bg-[#0f0814] text-white font-sans pb-28 relative overflow-hidden">
            <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-500/4 rounded-full blur-[150px] pointer-events-none" />

            <TopHeader user={user} />

            <main className="max-w-4xl mx-auto px-6 pt-8 pb-12 relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                        <TrendingUp className="text-yellow-400" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tight">
                            LEADERBOARD <span className="text-yellow-400">GLOBAL</span>
                        </h1>
                        <p className="text-sm text-gray-400 mt-0.5">{t('leaderboard.subtitle')}</p>
                    </div>
                    {myEntry && (
                        <div className="ml-auto bg-[#b026ff]/10 border border-[#b026ff]/30 rounded-2xl px-4 py-2 text-center shrink-0">
                            <p className="text-[10px] font-bold text-[#b026ff] tracking-widest uppercase">{t('leaderboard.yourPosition')}</p>
                            <p className="text-2xl font-black text-white">#{myEntry.position}</p>
                        </div>
                    )}
                </div>

                {/* Podium */}
                {!isFetching && top3.length === 3 && (
                    <div className="flex items-end justify-center gap-4 mb-10">
                        {PODIUM_ORDER.map((entryIdx, podiumSlot) => {
                            const entry = top3[entryIdx];
                            const s = TOP3_STYLES[podiumSlot];
                            const isMe = entry.id === user.id;
                            return (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: podiumSlot * 0.12 }}
                                    className={`flex flex-col items-center bg-gradient-to-b ${s.gradient} backdrop-blur-xl border ${s.border} ${s.glow} rounded-2xl p-4 w-[30%] ${s.translateY} ${!isMe ? 'cursor-pointer hover:ring-2 hover:ring-[#b026ff]/30' : ''}`}
                                    onClick={() => { if (!isMe) setProfileUsername(entry.username); }}
                                >
                                    <span className="text-3xl mb-2">{s.badge}</span>
                                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 mb-2" style={{ borderColor: entry.rankConfig?.color || '#b026ff' }}>
                                        <img
                                            src={entry.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`}
                                            alt={entry.username}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <p className={`font-bold text-sm truncate max-w-full ${s.labelColor}`}>{entry.username}</p>
                                    <p className={`text-xs font-bold mt-0.5 ${s.mmrColor}`}>{entry.mmr.toLocaleString()} MMR</p>
                                    {entry.rankConfig && (
                                        <span className="mt-1 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded"
                                            style={{ color: entry.rankConfig.color, background: `${entry.rankConfig.color}20` }}>
                                            {entry.rankConfig.name}
                                        </span>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder={t('leaderboard.searchPlaceholder')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-[#120a1f]/60 border border-white/10 rounded-xl pl-10 pr-24 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#b026ff]/50"
                    />
                    {!isFetching && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">
                            {t('leaderboard.playersCount', { count: filtered.length })}
                        </span>
                    )}
                </div>

                {/* Table */}
                <div className="bg-[#120a1f]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    <div className="grid grid-cols-[48px_1fr_auto_auto] gap-x-4 px-4 py-3 border-b border-white/5 text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500">
                        <span>#</span>
                        <span>{t('leaderboard.player')}</span>
                        <span className="text-right">Rank</span>
                        <span className="text-right w-24">MMR</span>
                    </div>

                    {isFetching ? (
                        Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-[48px_1fr_auto_auto] gap-x-4 px-4 py-3 border-b border-white/5 animate-pulse">
                                <div className="h-4 bg-white/5 rounded w-8" />
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/5" />
                                    <div className="h-4 bg-white/5 rounded w-32" />
                                </div>
                                <div className="h-4 bg-white/5 rounded w-16" />
                                <div className="h-4 bg-white/5 rounded w-16" />
                            </div>
                        ))
                    ) : pageEntries.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Trophy className="mx-auto mb-3 opacity-20" size={40} />
                            <p className="font-bold">{search ? t('leaderboard.noPlayersFound') : t('leaderboard.noRankedPlayers')}</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div key={`${search}-${currentPage}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {pageEntries.map((entry, idx) => {
                                    const isMe = entry.id === user.id;
                                    const globalIdx = (currentPage - 1) * PAGE_SIZE + idx;
                                    return (
                                        <div
                                            key={entry.id}
                                            className={`grid grid-cols-[48px_1fr_auto_auto] gap-x-4 px-4 py-3 border-b border-white/5 items-center transition-colors ${isMe ? 'bg-[#b026ff]/10' : 'hover:bg-white/5 cursor-pointer'}`}
                                            onClick={() => { if (!isMe) setProfileUsername(entry.username); }}
                                        >
                                            <span className={`text-sm font-black ${globalIdx === 0 ? 'text-yellow-400' : globalIdx === 1 ? 'text-gray-300' : globalIdx === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                                                {globalIdx < 3 ? ['🥇', '🥈', '🥉'][globalIdx] : `#${entry.position}`}
                                            </span>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                                                    <img
                                                        src={entry.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`}
                                                        alt={entry.username}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`font-bold text-sm truncate ${isMe ? 'text-[#d685ff]' : 'text-white'}`}>
                                                        {entry.username}{isMe && <span className="ml-1 text-[9px] text-[#b026ff] font-black uppercase">({t('leaderboard.you')})</span>}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">{t('leaderboard.levelEntry', { level: entry.level })}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                {entry.rankConfig ? (
                                                    <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded"
                                                        style={{ color: entry.rankConfig.color, background: `${entry.rankConfig.color}20` }}>
                                                        {entry.rankConfig.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-600">—</span>
                                                )}
                                            </div>
                                            <div className="text-right w-24 shrink-0">
                                                <span className="text-sm font-black text-white">{entry.mmr.toLocaleString()}</span>
                                                <span className="text-[10px] text-gray-500 ml-1">MMR</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-6">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#120a1f]/80 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm text-gray-400">
                            <span className="text-white font-bold">{currentPage}</span> / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#120a1f]/80 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </main>

            {/* Bottom Nav */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#120a1f]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                    {[
                        { id: 'dashboard', icon: Home, link: '/dashboard' },
                        { id: 'play', icon: Gamepad2, link: '/play' },
                        { id: 'leaderboard', icon: Trophy, link: '/leaderboard' },
                        { id: 'tourney', icon: Swords, link: '/tournaments' },
                        { id: 'battlepass', icon: Medal, link: '/battlepass' },
                        { id: 'clan', icon: Shield, link: '/clan' },
                        { id: 'friends', icon: Users, link: '/friends' },
                        { id: 'profile', icon: User, link: '/profile' },
                        { id: 'collection', icon: Layers, link: '/collection' },
                        { id: 'store', icon: ShoppingBag, link: '/store' },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = item.id === 'leaderboard';
                        return (
                            <Link key={item.id} to={item.link}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-[#b026ff] text-white shadow-[0_0_20px_rgba(176,38,255,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                <Icon size={18} />
                            </Link>
                        );
                    })}
                </div>
            </div>
            <PlayerProfileModal username={profileUsername} onClose={() => setProfileUsername(null)} />
        </div>
    );
}
