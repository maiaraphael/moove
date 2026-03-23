import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CreditCard, Diamond, Crown, UserPlus, Users, X, Check, Swords, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import type { UserProfile } from '../../hooks/useUser';
import FramedAvatar from './FramedAvatar';
import { useNotify } from './NotificationProvider';
import SettingsModal from './SettingsModal';

export default function TopHeader({ user }: { user: UserProfile | null }) {
    const navigate = useNavigate();
    const isVip = !!user?.vipExpiresAt && new Date(user.vipExpiresAt) > new Date();
    const { bellItems, unreadCount, markAllRead, dismissBell, clearAllBell } = useNotify();
    const [panelOpen, setPanelOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close panel when clicking outside
    useEffect(() => {
        if (!panelOpen) return;
        function handler(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setPanelOpen(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [panelOpen]);

    function togglePanel() {
        if (!panelOpen) markAllRead();
        setPanelOpen(v => !v);
    }

    async function handleAccept(fromId: string, bellId: string) {
        try {
            const token = localStorage.getItem('token');
            // Find the friendship id by fetching incoming requests
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/requests/incoming`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const list = await res.json();
            const req = list.find((r: any) => r.id === fromId);
            if (req?.friendshipId) {
                await fetch(`${import.meta.env.VITE_API_URL}/api/friends/accept/${req.friendshipId}`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
        } catch {}
        dismissBell(bellId);
    }

    if (!user) {
        return (
            <header className="w-full px-6 py-5 flex items-center justify-between relative z-10 max-w-7xl mx-auto border-b border-white/5 bg-[#0f0814]/80 backdrop-blur-md sticky top-0 h-[88px]">
                <div className="animate-pulse bg-white/10 w-48 h-10 rounded-lg"></div>
            </header>
        );
    }

    return (
        <>
        <header className="w-full px-6 py-5 flex items-center justify-between relative z-[100] max-w-7xl mx-auto border-b border-white/5 bg-[#0f0814]/80 backdrop-blur-md sticky top-0">
            {/* User Profile (Left) */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <FramedAvatar
                        src={user.avatar}
                        alt="Profile"
                        size={48}
                        frameConfig={user.equippedFrame}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[#0f0814] z-20" />
                </div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h2 className="font-bold text-base md:text-lg tracking-wide text-white">{user.name}</h2>
                        {isVip && (
                            <span title="VIP Ativo" className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 uppercase tracking-wider">
                                <Crown size={9} className="fill-yellow-400" /> VIP
                            </span>
                        )}
                        <div className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#b026ff]/20 text-[#b026ff] border border-[#b026ff]/30 uppercase tracking-wider flex items-center gap-1">
                            <span>LVL {user.level}</span>
                            <span className="text-white/30">|</span>
                            {user.rankConfig?.iconUrl && (
                                <img src={user.rankConfig.iconUrl} alt={user.rankConfig.name} className="object-contain" style={{ width: 16, height: 16, transform: `scale(${user.rankConfig.iconScale ?? 1})`, transformOrigin: 'center' }} />
                            )}
                            <span style={user.rankConfig?.color ? { color: user.rankConfig.color } : undefined}>
                                {user.rankConfig?.name || user.rank}
                            </span>
                        </div>
                    </div>
                    {/* XP Bar */}
                    <div className="w-32 md:w-44 h-1.5 bg-gray-800 rounded-full mt-1.5 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${user.xpProgress}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="h-full bg-gradient-to-r from-[#b026ff] to-[#d685ff] shadow-[0_0_10px_rgba(176,38,255,0.8)]"
                        />
                    </div>
                </div>
            </div>

            {/* Currency & Notifications (Right) */}
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                    {/* Credits */}
                    <div className="flex items-center gap-2 font-bold text-sm tracking-wide text-white">
                        <CreditCard size={14} className="text-yellow-500" />
                        <span>{user.credits.toLocaleString()}</span>
                    </div>
                    <div className="w-px h-4 bg-white/20 mx-1" />
                    {/* Gems */}
                    <div className="flex items-center gap-2 font-bold text-sm tracking-wide group cursor-pointer text-white" onClick={() => navigate('/shop')}>
                        <Diamond size={14} className="text-[#b026ff] fill-[#b026ff]/20 group-hover:scale-110 transition-transform" />
                        <span className="text-[#b026ff] group-hover:text-white transition-colors">{user.gems.toLocaleString()}</span>
                        <span className="ml-1 bg-[#b026ff]/20 text-[#b026ff] rounded px-1.5 py-0.5 text-[8px] uppercase font-black">+ Get</span>
                    </div>
                </div>

                {/* Settings button */}
                <button
                    onClick={() => setSettingsOpen(true)}
                    title="Settings"
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white"
                >
                    <Settings size={18} className="text-gray-300" />
                </button>

                {/* Bell button + dropdown */}
                <div className="relative" ref={panelRef}>
                    <button
                        onClick={togglePanel}
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors relative text-white"
                    >
                        <Bell size={18} className="text-gray-300" />
                        {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 border-2 border-[#0f0814] flex items-center justify-center px-1">
                                <span className="text-[9px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            </div>
                        )}
                    </button>

                    <AnimatePresence>
                        {panelOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-12 w-80 bg-[#120a1f] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-[200]"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                                    <span className="text-xs font-black uppercase tracking-widest text-white/60">Notifications</span>
                                    <button onClick={() => setPanelOpen(false)} className="text-white/30 hover:text-white/70 transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>

                                {/* Items */}
                                <div className="max-h-80 overflow-y-auto">
                                    {bellItems.length === 0 ? (
                                        <div className="py-10 text-center text-gray-600 text-xs font-semibold">
                                            No notifications yet
                                        </div>
                                    ) : (
                                        bellItems.map(item => (
                                            <div key={item.id}
                                                className="flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/3 transition-colors"
                                            >
                                                <div className="shrink-0 w-8 h-8 rounded-full bg-[#b026ff]/20 border border-[#b026ff]/30 flex items-center justify-center text-[#b026ff] mt-0.5">
                                                    {item.type === 'friend_request' ? <UserPlus size={15} /> : item.type === 'friend_challenge' ? <Swords size={15} /> : <Users size={15} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] text-white/80 leading-snug">
                                                        {item.type === 'friend_request' ? (
                                                            <><span className="font-bold text-[#d685ff]">{item.from}</span> sent you a friend request</>
                                                        ) : item.type === 'friend_challenge' ? (
                                                            <><span className="font-bold text-[#d685ff]">{item.from}</span> challenged you to a match!</>
                                                        ) : (
                                                            <><span className="font-bold text-[#d685ff]">{item.from}</span> accepted your friend request</>
                                                        )}
                                                    </p>
                                                    <p className="text-[9px] text-gray-600 mt-0.5">
                                                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    {item.type === 'friend_request' && (
                                                        <div className="flex gap-2 mt-2">
                                                            <button
                                                                onClick={() => handleAccept(item.fromId, item.id)}
                                                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-400 text-[10px] font-bold transition-colors"
                                                            >
                                                                <Check size={11} /> Accept
                                                            </button>
                                                            <button
                                                                onClick={() => dismissBell(item.id)}
                                                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-bold transition-colors"
                                                            >
                                                                <X size={11} /> Dismiss
                                                            </button>
                                                        </div>
                                                    )}
                                                    {item.type === 'friend_challenge' && (
                                                        <div className="flex gap-2 mt-2">
                                                            <button
                                                                onClick={() => { dismissBell(item.id); setPanelOpen(false); navigate(`/play?challenge=${item.from}`); }}
                                                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#b026ff]/15 hover:bg-[#b026ff]/30 text-[#d685ff] text-[10px] font-bold transition-colors"
                                                            >
                                                                <Swords size={11} /> Accept
                                                            </button>
                                                            <button
                                                                onClick={() => dismissBell(item.id)}
                                                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-bold transition-colors"
                                                            >
                                                                <X size={11} /> Decline
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Footer */}
                                {bellItems.length > 0 && (
                                    <div className="px-4 py-2.5 border-t border-white/8 flex justify-between items-center">
                                        <button
                                            onClick={() => { clearAllBell(); setPanelOpen(false); }}
                                            className="text-[10px] text-gray-500 hover:text-white/50 transition-colors"
                                        >
                                            Clear all
                                        </button>
                                        <Link to="/friends" onClick={() => setPanelOpen(false)}
                                            className="text-[10px] text-[#b026ff] hover:text-[#d685ff] transition-colors font-bold"
                                        >
                                            View Friends →
                                        </Link>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>

        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </>
    );
}

