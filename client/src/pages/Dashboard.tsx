import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Home, Gamepad2, Trophy, User, Layers, ShoppingBag, Medal, Target, ArrowRight, CheckCircle2, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TopHeader from '../components/ui/TopHeader';
import { useUser } from '../hooks/useUser';
import LoginBonusModal from '../components/ui/LoginBonusModal';
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

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, isLoading: isUserLoading } = useUser();
    const { t } = useTranslation();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [isLoadingTourns, setIsLoadingTourns] = useState(true);
    const [missions, setMissions] = useState<any[]>([]);
    const [pendingFriends, setPendingFriends] = useState(0);
    const [loginBonus, setLoginBonus] = useState<{ xp: number; credits: number; gems: number; streak: number } | null>(null);

    useEffect(() => {
        const raw = sessionStorage.getItem('loginBonus');
        if (raw) {
            try { setLoginBonus(JSON.parse(raw)); } catch {}
            sessionStorage.removeItem('loginBonus');
        }
    }, []);

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
        const fetchTournaments = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const tRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tournaments`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (tRes.ok) {
                    const dynamicTournaments = await tRes.json();
                    setTournaments(dynamicTournaments);
                } else {
                    setTournaments([]);
                }
            } catch (error) {
                console.error("Failed to load tournaments from database:", error);
            } finally {
                setIsLoadingTourns(false);
            }
        };

        fetchTournaments();
        fetchMissions();
        fetchPendingFriends();
    }, [fetchMissions, fetchPendingFriends]);

    const protocols = [
        {
            id: "ranked",
            title: t('dashboard.ranked'),
            subtitle: t('dashboard.rankedSub'),
            description: t('dashboard.rankedDesc'),
            accent: "#ef4444",
            badge: t('dashboard.liveNow'),
            bgImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2wSi-PcPJKU4p1xZ8dN475FDznpKYyJEAH9HdMQFcGQnu0Lomn3zhCDyLts1IR3xN0Tac3TLhuWjDEQPB2ovCgjaFM7oGuWJolBctnOjD0uXIaMFhI00jo6e7jbtJQxQGWOAmeYuOTDrjdHNVwRaC2HcIv7m6LllOPSO-6tSRTMXal7GKo9TrQ0Pi3rcTU_GTSkzJEBm5YGQs1_na13VE5lA6Ay9J6Y1KKcrUNv5ZYBpk5F6hxgKCeoaD_gAER4fXkK2aod7V8g",
        },
        {
            id: "casual",
            title: t('dashboard.casual'),
            subtitle: t('dashboard.casualSub'),
            description: t('dashboard.casualDesc'),
            accent: "#3b82f6",
            bgImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAeQ4moVmnmZ1Dxj7G2UPNtPdBNimArNEv1pm07VeQs-GuEzc-sV6j_OjHoLMdBrmId-ILAWoyIPX2y7LLyawwD7xMolGpPqScndQV3uefWHcD3KjOGl-6RzUrE1soCj-N3-GWpM8uhor4bj-5_cL25jfVyjv0KPGFCaBt3DeXTFY4b9MGVIyhn4nzhX18ihR2FEJZs2Z0f7OTBcMdTGLuEwoqe9056eItGlZ_TeB5W6pKUWtzZrDBjn9O7BqMBeTvUGZ1L_HC_fw",
        },
        {
            id: "ai",
            title: t('dashboard.vsAI'),
            subtitle: t('dashboard.vsAISub'),
            description: t('dashboard.vsAIDesc'),
            accent: "#10b981",
            bgImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDv2jMzVGBdsK02qVloqAo_eY30uARJsZPXLkkum4ZBfcCtv0KYzlE42juLsyLsbI_apV2_5SQBN6REm2Xiy-pZ-uYVbOl3eb6MWO5p7jvGf6coB5SLlF_XyeMHQec5WngdsHpmiKmpxvzMj9PjY47Tgs7WaN_QXiFv-WQQ1Zc2ZnlY64wh39mF13sUc_m0v6Vc0PhGM1q8OWUiqUgZfc9B8HptWYSjzb_Nn-Wj9vN-fvLK7UN_y3mxQoOYa_WK4ExsvOPjDQ1C7A",
        }
    ];

    if (isUserLoading || !user) return <DashboardSkeleton />;

    return (
        <div className="min-h-screen bg-[#0f0814] text-white font-sans selection:bg-[#b026ff] pb-24 relative overflow-hidden">
            {/* Dark gradient ambient backgrounds */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#b026ff]/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

            {/* --- TOP HEADER --- */}
            <TopHeader user={user} />
            <LoginBonusModal bonus={loginBonus} onClose={() => setLoginBonus(null)} />

            {/* --- MAIN CONTENT --- */}
            <main className="max-w-7xl mx-auto px-6 pt-8 pb-12 relative z-10">

                {/* SELECT PROTOCOL */}
                <section className="mb-12">
                    <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-6">{t('dashboard.selectProtocol')}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {protocols.map((protocol, index) => (
                            <motion.div
                                key={protocol.id}
                                onClick={() => navigate('/play')}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="group relative h-[360px] rounded-2xl overflow-hidden cursor-pointer border border-white/10 transition-all hover:border-white/30"
                                style={{ boxShadow: `0 0 40px inset ${protocol.accent}15` }}
                            >
                                {/* Background Image & Overlay */}
                                <div className="absolute inset-0">
                                    <img src={protocol.bgImage} alt={protocol.title} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0814] via-[#0f0814]/60 to-transparent" />
                                    <div
                                        className="absolute inset-0 opacity-50 transition-colors"
                                        style={{ background: `linear-gradient(to bottom, ${protocol.accent}1A, transparent)` }}
                                    />
                                </div>

                                {/* Content */}
                                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                    {protocol.badge && (
                                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-500 text-[9px] font-black tracking-widest uppercase">
                                            {protocol.badge}
                                        </div>
                                    )}

                                    <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: protocol.accent }}>
                                        {protocol.subtitle}
                                    </h4>
                                    <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2 drop-shadow-lg">
                                        {protocol.title}
                                    </h2>
                                    <p className="text-sm text-gray-400 font-medium">
                                        {protocol.description}
                                    </p>
                                </div>

                                {/* Hover Glow Effect */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                    style={{ boxShadow: `0 0 50px inset ${protocol.accent}40` }}
                                />
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* DAILY MISSIONS */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Target size={14} className="text-[#b026ff]" />
                            <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase">{t('dashboard.missions')}</h3>
                        </div>
                        <Link to="/missions" className="flex items-center gap-1 text-[10px] font-bold text-[#b026ff] tracking-[0.15em] uppercase hover:text-[#d685ff] transition-colors">
                            {t('dashboard.viewAll')} <ArrowRight size={10} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                        {missions.length === 0 ? (
                            <Link to="/missions" className="col-span-3 flex items-center justify-center gap-2 bg-[#160d26]/60 border border-white/5 rounded-xl py-4 text-xs font-bold text-gray-500 hover:border-[#b026ff]/20 hover:text-[#b026ff] transition-all">
                                <Target size={14} /> {t('dashboard.seeMissionsToday')}
                            </Link>
                        ) : (
                            missions.map((um: any) => {
                                const pct = Math.min(100, Math.round((um.progress / um.mission.requirement) * 100));
                                return (
                                    <Link key={um.id} to="/missions"
                                        className={`relative bg-[#160d26]/60 border rounded-xl p-3 hover:opacity-90 transition-all overflow-hidden ${
                                            um.completed && um.claimed ? 'border-green-500/20 opacity-60' :
                                            um.completed ? 'border-[#b026ff]/40' : 'border-white/5'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-xs font-bold text-white truncate flex-1">{um.mission.title}</p>
                                            {um.completed && (
                                                <CheckCircle2 size={12} className={um.claimed ? 'text-green-400' : 'text-[#b026ff]'} />
                                            )}
                                        </div>
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-[#b026ff] to-[#d685ff] rounded-full transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">{um.progress}/{um.mission.requirement}</p>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* ACTIVE TOURNAMENTS */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase">{t('dashboard.tournaments')}</h3>
                        <button className="text-[10px] font-bold text-[#b026ff] tracking-[0.15em] uppercase hover:text-[#d685ff] transition-colors">
                            {t('dashboard.viewAll')}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {tournaments.length === 0 ? (
                            <div className="col-span-2 text-center py-8 text-gray-500 text-sm">{t('dashboard.noTournaments')}</div>
                        ) : (
                            tournaments.map((tourney, index) => (
                                <motion.div
                                    key={tourney.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                                    className="flex items-center gap-4 bg-[#160d26]/60 border border-white/5 rounded-2xl p-4 hover:bg-[#1a0f2e] transition-colors group"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0">
                                        <img src={tourney.img} alt={tourney.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white truncate text-base mb-1">{tourney.title}</h4>
                                        <p className="text-xs text-gray-400 font-medium truncate mb-2">{tourney.prize}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#b026ff]/10 text-[#b026ff] border border-[#b026ff]/20 uppercase">
                                                {tourney.scope}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 text-gray-400 border border-white/10 uppercase">
                                                {tourney.time}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button className={`px-5 py-2.5 rounded-lg text-xs font-black tracking-widest uppercase transition-all shrink-0 ${tourney.actionColor} ${tourney.actionColor.includes('bg-[#b026ff]') ? 'hover:bg-[#9d1ce6] text-white shadow-[0_0_15px_rgba(176,38,255,0.3)]' : 'hover:bg-white/5 text-[#b026ff]'}`}>
                                        {tourney.action}
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>
                </section>

            </main>

            {/* --- BOTTOM NAVIGATION BAR --- */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#120a1f]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                    {[
                        { id: 'dashboard', icon: Home, link: '/dashboard', badge: 0 },
                        { id: 'play', icon: Gamepad2, link: '/play', badge: 0 },
                        { id: 'tourney', icon: Trophy, link: '/tournaments', badge: 0 },
                        { id: 'battlepass', icon: Medal, link: '/battlepass', badge: 0 },
                        { id: 'friends', icon: Users, link: '/friends', badge: pendingFriends },
                        { id: 'profile', icon: User, link: '/profile', badge: 0 },
                        { id: 'cards', icon: Layers, link: '/collection', badge: 0 },
                        { id: 'shop', icon: ShoppingBag, link: '/shop', badge: 0 },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = item.id === 'dashboard';

                        return (
                            <Link
                                to={item.link}
                                key={item.id}
                                className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${isActive
                                    ? 'bg-[#b026ff] text-white shadow-[0_0_20px_rgba(176,38,255,0.5)]'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'fill-white/20' : ''} />
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
