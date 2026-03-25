import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Swords, Shield, TrendingUp, Calendar, Flame, Star } from 'lucide-react';

interface PublicProfile {
    id: string;
    username: string;
    avatarUrl?: string | null;
    level: number;
    rank: string;
    mmr: number;
    xp: number;
    loginStreak: number;
    createdAt: string;
    rankConfig?: { name: string; color?: string; iconUrl?: string; iconScale?: number } | null;
    achievements: { id: string; type: string; title: string; date: string }[];
    recentMatches: { id: string; mode: string; won: boolean; players: string[]; createdAt: string }[];
    stats: { wins: number; games: number; losses: number; winRate: number };
    equippedSleeveUrl?: string | null;
}

interface Props {
    username: string | null;
    onClose: () => void;
}

export default function PlayerProfileModal({ username, onClose }: Props) {
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!username) return;
        setLoading(true);
        setError('');
        setProfile(null);
        const token = localStorage.getItem('token');
        fetch(`${import.meta.env.VITE_API_URL}/api/users/profile/${encodeURIComponent(username)}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(d => { if (d.error) setError(d.error); else setProfile(d); })
            .catch(() => setError('Failed to load profile'))
            .finally(() => setLoading(false));
    }, [username]);

    const avatar = profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    return (
        <AnimatePresence>
            {username && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="bg-[#120a1f] border border-white/10 rounded-2xl w-full max-w-md shadow-[0_0_60px_rgba(176,38,255,0.15)] relative"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 z-10 text-white/30 hover:text-white/70 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                        >
                            <X size={16} />
                        </button>

                        {loading && (
                            <div className="py-16 text-center text-gray-500 text-sm">Loading profile…</div>
                        )}
                        {error && (
                            <div className="py-16 text-center text-red-400 text-sm">{error}</div>
                        )}

                        {profile && (
                            <div className="px-6 pt-6 pb-6">
                                {/* Avatar + name — side by side, no overlap */}
                                <div className="flex items-center gap-4 mb-5 pr-8">
                                    <div className="relative shrink-0">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2a0d4a] to-[#1a0830] p-0.5 shadow-[0_0_20px_rgba(176,38,255,0.3)]">
                                            <img
                                                src={avatar}
                                                alt={profile.username}
                                                className="w-full h-full rounded-2xl object-cover bg-[#1e1030]"
                                            />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-[#b026ff] text-white text-[9px] font-black rounded-full px-1.5 py-0.5 border-2 border-[#120a1f]">
                                            {profile.level}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl font-black text-white leading-tight" style={{ wordBreak: 'break-word' }}>{profile.username}</h2>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            {profile.rankConfig?.iconUrl && (
                                                <img src={profile.rankConfig.iconUrl} alt={profile.rankConfig.name} className="w-4 h-4 object-contain shrink-0" style={{ transform: `scale(${profile.rankConfig.iconScale ?? 1})` }} />
                                            )}
                                            <span className="text-xs font-bold" style={profile.rankConfig?.color ? { color: profile.rankConfig.color } : { color: '#b026ff' }}>
                                                {profile.rankConfig?.name || profile.rank}
                                            </span>
                                            <span className="text-xs text-gray-500">· {profile.mmr} MMR</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Rank + Sleeve showcase */}
                                {(profile.rankConfig?.iconUrl || profile.equippedSleeveUrl) && (
                                    <div className="flex items-center gap-4 mb-5 bg-black/30 border border-white/8 rounded-2xl p-4">
                                        {profile.rankConfig?.iconUrl && (
                                            <div className="flex flex-col items-center gap-2 shrink-0">
                                                <div className="w-20 h-20 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-[0_0_24px_rgba(176,38,255,0.25)]">
                                                    <img
                                                        src={profile.rankConfig.iconUrl}
                                                        alt={profile.rankConfig.name}
                                                        className="w-16 h-16 object-contain"
                                                        style={{ transform: `scale(${profile.rankConfig.iconScale ?? 1})`, transformOrigin: 'center' }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: profile.rankConfig.color || '#b026ff' }}>
                                                    {profile.rankConfig.name}
                                                </span>
                                                <span className="text-[9px] text-gray-500 font-bold">{profile.mmr} MMR</span>
                                            </div>
                                        )}
                                        {profile.equippedSleeveUrl && (
                                            <div className="flex flex-col items-center gap-2 shrink-0">
                                                <div
                                                    className="rounded-xl overflow-hidden border-2 border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
                                                    style={{ width: 52, height: 78 }}
                                                >
                                                    <img src={profile.equippedSleeveUrl} alt="Card Sleeve" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Sleeve</span>
                                            </div>
                                        )}
                                        {!profile.equippedSleeveUrl && profile.rankConfig?.iconUrl && (
                                            <div className="flex-1">
                                                <p className="text-[10px] text-gray-600 italic">No sleeve equipped</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Stats row */}
                                <div className="grid grid-cols-4 gap-2 mb-5">
                                    {[
                                        { label: 'Games', value: profile.stats.games, icon: <Swords size={14} /> },
                                        { label: 'Wins', value: profile.stats.wins, icon: <Trophy size={14} /> },
                                        { label: 'Win %', value: `${profile.stats.winRate}%`, icon: <TrendingUp size={14} /> },
                                        { label: 'Streak', value: profile.loginStreak, icon: <Flame size={14} /> },
                                    ].map(s => (
                                        <div key={s.label} className="bg-white/5 border border-white/8 rounded-xl p-3 flex flex-col items-center gap-1">
                                            <div className="text-[#b026ff]">{s.icon}</div>
                                            <div className="text-base font-black text-white">{s.value}</div>
                                            <div className="text-[9px] text-gray-500 uppercase tracking-wider">{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Achievements */}
                                {profile.achievements.length > 0 && (
                                    <div className="mb-5">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Star size={10} className="text-yellow-400" /> Achievements ({profile.achievements.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {profile.achievements.slice(0, 6).map(a => (
                                                <span key={a.id} className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 rounded-full px-2.5 py-1 font-semibold">
                                                    {a.title}
                                                </span>
                                            ))}
                                            {profile.achievements.length > 6 && (
                                                <span className="text-[10px] bg-white/5 border border-white/10 text-gray-400 rounded-full px-2.5 py-1">
                                                    +{profile.achievements.length - 6} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Recent matches */}
                                {profile.recentMatches.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Shield size={10} /> Recent Matches
                                        </p>
                                        <div className="space-y-1.5">
                                            {profile.recentMatches.slice(0, 5).map(m => (
                                                <div key={m.id} className="flex items-center justify-between bg-white/3 border border-white/5 rounded-lg px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${m.won ? 'bg-green-400' : 'bg-red-400'}`} />
                                                        <span className="text-[11px] text-white font-bold">{m.won ? 'Victory' : 'Defeat'}</span>
                                                        <span className="text-[10px] text-gray-500 capitalize">{m.mode.toLowerCase()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={9} className="text-gray-600" />
                                                        <span className="text-[9px] text-gray-600">
                                                            {new Date(m.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Member since */}
                                <p className="mt-4 text-[9px] text-gray-600 text-center">
                                    Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
