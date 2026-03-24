import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Gamepad2, Trophy, User, Layers, ShoppingBag, Medal, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopHeader from '../components/ui/TopHeader';
import { LeaderboardSkeleton } from '../components/ui/PageLoader';
import { useUser } from '../hooks/useUser';
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

const MEDAL_COLORS = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
const MEDAL_BG = ['bg-yellow-400/10 border-yellow-400/30', 'bg-gray-400/10 border-gray-400/30', 'bg-amber-600/10 border-amber-600/30'];

export default function Leaderboard() {
    const { user, isLoading } = useUser();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [myPosition, setMyPosition] = useState<number | null>(null);
    const [profileUsername, setProfileUsername] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/leaderboard`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setEntries(data);
                    if (user) {
                        const myEntry = data.find((e: LeaderboardEntry) => e.id === user.id);
                        if (myEntry) setMyPosition(myEntry.position);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch leaderboard', err);
            } finally {
                setIsFetching(false);
            }
        };
        if (!isLoading) fetchLeaderboard();
    }, [isLoading, user?.id]);

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
                        <p className="text-sm text-gray-400 mt-0.5">Top 100 jogadores por MMR</p>
                    </div>
                    {myPosition && (
                        <div className="ml-auto bg-[#b026ff]/10 border border-[#b026ff]/30 rounded-2xl px-4 py-2 text-center">
                            <p className="text-[10px] font-bold text-[#b026ff] tracking-widest uppercase">Sua posição</p>
                            <p className="text-2xl font-black text-white">#{myPosition}</p>
                        </div>
                    )}
                </div>

                {/* Top 3 podium */}
                {entries.length >= 3 && (
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[entries[1], entries[0], entries[2]].map((entry, podiumIdx) => {
                            const realPos = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
                            const colorClass = MEDAL_COLORS[realPos - 1];
                            const bgClass = MEDAL_BG[realPos - 1];
                            return (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: podiumIdx === 1 ? -12 : 0 }}
                                    transition={{ delay: podiumIdx * 0.1 }}
                                    className={`flex flex-col items-center bg-[#120a1f]/80 backdrop-blur-xl border rounded-2xl p-4 shadow-xl ${bgClass}${entry.id !== user.id ? ' cursor-pointer hover:ring-2 hover:ring-[#b026ff]/30' : ''}`}
                                    onClick={() => { if (entry.id !== user.id) setProfileUsername(entry.username); }}
                                >
                                    <div className={`text-3xl font-black mb-2 ${colorClass}`}>
                                        {realPos === 1 ? '👑' : realPos === 2 ? '🥈' : '🥉'}
                                    </div>
                                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 mb-2" style={{ borderColor: entry.rankConfig?.color || '#b026ff' }}>
                                        <img
                                            src={entry.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`}
                                            alt={entry.username}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <p className="font-bold text-sm text-white truncate max-w-full">{entry.username}</p>
                                    <p className={`text-xs font-bold mt-0.5 ${colorClass}`}>{entry.mmr.toLocaleString()} MMR</p>
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

                {/* Full table */}
                <div className="bg-[#120a1f]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    <div className="grid grid-cols-[48px_1fr_auto_auto] gap-x-4 px-4 py-3 border-b border-white/5 text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500">
                        <span>#</span>
                        <span>Jogador</span>
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
                    ) : entries.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Trophy className="mx-auto mb-3 opacity-20" size={40} />
                            <p className="font-bold">Nenhum jogador ranqueado ainda</p>
                        </div>
                    ) : (
                        entries.map((entry, idx) => {
                            const isMe = entry.id === user.id;
                            return (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                                    className={`grid grid-cols-[48px_1fr_auto_auto] gap-x-4 px-4 py-3 border-b border-white/5 items-center transition-colors ${isMe ? 'bg-[#b026ff]/10 border-[#b026ff]/20' : 'hover:bg-white/5 cursor-pointer'}`}
                                    onClick={() => { if (!isMe) setProfileUsername(entry.username); }}
                                >
                                    <span className={`text-sm font-black ${idx < 3 ? MEDAL_COLORS[idx] : 'text-gray-500'}`}>
                                        {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${entry.position}`}
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
                                                {entry.username} {isMe && <span className="text-[9px] text-[#b026ff] font-black uppercase">(você)</span>}
                                            </p>
                                            <p className="text-[10px] text-gray-500">Nível {entry.level}</p>
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
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Bottom Nav */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#120a1f]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                    {[
                        { id: 'dashboard', icon: Home, link: '/dashboard' },
                        { id: 'play', icon: Gamepad2, link: '/play' },
                        { id: 'tourney', icon: Trophy, link: '/tournaments' },
                        { id: 'battlepass', icon: Medal, link: '/battlepass' },
                        { id: 'profile', icon: User, link: '/profile' },
                        { id: 'cards', icon: Layers, link: '/collection' },
                        { id: 'shop', icon: ShoppingBag, link: '/shop' },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = item.id === 'leaderboard';
                        return (
                            <Link key={item.id} to={item.link}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-[#b026ff] text-white shadow-[0_0_20px_rgba(176,38,255,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                <Icon size={20} />
                            </Link>
                        );
                    })}
                </div>
            </div>
            <PlayerProfileModal username={profileUsername} onClose={() => setProfileUsername(null)} />
        </div>
    );
}
