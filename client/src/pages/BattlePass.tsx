import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, Check, Crown, Home, Gamepad2, Trophy, Medal, User, Layers, ShoppingBag, Package, Users } from 'lucide-react';
import TopHeader from '../components/ui/TopHeader';
import { useUser } from '../hooks/useUser';
import { useTranslation } from 'react-i18next';

interface BattlePassItem {
    id: string;
    name: string;
    type: string;
    rarity: string;
    imageUrl: string | null;
}

interface BattlePassTier {
    id: string;
    level: number;
    freeItemId: string | null;
    freeItem: BattlePassItem | null;
    freeGems: number;
    premiumItemId: string | null;
    premiumItem: BattlePassItem | null;
    premiumGems: number;
}

interface BattlePassData {
    id: string;
    season: number;
    name: string;
    price: number;
    tiers: BattlePassTier[];
}

export default function BattlePass() {
    const { user, isLoading, refreshUser } = useUser();
    const { t } = useTranslation();
    const [battlePass, setBattlePass] = useState<BattlePassData | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [buyStatus, setBuyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [buyError, setBuyError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBP = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/battlepass/current`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setBattlePass(data);
                }
            } catch (err) {
                console.error('Failed to fetch Battle Pass', err);
            } finally {
                setIsFetching(false);
            }
        };

        if (user && !isLoading) {
            fetchBP();
        }
    }, [user, isLoading]);

    const handleBuyPremium = async () => {
        if (buyStatus === 'loading') return;
        setBuyError(null);
        if (passPrice > 0 && (user?.gems ?? 0) < passPrice) {
            setBuyError(`Gems insuficientes. Você precisa de ${passPrice} 💎 mas tem ${user?.gems ?? 0} 💎`);
            setBuyStatus('error');
            setTimeout(() => setBuyStatus('idle'), 3000);
            return;
        }
        setBuyStatus('loading');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/battlepass/buy-premium`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) {
                setBuyError(data.error || 'Erro ao comprar premium');
                setBuyStatus('error');
                setTimeout(() => setBuyStatus('idle'), 3000);
                return;
            }
            setBuyStatus('success');
            if (refreshUser) await refreshUser();
            setTimeout(() => setBuyStatus('idle'), 2000);
        } catch {
            setBuyError('Erro de conexão');
            setBuyStatus('error');
            setTimeout(() => setBuyStatus('idle'), 3000);
        }
    };

    if (isLoading || !user || isFetching) {
        return (
            <div className="min-h-screen bg-[#0f0814] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-[#b026ff]/20 border-t-[#b026ff] rounded-full animate-spin"></div>
            </div>
        );
    }

    const CURRENT_LEVEL = user.level;
    const XP_FOR_NEXT = CURRENT_LEVEL * 100;
    const xpPercent = Math.min(100, Math.round(user.xpProgress));
    const CURRENT_XP = Math.round(user.xpProgress / 100 * XP_FOR_NEXT);
    const IS_PREMIUM = user.isPremium;
    const passName = battlePass?.name || 'Nexus Protocol';
    const season = battlePass?.season || 1;
    const passPrice = battlePass?.price ?? 0;
    const tiers = battlePass?.tiers || [];

    return (
        <div className="min-h-screen bg-[#0f0814] text-white font-sans selection:bg-[#b026ff] pb-24 relative overflow-hidden">

            {/* Ambient Backgrounds */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#b026ff]/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed bottom-0 right-[-10%] w-[50%] h-[50%] bg-yellow-500/10 rounded-full blur-[150px] pointer-events-none" />

            <TopHeader user={user} />

            {/* Header Section */}
            <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase mb-2 flex items-center gap-3">
                        <Medal className="text-[#b026ff]" size={42} />
                        {passName} <span className="text-yellow-500 text-lg md:text-2xl mt-2">(S{season})</span>
                    </h1>
                    <p className="text-gray-400 font-bold max-w-xl text-lg">
                        {t('battlepass.sub')}
                    </p>
                </div>

                {!IS_PREMIUM && (
                    <div className="flex flex-col items-end gap-2">
                        {buyError && <p className="text-red-400 text-xs font-bold text-right">{buyError}</p>}
                        {buyStatus === 'success' && <p className="text-green-400 text-xs font-bold">{t('battlepass.premiumActivated')}</p>}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleBuyPremium}
                            disabled={buyStatus === 'loading'}
                            className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-8 py-4 rounded-xl font-black tracking-widest uppercase hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-[0_0_30px_rgba(234,179,8,0.3)] flex items-center gap-3 disabled:opacity-60"
                        >
                            <Crown size={24} />
                            {buyStatus === 'loading' ? t('battlepass.buying') : passPrice > 0 ? `${t('battlepass.getPremiumPass')} — ${passPrice} 💎` : t('battlepass.getPremiumPass')}
                        </motion.button>
                    </div>
                )}
            </header>

            {/* Progress Bar Overview */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 mb-12">
                <div className="bg-[#120a1f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#b026ff]/5 rounded-full blur-3xl" />

                    <div className="flex flex-col items-center justify-center shrink-0">
                        <span className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-1">{t('battlepass.currentTier')}</span>
                        <div className="w-24 h-24 rounded-full border-4 border-[#b026ff] flex items-center justify-center text-4xl font-black text-white shadow-[0_0_20px_rgba(176,38,255,0.4)] bg-black/50">
                            {CURRENT_LEVEL}
                        </div>
                    </div>

                    <div className="flex-1 w-full relative">
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 px-1">
                            <span>{CURRENT_XP} XP</span>
                            <span className="text-[#b026ff]">{CURRENT_XP} / {XP_FOR_NEXT} XP (To Tier {CURRENT_LEVEL + 1})</span>
                        </div>
                        <div className="w-full h-4 bg-black/60 border border-white/10 rounded-full overflow-hidden relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${xpPercent}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-[#b026ff] to-[#d685ff] shadow-[0_0_15px_rgba(176,38,255,0.8)]"
                            />
                        </div>
                        <p className="text-gray-400 mt-4 text-sm font-medium">{t('battlepass.completeTip')}</p>
                    </div>
                </div>
            </section>

            {/* Battle Pass Progression Track */}
            <section className="relative z-10 max-w-7xl mx-auto px-6">
                <div className="bg-black/40 border border-white/5 rounded-3xl p-6 md:p-8 overflow-x-auto custom-scrollbar">

                    {/* Headers */}
                    <div className="min-w-[800px] grid grid-cols-[100px_1fr_1fr] gap-6 mb-6 px-4">
                        <div className="text-center font-bold text-gray-400 tracking-widest uppercase text-sm">{t('battlepass.tier')}</div>
                        <div className="font-bold text-gray-300 tracking-widest uppercase text-sm flex items-center gap-2">
                            {t('battlepass.freeTrack')}
                        </div>
                        <div className="font-bold text-yellow-500 tracking-widest uppercase text-sm flex items-center gap-2">
                            <Crown size={16} /> {t('battlepass.premiumTrack')}
                        </div>
                    </div>

                    {/* Nodes */}
                    <div className="min-w-[800px] flex flex-col gap-4">
                        {tiers.length === 0 ? (
                            <div className="text-center py-10 opacity-50 flex-1 flex flex-col justify-center">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t('battlepass.noActiveBP')}</p>
                            </div>
                        ) : tiers.map((tier) => {
                            const isCompleted = tier.level <= CURRENT_LEVEL;
                            const isCurrent = tier.level === CURRENT_LEVEL;
                            const isLocked = tier.level > CURRENT_LEVEL;

                            const RARITY_COLORS: Record<string, string> = {
                                Common: 'text-gray-400', Rare: 'text-blue-400',
                                Epic: 'text-purple-400', Legendary: 'text-orange-400'
                            };

const ItemCard = ({ item, gems, isPremium }: { item: { name: string; type: string; rarity: string; imageUrl: string | null } | null, gems: number, isPremium: boolean }) => {
                                const unlocked = isCompleted && (isPremium ? IS_PREMIUM : true);
                                if (!item && gems <= 0) return (
                                    <div className="flex items-center gap-3 flex-1">
                                        <span className="text-xs text-gray-600 font-bold italic">{t('battlepass.noReward')}</span>
                                    </div>
                                );
                                return (
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {item && (
                                            <>
                                                <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border ${isPremium ? 'border-yellow-500/30' : 'border-white/10'} bg-black/40 flex items-center justify-center`}>
                                                    {item.imageUrl
                                                        ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                        : <Package size={18} className={unlocked ? (isPremium ? 'text-yellow-500' : 'text-white') : 'text-gray-600'} />
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`font-bold truncate text-sm ${unlocked ? (isPremium ? 'text-yellow-400' : 'text-white') : 'text-gray-500'}`}>{item.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{item.type.replace('_', ' ')}</span>
                                                        <span className={`text-[10px] font-black uppercase ${RARITY_COLORS[item.rarity] || 'text-gray-400'}`}>· {item.rarity}</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {gems > 0 && (
                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${isPremium ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-cyan-500/10 border border-cyan-500/20'}`}>
                                                <span className="text-base">💎</span>
                                                <span className={`font-black text-sm ${isPremium ? 'text-yellow-400' : 'text-cyan-400'}`}>{gems}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            };

                            return (
                                <motion.div
                                    key={tier.level}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className={`grid grid-cols-[100px_1fr_1fr] gap-6 p-4 rounded-2xl border transition-all ${isCurrent ? 'bg-[#b026ff]/10 border-[#b026ff]/50 shadow-[0_0_20px_rgba(176,38,255,0.2)]' :
                                        isCompleted ? 'bg-white/5 border-white/10' : 'bg-black/60 border-white/5 opacity-60'
                                        }`}
                                >
                                    {/* Level Indicator */}
                                    <div className="flex items-center justify-center">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl border ${isCurrent ? 'bg-[#b026ff] text-white border-[#b026ff] shadow-[0_0_15px_rgba(176,38,255,0.5)]' :
                                            isCompleted ? 'bg-white/10 text-white border-white/5' : 'bg-black text-gray-600 border-white/5'
                                            }`}>
                                            {tier.level}
                                        </div>
                                    </div>

                                    {/* Free Reward */}
                                    <div className="relative overflow-hidden group rounded-xl bg-[#120a1f] border border-white/5 flex items-center p-4 gap-3">
                                        <ItemCard item={tier.freeItem} gems={tier.freeGems} isPremium={false} />
                                        <div className="shrink-0">
                                            {isCompleted ? <Check className="text-green-500" size={22} /> : <Lock className="text-gray-600" size={18} />}
                                        </div>
                                        <span className="absolute bottom-1.5 left-4 text-[9px] text-gray-600 font-black uppercase tracking-widest">Free</span>
                                    </div>

                                    {/* Premium Reward */}
                                    <div className={`relative overflow-hidden group rounded-xl border flex items-center p-4 gap-3 ${IS_PREMIUM ? 'bg-[#1a0f00] border-yellow-500/20' : 'bg-[#120a1f] border-white/5'}`}>
                                        <ItemCard item={tier.premiumItem} gems={tier.premiumGems} isPremium={true} />
                                        <div className="shrink-0">
                                            {isCompleted && IS_PREMIUM
                                                ? <Check className="text-yellow-500" size={22} />
                                                : <Lock className={IS_PREMIUM && isLocked ? 'text-gray-600' : 'text-red-500/50'} size={18} />
                                            }
                                        </div>
                                        <span className="absolute bottom-1.5 left-4 text-[9px] text-yellow-700 font-black uppercase tracking-widest">Premium</span>
                                        {/* Overlay if not premium */}
                                        {!IS_PREMIUM && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-yellow-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                                    <Lock size={12} /> Requires Premium
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* --- BOTTOM NAVIGATION BAR --- */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#120a1f]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                    {[
                        { id: 'dashboard', icon: Home, link: '/dashboard' },
                        { id: 'play', icon: Gamepad2, link: '/play' },
                        { id: 'tourney', icon: Trophy, link: '/tournaments' },
                        { id: 'battlepass', icon: Medal, link: '/battlepass' },
                        { id: 'friends', icon: Users, link: '/friends' },
                        { id: 'profile', icon: User, link: '/profile' },
                        { id: 'cards', icon: Layers, link: '/collection' },
                        { id: 'shop', icon: ShoppingBag, link: '/shop' },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = item.id === 'battlepass';

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
