import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Gamepad2, Trophy, User, Layers, ShoppingBag, Image as ImageIcon, Frame, Smile, Star, Lock, CheckCircle2, Medal, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopHeader from '../components/ui/TopHeader';
import FramedAvatar from '../components/ui/FramedAvatar';
import { parseFrameConfig } from '../utils/frameUtils';
import type { FrameConfig } from '../utils/frameUtils';
import PetViewer from '../components/ui/PetViewer';
import type { PetConfig } from '../components/ui/PetViewer';
import { useUser } from '../hooks/useUser';

type Category = 'Avatars' | 'Pets' | 'Card Sleeves' | 'Profile Frames' | 'Emoticons';

interface CollectionItem {
    id: string;
    name: string;
    category: Category;
    image: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    isOwned: boolean;
    isEquipped: boolean;
    source: string; // e.g., "Store", "Season 1 Pass", "Event"
    frameConfig?: FrameConfig | null;
    petConfig?: PetConfig | null;
}

// Mock Data removed

const RARITY_COLORS = {
    Common: 'text-gray-400 border-gray-400/30 bg-gray-400/10',
    Rare: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    Epic: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
    Legendary: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
};

const CATEGORIES: { id: Category; icon: LucideIcon; label: string }[] = [
    { id: 'Avatars', icon: User, label: 'Avatars' },
    { id: 'Pets', icon: Star, label: 'Pets' },
    { id: 'Card Sleeves', icon: Layers, label: 'Card Sleeves' },
    { id: 'Profile Frames', icon: Frame, label: 'Frames' },
    { id: 'Emoticons', icon: Smile, label: 'Emoticons' }
];

export default function Collection() {
    const { user, isLoading, refreshUser, setUserAvatar } = useUser();
    const [activeCategory, setActiveCategory] = useState<Category>('Avatars');
    const [items, setItems] = useState<CollectionItem[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [equipLoadingId, setEquipLoadingId] = useState<string | null>(null);

    const fetchCollection = async () => {
        try {
            const token = localStorage.getItem('token');
            const invRes = await fetch('http://localhost:3000/api/collection', { headers: { 'Authorization': `Bearer ${token}` } });

            if (invRes.ok) {
                const invData = await invRes.json();

                const mappedCollection: CollectionItem[] = invData.map((inv: any) => {
                    const storeItem = inv.storeItem;
                    const catMap: Record<string, Category> = {
                        'CARD_BACK': 'Card Sleeves',
                        'FRAME': 'Profile Frames',
                        'EMOTE': 'Emoticons',
                        'AVATAR': 'Avatars',
                        'PET': 'Pets'
                    };
                    const cat = catMap[inv.itemType] || 'Avatars';
                    return {
                        id: inv.itemId, 
                        name: storeItem ? storeItem.name : 'Unknown Item',
                        rarity: storeItem ? storeItem.rarity : 'Common',
                        image: storeItem ? storeItem.imageUrl : 'https://images.unsplash.com/photo-1533139366479-79ad22e92c2a?q=80&w=150&auto=format&fit=crop',
                        frameConfig: (inv.itemType === 'FRAME' && storeItem?.frameConfig) ? parseFrameConfig(storeItem.frameConfig) : null,
                        petConfig: (inv.itemType === 'PET' && storeItem?.petConfig) ? (() => { try { return typeof storeItem.petConfig === 'string' ? JSON.parse(storeItem.petConfig) : storeItem.petConfig; } catch { return null; } })() : null,
                        category: cat,
                        isOwned: true,
                        isEquipped: inv.isEquipped,
                        source: 'Store'
                    };
                });
                setItems(mappedCollection);
            }
        } catch (err) {
            console.error('Failed fetching collection', err);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        if (user && !isLoading) {
            fetchCollection();
        }
    }, [user, isLoading]);

    if (isLoading || !user || isFetching) {
        return (
            <div className="min-h-screen bg-[#0f0814] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-[#b026ff]/20 border-t-[#b026ff] rounded-full animate-spin"></div>
            </div>
        );
    }

    const handleEquip = async (itemId: string, itemImage: string, itemCategory: string) => {
        setEquipLoadingId(itemId);
        // Immediately update avatar in UI if it's an Avatar — before backend call
        if (itemCategory === 'Avatars' && itemImage && setUserAvatar) {
            setUserAvatar(itemImage);
        }
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3000/api/collection/equip/${itemId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: itemImage })
            });

            if (res.ok) {
                await fetchCollection();
                // Only refreshUser for non-avatar items so we don't overwrite the avatar we just set
                if (itemCategory !== 'Avatars' && refreshUser) {
                    await refreshUser();
                }
            } else {
                // Equip failed: revert avatar by re-fetching user data
                if (itemCategory === 'Avatars' && refreshUser) await refreshUser();
            }
        } catch(e) {
            console.error(e);
            if (itemCategory === 'Avatars' && refreshUser) await refreshUser();
        } finally {
            setEquipLoadingId(null);
        }
    };

    const allCategoryItems = items.filter(i => i.category === activeCategory);
    const activeItems = allCategoryItems.filter(i => i.isOwned);

    // Stats for current category
    const ownedInCategory = activeItems.length;
    const totalInCategory = allCategoryItems.length;
    const completionPercent = Math.round((ownedInCategory / totalInCategory) * 100) || 0;

    return (
        <div className="min-h-screen bg-[#0f0814] text-white font-sans selection:bg-[#b026ff] pb-24 relative overflow-hidden">

            {/* Ambient Background */}
            <div className="fixed top-[20%] right-[-10%] w-[50%] h-[50%] bg-[#b026ff]/5 rounded-full blur-[150px] pointer-events-none" />

            {/* --- TOP HEADER --- */}
            <TopHeader user={user} />

            {/* --- MAIN CONTENT --- */}
            <main className="max-w-7xl mx-auto px-6 pt-8 pb-12 relative z-10 flex flex-col lg:flex-row gap-8">

                {/* Left Sidebar: Categories */}
                <div className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase drop-shadow-md mb-2">
                            MY <span className="text-[#b026ff]">COLLECTION</span>
                        </h1>
                        <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">Customize your style</p>
                    </div>

                    <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 custom-scrollbar">
                        {CATEGORIES.map(cat => {
                            const Icon = cat.icon;
                            const isActive = activeCategory === cat.id;

                            // Category stats
                            const catOwned = items.filter(i => i.category === cat.id && i.isOwned).length;
                            const catTotal = items.filter(i => i.category === cat.id).length;

                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all shrink-0 lg:shrink whitespace-nowrap lg:whitespace-normal
                                        ${isActive
                                            ? 'bg-gradient-to-r from-[#b026ff]/20 to-transparent border-[#b026ff]/50'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-[#b026ff] text-white shadow-[0_0_15px_rgba(176,38,255,0.5)]' : 'bg-black/30 text-gray-400'}`}>
                                            <Icon size={16} />
                                        </div>
                                        <span className={`font-bold tracking-wide ${isActive ? 'text-white' : 'text-gray-400'}`}>{cat.label}</span>
                                    </div>
                                    <div className="hidden lg:block text-[10px] font-black tracking-widest text-[#b026ff] bg-black/40 px-2 py-1 rounded">
                                        {catOwned}/{catTotal}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Content: Category View */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* Category Header & Progress */}
                    <div className="bg-[#120a1f]/80 backdrop-blur-md rounded-2xl border border-white/10 p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-black italic tracking-wide uppercase flex items-center gap-3">
                                {activeCategory}
                            </h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                {activeCategory === 'Card Sleeves' ? 'Customize your deck appearance' : `Express yourself with ${activeCategory.toLowerCase()}`}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 bg-black/40 px-4 py-3 rounded-xl border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Completion</span>
                                <span className="text-sm font-black">{ownedInCategory} <span className="text-gray-500">/ {totalInCategory}</span></span>
                            </div>
                            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${completionPercent}%` }}
                                    className="h-full bg-gradient-to-r from-blue-500 to-[#b026ff]"
                                />
                            </div>
                            <span className="text-xs font-black text-[#b026ff]">{completionPercent}%</span>
                        </div>
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        <AnimatePresence mode="popLayout">
                            {activeItems.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`relative flex flex-col bg-[#120a1f]/60 backdrop-blur-sm rounded-2xl border transition-all overflow-hidden group
                                        ${item.isEquipped ? 'border-[#b026ff] shadow-[0_0_20px_rgba(176,38,255,0.2)]' : 'border-white/10 hover:border-white/30'}
                                        ${!item.isOwned ? 'opacity-70 grayscale-[0.5]' : ''}
                                    `}
                                >
                                    {/* Item Image Area */}
                                    <div className="relative aspect-square p-6 flex items-center justify-center overflow-hidden bg-gradient-to-b from-transparent to-black/40">
                                        {/* Rarity Glow */}
                                        <div className={`absolute inset-0 opacity-20 bg-gradient-to-t ${item.rarity === 'Legendary' ? 'from-yellow-500' :
                                            item.rarity === 'Epic' ? 'from-purple-500' :
                                                item.rarity === 'Rare' ? 'from-blue-500' : 'from-gray-500'
                                            } to-transparent`} />

                                        {item.category === 'Pets' && item.petConfig ? (
                                            <div className="relative z-10 flex items-center justify-center w-full h-full">
                                                <PetViewer petConfig={item.petConfig} size={96} />
                                            </div>
                                        ) : item.category === 'Profile Frames' && item.frameConfig ? (
                                            <div className="relative z-10 flex items-center justify-center w-full h-full">
                                                <FramedAvatar
                                                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.id}`}
                                                    size={96}
                                                    frameConfig={item.frameConfig}
                                                />
                                            </div>
                                        ) : (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className={`relative z-10 w-full h-full object-contain drop-shadow-2xl transition-transform duration-500
                                                    ${activeCategory === 'Avatars' || activeCategory === 'Profile Frames' ? 'rounded-full' : 'rounded-xl'}
                                                    ${item.isOwned ? 'group-hover:scale-110' : ''}
                                                `}
                                            />
                                        )}

                                        {!item.isOwned && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                                                <Lock className="text-gray-400 w-8 h-8 opacity-50" />
                                            </div>
                                        )}

                                        {item.isEquipped && (
                                            <div className="absolute top-3 right-3 z-30 bg-[#b026ff] text-white p-1.5 rounded-full shadow-[0_0_10px_rgba(176,38,255,0.8)]">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Item Details */}
                                    <div className="p-4 flex flex-col flex-1 border-t border-white/5 bg-black/20">
                                        <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded w-max mb-2 ${RARITY_COLORS[item.rarity]}`}>
                                            {item.rarity}
                                        </div>
                                        <h3 className={`font-bold text-sm tracking-wide mb-1 ${item.isEquipped ? 'text-[#b026ff]' : 'text-white'}`}>{item.name}</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4 flex-1">{item.source}</p>

                                        {/* Action Button */}
                                        {item.isOwned ? (
                                            <button
                                                onClick={() => handleEquip(item.id, item.image, item.category)}
                                                disabled={equipLoadingId === item.id}
                                                className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                                                    ${item.isEquipped
                                                        ? 'bg-white/5 text-gray-400 border border-white/10 cursor-default'
                                                        : 'bg-white/10 text-white hover:bg-[#b026ff] hover:text-white border border-white/10 hover:border-[#b026ff] hover:shadow-[0_0_15px_rgba(176,38,255,0.4)]'
                                                    }
                                                `}
                                            >
                                                {equipLoadingId === item.id ? 'Equipping...' : (item.isEquipped ? 'Equipped' : 'Equip')}
                                            </button>
                                        ) : (
                                            <button className="w-full py-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                                                Get in Store
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {activeItems.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 lg:p-24 border border-white/5 border-dashed rounded-3xl bg-white/5">
                            <ImageIcon className="w-16 h-16 text-gray-600 mb-4 opacity-50" />
                            <h3 className="text-xl font-bold text-gray-400 mb-2">No Items in this Category</h3>
                            <p className="text-sm text-gray-500 text-center max-w-sm">You haven't collected any {activeCategory.toLowerCase()} yet. Check the store or participate in events to expand your collection!</p>
                        </div>
                    )}
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
                        { id: 'profile', icon: User, link: '/profile' },
                        { id: 'cards', icon: Layers, link: '/collection' },
                        { id: 'shop', icon: ShoppingBag, link: '/shop' },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = item.id === 'cards'; // Active for Collection

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
            `}</style>
        </div>
    );
}
