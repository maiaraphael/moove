import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, Gamepad2, Trophy, User, Layers, ShoppingBag, Medal, Users,
    Shield, Plus, LogOut, Crown, ChevronRight, Send, Hash, X, Loader2,
    TrendingUp, MessageSquare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TopHeader from '../components/ui/TopHeader';
import { useUser } from '../hooks/useUser';
import { useNotify } from '../components/ui/NotificationProvider';

const API = `${import.meta.env.VITE_API_URL}/api/clans`;

interface ClanSummary {
    id: string; name: string; tag: string; description?: string | null;
    totalMmr: number; memberCount: number; avgMmr: number;
}

interface ClanMemberData {
    id: string; role: 'LEADER' | 'OFFICER' | 'MEMBER'; joinedAt: string;
    user: { id: string; username: string; avatarUrl?: string | null; mmr: number; rank: string; level: number };
}

interface MyClan extends ClanSummary {
    members: ClanMemberData[];
    myRole: 'LEADER' | 'OFFICER' | 'MEMBER';
}

async function apiFetch(path: string, method = 'GET', body?: object) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}${path}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

const ROLE_BADGE = { LEADER: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30', OFFICER: 'bg-blue-400/10 text-blue-400 border-blue-400/30', MEMBER: 'bg-white/5 text-gray-400 border-white/10' };

export default function Clan() {
    const navigate = useNavigate();
    const { user, isLoading: isUserLoading } = useUser();
    const { clanMessages, sendClanMessage } = useNotify();

    const [tab, setTab] = useState<'leaderboard' | 'my_clan'>('leaderboard');
    const [clans, setClans] = useState<ClanSummary[]>([]);
    const [myClan, setMyClan] = useState<MyClan | null>(null);
    const [fetching, setFetching] = useState(true);
    const [clanTab, setClanTab] = useState<'members' | 'chat'>('members');

    // Create form
    const [showCreate, setShowCreate] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createTag, setCreateTag] = useState('');
    const [createDesc, setCreateDesc] = useState('');
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    // Chat
    const [chatInput, setChatInput] = useState('');
    const chatBottomRef = useRef<HTMLDivElement | null>(null);

    const load = useCallback(async () => {
        setFetching(true);
        try {
            const [list, mine] = await Promise.allSettled([
                apiFetch('/'),
                apiFetch('/mine'),
            ]);
            if (list.status === 'fulfilled') setClans(list.value);
            if (mine.status === 'fulfilled') {
                setMyClan(mine.value);
                if (mine.value) setTab('my_clan');
            }
        } catch {}
        setFetching(false);
    }, []);

    useEffect(() => { if (!isUserLoading) load(); }, [isUserLoading, load]);
    useEffect(() => { if (!isUserLoading && !user) navigate('/login'); }, [user, isUserLoading, navigate]);
    useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [clanMessages.length]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setCreateLoading(true); setCreateError('');
        try {
            await apiFetch('/', 'POST', { name: createName, tag: createTag, description: createDesc });
            setShowCreate(false);
            setCreateName(''); setCreateTag(''); setCreateDesc('');
            await load();
            setTab('my_clan');
        } catch (err: any) { setCreateError(err.message); }
        setCreateLoading(false);
    }

    async function handleJoin(clanId: string) {
        try { await apiFetch(`/${clanId}/join`, 'POST'); await load(); setTab('my_clan'); }
        catch (err: any) { alert(err.message || 'Could not join clan'); }
    }

    async function handleLeave() {
        if (!confirm('Leave your clan? If you\'re the leader, the next officer/member will be promoted.')) return;
        try { await apiFetch('/leave', 'DELETE'); setMyClan(null); setTab('leaderboard'); await load(); }
        catch (err: any) { alert(err.message); }
    }

    function sendChat(e: React.FormEvent) {
        e.preventDefault();
        if (!chatInput.trim()) return;
        sendClanMessage(chatInput.trim());
        setChatInput('');
    }

    if (isUserLoading) return null;

    return (
        <div className="min-h-screen bg-[#0f0814] text-white font-sans pb-28 relative overflow-hidden">
            <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#b026ff]/4 rounded-full blur-[120px] pointer-events-none" />

            <TopHeader user={user} />

            <main className="max-w-4xl mx-auto px-4 pt-8 pb-12 relative z-10 space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield size={28} className="text-[#b026ff]" />
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-wide text-white">Clan System</h1>
                            <p className="text-gray-500 text-xs uppercase tracking-wider">Unite. Conquer. Dominate.</p>
                        </div>
                    </div>
                    {!myClan && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#b026ff] hover:bg-[#9010e0] rounded-xl text-sm font-black transition-colors shadow-[0_0_15px_rgba(176,38,255,0.3)]"
                        >
                            <Plus size={15} /> Create Clan
                        </button>
                    )}
                </motion.div>

                {/* Tab Switch */}
                <div className="flex gap-1 bg-[#120a1f]/60 border border-white/10 rounded-xl p-1">
                    <button onClick={() => setTab('leaderboard')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${tab === 'leaderboard' ? 'bg-[#b026ff] text-white' : 'text-gray-400 hover:text-white'}`}>
                        <TrendingUp size={13} /> Ranking
                    </button>
                    <button onClick={() => setTab('my_clan')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${tab === 'my_clan' ? 'bg-[#b026ff] text-white' : 'text-gray-400 hover:text-white'}`}>
                        <Shield size={13} /> My Clan {!myClan && <span className="text-gray-600">(none)</span>}
                    </button>
                </div>

                {/* Create Clan Modal */}
                <AnimatePresence>
                    {showCreate && (
                        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                            className="bg-[#120a1f]/90 border border-[#b026ff]/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(176,38,255,0.15)]"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <p className="font-black text-white uppercase tracking-widest text-sm">Create New Clan</p>
                                <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
                            </div>
                            <form onSubmit={handleCreate} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Clan Name *</label>
                                        <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="e.g. Shadow Raiders" maxLength={32}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#b026ff]/50 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Tag (2–5 chars) *</label>
                                        <input value={createTag} onChange={e => setCreateTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))} placeholder="SHADE" maxLength={5}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-black tracking-widest focus:border-[#b026ff]/50 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Description</label>
                                    <input value={createDesc} onChange={e => setCreateDesc(e.target.value)} placeholder="Brief description of your clan..." maxLength={200}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#b026ff]/50 outline-none" />
                                </div>
                                {createError && <p className="text-xs text-red-400 font-bold">{createError}</p>}
                                <div className="flex justify-end gap-2 pt-1">
                                    <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={createLoading || !createName.trim() || createTag.length < 2}
                                        className="px-5 py-2 bg-[#b026ff] hover:bg-[#9010e0] disabled:opacity-50 text-white font-black text-xs rounded-xl transition-colors flex items-center gap-2">
                                        {createLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Create
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {fetching ? (
                    <div className="flex justify-center py-16"><Loader2 size={32} className="text-[#b026ff] animate-spin" /></div>
                ) : (
                    <AnimatePresence mode="wait">
                        {/* ── LEADERBOARD TAB ── */}
                        {tab === 'leaderboard' && (
                            <motion.div key="lb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                                {clans.length === 0 ? (
                                    <div className="text-center py-16 text-gray-600">
                                        <Shield size={40} className="mx-auto mb-3 opacity-20" />
                                        <p className="font-bold text-sm">No clans yet. Be the first to create one!</p>
                                    </div>
                                ) : clans.map((c, idx) => (
                                    <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                                        className="flex items-center gap-4 bg-[#120a1f]/70 border border-white/8 rounded-xl px-4 py-3 hover:border-[#b026ff]/20 transition-colors"
                                    >
                                        <span className={`text-lg font-black w-7 text-center ${idx < 3 ? ['text-yellow-400', 'text-gray-300', 'text-amber-600'][idx] : 'text-gray-600'}`}>
                                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                        </span>
                                        <div className="w-9 h-9 rounded-xl bg-[#b026ff]/10 border border-[#b026ff]/30 flex items-center justify-center">
                                            <span className="text-xs font-black text-[#b026ff]">{c.tag}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-white truncate">{c.name}</p>
                                            <p className="text-[10px] text-gray-500">{c.memberCount} members · avg {c.avgMmr.toLocaleString()} MMR</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-white">{c.totalMmr.toLocaleString()}</p>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-widest">Total MMR</p>
                                        </div>
                                        {!myClan && (
                                            <button onClick={() => handleJoin(c.id)}
                                                className="ml-2 px-3 py-1.5 bg-[#b026ff]/10 hover:bg-[#b026ff]/25 border border-[#b026ff]/30 text-[#b026ff] text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1">
                                                Join <ChevronRight size={11} />
                                            </button>
                                        )}
                                        {myClan?.id === c.id && (
                                            <span className="ml-2 px-2 py-1 bg-[#b026ff]/20 border border-[#b026ff]/40 text-[#d685ff] text-[9px] font-black uppercase tracking-widest rounded-lg">
                                                Mine
                                            </span>
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {/* ── MY CLAN TAB ── */}
                        {tab === 'my_clan' && (
                            <motion.div key="mc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {!myClan ? (
                                    <div className="text-center py-16 text-gray-600">
                                        <Shield size={40} className="mx-auto mb-4 opacity-20" />
                                        <p className="font-bold text-sm mb-3">You're not in a clan yet.</p>
                                        <button onClick={() => setShowCreate(true)}
                                            className="px-5 py-2.5 bg-[#b026ff] hover:bg-[#9010e0] text-white font-black text-xs rounded-xl transition-colors inline-flex items-center gap-2">
                                            <Plus size={13} /> Create New Clan
                                        </button>
                                        <p className="text-xs text-gray-600 mt-3">or <button className="text-[#b026ff] underline" onClick={() => setTab('leaderboard')}>join an existing clan</button></p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Clan Card */}
                                        <div className="bg-[#120a1f]/80 border border-[#b026ff]/20 rounded-2xl p-5 shadow-[0_0_20px_rgba(176,38,255,0.08)]">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-[#b026ff]/15 border border-[#b026ff]/40 flex items-center justify-center">
                                                        <span className="text-sm font-black text-[#b026ff]">{myClan.tag}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black text-white">{myClan.name}</p>
                                                        <p className="text-[10px] text-gray-500">{myClan.memberCount} members · {myClan.totalMmr.toLocaleString()} total MMR</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${ROLE_BADGE[myClan.myRole]}`}>
                                                        {myClan.myRole === 'LEADER' && <Crown size={10} className="inline mr-1" />}
                                                        {myClan.myRole}
                                                    </span>
                                                    <button onClick={handleLeave}
                                                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="Leave clan">
                                                        <LogOut size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                            {myClan.description && (
                                                <p className="text-xs text-gray-400 border-t border-white/5 pt-3">{myClan.description}</p>
                                            )}
                                        </div>

                                        {/* Sub-tab: Members / Chat */}
                                        <div className="flex gap-1 bg-[#120a1f]/60 border border-white/10 rounded-xl p-1">
                                            <button onClick={() => setClanTab('members')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${clanTab === 'members' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                                                <Users size={12} /> Members ({myClan.members.length})
                                            </button>
                                            <button onClick={() => setClanTab('chat')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${clanTab === 'chat' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                                                <MessageSquare size={12} /> Clan Chat
                                            </button>
                                        </div>

                                        {/* Members List */}
                                        {clanTab === 'members' && (
                                            <div className="space-y-2">
                                                {myClan.members.map((m, i) => {
                                                    const av = m.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user.username}`;
                                                    return (
                                                        <motion.div key={m.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                                                            className="flex items-center gap-3 bg-[#0f0814]/80 border border-white/8 rounded-xl px-4 py-3">
                                                            <img src={av} alt={m.user.username} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                                                                    {m.role === 'LEADER' && <Crown size={12} className="text-yellow-400 shrink-0" />}
                                                                    {m.user.username}
                                                                </p>
                                                                <p className="text-[10px] text-gray-500">Lv {m.user.level} · {m.user.rank} · {m.user.mmr.toLocaleString()} MMR</p>
                                                            </div>
                                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${ROLE_BADGE[m.role]}`}>{m.role}</span>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Clan Chat */}
                                        {clanTab === 'chat' && (
                                            <div className="bg-[#0f0814]/80 border border-white/8 rounded-2xl overflow-hidden">
                                                {/* Messages area */}
                                                <div className="h-72 overflow-y-auto px-4 py-3 space-y-2 flex flex-col">
                                                    {clanMessages.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                                                            <Hash size={28} className="opacity-30" />
                                                            <p className="text-xs font-bold uppercase tracking-widest text-center">No messages yet.<br />Start the conversation!</p>
                                                        </div>
                                                    ) : (
                                                        clanMessages.map((msg, i) => {
                                                            const av = `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.from}`;
                                                            return (
                                                                <div key={i} className={`flex gap-2 items-start ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                                                                    {!msg.mine && <img src={av} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />}
                                                                    <div className="max-w-[78%]">
                                                                        {!msg.mine && <p className="text-[9px] font-black text-[#b026ff] mb-0.5 uppercase tracking-wider">{msg.from}</p>}
                                                                        <div className={`px-3 py-1.5 rounded-xl text-sm leading-snug break-words ${msg.mine ? 'bg-[#b026ff] text-white rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                                                                            {msg.message}
                                                                        </div>
                                                                        <p className="text-[9px] text-gray-600 mt-0.5 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                    <div ref={chatBottomRef} />
                                                </div>
                                                {/* Input */}
                                                <form onSubmit={sendChat} className="flex gap-2 px-3 py-3 border-t border-white/8 bg-[#0a0510]/40">
                                                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Message your clan..." maxLength={300}
                                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#b026ff]/40 transition-colors" />
                                                    <button type="submit" disabled={!chatInput.trim()} className="w-9 h-9 flex items-center justify-center bg-[#b026ff] hover:bg-[#9010e0] disabled:opacity-40 rounded-xl text-white transition-colors shrink-0">
                                                        <Send size={14} />
                                                    </button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </main>

            {/* Bottom Nav */}
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
                        const isActive = item.id === 'clan';
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
