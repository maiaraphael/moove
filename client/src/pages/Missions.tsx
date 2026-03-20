import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Gamepad2, Trophy, User, Layers, ShoppingBag, Medal, Target, CheckCircle2, Clock, Swords, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopHeader from '../components/ui/TopHeader';
import { useUser } from '../hooks/useUser';

interface Mission {
    id: string;
    title: string;
    description: string;
    type: string;
    requirement: number;
    xpReward: number;
    gemsReward: number;
}

interface UserMission {
    id: string;
    missionId: string;
    date: string;
    progress: number;
    completed: boolean;
    claimed: boolean;
    mission: Mission;
}

const TYPE_ICONS: Record<string, any> = {
    WIN_RANKED: Swords,
    WIN_ANY: Trophy,
    PLAY_RANKED: Target,
    PLAY_ANY: Zap,
};

const TYPE_COLORS: Record<string, string> = {
    WIN_RANKED: 'text-red-400',
    WIN_ANY: 'text-yellow-400',
    PLAY_RANKED: 'text-blue-400',
    PLAY_ANY: 'text-green-400',
};

function getTimeUntilMidnight(): string {
    const now = new Date();
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
}

export default function Missions() {
    const { user, isLoading, refreshUser } = useUser();
    const [missions, setMissions] = useState<UserMission[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [claimStatus, setClaimStatus] = useState<Record<string, 'idle' | 'loading' | 'done'>>({});
    const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnight());

    const fetchMissions = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/missions/daily`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) setMissions(await res.json());
        } catch (err) {
            console.error('Failed to fetch missions', err);
        } finally {
            setIsFetching(false);
        }
    }, []);

    useEffect(() => {
        if (!isLoading) fetchMissions();
    }, [isLoading, fetchMissions]);

    useEffect(() => {
        const interval = setInterval(() => setTimeLeft(getTimeUntilMidnight()), 60000);
        return () => clearInterval(interval);
    }, []);

    const handleClaim = async (missionId: string) => {
        setClaimStatus(prev => ({ ...prev, [missionId]: 'loading' }));
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/missions/${missionId}/claim`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setClaimStatus(prev => ({ ...prev, [missionId]: 'done' }));
                await fetchMissions();
                await refreshUser();
            }
        } catch (err) {
            setClaimStatus(prev => ({ ...prev, [missionId]: 'idle' }));
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen bg-[#0f0814] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#b026ff]/20 border-t-[#b026ff] rounded-full animate-spin" />
            </div>
        );
    }

    const completedCount = missions.filter(m => m.completed).length;

    return (
        <div className="min-h-screen bg-[#0f0814] text-white font-sans pb-28 relative overflow-hidden">
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#b026ff]/4 rounded-full blur-[150px] pointer-events-none" />

            <TopHeader user={user} />

            <main className="max-w-2xl mx-auto px-6 pt-8 pb-12 relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#b026ff]/10 border border-[#b026ff]/30 flex items-center justify-center shadow-[0_0_30px_rgba(176,38,255,0.2)]">
                        <Target className="text-[#b026ff]" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tight">
                            MISSÕES <span className="text-[#b026ff]">DIÁRIAS</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Clock size={12} className="text-gray-500" />
                            <p className="text-xs text-gray-500 font-bold">Redefine em {timeLeft}</p>
                        </div>
                    </div>
                    <div className="ml-auto bg-[#120a1f] border border-white/10 rounded-2xl px-4 py-2 text-center">
                        <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Concluídas</p>
                        <p className="text-2xl font-black text-white">{completedCount}<span className="text-gray-600">/{missions.length}</span></p>
                    </div>
                </div>

                {/* Progress bar */}
                {missions.length > 0 && (
                    <div className="mb-8">
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(completedCount / missions.length) * 100}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-[#b026ff] to-[#d685ff] rounded-full shadow-[0_0_8px_rgba(176,38,255,0.8)]"
                            />
                        </div>
                    </div>
                )}

                {/* Mission cards */}
                {isFetching ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-[#120a1f]/60 border border-white/5 rounded-2xl p-5 mb-4 animate-pulse h-28" />
                    ))
                ) : missions.length === 0 ? (
                    <div className="text-center py-16">
                        <Target className="mx-auto mb-4 opacity-20" size={48} />
                        <p className="font-bold text-gray-500">Nenhuma missão disponível hoje</p>
                        <p className="text-xs text-gray-600 mt-2">Fale com um admin para criar missões</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {missions.map((um, idx) => {
                            const IconComp = TYPE_ICONS[um.mission.type] || Target;
                            const colorClass = TYPE_COLORS[um.mission.type] || 'text-[#b026ff]';
                            const progress = Math.min(um.progress / um.mission.requirement, 1);
                            const claiming = claimStatus[um.id] === 'loading';

                            return (
                                <motion.div
                                    key={um.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.08 }}
                                    className={`relative bg-[#120a1f]/80 backdrop-blur-xl border rounded-2xl p-5 mb-4 overflow-hidden transition-all ${
                                        um.completed && um.claimed
                                            ? 'border-green-500/20 opacity-60'
                                            : um.completed
                                            ? 'border-[#b026ff]/40 shadow-[0_0_20px_rgba(176,38,255,0.1)]'
                                            : 'border-white/5'
                                    }`}
                                >
                                    {/* Completed glow */}
                                    {um.completed && !um.claimed && (
                                        <div className="absolute inset-0 bg-[#b026ff]/5 pointer-events-none" />
                                    )}

                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${um.completed ? 'bg-[#b026ff]/20 border border-[#b026ff]/40' : 'bg-white/5 border border-white/10'}`}>
                                            {um.completed && um.claimed ? (
                                                <CheckCircle2 size={20} className="text-green-400" />
                                            ) : (
                                                <IconComp size={20} className={colorClass} />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="font-bold text-white text-base">{um.mission.title}</h3>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {um.mission.xpReward > 0 && (
                                                        <span className="text-[10px] font-black text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2 py-0.5 rounded">+{um.mission.xpReward} XP</span>
                                                    )}
                                                    {um.mission.gemsReward > 0 && (
                                                        <span className="text-[10px] font-black text-[#b026ff] bg-[#b026ff]/10 border border-[#b026ff]/20 px-2 py-0.5 rounded">+{um.mission.gemsReward} 💎</span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">{um.mission.description}</p>

                                            {/* Progress */}
                                            <div className="mt-3 flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress * 100}%` }}
                                                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                                                        className={`h-full rounded-full ${um.completed ? 'bg-gradient-to-r from-[#b026ff] to-[#d685ff]' : 'bg-white/20'}`}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400 shrink-0">
                                                    {um.progress}/{um.mission.requirement}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Claim button */}
                                        {um.completed && !um.claimed && (
                                            <button
                                                onClick={() => handleClaim(um.id)}
                                                disabled={claiming}
                                                className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-[#b026ff] to-[#d685ff] text-white text-xs font-black tracking-widest uppercase shadow-[0_0_15px_rgba(176,38,255,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50"
                                            >
                                                {claiming ? '...' : 'COLETAR'}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}

                {/* Tip */}
                <p className="text-center text-[10px] font-bold text-gray-600 tracking-widest uppercase mt-6">
                    Jogue partidas para avançar nas missões · Novas missões todo dia à meia-noite UTC
                </p>
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
                        const isActive = item.id === 'missions';
                        return (
                            <Link key={item.id} to={item.link}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-[#b026ff] text-white shadow-[0_0_20px_rgba(176,38,255,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                <Icon size={20} />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
