import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, Gamepad2, Trophy, User, Layers, ShoppingBag, Medal, Target, ArrowRight,
    CheckCircle2, Users, Shield, Swords, Zap, TrendingUp, Star, Crown,
    ChevronRight, Flame, Clock, Sparkles, Play
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TopHeader from '../components/ui/TopHeader';
import { useUser } from '../hooks/useUser';
import LoginBonusModal from '../components/ui/LoginBonusModal';
import OnboardingModal from '../components/ui/OnboardingModal';
import { DashboardSkeleton } from '../components/ui/PageLoader';
import { useTranslation } from 'react-i18next';

interface Tournament {
    id: number;
    title: string;
    prize: string;
    scope: string;
    time: string;
    action: string;
    actionColor: string;
    img: string;
}

interface LeaderboardEntry {
    position: number;
    id: string;
    username: string;
    avatarUrl: string | null;
    mmr: number;
    rank: string;
    level: number;
    rankConfig: { name: string; color: string } | null;
}

interface StoreItem {
    id: string;
    name: string;
    type: string;
    rarity: string;
    price: number;
    currency: string;
    imageUrl: string | null;
    isFeatured: boolean;
}

const RARITY_STYLES: Record<string, { label: string; color: string; bg: string; glow: string }> = {
    Legendary: { label: 'LendÃ¡rio', color: 'text-yellow-300', bg: 'bg-yellow-500/10 border-yellow-500/30', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.25)]' },
    Epic:      { label: 'Ã‰pico',    color: 'text-purple-300', bg: 'bg-purple-500/10 border-purple-500/30', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]' },
    Rare:      { label: 'Raro',     color: 'text-blue-300',   bg: 'bg-blue-500/10 border-blue-500/30',   glow: '' },
    Common:    { label: 'Comum',    color: 'text-gray-400',   bg: 'bg-white/5 border-white/10',          glow: '' },
};

const PODIUM_STYLES = [
    { badge: 'ðŸ¥ˆ', border: 'border-gray-400/40', label: 'text-gray-300', offset: 'translate-y-3' },
    { badge: 'ðŸ‘‘', border: 'border-yellow-400/50', label: 'text-yellow-300', offset: '' },
    { badge: 'ðŸ¥‰', border: 'border-amber-600/40', label: 'text-amber-500', offset: 'translate-y-5' },
];
const PODIUM_ORDER = [1, 0, 2]; // silver center-left, gold center, bronze center-right

const GREETING = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, isLoading: isUserLoading } = useUser();
    const { t } = useTranslation();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [missions, setMissions] = useState<any[]>([]);
    const [pendingFriends, setPendingFriends] = useState(0);
    const [loginBonus, setLoginBonus] = useState<{ xp: number; gems: number; streak: number } | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [top3, setTop3] = useState<LeaderboardEntry[]>([]);
    const [featuredItems, setFeaturedItems] = useState<StoreItem[]>([]);
    const [currentFeaturedIdx, setCurrentFeaturedIdx] = useState(0);

    useEffect(() => {
        if (!localStorage.getItem('tutorialSeen')) setShowOnboarding(true);
    }, []);

    useEffect(() => {
        const raw = sessionStorage.getItem('loginBonus');
        if (raw) {
            try { setLoginBonus(JSON.parse(raw)); } catch {}
            sessionStorage.removeItem('loginBonus');
        }
    }, []);

    // Carousel auto-rotate
    useEffect(() => {
        if (featuredItems.length <= 1) return;
        const t = setInterval(() => setCurrentFeaturedIdx(i => (i + 1) % featuredItems.length), 4000);
        return () => clearInterval(t);
    }, [featuredItems.length]);

    const fetchMissions = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/missions/daily`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setMissions(await res.json());
        } catch { /* ignore */ }
    }, []);

    const fetchPendingFriends = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/requests/incoming`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) { const d = await res.json(); setPendingFriends(d.length); }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const headers = { 'Authorization': `Bearer ${token}` };

        const fetchAll = async () => {
            const [tRes, lbRes, storeRes] = await Promise.allSettled([
                fetch(`${import.meta.env.VITE_API_URL}/api/tournaments`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/api/users/leaderboard`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/api/store`, { headers }),
            ]);

            if (tRes.status === 'fulfilled' && tRes.value.ok) setTournaments(await tRes.value.json());
            if (lbRes.status === 'fulfilled' && lbRes.value.ok) {
                const data: LeaderboardEntry[] = await lbRes.value.json();
                setTop3(data.slice(0, 3));
            }
            if (storeRes.status === 'fulfilled' && storeRes.value.ok) {
                const items: StoreItem[] = await storeRes.value.json();
                // Prefer featured, fallback to random Legendary/Epic
                const featured = items.filter(i => i.isFeatured);
                const fallback = items.filter(i => ['Legendary', 'Epic'].includes(i.rarity));
                const pool = featured.length >= 3 ? featured : [...featured, ...fallback];
                // shuffle + pick 4
                const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 4);
                setFeaturedItems(shuffled);
            }
        };

        fetchAll();
        fetchMissions();
        fetchPendingFriends();
    }, [fetchMissions, fetchPendingFriends]);

    const xpProgress = useMemo(() => {
        if (!user) return 0;
        return Math.min(100, Math.round(user.xpProgress ?? 0));
    }, [user]);

    const completedMissions = useMemo(() => missions.filter(m => m.completed).length, [missions]);

    if (isUserLoading || !user) return <DashboardSkeleton />;

    const rankStyle = user.rankConfig as any;

    return (
        <div className="min-h-screen bg-[#0f0814] text-white font-sans selection:bg-[#b026ff] pb-28 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="fixed top-[-15%] left-[-10%] w-[60%] h-[60%] bg-[#b026ff]/6 rounded-full blur-[180px] pointer-events-none" />
            <div className="fixed bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed top-[30%] right-[-5%] w-[30%] h-[40%] bg-yellow-500/3 rounded-full blur-[120px] pointer-events-none" />

            <TopHeader user={user} />
            <LoginBonusModal bonus={loginBonus} onClose={() => setLoginBonus(null)} />
            <AnimatePresence>{showOnboarding && <OnboardingModal onClose={() => { localStorage.setItem('tutorialSeen', '1'); setShowOnboarding(false); }} />}</AnimatePresence>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12 relative z-10 space-y-10">

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                {/* HERO â€” Player Card + Play CTA                       */}
                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                <motion.section
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative rounded-3xl overflow-hidden border border-white/8 min-h-[200px]"
                    style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #0f0814 60%, #0d1a2e 100%)' }}
                >
                    {/* animated grid bg */}
                    <div className="absolute inset-0 opacity-[0.04]"
                        style={{ backgroundImage: 'linear-gradient(#b026ff 1px, transparent 1px), linear-gradient(90deg, #b026ff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                    {/* purple glow behind avatar */}
                    <div className="absolute left-[15%] top-1/2 -translate-y-1/2 w-48 h-48 bg-[#b026ff]/20 rounded-full blur-[60px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 shadow-xl"
                                style={{ borderColor: rankStyle?.color || '#b026ff', boxShadow: `0 0 30px ${rankStyle?.color || '#b026ff'}40` }}>
                                <img
                                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {/* online dot */}
                            <span className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-green-400 border-2 border-[#1a0a2e] shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <p className="text-sm text-gray-400 mb-1">{GREETING()},</p>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                                {user.name}
                                {rankStyle && (
                                    <span className="ml-3 text-sm font-black px-2 py-0.5 rounded-lg align-middle"
                                        style={{ color: rankStyle.color, background: `${rankStyle.color}20` }}>
                                        {rankStyle.name}
                                    </span>
                                )}
                            </h1>

                            {/* XP bar */}
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-xs text-gray-500 shrink-0">NÃ­vel {user.level}</span>
                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden max-w-xs">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${xpProgress}%` }}
                                        transition={{ duration: 1, delay: 0.3 }}
                                        className="h-full rounded-full bg-gradient-to-r from-[#b026ff] to-[#7c3aed]"
                                    />
                                </div>
                                <span className="text-xs text-gray-500 shrink-0">{xpProgress}%</span>
                            </div>

                            {/* Quick stats row */}
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <TrendingUp size={14} className="text-[#b026ff]" />
                                    <span className="font-bold">{(user.mmr ?? 0).toLocaleString()}</span>
                                    <span className="text-gray-500 text-xs">MMR</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Flame size={14} className="text-orange-400" />
                                    <span className="font-bold">{user.stats?.ranked.won ?? 0}</span>
                                    <span className="text-gray-500 text-xs">vitÃ³rias</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Target size={14} className="text-green-400" />
                                    <span className="font-bold">{completedMissions}/{missions.length || '?'}</span>
                                    <span className="text-gray-500 text-xs">missÃµes</span>
                                </div>
                            </div>
                        </div>

                        {/* PLAY NOW CTA */}
                        <div className="flex flex-col gap-3 shrink-0">
                            <motion.button
                                onClick={() => navigate('/play')}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-lg tracking-wider uppercase bg-gradient-to-r from-[#b026ff] to-[#7c3aed] text-white shadow-[0_0_40px_rgba(176,38,255,0.4)] hover:shadow-[0_0_60px_rgba(176,38,255,0.6)] transition-shadow"
                            >
                                <Play size={22} className="fill-white" />
                                JOGAR
                            </motion.button>
                            <button
                                onClick={() => navigate('/profile')}
                                className="text-xs text-gray-500 hover:text-white transition-colors text-center"
                            >
                                Ver perfil completo â†’
                            </button>
                        </div>
                    </div>
                </motion.section>

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                {/* TOP 3 DO RANKING                                    */}
                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                {top3.length === 3 && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Trophy size={14} className="text-yellow-400" />
                                <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase">Top Ranking Global</h3>
                            </div>
                            <Link to="/leaderboard" className="flex items-center gap-1 text-[10px] font-bold text-[#b026ff] tracking-widest uppercase hover:text-[#d685ff] transition-colors">
                                Ver todos <ChevronRight size={12} />
                            </Link>
                        </div>

                        <div className="flex items-end justify-center gap-3">
                            {PODIUM_ORDER.map((entryIdx, slot) => {
                                const entry = top3[entryIdx];
                                const s = PODIUM_STYLES[slot];
                                const isMe = entry.id === user.id;
                                return (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + slot * 0.1 }}
                                        onClick={() => navigate('/leaderboard')}
                                        className={`flex flex-col items-center bg-[#120a1f]/80 backdrop-blur-xl border ${s.border} rounded-2xl p-4 w-[32%] cursor-pointer hover:ring-2 hover:ring-[#b026ff]/30 transition-all ${s.offset} ${isMe ? 'ring-2 ring-[#b026ff]/50' : ''}`}
                                    >
                                        <span className="text-2xl mb-2">{s.badge}</span>
                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 mb-2"
                                            style={{ borderColor: entry.rankConfig?.color || '#b026ff' }}>
                                            <img
                                                src={entry.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`}
                                                alt={entry.username}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className={`font-bold text-xs truncate max-w-full ${s.label}`}>{entry.username}</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">{entry.mmr.toLocaleString()} MMR</p>
                                        {entry.rankConfig && (
                                            <span className="mt-1 text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded"
                                                style={{ color: entry.rankConfig.color, background: `${entry.rankConfig.color}20` }}>
                                                {entry.rankConfig.name}
                                            </span>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.section>
                )}

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                {/* MISSÃ•ES + TORNEIOS (grid 2-col)                     */}
                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* DAILY MISSIONS */}
                    <motion.section initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Target size={14} className="text-[#b026ff]" />
                                <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase">MissÃµes DiÃ¡rias</h3>
                            </div>
                            <Link to="/missions" className="flex items-center gap-1 text-[10px] font-bold text-[#b026ff] tracking-widest uppercase hover:text-[#d685ff] transition-colors">
                                Ver todas <ChevronRight size={12} />
                            </Link>
                        </div>

                        <div className="space-y-2">
                            {missions.length === 0 ? (
                                <Link to="/missions"
                                    className="flex items-center justify-center gap-2 bg-[#160d26]/60 border border-white/5 rounded-xl py-5 text-xs font-bold text-gray-500 hover:border-[#b026ff]/20 hover:text-[#b026ff] transition-all">
                                    <Target size={14} /> Ver missÃµes de hoje
                                </Link>
                            ) : (
                                missions.slice(0, 3).map((um: any) => {
                                    const pct = Math.min(100, Math.round((um.progress / um.mission.requirement) * 100));
                                    const done = um.completed && um.claimed;
                                    return (
                                        <Link key={um.id} to="/missions"
                                            className={`flex items-center gap-3 bg-[#160d26]/60 border rounded-xl px-4 py-3 hover:opacity-90 transition-all ${
                                                done ? 'border-green-500/20 opacity-60' :
                                                um.completed ? 'border-[#b026ff]/30' : 'border-white/5'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${done ? 'bg-green-500/10' : um.completed ? 'bg-[#b026ff]/10' : 'bg-white/5'}`}>
                                                {done ? <CheckCircle2 size={16} className="text-green-400" /> : <Zap size={16} className="text-[#b026ff]" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{um.mission.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-[#b026ff] to-[#d685ff] rounded-full" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 shrink-0">{um.progress}/{um.mission.requirement}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </motion.section>

                    {/* ACTIVE TOURNAMENTS */}
                    <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Swords size={14} className="text-[#b026ff]" />
                                <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase">Torneios Ativos</h3>
                            </div>
                            <Link to="/tournaments" className="flex items-center gap-1 text-[10px] font-bold text-[#b026ff] tracking-widest uppercase hover:text-[#d685ff] transition-colors">
                                Ver todos <ChevronRight size={12} />
                            </Link>
                        </div>

                        <div className="space-y-2">
                            {tournaments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2 bg-[#160d26]/60 border border-white/5 rounded-xl py-8 text-center">
                                    <Swords size={28} className="text-gray-700" />
                                    <p className="text-xs font-bold text-gray-500">Nenhum torneio ativo no momento</p>
                                    <Link to="/tournaments" className="text-[10px] text-[#b026ff] hover:text-[#d685ff] transition-colors">Verificar mais tarde</Link>
                                </div>
                            ) : (
                                tournaments.slice(0, 3).map((tourney) => (
                                    <Link to="/tournaments" key={tourney.id}
                                        className="flex items-center gap-3 bg-[#160d26]/60 border border-white/5 rounded-xl px-4 py-3 hover:border-[#b026ff]/20 transition-all group">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                            <img src={tourney.img} alt={tourney.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{tourney.title}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Clock size={10} className="text-gray-500" />
                                                <span className="text-[10px] text-gray-500">{tourney.time}</span>
                                                <span className="text-[10px] text-[#b026ff] font-bold ml-1">{tourney.prize}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-600 group-hover:text-[#b026ff] transition-colors shrink-0" />
                                    </Link>
                                ))
                            )}
                        </div>
                    </motion.section>
                </div>

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                {/* ITENS EM DESTAQUE DA LOJA                           */}
                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                {featuredItems.length > 0 && (
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-yellow-400" />
                                <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase">Itens em Destaque</h3>
                            </div>
                            <Link to="/store" className="flex items-center gap-1 text-[10px] font-bold text-[#b026ff] tracking-widest uppercase hover:text-[#d685ff] transition-colors">
                                Ir Ã  loja <ChevronRight size={12} />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {featuredItems.map((item, idx) => {
                                const rs = RARITY_STYLES[item.rarity] || RARITY_STYLES.Common;
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.45 + idx * 0.07 }}
                                        whileHover={{ y: -4, scale: 1.02 }}
                                        onClick={() => navigate('/store')}
                                        className={`relative bg-[#120a1f]/80 border ${rs.bg} rounded-2xl p-3 cursor-pointer transition-all ${rs.glow} overflow-hidden`}
                                    >
                                        {/* Rarity glow bg */}
                                        {item.rarity === 'Legendary' && (
                                            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none" />
                                        )}
                                        {item.rarity === 'Epic' && (
                                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
                                        )}

                                        <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-white/5 flex items-center justify-center relative">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Star size={28} className={rs.color} />
                                            )}
                                        </div>

                                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <span className={`text-[9px] font-black uppercase tracking-wider ${rs.color}`}>{rs.label}</span>
                                            <span className="text-xs font-black text-white">
                                                {item.currency === 'Gems' ? 'ðŸ’Ž' : 'ðŸª™'} {item.price.toLocaleString()}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.section>
                )}

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                {/* ATALHOS RÃPIDOS                                     */}
                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-4">Acesso RÃ¡pido</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {[
                            { icon: Gamepad2, label: 'Jogar', link: '/play', color: '#b026ff', bg: 'bg-[#b026ff]/10 border-[#b026ff]/20' },
                            { icon: Trophy, label: 'Ranking', link: '/leaderboard', color: '#eab308', bg: 'bg-yellow-500/10 border-yellow-500/20' },
                            { icon: Medal, label: 'Battle Pass', link: '/battlepass', color: '#f97316', bg: 'bg-orange-500/10 border-orange-500/20' },
                            { icon: Layers, label: 'ColeÃ§Ã£o', link: '/collection', color: '#3b82f6', bg: 'bg-blue-500/10 border-blue-500/20' },
                            { icon: Users, label: 'Amigos', link: '/friends', color: '#10b981', bg: 'bg-green-500/10 border-green-500/20', badge: pendingFriends },
                            { icon: ShoppingBag, label: 'Loja', link: '/store', color: '#ec4899', bg: 'bg-pink-500/10 border-pink-500/20' },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.link} to={item.link}
                                    className={`relative flex flex-col items-center gap-2 py-4 rounded-2xl border ${item.bg} hover:scale-105 transition-all`}>
                                    {(item as any).badge > 0 && (
                                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center">
                                            {(item as any).badge > 9 ? '9+' : (item as any).badge}
                                        </span>
                                    )}
                                    <Icon size={22} style={{ color: item.color }} />
                                    <span className="text-[10px] font-bold text-gray-400">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </motion.section>

            </main>

            {/* BOTTOM NAV */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#120a1f]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                    {[
                        { id: 'dashboard', icon: Home, link: '/dashboard', badge: 0 },
                        { id: 'play', icon: Gamepad2, link: '/play', badge: 0 },
                        { id: 'leaderboard', icon: Trophy, link: '/leaderboard', badge: 0 },
                        { id: 'tourney', icon: Swords, link: '/tournaments', badge: 0 },
                        { id: 'battlepass', icon: Medal, link: '/battlepass', badge: 0 },
                        { id: 'friends', icon: Users, link: '/friends', badge: pendingFriends },
                        { id: 'clan', icon: Shield, link: '/clan', badge: 0 },
                        { id: 'profile', icon: User, link: '/profile', badge: 0 },
                        { id: 'cards', icon: Layers, link: '/collection', badge: 0 },
                        { id: 'shop', icon: ShoppingBag, link: '/store', badge: 0 },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = item.id === 'dashboard';
                        return (
                            <Link to={item.link} key={item.id}
                                className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive
                                    ? 'bg-[#b026ff] text-white shadow-[0_0_20px_rgba(176,38,255,0.5)]'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                <Icon size={18} />
                                {item.badge > 0 && (
                                    <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center border border-[#120a1f]">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
