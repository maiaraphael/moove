import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Check, X, Trash2, Search, Loader2, UserMinus, Home, Gamepad2, Trophy, User, Layers, ShoppingBag, Medal, Swords, MessageCircle } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import TopHeader from '../components/ui/TopHeader';
import { useUser } from '../hooks/useUser';
import PlayerProfileModal from '../components/ui/PlayerProfileModal';
import ChatModal from '../components/ui/ChatModal';
import { useNotify } from '../components/ui/NotificationProvider';

const API = 'http://localhost:3000/api/friends';

interface FriendUser {
    id: string;
    username: string;
    avatarUrl?: string | null;
    level: number;
    rank: string;
    mmr?: number;
    friendshipId?: string;
}

async function apiFetch(path: string, method = 'GET', body?: object) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}${path}`, {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
    }
    return res.json();
}

export default function Friends() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isLoading: isUserLoading } = useUser();
    const { dmUnread } = useNotify();
    const [profileUsername, setProfileUsername] = useState<string | null>(null);
    const [chatFriend, setChatFriend] = useState<FriendUser | null>(null);

    const [friends, setFriends] = useState<FriendUser[]>([]);
    const [incoming, setIncoming] = useState<FriendUser[]>([]);
    const [outgoing, setOutgoing] = useState<FriendUser[]>([]);
    const [addUsername, setAddUsername] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');
    const [addSuccess, setAddSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'friends' | 'requests'>('friends');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [f, inc, out] = await Promise.all([
                apiFetch('/'),
                apiFetch('/requests/incoming'),
                apiFetch('/requests/outgoing'),
            ]);
            setFriends(f);
            setIncoming(inc);
            setOutgoing(out);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!isUserLoading && !user) navigate('/login');
    }, [user, isUserLoading, navigate]);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!addUsername.trim()) return;
        setAddLoading(true);
        setAddError('');
        setAddSuccess('');
        try {
            await apiFetch('/request', 'POST', { username: addUsername.trim() });
            setAddSuccess(`Request sent to ${addUsername.trim()}!`);
            setAddUsername('');
            await load();
        } catch (err: any) {
            setAddError(err.message);
        }
        setAddLoading(false);
    }

    async function handleAccept(friendshipId: string) {
        try { await apiFetch(`/accept/${friendshipId}`, 'POST'); await load(); } catch {}
    }

    async function handleDecline(friendshipId: string) {
        try { await apiFetch(`/decline/${friendshipId}`, 'POST'); await load(); } catch {}
    }

    async function handleRemove(userId: string) {
        try { await apiFetch(`/${userId}`, 'DELETE'); await load(); } catch {}
    }

    async function handleChallenge(userId: string) {
        try {
            await apiFetch(`/challenge/${userId}`, 'POST');
        } catch (err: any) {
            alert(err.message || 'Could not send challenge');
        }
    }

    if (isUserLoading) return null;

    const totalPending = incoming.length;

    return (
        <div className="min-h-screen bg-[#0f0814] text-white font-sans pb-28">
            <TopHeader user={user} />
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

                {/* Title */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                    <Users size={28} className="text-[#b026ff]" />
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-wide text-white">Friends</h1>
                        <p className="text-gray-500 text-xs uppercase tracking-wider">Your network of pilots</p>
                    </div>
                </motion.div>

                {/* Add Friend */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-[#120a1f]/80 border border-white/10 rounded-xl p-5"
                >
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <UserPlus size={14} className="text-[#b026ff]" /> Add Friend by Username
                    </p>
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                value={addUsername}
                                onChange={e => setAddUsername(e.target.value)}
                                placeholder="Enter username..."
                                className="w-full bg-[#0a0510]/80 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#b026ff]/50 focus:ring-1 focus:ring-[#b026ff]/30 transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={addLoading || !addUsername.trim()}
                            className="px-4 py-2 bg-[#b026ff] hover:bg-[#9010e0] disabled:opacity-50 rounded-lg text-sm font-bold text-white transition-colors flex items-center gap-2"
                        >
                            {addLoading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                            Send
                        </button>
                    </form>
                    <AnimatePresence>
                        {addError && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="mt-2 text-xs text-red-400 font-semibold">{addError}</motion.p>
                        )}
                        {addSuccess && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="mt-2 text-xs text-green-400 font-semibold">{addSuccess}</motion.p>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Tab Switch */}
                <div className="flex gap-1 bg-[#120a1f]/60 border border-white/10 rounded-xl p-1">
                    {(['friends', 'requests'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all
                                ${tab === t ? 'bg-[#b026ff] text-white shadow-[0_0_12px_rgba(176,38,255,0.4)]' : 'text-gray-400 hover:text-white'}`}
                        >
                            {t === 'friends' ? `Friends (${friends.length})` : `Requests${totalPending > 0 ? ` (${totalPending})` : ''}`}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={28} className="text-[#b026ff] animate-spin" />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {tab === 'friends' ? (
                            <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {friends.length === 0 ? (
                                    <div className="text-center py-12 text-gray-600 text-sm font-semibold">
                                        No friends yet. Send a request above!
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {friends.map(f => (
                                            <FriendCard key={f.id} user={f}
                                                onViewProfile={() => setProfileUsername(f.username)}
                                                actions={
                                                <div className="flex gap-2">
                                                    <button onClick={() => setChatFriend(chatFriend?.id === f.id ? null : f)}
                                                        className="relative p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                                                        title="Open chat"
                                                    >
                                                        <MessageCircle size={15} />
                                                        {(dmUnread[f.id] ?? 0) > 0 && (
                                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black flex items-center justify-center text-white">
                                                                {dmUnread[f.id] > 9 ? '9+' : dmUnread[f.id]}
                                                            </span>
                                                        )}
                                                    </button>
                                                    <button onClick={() => handleChallenge(f.id)}
                                                        className="p-2 rounded-lg bg-[#b026ff]/10 hover:bg-[#b026ff]/25 hover:text-[#d685ff] text-[#b026ff] transition-colors"
                                                        title="Challenge to a match"
                                                    >
                                                        <Swords size={15} />
                                                    </button>
                                                    <button onClick={() => handleRemove(f.id)}
                                                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-500 transition-colors"
                                                        title="Remove friend"
                                                    >
                                                        <UserMinus size={15} />
                                                    </button>
                                                </div>
                                            } />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                {/* Incoming */}
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Incoming ({incoming.length})</p>
                                    {incoming.length === 0 ? (
                                        <p className="text-xs text-gray-600 text-center py-4">No incoming requests.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {incoming.map(f => (
                                                <FriendCard key={f.id} user={f} actions={
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleAccept(f.friendshipId!)}
                                                            className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors" title="Accept">
                                                            <Check size={15} />
                                                        </button>
                                                        <button onClick={() => handleDecline(f.friendshipId!)}
                                                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="Decline">
                                                            <X size={15} />
                                                        </button>
                                                    </div>
                                                } />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Outgoing */}
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Sent ({outgoing.length})</p>
                                    {outgoing.length === 0 ? (
                                        <p className="text-xs text-gray-600 text-center py-4">No pending requests sent.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {outgoing.map(f => (
                                                <FriendCard key={f.id} user={f} actions={
                                                    <button onClick={() => handleRemove(f.id)}
                                                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-500 transition-colors"
                                                        title="Cancel request"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                } />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

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
                        const isActive = location.pathname === item.link;
                        return (
                            <Link
                                to={item.link}
                                key={item.id}
                                className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                    isActive
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

        <PlayerProfileModal username={profileUsername} onClose={() => setProfileUsername(null)} />
        <AnimatePresence>
            {chatFriend && (
                <ChatModal
                    key={chatFriend.id}
                    friendId={chatFriend.id}
                    friendUsername={chatFriend.username}
                    friendAvatar={chatFriend.avatarUrl ?? ''}
                    onClose={() => setChatFriend(null)}
                />
            )}
        </AnimatePresence>
        </div>
    );
}

function FriendCard({ user: f, actions, onViewProfile }: { user: FriendUser; actions: React.ReactNode; onViewProfile?: () => void }) {
    const avatar = f.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`;
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-[#120a1f]/70 border border-white/8 rounded-xl px-4 py-3 hover:border-[#b026ff]/20 transition-colors"
        >
            <img
                src={avatar}
                alt={f.username}
                className="w-10 h-10 rounded-full bg-[#1e1030] object-cover border border-white/10 cursor-pointer hover:ring-2 hover:ring-[#b026ff]/50 transition-all"
                onClick={onViewProfile}
            />
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onViewProfile}>
                <p className="font-bold text-sm text-white truncate hover:text-[#d685ff] transition-colors">{f.username}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">LVL {f.level} · {f.rank}</p>
            </div>
            {actions}
        </motion.div>
    );
}
