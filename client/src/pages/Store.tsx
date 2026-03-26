import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Gamepad2, Trophy, User, Layers, ShoppingBag, CreditCard, Diamond, Frame, Smile, Star, Tag, Gift, Package, Sparkles, Medal, Crown, Shield, Users, Swords } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopHeader from '../components/ui/TopHeader';
import { CardGridSkeleton } from '../components/ui/PageLoader';
import FramedAvatar from '../components/ui/FramedAvatar';
import { parseFrameConfig } from '../utils/frameUtils';
import type { FrameConfig } from '../utils/frameUtils';
import PetViewer from '../components/ui/PetViewer';
import type { PetConfig } from '../components/ui/PetViewer';
import { useUser } from '../hooks/useUser';

type StoreCategory = 'Featured' | 'Bundles' | 'Avatars' | 'Pets' | 'Card Sleeves' | 'Profile Frames' | 'Emoticons' | 'Gems' | 'VIP';
type Currency = 'Credits' | 'Gems';

interface StoreItem {
    id: string;
    name: string;
    category: StoreCategory;
    image: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    price: number;
    currency: Currency;
    description: string;
    isOwned: boolean;
    isFeatured: boolean;
    discount?: number;
    badge?: string;
    frameConfig?: FrameConfig | null;
    petConfig?: PetConfig | null;
}

const RARITY_COLORS: Record<string, string> = {
    Common: 'text-gray-400 border-gray-400/30 bg-gray-400/10',
    Rare: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    Epic: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
    Legendary: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
};

const RARITY_GLOW: Record<string, string> = {
    Common:   'rgba(156,163,175,0.35)',
    Rare:     'rgba(96,165,250,0.45)',
    Epic:     'rgba(192,132,252,0.45)',
    Legendary:'rgba(234,179,8,0.55)',
};

const RARITY_BORDER: Record<string, string> = {
    Common:   'border-gray-500/40',
    Rare:     'border-blue-400/50',
    Epic:     'border-purple-400/60',
    Legendary:'border-yellow-400/70',
};

const RARITY_BG_FROM: Record<string, string> = {
    Common:   'from-gray-500/20',
    Rare:     'from-blue-500/25',
    Epic:     'from-purple-600/30',
    Legendary:'from-yellow-500/30',
};

const CATEGORIES: { id: StoreCategory; icon: LucideIcon; label: string }[] = [
    { id: 'Featured', icon: Sparkles, label: 'Featured' },
    { id: 'Bundles', icon: Package, label: 'Bundles' },
    { id: 'Avatars', icon: User, label: 'Avatars' },
    { id: 'Pets', icon: Star, label: 'Pets' },
    { id: 'Card Sleeves', icon: Layers, label: 'Card Sleeves' },
    { id: 'Profile Frames', icon: Frame, label: 'Frames' },
    { id: 'Emoticons', icon: Smile, label: 'Emoticons' },
    { id: 'Gems', icon: Diamond, label: 'Gems' },
    { id: 'VIP', icon: Crown, label: 'VIP' },
];

export default function Store() {
    const { user, isLoading, refreshUser } = useUser();
    const [activeCategory, setActiveCategory] = useState<StoreCategory>('Featured');
    const [purchaseModal, setPurchaseModal] = useState<StoreItem | null>(null);
    const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [buyStatus, setBuyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [vipConfig, setVipConfig] = useState<any | null>(null);
    const [vipBuyStatus, setVipBuyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    // Fetch store items immediately on mount — no need to wait for user context
    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const fetchStore = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/store`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: controller.signal,
                });

                if (res.ok && !cancelled) {
                    const data = await res.json();
                    const mappedItems = data
                        .filter((item: any) => item.isActive !== false)
                        .map((item: any) => ({
                            ...item,
                            image: item.imageUrl,
                            frameConfig: item.type === 'FRAME' ? parseFrameConfig(item.frameConfig) : null,
                            petConfig: item.type === 'PET' ? (() => { try { return typeof item.petConfig === 'string' ? JSON.parse(item.petConfig) : item.petConfig; } catch { return null; } })() : null,
                            isFeatured: item.isFeatured || false,
                            category: item.type === 'CARD_BACK' ? 'Card Sleeves' :
                                      item.type === 'FRAME' ? 'Profile Frames' :
                                      item.type === 'EMOTE' ? 'Emoticons' :
                                      item.type === 'AVATAR' ? 'Avatars' :
                                      item.type === 'PET' ? 'Pets' : 'Avatars',
                            isOwned: false, // will be recomputed once user inventory loads
                        }));
                    if (!cancelled) setStoreItems(mappedItems);
                } else if (!cancelled) {
                    setFetchError(true);
                }
            } catch (err: any) {
                if (!cancelled && err?.name !== 'AbortError') {
                    console.error('Store Items fetch failed', err);
                    setFetchError(true);
                }
            } finally {
                clearTimeout(timeout);
                if (!cancelled) setIsFetching(false);
            }
        };

        fetchStore();
        return () => { cancelled = true; controller.abort(); clearTimeout(timeout); };
    }, []);

    // Re-compute isOwned whenever user inventory becomes available
    useEffect(() => {
        if (user?.inventory && storeItems.length > 0) {
            setStoreItems(items =>
                items.map(item => ({
                    ...item,
                    isOwned: user.inventory!.some((inv: any) => inv.itemId === item.id),
                }))
            );
        }
    }, [user?.inventory]);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/vip/active`)
            .then(res => res.ok ? res.json() : null)
            .then(data => setVipConfig(data))
            .catch(() => setVipConfig(null));
    }, []);

    if (isLoading || !user) return <CardGridSkeleton />;
    if (isFetching) return <CardGridSkeleton label="LOADING STORE..." />;

    const activeItems = storeItems.filter(i =>
        activeCategory === 'Featured'
            ? i.isFeatured === true
            : i.category === activeCategory
    );

    const handlePurchaseClick = (item: StoreItem) => {
        setPurchaseModal(item);
        setBuyStatus('idle');
    };

    const handleBuyVip = async () => {
        if (vipBuyStatus === 'loading' || !vipConfig) return;
        setVipBuyStatus('loading');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/vip/buy`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: vipConfig.id })
            });
            if (res.ok) {
                setVipBuyStatus('success');
                if (refreshUser) refreshUser();
                setTimeout(() => setVipBuyStatus('idle'), 4000);
            } else {
                setVipBuyStatus('error');
                setTimeout(() => setVipBuyStatus('idle'), 3000);
            }
        } catch {
            setVipBuyStatus('error');
            setTimeout(() => setVipBuyStatus('idle'), 3000);
        }
    };

    const confirmPurchase = async () => {
        if (!purchaseModal) return;
        setBuyStatus('loading');
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/store/buy`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ itemId: purchaseModal.id })
            });
            
            if (res.ok) {
                setBuyStatus('success');
                setTimeout(() => {
                    setPurchaseModal(null);
                    if (refreshUser) refreshUser(); // Re-sync balance & inventory
                }, 1500);
            } else {
                setBuyStatus('error');
            }
        } catch(err) {
            console.error(err);
            setBuyStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0814] text-white font-sans selection:bg-[#b026ff] pb-24 relative overflow-hidden">

            {/* Ambient Background */}
            <div className="fixed top-[0%] left-[-10%] w-[50%] h-[50%] bg-[#b026ff]/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/5 rounded-full blur-[150px] pointer-events-none" />

            {/* --- TOP HEADER --- */}
            <TopHeader user={user} />

            {/* --- MAIN CONTENT --- */}
            <main className="max-w-7xl mx-auto px-6 pt-8 pb-12 relative z-10 flex flex-col lg:flex-row gap-8">

                {/* Left Sidebar: Categories */}
                <div className="w-full lg:w-48 shrink-0 flex flex-col gap-6">
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase drop-shadow-md mb-2">
                            MOOVE <span className="text-[#b026ff]">STORE</span>
                        </h1>
                        <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">Premium & Exclusives</p>
                    </div>

                    <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 custom-scrollbar">
                        {CATEGORIES.map(cat => {
                            const Icon = cat.icon;
                            const isActive = activeCategory === cat.id;

                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`relative flex items-center justify-start p-3 lg:p-4 rounded-xl lg:rounded-2xl border transition-all shrink-0 lg:shrink whitespace-nowrap lg:whitespace-normal
                                        ${isActive
                                            ? 'bg-gradient-to-r from-[#b026ff]/20 to-transparent border-[#b026ff]/50 shadow-[0_0_15px_rgba(176,38,255,0.15)]'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-[#b026ff] text-white' : 'bg-black/30 text-gray-400'}`}>
                                            <Icon size={16} />
                                        </div>
                                        <span className={`font-bold text-sm tracking-wide ${isActive ? 'text-white' : 'text-gray-400'}`}>{cat.label}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>


                </div>

                {/* Right Content: Category View */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* Fetch error banner */}
                    {fetchError && (
                        <div className="flex flex-col items-center justify-center p-12 border border-red-500/20 border-dashed rounded-2xl bg-red-500/5 mb-4">
                            <span className="text-2xl mb-3">⚠️</span>
                            <h3 className="text-base font-bold text-red-400 mb-1">Falha ao carregar a loja</h3>
                            <p className="text-xs text-gray-500 text-center mb-4">Verifique sua conexão e tente novamente.</p>
                            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors">Recarregar</button>
                        </div>
                    )}

                    {/* Items Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                        <AnimatePresence mode="popLayout">
                            {activeItems.map((item, idx) => {
                                const originalPrice = item.discount ? Math.floor(item.price / (1 - item.discount / 100)) : item.price;
                                const canAfford = item.currency === 'Gems' ? user.gems >= item.price : user.credits >= item.price;
                                const glowColor = RARITY_GLOW[item.rarity] ?? 'rgba(176,38,255,0.35)';

                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: idx * 0.04 }}
                                        onClick={() => !item.isOwned && handlePurchaseClick(item)}
                                        className={`relative flex flex-col rounded-2xl border ${RARITY_BORDER[item.rarity]} overflow-hidden cursor-pointer
                                            group transition-all duration-300 hover:-translate-y-1.5`}
                                        style={{
                                            background: 'linear-gradient(160deg, #18102a 0%, #0d0818 100%)',
                                            boxShadow: `0 0 0 rgba(0,0,0,0)`,
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 8px 40px ${glowColor}, 0 0 0 1px ${glowColor}`)}
                                        onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 0 rgba(0,0,0,0)`)}
                                    >
                                        {/* Rarity shimmer line at top */}
                                        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent ${
                                            item.rarity === 'Legendary' ? 'via-yellow-400' :
                                            item.rarity === 'Epic' ? 'via-purple-400' :
                                            item.rarity === 'Rare' ? 'via-blue-400' : 'via-gray-400'
                                        } to-transparent z-20`} />

                                        {/* Badges row */}
                                        <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-start z-30 pointer-events-none">
                                            {item.badge ? (
                                                <span className="bg-red-500 text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg">
                                                    {item.badge}
                                                </span>
                                            ) : <span />}
                                            {item.isOwned && (
                                                <span className="bg-green-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow">
                                                    OWNED
                                                </span>
                                            )}
                                        </div>

                                        {/* Image Area */}
                                        <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-b ${RARITY_BG_FROM[item.rarity]} to-[#0d0818]`}
                                            style={{ minHeight: 160 }}>
                                            {/* Radial rarity spotlight */}
                                            <div className="absolute inset-0 pointer-events-none"
                                                style={{ background: `radial-gradient(ellipse 70% 60% at 50% 90%, ${glowColor} 0%, transparent 70%)` }} />

                                            {item.category === 'Pets' && item.petConfig ? (
                                                <div className="relative z-10 flex items-center justify-center w-full h-full py-6">
                                                    <PetViewer petConfig={item.petConfig} size={96} withBackground={false} />
                                                </div>
                                            ) : item.category === 'Profile Frames' && item.frameConfig ? (
                                                <div className="relative z-10 flex items-center justify-center w-full h-full py-5">
                                                    <FramedAvatar
                                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.id}`}
                                                        size={110}
                                                        frameConfig={item.frameConfig}
                                                    />
                                                </div>
                                            ) : (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className={`relative z-10 object-cover drop-shadow-2xl transition-transform duration-500 group-hover:scale-110
                                                        ${item.category === 'Avatars'
                                                            ? 'w-28 h-28 rounded-full ring-2 ring-white/20'
                                                            : 'w-28 h-28 object-contain py-4'
                                                        }`}
                                                />
                                            )}

                                            {/* Discount ribbon */}
                                            {item.discount && (
                                                <div className="absolute bottom-2 left-2 z-20 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                                                    -{item.discount}%
                                                </div>
                                            )}
                                        </div>

                                        {/* Item Info */}
                                        <div className="px-3 pt-3 pb-3 flex flex-col gap-2 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${RARITY_COLORS[item.rarity]}`}>
                                                    {item.rarity}
                                                </span>
                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate">{item.category}</span>
                                            </div>

                                            <h3 className="font-black text-sm text-white leading-tight line-clamp-1">{item.name}</h3>

                                            {/* Price & CTA */}
                                            <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                                                <div className="flex items-center gap-1">
                                                    {item.currency === 'Gems' ? (
                                                        <Diamond size={14} className="text-[#b026ff] shrink-0" />
                                                    ) : (
                                                        <CreditCard size={14} className="text-yellow-400 shrink-0" />
                                                    )}
                                                    <span className={`font-black text-sm ${canAfford ? 'text-white' : 'text-red-400'}`}>
                                                        {item.price === 0 ? 'FREE' : item.price.toLocaleString()}
                                                    </span>
                                                    {item.discount && (
                                                        <span className="text-[10px] text-gray-500 line-through">{originalPrice.toLocaleString()}</span>
                                                    )}
                                                </div>

                                                {item.isOwned ? (
                                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-green-500/10 border border-green-500/30 text-green-400">
                                                        Owned
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={e => { e.stopPropagation(); handlePurchaseClick(item); }}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                                                            ${canAfford
                                                                ? 'bg-[#b026ff]/20 border border-[#b026ff]/50 text-[#d685ff] hover:bg-[#b026ff] hover:text-white hover:border-[#b026ff]'
                                                                : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white'
                                                            }`}
                                                    >
                                                        {canAfford ? 'Buy' : 'Get'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {activeItems.length === 0 && activeCategory !== 'Gems' && activeCategory !== 'VIP' && !fetchError && (
                        <div className="flex flex-col items-center justify-center p-12 lg:p-24 border border-white/5 border-dashed rounded-3xl bg-white/5">
                            <Tag className="w-16 h-16 text-gray-600 mb-4 opacity-50" />
                            <h3 className="text-xl font-bold text-gray-400 mb-2">
                                {activeCategory === 'Featured' ? 'Nenhum item em destaque' : 'Nenhum item disponível'}
                            </h3>
                            <p className="text-sm text-gray-500 text-center max-w-sm">
                                {activeCategory === 'Featured'
                                    ? 'O admin ainda não marcou itens como destaque. Navegue pelas categorias ao lado.'
                                    : `Volte mais tarde para novos itens em ${activeCategory.toLowerCase()}.`}
                            </p>
                        </div>
                    )}

                    {activeCategory === 'Gems' && activeItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 lg:p-24 border border-white/5 border-dashed rounded-3xl bg-white/5">
                            <Diamond className="w-16 h-16 text-gray-600 mb-4 opacity-50" />
                            <h3 className="text-xl font-bold text-gray-400 mb-2">No Gem Packs Available</h3>
                            <p className="text-sm text-gray-500 text-center max-w-sm">Gem packs are managed by the admin. Check back later.</p>
                        </div>
                    )}

                    {activeCategory === 'VIP' && (
                        <div className="max-w-lg mx-auto">
                            {!vipConfig ? (
                                <div className="flex flex-col items-center justify-center p-16 border border-white/5 border-dashed rounded-3xl bg-white/5">
                                    <Crown className="w-16 h-16 text-gray-600 mb-4 opacity-50" />
                                    <h3 className="text-xl font-bold text-gray-400 mb-2">No VIP Plan Available</h3>
                                    <p className="text-sm text-gray-500 text-center">Check back later for VIP subscription plans.</p>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative bg-gradient-to-b from-yellow-500/10 to-[#120a1f]/80 backdrop-blur-md border border-yellow-500/30 rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_0_40px_rgba(234,179,8,0.1)]"
                                >
                                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50 rounded-t-3xl" />
                                    <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                                        <Crown size={32} className="text-yellow-400" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white mb-1">{vipConfig.name}</h2>
                                    {vipConfig.description && <p className="text-sm text-gray-400 mb-6">{vipConfig.description}</p>}

                                    <div className="w-full grid grid-cols-1 gap-3 mb-6">
                                        {vipConfig.xpBonus > 0 && (
                                            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                                                <Star size={16} className="text-purple-400 shrink-0" />
                                                <span className="text-sm text-white font-bold">+{vipConfig.xpBonus}% XP</span>
                                                <span className="text-xs text-gray-500 ml-auto">em partidas ranqueadas</span>
                                            </div>
                                        )}
                                        {vipConfig.gemsBonus > 0 && (
                                            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                                                <Diamond size={16} className="text-cyan-400 shrink-0" />
                                                <span className="text-sm text-white font-bold">+{vipConfig.gemsBonus}% Gems</span>
                                                <span className="text-xs text-gray-500 ml-auto">em partidas ranqueadas</span>
                                            </div>
                                        )}
                                        {vipConfig.noMmrLoss && (
                                            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                                                <Shield size={16} className="text-green-400 shrink-0" />
                                                <span className="text-sm text-white font-bold">Proteção de MMR</span>
                                                <span className="text-xs text-gray-500 ml-auto">ao desconectar/render</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                                            <Crown size={16} className="text-yellow-400 shrink-0" />
                                            <span className="text-sm text-white font-bold">{vipConfig.durationDays} dias</span>
                                            <span className="text-xs text-gray-500 ml-auto">de acesso VIP</span>
                                        </div>
                                    </div>

                                    {user?.vipExpiresAt && new Date(user.vipExpiresAt) > new Date() ? (
                                        <div className="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-sm">
                                            ✓ VIP Ativo até {new Date(user.vipExpiresAt).toLocaleDateString('pt-BR')}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleBuyVip}
                                            disabled={vipBuyStatus === 'loading' || vipBuyStatus === 'success'}
                                            className={`w-full py-4 rounded-xl font-black text-sm tracking-widest transition-all disabled:opacity-60 ${
                                                vipBuyStatus === 'success' ? 'bg-green-500 text-white' :
                                                vipBuyStatus === 'error' ? 'bg-red-500 text-white' :
                                                'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black hover:from-yellow-400 hover:to-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                                            }`}
                                        >
                                            {vipBuyStatus === 'loading' ? 'Processando...' :
                                             vipBuyStatus === 'success' ? '✓ VIP Ativado!' :
                                             vipBuyStatus === 'error' ? 'Saldo insuficiente' :
                                             `Obter por ${vipConfig.price} Credits`}
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* --- PURCHASE MODAL --- */}
            <AnimatePresence>
                {purchaseModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPurchaseModal(null)}
                            className="absolute inset-0 bg-[#0f0814]/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-[#120a1f] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className={`h-48 relative overflow-hidden flex items-center justify-center bg-gradient-to-b ${purchaseModal.rarity === 'Legendary' ? 'from-yellow-500/20' :
                                purchaseModal.rarity === 'Epic' ? 'from-purple-500/20' :
                                    purchaseModal.rarity === 'Rare' ? 'from-blue-500/20' : 'from-gray-500/20'
                                } to-[#120a1f]`}>
                                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#b026ff] to-transparent opacity-50" />
                                {purchaseModal.category === 'Pets' && purchaseModal.petConfig ? (
                                    <PetViewer petConfig={purchaseModal.petConfig} size={140} withBackground={false} />
                                ) : purchaseModal.category === 'Profile Frames' && purchaseModal.frameConfig ? (
                                    <FramedAvatar
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${purchaseModal.id}`}
                                        size={96}
                                        frameConfig={purchaseModal.frameConfig}
                                    />
                                ) : (
                                    <img src={purchaseModal.image} alt={purchaseModal.name} className="w-32 h-32 object-contain drop-shadow-2xl" />
                                )}
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 text-center flex flex-col items-center">
                                <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded w-max mb-3 ${RARITY_COLORS[purchaseModal.rarity]}`}>
                                    {purchaseModal.rarity}
                                </div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-1">{purchaseModal.name}</h2>
                                <p className="text-xs text-gray-400 mb-6">{purchaseModal.description}</p>

                                <div className="w-full bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col items-center mb-6">
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Total Cost</div>
                                    <div className="flex items-center gap-2">
                                        {purchaseModal.currency === 'Gems' ? (
                                            <Diamond size={24} className="text-[#b026ff]" />
                                        ) : (
                                            <CreditCard size={24} className="text-yellow-500" />
                                        )}
                                        <span className="text-3xl font-black tracking-wide">{purchaseModal.price.toLocaleString()}</span>
                                    </div>

                                    {/* User Balance Check */}
                                    <div className="mt-4 pt-4 border-t border-white/10 w-full flex items-center justify-between text-xs">
                                        <span className="text-gray-400">Your Balance:</span>
                                        <div className="flex items-center gap-1 font-bold">
                                            {purchaseModal.currency === 'Gems' ? (
                                                <><span className="text-[#b026ff]">{user.gems.toLocaleString()}</span> Gems</>
                                            ) : (
                                                <><span className="text-yellow-500">{user.credits.toLocaleString()}</span> Credits</>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 w-full">
                                    <button
                                        onClick={() => setPurchaseModal(null)}
                                        className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    {(purchaseModal.currency === 'Gems' ? user.gems >= purchaseModal.price : user.credits >= purchaseModal.price) ? (
                                        <button
                                            onClick={confirmPurchase}
                                            disabled={buyStatus === 'loading' || buyStatus === 'success'}
                                            className={`flex-[2] py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2
                                                ${buyStatus === 'success' ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 
                                                  buyStatus === 'error' ? 'bg-red-500 hover:bg-red-600' :
                                                  'bg-[#b026ff] hover:bg-[#9d1ce6] shadow-[0_0_20px_rgba(176,38,255,0.4)]'}
                                            `}
                                        >
                                            {buyStatus === 'loading' ? 'Processing...' : 
                                             buyStatus === 'success' ? 'Purchased!' :
                                             buyStatus === 'error' ? 'Failed' :
                                             <><Gift size={16} /> Purchase</>}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setPurchaseModal(null)}
                                            className="flex-[2] py-3 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2"
                                        >
                                            Get More {purchaseModal.currency}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- BOTTOM NAVIGATION BAR --- */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#120a1f]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                    {[
                        { id: 'dashboard', icon: Home, link: '/dashboard' },
                        { id: 'play', icon: Gamepad2, link: '/play' },
                        { id: 'leaderboard', icon: Trophy, link: '/leaderboard' },
                        { id: 'tourney', icon: Swords, link: '/tournaments' },
                        { id: 'battlepass', icon: Medal, link: '/battlepass' },
                        { id: 'friends', icon: Users, link: '/friends' },
                        { id: 'clan', icon: Shield, link: '/clan' },
                        { id: 'profile', icon: User, link: '/profile' },
                        { id: 'cards', icon: Layers, link: '/collection' },
                        { id: 'shop', icon: ShoppingBag, link: '/shop' },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = item.id === 'shop'; // Active for Store

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

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(176,38,255,0.5); }
                .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            `}</style>
        </div>
    );
}
