import { motion } from 'framer-motion';
import { Home, Gamepad2, Trophy, User, Layers, ShoppingBag, Target, Clock, CalendarDays, Award, Swords, Shield, Activity, Medal, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopHeader from '../components/ui/TopHeader';
import FramedAvatar from '../components/ui/FramedAvatar';
import { ProfileSkeleton } from '../components/ui/PageLoader';
import { useUser } from '../hooks/useUser';
import { useEffect } from 'react';

// Map Trophies types to icons
const getTrophyIcon = (type: string) => {
    switch(type) {
        case 'GOLD': return Trophy;
        case 'SILVER': return Award;
        case 'ACHIEVEMENT': return Target;
        default: return Award;
    }
};

const getTrophyStyle = (type: string) => {
    switch(type) {
        case 'GOLD': return { color: "text-yellow-500", bg: "bg-yellow-500/20", border: "border-yellow-500/50" };
        case 'SILVER': return { color: "text-gray-300", bg: "bg-gray-400/20", border: "border-gray-400/50" };
        case 'ACHIEVEMENT': return { color: "text-[#b026ff]", bg: "bg-[#b026ff]/20", border: "border-[#b026ff]/50" };
        default: return { color: "text-gray-300", bg: "bg-gray-400/20", border: "border-gray-400/50" };
    }
};

export default function Profile() {
    const { user, isLoading, refreshUser } = useUser();

    // Always fetch fresh data when the page is opened (e.g. after a ranked game)
    useEffect(() => { refreshUser(); }, []);

    if (isLoading || !user) return <ProfileSkeleton />;

    const history = user.recentMatches || [];
    const stats = user.stats;
    const rankedPlayed = stats?.ranked.played ?? 0;
    const rankedWon = stats?.ranked.won ?? 0;
    const casualPlayed = stats?.casual.played ?? 0;
    const casualWon = stats?.casual.won ?? 0;

    const displayUser = {
        name: user.name,
        level: user.level,
        xpProgress: user.xpProgress,
        avatar: user.avatar,
        joinDate: new Date((user as any).createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        stats: {
            ranked: { played: rankedPlayed, won: rankedWon, winRate: stats?.ranked.winRate ?? 0, currentRank: user.rankConfig?.name || user.rank, rankColor: user.rankConfig?.color || '#8b5cf6' },
            casual: { played: casualPlayed, won: casualWon, winRate: stats?.casual.winRate ?? 0, currentRank: 'Unranked' },
        },
        matchHistory: history.map((m) => ({
            id: m.id,
            result: m.won ? 'Victory' : 'Defeat',
            mode: m.mode === 'RANKED' ? 'Ranked' : 'Casual',
            opponent: m.players.filter(p => p !== user.name).join(', ') || 'Unknown',
            length: m.duration ? `${Math.floor(m.duration / 60)}m ${m.duration % 60}s` : '—',
            date: new Date(m.createdAt).toLocaleDateString(),
        })),
        trophies: ((user as any).achievements || []).map((t: any) => {
            const style = getTrophyStyle(t.type);
            return {
                id: t.id,
                name: t.title,
                date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                type: t.type,
                description: t.description,
                icon: getTrophyIcon(t.type),
                ...style
            };
        })
    };

    return (
        <div className="min-h-screen bg-[#0f0814] text-white font-sans selection:bg-[#b026ff] pb-24 relative overflow-hidden">

            {/* Ambient Background */}
            <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#b026ff]/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

            {/* --- TOP HEADER --- */}
            <TopHeader user={user} />

            {/* --- MAIN CONTENT --- */}
            <main className="max-w-7xl mx-auto px-6 pt-8 pb-12 relative z-10">

                {/* Profile Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-[#120a1f]/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shadow-2xl"
                >
                    {/* Background Graphic */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#b026ff]/20 to-transparent rounded-full blur-3xl opacity-50" />

                    {/* Big Avatar */}
                    <div className="relative shrink-0">
                        <FramedAvatar
                            src={displayUser.avatar}
                            alt="Avatar"
                            size={160}
                            frameConfig={user.equippedFrame ?? null}
                        />
                        <div className="absolute -bottom-2 -right-2 px-3 py-1.5 rounded-lg bg-[#b026ff] border-2 border-[#120a1f] text-white font-black text-sm uppercase tracking-widest shadow-lg z-10">
                            LVL {displayUser.level}
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left z-10 w-full">
                        <h1 className="text-4xl font-black italic tracking-tighter uppercase drop-shadow-lg mb-2">{displayUser.name}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-xs md:text-sm text-gray-400 font-bold uppercase tracking-widest mb-6">
                            <span className="flex items-center gap-1.5"><CalendarDays size={16} /> Joined {displayUser.joinDate}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                            <span className="flex items-center gap-1.5 text-green-400"><Activity size={16} /> Status: Online</span>
                        </div>

                        {/* XP Bar */}
                        <div className="max-w-md mx-auto md:mx-0">
                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                <span>Progress to LVL {displayUser.level + 1}</span>
                                <span className="text-white">{displayUser.xpProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${displayUser.xpProgress}%` }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                    className="h-full bg-gradient-to-r from-[#b026ff] to-[#d685ff] shadow-[0_0_10px_rgba(176,38,255,0.8)]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Showcase: Rank + Card Sleeve */}
                    <div className="shrink-0 flex flex-row md:flex-col items-center justify-center gap-4 z-10">
                        {/* Rank Icon */}
                        {user.rankConfig?.iconUrl && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(176,38,255,0.2)]">
                                    <img
                                        src={user.rankConfig.iconUrl}
                                        alt={user.rankConfig.name}
                                        className="w-20 h-20 object-contain"
                                        style={{ transform: `scale(${user.rankConfig.iconScale ?? 1})`, transformOrigin: 'center' }}
                                    />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: user.rankConfig.color || '#b026ff' }}>
                                    {user.rankConfig.name}
                                </span>
                            </div>
                        )}
                        {/* Card Sleeve */}
                        {user.equippedSleeveUrl && (
                            <div className="flex flex-col items-center gap-2">
                                <div
                                    className="rounded-xl overflow-hidden border-2 border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                                    style={{ width: 56, height: 84 }}
                                >
                                    <img src={user.equippedSleeveUrl} alt="Card Sleeve" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sleeve</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Game Stats Grid */}
                <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-4 pl-2"><Target size={14} className="inline mr-2 -mt-0.5" /> Combat Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Ranked Stats */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/10 transition-colors">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mt-10 -mr-10 group-hover:bg-red-500/20 transition-all" />
                        <h4 className="text-[10px] font-black tracking-widest text-red-500 uppercase flex items-center gap-2 mb-4"><Shield size={14} /> Ranked Match</h4>

                        <div className="flex items-center gap-4 mb-6">
                            {/* Rank Icon */}
                            {user.rankConfig?.iconUrl && (
                                <div className="w-20 h-20 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <img src={user.rankConfig.iconUrl} alt={user.rankConfig.name} className="w-16 h-16 object-contain" style={{ transform: `scale(${user.rankConfig.iconScale ?? 1})`, transformOrigin: 'center' }} />
                                </div>
                            )}
                            <div className="flex-1">
                                <div
                                    className="text-2xl font-black italic uppercase tracking-wide"
                                    style={{ color: displayUser.stats.ranked.rankColor }}
                                >
                                    {displayUser.stats.ranked.currentRank}
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">
                                    {user.mmr} MMR
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                            <div className="bg-black/30 rounded-lg p-2 text-center">
                                <div className="text-white font-bold text-sm">{displayUser.stats.ranked.played}</div>
                                <div className="text-[8px] text-gray-400 uppercase tracking-widest">Played</div>
                            </div>
                            <div className="bg-black/30 rounded-lg p-2 text-center">
                                <div className="text-green-400 font-bold text-sm">{displayUser.stats.ranked.won}</div>
                                <div className="text-[8px] text-gray-400 uppercase tracking-widest">Won</div>
                            </div>
                            <div className="bg-black/30 rounded-lg p-2 text-center">
                                <div className="text-[#b026ff] font-bold text-sm">{displayUser.stats.ranked.winRate}%</div>
                                <div className="text-[8px] text-gray-400 uppercase tracking-widest">Win R.</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Casual Stats */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/10 transition-colors">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mt-10 -mr-10 group-hover:bg-blue-500/20 transition-all" />
                        <h4 className="text-[10px] font-black tracking-widest text-blue-400 uppercase flex items-center gap-2 mb-4"><Swords size={14} /> Casual Play</h4>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1">
                                <div className="text-2xl font-black italic uppercase text-gray-300 tracking-wide">
                                    {displayUser.stats.casual.currentRank}
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Unscored Mode</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                            <div className="bg-black/30 rounded-lg p-2 text-center">
                                <div className="text-white font-bold text-sm">{displayUser.stats.casual.played}</div>
                                <div className="text-[8px] text-gray-400 uppercase tracking-widest">Played</div>
                            </div>
                            <div className="bg-black/30 rounded-lg p-2 text-center">
                                <div className="text-green-400 font-bold text-sm">{displayUser.stats.casual.won}</div>
                                <div className="text-[8px] text-gray-400 uppercase tracking-widest">Won</div>
                            </div>
                            <div className="bg-black/30 rounded-lg p-2 text-center">
                                <div className="text-[#b026ff] font-bold text-sm">{displayUser.stats.casual.winRate}%</div>
                                <div className="text-[8px] text-gray-400 uppercase tracking-widest">Win R.</div>
                            </div>
                        </div>
                    </motion.div>

                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                    {/* Recent Matches */}
                    <div className="xl:col-span-2 flex flex-col">
                        <div className="flex items-center justify-between mb-4 pl-2">
                            <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase"><Clock size={14} className="inline mr-2 -mt-0.5" /> Recent Matches</h3>
                            <button className="text-[10px] font-bold text-[#b026ff] tracking-[0.15em] uppercase hover:text-[#d685ff] transition-colors">View All Archive</button>
                        </div>

                        <div className="bg-[#120a1f]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden p-2 flex-1">
                            <div className="flex flex-col gap-2">
                                {displayUser.matchHistory.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                                        <Swords size={36} className="mb-3 opacity-20" />
                                        <p className="font-bold text-sm uppercase tracking-widest">No matches played yet</p>
                                        <p className="text-xs mt-1">Play your first game to see history here</p>
                                    </div>
                                ) : displayUser.matchHistory.map((match: any, i: number) => (
                                    <motion.div
                                        key={match.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * i }}
                                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-1.5 h-10 rounded-full ${match.result === 'Victory' ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <div>
                                                <h4 className={`font-black uppercase tracking-wider text-sm md:text-base ${match.result === 'Victory' ? 'text-green-400' : 'text-red-400'}`}>{match.result}</h4>
                                                <p className="text-[9px] md:text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1 flex flex-wrap gap-x-2">
                                                    <span>VS {match.opponent}</span> <span className="opacity-30">•</span> <span>{match.mode}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 md:gap-6 text-right">
                                            <div className="hidden sm:block">
                                                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{match.date}</span>
                                            </div>
                                            <div className="hidden md:block">
                                                <span className="text-xs font-bold text-gray-300 bg-black/40 px-2 py-1 rounded border border-white/10">{match.length}</span>
                                            </div>

                                            {/* Mode badge */}
                                            <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                                                match.mode === 'Ranked' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                            }`}>{match.mode}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Trophies & Achievements */}
                    <div className="xl:col-span-1 flex flex-col mt-8 xl:mt-0">
                        <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-4 pl-2"><Trophy size={14} className="inline mr-2 -mt-0.5" /> Hardware & Honors</h3>

                        <div className="bg-[#120a1f]/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex-1">
                            <div className="flex flex-col gap-4 h-full">
                                {displayUser.trophies.map((trophy: any, i: number) => {
                                    const Icon = trophy.icon;
                                    return (
                                        <motion.div
                                            key={trophy.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 * i }}
                                            className={`p-4 rounded-xl border ${trophy.border} bg-white/5 hover:bg-white/10 flex items-start gap-4 transition-colors`}
                                        >
                                            <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${trophy.bg} ${trophy.border} border`}>
                                                <Icon size={20} className={trophy.color} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm leading-tight drop-shadow-md mb-1">{trophy.name}</h4>
                                                <p className="text-[10px] uppercase font-bold text-[#b026ff] tracking-widest mb-1.5">{trophy.type}</p>
                                                <p className="text-xs text-gray-400 leading-snug">{trophy.description}</p>
                                                <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-2">{trophy.date}</div>
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {displayUser.trophies.length === 0 && (
                                    <div className="text-center py-10 opacity-50 flex-1 flex flex-col justify-center">
                                        <Trophy size={32} className="mx-auto text-gray-500 mb-2" />
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">No trophies earned yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* --- BOTTOM NAVIGATION BAR --- */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#120a1f]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                    {[
                        { id: 'dashboard', icon: Home, link: '/dashboard' },
                        { id: 'play', icon: Gamepad2, link: '/play' },
                        { id: 'tourney', icon: Trophy, link: '/tournaments' },
                        { id: 'battlepass', icon: Medal, link: '/battlepass' },
                        { id: 'friends', icon: Users, link: '/friends' },
                        { id: 'clan', icon: Shield, link: '/clan' },
                        { id: 'profile', icon: User, link: '/profile' },
                        { id: 'cards', icon: Layers, link: '/collection' },
                        { id: 'shop', icon: ShoppingBag, link: '/shop' },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = item.id === 'profile';

                        return (
                            <Link
                                to={item.link}
                                key={item.id}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isActive
                                    ? 'bg-[#b026ff] text-white shadow-[0_0_20px_rgba(176,38,255,0.5)]'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'fill-white/20' : ''} />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
