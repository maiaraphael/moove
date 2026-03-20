import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io as createSocket, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CheckCircle, X, Star, UserPlus, Users } from 'lucide-react';

// ─── Toast types (auto-dismiss) ───────────────────────────────────────────────
interface ToastNotif {
    id: string;
    type: 'achievement' | 'mission';
    title: string;
    description?: string;
    rewardType?: string;
    xpReward?: number;
    gemsReward?: number;
}

// ─── Bell types (persistent panel) ───────────────────────────────────────────
export interface BellNotif {
    id: string;
    type: 'friend_request' | 'friend_accepted' | 'friend_challenge';
    from: string;
    fromId: string;
    challengeId?: string;
    read: boolean;
    timestamp: number;
}

export interface DmMessage {
    fromId: string;
    from: string;
    avatar: string;
    message: string;
    timestamp: string;
    mine?: boolean;
}

interface NotificationContextValue {
    notify: (n: Omit<ToastNotif, 'id'>) => void;
    bellItems: BellNotif[];
    unreadCount: number;
    markAllRead: () => void;
    dismissBell: (id: string) => void;
    clearAllBell: () => void;
    // DM
    dms: Record<string, DmMessage[]>;
    dmUnread: Record<string, number>;
    sendDm: (toUserId: string, toUsername: string, message: string) => void;
    clearDmUnread: (userId: string) => void;
    clanMessages: DmMessage[];
    sendClanMessage: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
    notify: () => {},
    bellItems: [],
    unreadCount: 0,
    markAllRead: () => {},
    dismissBell: () => {},
    clearAllBell: () => {},
    dms: {},
    dmUnread: {},
    sendDm: () => {},
    clearDmUnread: () => {},
    clanMessages: [],
    sendClanMessage: () => {},
});

export function useNotify() {
    return useContext(NotificationContext);
}

// ─── Toast component ──────────────────────────────────────────────────────────
function NotificationToast({ n, onDismiss }: { n: ToastNotif; onDismiss: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 5000);
        return () => clearTimeout(t);
    }, [onDismiss]);

    const isAchievement = n.type === 'achievement';
    const color = isAchievement
        ? (n.rewardType === 'GOLD' ? 'from-yellow-500/20 border-yellow-500/40 text-yellow-300' : 'from-gray-400/20 border-gray-400/40 text-gray-300')
        : 'from-[#b026ff]/20 border-[#b026ff]/40 text-[#d685ff]';
    const iconColor = isAchievement
        ? (n.rewardType === 'GOLD' ? 'text-yellow-400' : 'text-gray-300')
        : 'text-[#b026ff]';

    return (
        <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`relative flex items-start gap-3 w-80 rounded-xl border bg-gradient-to-r to-[#0f0814] ${color} px-4 py-3 shadow-2xl backdrop-blur-md cursor-pointer select-none`}
            onClick={onDismiss}
        >
            <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                {isAchievement ? <Trophy size={20} /> : <CheckCircle size={20} />}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] font-black tracking-[0.15em] uppercase text-white/50">
                    {isAchievement ? 'Achievement Unlocked' : 'Mission Complete'}
                </span>
                <span className="text-sm font-bold text-white leading-tight truncate">{n.title}</span>
                {n.description && (
                    <span className="text-xs text-white/50 leading-snug">{n.description}</span>
                )}
                {(n.xpReward || n.gemsReward) && (
                    <div className="flex items-center gap-2 mt-1">
                        {n.xpReward ? <span className="text-[10px] font-black text-blue-400">+{n.xpReward} XP</span> : null}
                        {n.gemsReward ? <span className="text-[10px] font-black text-[#b026ff] flex items-center gap-0.5"><Star size={9} className="fill-[#b026ff]" /> {n.gemsReward} Gems</span> : null}
                    </div>
                )}
            </div>
            <button
                className="absolute top-2 right-2 text-white/30 hover:text-white/70 transition-colors"
                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            >
                <X size={14} />
            </button>
        </motion.div>
    );
}

// ─── Friend toast (top-left style) ───────────────────────────────────────────
function FriendToast({ from, type, onDismiss }: { from: string; type: 'friend_request' | 'friend_accepted'; onDismiss: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 6000);
        return () => clearTimeout(t);
    }, [onDismiss]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative flex items-center gap-3 w-80 rounded-xl border border-[#b026ff]/40 bg-gradient-to-r from-[#b026ff]/20 to-[#0f0814] px-4 py-3 shadow-2xl backdrop-blur-md cursor-pointer select-none"
            onClick={onDismiss}
        >
            <div className="shrink-0 w-9 h-9 rounded-full bg-[#b026ff]/20 border border-[#b026ff]/40 flex items-center justify-center text-[#b026ff]">
                {type === 'friend_request' ? <UserPlus size={17} /> : <Users size={17} />}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] font-black tracking-[0.15em] uppercase text-white/50">
                    {type === 'friend_request' ? 'Friend Request' : 'Now Friends!'}
                </span>
                <span className="text-sm font-bold text-white leading-tight truncate">
                    {type === 'friend_request'
                        ? <><span className="text-[#d685ff]">{from}</span> sent you a request</>
                        : <><span className="text-[#d685ff]">{from}</span> accepted your request</>
                    }
                </span>
            </div>
            <button
                className="absolute top-2 right-2 text-white/30 hover:text-white/70 transition-colors"
                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            >
                <X size={14} />
            </button>
        </motion.div>
    );
}

interface FriendToastItem { id: string; from: string; type: 'friend_request' | 'friend_accepted' }

export function NotificationProvider({ children, userId, token }: { children: React.ReactNode; userId?: string; token?: string }) {
    const [toasts, setToasts] = useState<ToastNotif[]>([]);
    const [friendToasts, setFriendToasts] = useState<FriendToastItem[]>([]);
    const [bellItems, setBellItems] = useState<BellNotif[]>([]);
    const [dms, setDms] = useState<Record<string, DmMessage[]>>({});
    const [dmUnread, setDmUnread] = useState<Record<string, number>>({});
    const [clanMessages, setClanMessages] = useState<DmMessage[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const userIdRef = useRef<string | undefined>(userId);

    const notify = useCallback((n: Omit<ToastNotif, 'id'>) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev.slice(-4), { ...n, id }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(n => n.id !== id));
    }, []);

    const dismissFriendToast = useCallback((id: string) => {
        setFriendToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const unreadCount = bellItems.filter(b => !b.read).length;

    const markAllRead = useCallback(() => {
        setBellItems(prev => prev.map(b => ({ ...b, read: true })));
    }, []);

    const dismissBell = useCallback((id: string) => {
        setBellItems(prev => prev.filter(b => b.id !== id));
    }, []);

    const clearAllBell = useCallback(() => {
        setBellItems([]);
    }, []);

    const sendDm = useCallback((toUserId: string, toUsername: string, message: string) => {
        const skt = socketRef.current;
        if (!skt || !message.trim()) return;
        skt.emit('dm:send', { toUserId, message: message.trim() });
        // Add to local dm thread as "mine"
        const mine: DmMessage = {
            fromId: userIdRef.current ?? '',
            from: 'me',
            avatar: '',
            message: message.trim(),
            timestamp: new Date().toISOString(),
            mine: true,
        };
        setDms(prev => ({ ...prev, [toUserId]: [...(prev[toUserId] ?? []), mine] }));
    }, []);

    const clearDmUnread = useCallback((uid: string) => {
        setDmUnread(prev => ({ ...prev, [uid]: 0 }));
    }, []);

    const sendClanMessage = useCallback((message: string) => {
        const skt = socketRef.current;
        if (!skt || !message.trim()) return;
        skt.emit('clan:message', { message: message.trim() });
    }, []);

    useEffect(() => { userIdRef.current = userId; }, [userId]);

    useEffect(() => {
        if (!userId || !token) return;

        const skt = createSocket(import.meta.env.VITE_API_URL, { transports: ['websocket'] });
        socketRef.current = skt;

        skt.on('connect', () => {
            skt.emit('lobby:authenticate', { token, userId, username: '', avatar: '' });
        });

        skt.on('notification:achievement', (data: { title: string; type: string; description: string }) => {
            notify({ type: 'achievement', title: data.title, description: data.description, rewardType: data.type });
        });

        skt.on('notification:mission_complete', (data: { title: string; xpReward: number; gemsReward: number }) => {
            notify({ type: 'mission', title: data.title, xpReward: data.xpReward, gemsReward: data.gemsReward });
        });

        skt.on('notification:friend_request', (data: { fromId: string; from: string }) => {
            const id = Math.random().toString(36).slice(2);
            setBellItems(prev => [{ id, type: 'friend_request', from: data.from, fromId: data.fromId, read: false, timestamp: Date.now() }, ...prev.slice(0, 49)]);
            setFriendToasts(prev => [...prev.slice(-3), { id: id + '_toast', from: data.from, type: 'friend_request' }]);
        });

        skt.on('notification:friend_accepted', (data: { fromId: string; from: string }) => {
            const id = Math.random().toString(36).slice(2);
            setBellItems(prev => [{ id, type: 'friend_accepted', from: data.from, fromId: data.fromId, read: false, timestamp: Date.now() }, ...prev.slice(0, 49)]);
            setFriendToasts(prev => [...prev.slice(-3), { id: id + '_toast', from: data.from, type: 'friend_accepted' }]);
        });

        skt.on('notification:friend_challenge', (data: { fromId: string; from: string; challengeId: string }) => {
            const id = Math.random().toString(36).slice(2);
            setBellItems(prev => [{ id, type: 'friend_challenge', from: data.from, fromId: data.fromId, challengeId: data.challengeId, read: false, timestamp: Date.now() }, ...prev.slice(0, 49)]);
            setFriendToasts(prev => [...prev.slice(-3), { id: id + '_toast', from: data.from, type: 'friend_challenge' as any }]);
        });

        skt.on('dm:receive', (data: { fromId: string; from: string; avatar: string; message: string; timestamp: string }) => {
            const msg: DmMessage = { ...data, mine: false };
            setDms(prev => ({ ...prev, [data.fromId]: [...(prev[data.fromId] ?? []), msg] }));
            setDmUnread(prev => ({ ...prev, [data.fromId]: (prev[data.fromId] ?? 0) + 1 }));
        });

        skt.on('clan:message', (data: { fromId: string; from: string; avatar: string; message: string; timestamp: string }) => {
            const msg: DmMessage = { ...data, mine: data.fromId === userId };
            setClanMessages(prev => [...prev.slice(-199), msg]);
        });

        return () => { skt.disconnect(); socketRef.current = null; };
    }, [userId, token, notify]);

    return (
        <NotificationContext.Provider value={{ notify, bellItems, unreadCount, markAllRead, dismissBell, clearAllBell, dms, dmUnread, sendDm, clearDmUnread, clanMessages, sendClanMessage }}>
            {children}
            {/* Achievement/mission toasts — bottom right */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map(n => (
                        <div key={n.id} className="pointer-events-auto">
                            <NotificationToast n={n} onDismiss={() => dismissToast(n.id)} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
            {/* Friend toasts — top right */}
            <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {friendToasts.map(t => (
                        <div key={t.id} className="pointer-events-auto">
                            <FriendToast from={t.from} type={t.type} onDismiss={() => dismissFriendToast(t.id)} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
}


