import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Gamepad2, Trophy, User, Layers, ShoppingBag, Users, User as UserIcon, Swords, Globe, Bot, ChevronLeft, Search, Plus, Medal, Lock, Crown, UserX, Play as PlayIcon, Clock, Shield, X, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { io as createSocket, Socket } from 'socket.io-client';
import TopHeader from '../components/ui/TopHeader';
import FramedAvatar from '../components/ui/FramedAvatar';
import PetViewer from '../components/ui/PetViewer';
import { parseFrameConfig } from '../utils/frameUtils';
import type { PetConfig } from '../components/ui/PetViewer';
import { useUser } from '../hooks/useUser';
import { useTranslation } from 'react-i18next';

type GameMode = 'ranked' | 'casual' | 'ai' | null;
type PlayerCount = 2 | 4 | null;

interface LobbyEntry { id: string; name: string; host: string; players: number; maxPlayers: number; turnTime: number; isPrivate: boolean; status: string; }
interface RoomState { id: string; name: string; hostSocketId: string; turnTime: number; maxPlayers: number; isPrivate: boolean; status: string; players: { socketId: string; userId: string; username: string; avatar: string; slot: string }[]; }

export default function Play() {
    const { user, isLoading } = useUser();
    const { t } = useTranslation();
    const [selectedMode, setSelectedMode] = useState<GameMode>(null);
    const [playerCount, setPlayerCount] = useState<PlayerCount>(null);
    const navigate = useNavigate();

    // ── Socket & Lobby State ──
    const socketRef = useRef<Socket | null>(null);
    const [lobbies, setLobbies] = useState<LobbyEntry[]>([]);
    const [currentRoom, setCurrentRoom] = useState<RoomState | null>(null);
    const [lobbyError, setLobbyError] = useState<string | null>(null);
    const [lobbySearch, setLobbySearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', maxPlayers: 2 as 2 | 4, turnTime: 45 as 30 | 45 | 60, isPrivate: false, password: '' });
    const [joinPasswordModal, setJoinPasswordModal] = useState<string | null>(null);
    const [joinPassword, setJoinPassword] = useState('');

    // ── Ranked Matchmaking State ──
    const [rankedSearching, setRankedSearching] = useState(false);
    const [matchFound, setMatchFound] = useState<any>(null);
    const [matchCountdown, setMatchCountdown] = useState(5);
    const matchCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Connect socket when user loads
    useEffect(() => {
        if (!user) return;
        const skt = createSocket(import.meta.env.VITE_API_URL, { transports: ['websocket'], reconnection: true });
        socketRef.current = skt;
        skt.on('connect', () => {
            skt.emit('lobby:authenticate', {
                token: localStorage.getItem('token') || '',
                userId: user.id,
                username: user.name,
                avatar: user.avatar,
            });
        });
        skt.on('lobby:authenticated', () => skt.emit('lobby:list'));
        skt.on('lobby:rooms', (rooms: LobbyEntry[]) => setLobbies(rooms));
        skt.on('lobby:room_joined', (room: RoomState) => { setCurrentRoom(room); setShowCreateModal(false); });
        skt.on('lobby:room_updated', (room: RoomState) => setCurrentRoom(room));
        skt.on('lobby:left', () => setCurrentRoom(null));
        skt.on('lobby:kicked', (data: { message: string }) => { setCurrentRoom(null); setLobbyError(data.message); });
        skt.on('lobby:error', (data: { message: string }) => { setLobbyError(data.message); setTimeout(() => setLobbyError(null), 4000); });
        skt.on('game:start', (data: any) => {
            navigate(`/game?players=${data.players.length}&roomId=${data.roomId}&type=casual&slot=${data.slot}&turnTime=${data.turnTime}`);
        });
        skt.on('ranked:queued', () => setRankedSearching(true));
        skt.on('ranked:cancelled', () => setRankedSearching(false));
        skt.on('ranked:match_found', (data: any) => {
            setRankedSearching(false);
            setMatchFound(data);
            setMatchCountdown(5);
            let count = 5;
            if (matchCountdownRef.current) clearInterval(matchCountdownRef.current);
            matchCountdownRef.current = setInterval(() => {
                count--;
                setMatchCountdown(count);
                if (count <= 0) {
                    clearInterval(matchCountdownRef.current!);
                    matchCountdownRef.current = null;
                    navigate(`/game?players=${data.players.length}&roomId=${data.roomId}&type=ranked&slot=${data.slot}&turnTime=${data.turnTime}`);
                }
            }, 1000);
        });
        return () => { skt.disconnect(); if (matchCountdownRef.current) clearInterval(matchCountdownRef.current); };
    }, [user]);

    const handleCreateRoom = () => {
        const skt = socketRef.current;
        if (!skt) return;
        skt.emit('lobby:create', { name: createForm.name, maxPlayers: createForm.maxPlayers, turnTime: createForm.turnTime, isPrivate: createForm.isPrivate, password: createForm.password });
    };

    const handleJoinRoom = (roomId: string, isPrivate: boolean) => {
        const skt = socketRef.current;
        if (!skt) return;
        if (isPrivate) { setJoinPasswordModal(roomId); return; }
        skt.emit('lobby:join', { roomId });
    };

    const handleJoinWithPassword = () => {
        const skt = socketRef.current;
        if (!skt || !joinPasswordModal) return;
        skt.emit('lobby:join', { roomId: joinPasswordModal, password: joinPassword });
        setJoinPasswordModal(null);
        setJoinPassword('');
    };

    const handleLeaveRoom = () => socketRef.current?.emit('lobby:leave');
    const handleKick = (targetSocketId: string) => socketRef.current?.emit('lobby:kick', { targetSocketId });
    const handleStartGame = () => socketRef.current?.emit('lobby:start');

    const handleFindRankedMatch = () => {
        const skt = socketRef.current;
        if (!skt || !user || !playerCount) return;
        skt.emit('ranked:queue', {
            playerCount,
            rank: user.rank || 'IRON',
            mmr: user.mmr ?? 0,
            level: user.level ?? 1,
            rankConfig: user.rankConfig ?? null,
        });
    };

    const handleCancelRanked = () => {
        socketRef.current?.emit('ranked:cancel');
        setRankedSearching(false);
        if (matchCountdownRef.current) clearInterval(matchCountdownRef.current);
        setMatchFound(null);
    };

    const handleStartAiGame = () => {
        if (!playerCount) return;
        navigate(`/game?players=${playerCount}&type=ai`);
    };

    const mySocketId = socketRef.current?.id;

    if (isLoading || !user) {
        return (
            <div className="min-h-screen bg-[#0f0814] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-[#b026ff]/20 border-t-[#b026ff] rounded-full animate-spin"></div>
            </div>
        );
    }

    const modes = [
        {
            id: 'ranked' as const,
            title: t('dashboard.ranked'),
            subtitle: t('dashboard.rankedSub'),
            icon: Trophy,
            color: '#ef4444',
            description: t('play.rankedDesc'),
            bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2wSi-PcPJKU4p1xZ8dN475FDznpKYyJEAH9HdMQFcGQnu0Lomn3zhCDyLts1IR3xN0Tac3TLhuWjDEQPB2ovCgjaFM7oGuWJolBctnOjD0uXIaMFhI00jo6e7jbtJQxQGWOAmeYuOTDrjdHNVwRaC2HcIv7m6LllOPSO-6tSRTMXal7GKo9TrQ0Pi3rcTU_GTSkzJEBm5YGQs1_na13VE5lA6Ay9J6Y1KKcrUNv5ZYBpk5F6hxgKCeoaD_gAER4fXkK2aod7V8g'
        },
        {
            id: 'casual' as const,
            title: t('play.casualLobby'),
            subtitle: t('dashboard.casualSub'),
            icon: Globe,
            color: '#3b82f6',
            description: t('play.casualLobbyDesc'),
            bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeQ4moVmnmZ1Dxj7G2UPNtPdBNimArNEv1pm07VeQs-GuEzc-sV6j_OjHoLMdBrmId-ILAWoyIPX2y7LLyawwD7xMolGpPqScndQV3uefWHcD3KjOGl-6RzUrE1soCj-N3-GWpM8uhor4bj-5_cL25jfVyjv0KPGFCaBt3DeXTFY4b9MGVIyhn4nzhX18ihR2FEJZs2Z0f7OTBcMdTGLuEwoqe9056eItGlZ_TeB5W6pKUWtzZrDBjn9O7BqMBeTvUGZ1L_HC_fw'
        },
        {
            id: 'ai' as const,
            title: t('dashboard.vsAI'),
            subtitle: t('dashboard.vsAISub'),
            icon: Bot,
            color: '#10b981',
            description: t('play.vsAiDesc2'),
            bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDv2jMzVGBdsK02qVloqAo_eY30uARJsZPXLkkum4ZBfcCtv0KYzlE42juLsyLsbI_apV2_5SQBN6REm2Xiy-pZ-uYVbOl3eb6MWO5p7jvGf6coB5SLlF_XyeMHQec5WngdsHpmiKmpxvzMj9PjY47Tgs7WaN_QXiFv-WQQ1Zc2ZnlY64wh39mF13sUc_m0v6Vc0PhGM1q8OWUiqUgZfc9B8HptWYSjzb_Nn-Wj9vN-fvLK7UN_y3mxQoOYa_WK4ExsvOPjDQ1C7A'
        }
    ];

    const filteredLobbies = lobbies.filter(l => l.name.toLowerCase().includes(lobbySearch.toLowerCase()) || l.host.toLowerCase().includes(lobbySearch.toLowerCase()));

    return (
        <div className="min-h-screen bg-[#0f0814] text-white font-sans selection:bg-[#b026ff] pb-24 relative overflow-hidden">

            {/* Ambient Gradients based on selected mode */}
            <div className={`fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] pointer-events-none transition-colors duration-1000 ${selectedMode === 'ranked' ? 'bg-red-600/10' :
                selectedMode === 'casual' ? 'bg-blue-600/10' :
                    selectedMode === 'ai' ? 'bg-green-600/10' :
                        'bg-[#b026ff]/5'
                }`} />

            {/* --- TOP HEADER --- */}
            <TopHeader user={user} />

            {/* --- MAIN CONTENT --- */}
            <main className="max-w-6xl mx-auto px-6 pt-8 pb-12 relative z-10">

                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase drop-shadow-md">
                            SELECT <span className="text-[#b026ff]">PROTOCOL</span>
                        </h1>
                        <p className="text-sm text-gray-400 font-medium mt-1">{t('play.initializeBattle')}</p>
                    </div>

                    {/* Back button if a mode is selected */}
                    <AnimatePresence>
                        {selectedMode && (
                            <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onClick={() => { setSelectedMode(null); setPlayerCount(null); }}
                                className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-gray-400 hover:text-white transition-colors border border-white/10 bg-white/5 px-4 py-2 rounded-lg"
                            >
                                <ChevronLeft size={16} /> {t('play.changeProtocol')}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* DYNAMIC VIEW LAYER */}
                <div className="relative min-h-[500px]">

                    {/* LAYER 1: Select Mode */}
                    <AnimatePresence mode="wait">
                        {!selectedMode && (
                            <motion.div
                                key="mode-selection"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                            >
                                {modes.map((mode) => {
                                    const Icon = mode.icon;
                                    return (
                                        <div
                                            key={mode.id}
                                            onClick={() => setSelectedMode(mode.id)}
                                            className="group relative h-[450px] rounded-2xl overflow-hidden cursor-pointer border border-white/10 transition-all duration-500 hover:border-white/30"
                                            style={{ boxShadow: `0 0 40px inset ${mode.color}15` }}
                                        >
                                            <div className="absolute inset-0">
                                                <img src={mode.bgImage} className="w-full h-full object-cover opacity-30 group-hover:opacity-60 transition-opacity duration-700 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0814] via-[#0f0814]/80 to-transparent" />
                                                <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500" style={{ backgroundImage: `linear-gradient(to bottom, ${mode.color}20, transparent)` }} />
                                            </div>

                                            <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-black/40 backdrop-blur-md border border-white/10 shadow-xl group-hover:scale-110 transition-transform duration-500" style={{ boxShadow: `0 0 20px ${mode.color}40` }}>
                                                    <Icon size={32} style={{ color: mode.color }} />
                                                </div>
                                                <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase mb-2" style={{ color: mode.color }}>{mode.subtitle}</h4>
                                                <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-3 text-white drop-shadow-lg">{mode.title}</h2>
                                                <p className="text-sm text-gray-400 font-medium leading-relaxed">{mode.description}</p>

                                                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                                                    <span className="text-xs font-bold tracking-widest text-white uppercase flex items-center gap-2">
                                                        {t('play.initiate')} <Swords size={14} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}

                        {/* LAYER 2: Configure Selected Mode (Player Count + Lobbies) */}
                        {selectedMode && (
                            <motion.div
                                key="mode-configuration"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ duration: 0.4 }}
                                className="w-full"
                            >
                                {(() => {
                                    const activeConf = modes.find(m => m.id === selectedMode);
                                    if (!activeConf) return null;

                                    return (
                                        <div className="flex flex-col lg:flex-row gap-8">

                                            {/* Left Panel: Mode Info & Setup */}
                                            <div className="w-full lg:w-1/3 flex flex-col gap-6">

                                                {/* Active Mode Card Thumbnail */}
                                                <div className="relative h-48 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
                                                    <img src={activeConf.bgImage} className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm" />
                                                    <div className="absolute inset-0 bg-[#0f0814]/60 mix-blend-multiply" />
                                                    <div className="relative z-10 flex flex-col items-center text-center p-6">
                                                        <activeConf.icon size={40} style={{ color: activeConf.color }} className="mb-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                                                        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white shadow-black drop-shadow-lg">{activeConf.title}</h2>
                                                    </div>
                                                </div>

                                                {/* Player Setup Section */}
                                                <div className="bg-[#120a1f]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl">
                                                    <h3 className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-4">{t('play.participantMatrix')}</h3>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button
                                                            onClick={() => setPlayerCount(2)}
                                                            className={`relative overflow-hidden flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-300 ${playerCount === 2
                                                                ? `bg-${activeConf.color}/10 border-[${activeConf.color}] shadow-[0_0_20px_${activeConf.color}30]`
                                                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                                }`}
                                                            style={playerCount === 2 ? { borderColor: activeConf.color, backgroundColor: `${activeConf.color}15` } : {}}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                <UserIcon size={24} className={playerCount === 2 ? "text-white" : "text-gray-400"} />
                                                                <span className="text-gray-500 font-black italic text-xl mx-1">VS</span>
                                                                <UserIcon size={24} className={playerCount === 2 ? "text-white" : "text-gray-400"} />
                                                            </div>
                                                            <span className={`text-xs font-black tracking-widest uppercase ${playerCount === 2 ? 'text-white' : 'text-gray-500'}`}>1 vs 1</span>
                                                        </button>

                                                        <button
                                                            onClick={() => setPlayerCount(4)}
                                                            className={`relative overflow-hidden flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-300 ${playerCount === 4
                                                                ? `bg-${activeConf.color}/10 border-[${activeConf.color}] shadow-[0_0_20px_${activeConf.color}30]`
                                                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                                }`}
                                                            style={playerCount === 4 ? { borderColor: activeConf.color, backgroundColor: `${activeConf.color}15` } : {}}
                                                        >
                                                            <Users size={28} className={playerCount === 4 ? "text-white" : "text-gray-400"} />
                                                            <span className={`text-xs font-black tracking-widest uppercase ${playerCount === 4 ? 'text-white' : 'text-gray-500'}`}>4 Players</span>
                                                        </button>
                                                    </div>

                                                    {/* Primary CTA */}
                                                    {selectedMode === 'casual' ? (
                                                        <button
                                                            onClick={() => setShowCreateModal(true)}
                                                            className="w-full mt-6 py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold tracking-[0.15em] uppercase transition-all duration-300 bg-[#120a1f] border border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10"
                                                        >
                                                            <Plus size={18} /> {t('play.createRoom')}
                                                        </button>
                                                    ) : selectedMode === 'ai' ? (
                                                        <button
                                                            disabled={!playerCount}
                                                            onClick={handleStartAiGame}
                                                            className={`w-full mt-6 py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold tracking-[0.15em] uppercase transition-all duration-300 ${playerCount ? 'bg-[#10b981] text-white hover:bg-[#059669] shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}`}
                                                        >
                                                            <Bot size={18} /> {t('play.playVsAi')}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled={!playerCount}
                                                            onClick={handleFindRankedMatch}
                                                            className={`w-full mt-6 py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold tracking-[0.15em] uppercase transition-all duration-300 ${playerCount ? 'bg-[#ef4444] text-white hover:bg-[#dc2626] shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}`}
                                                        >
                                                            <Swords size={18} /> {t('play.findRankedMatch')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Panel: Contextual Content */}
                                            <div className="w-full lg:w-2/3 bg-[#120a1f]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col">

                                                {selectedMode === 'casual' ? (
                                                    // CASUAL: room lobby or lobby list
                                                    <div className="flex-1 flex flex-col">
                                                        {currentRoom ? (
                                                            /* ── ROOM LOBBY VIEW ── */
                                                            <div className="flex flex-col h-full gap-5">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <h3 className="text-white font-black text-lg uppercase tracking-tight">{currentRoom.name}</h3>
                                                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-3">
                                                                            <span className="flex items-center gap-1"><Clock size={11} />{currentRoom.turnTime}s/turn</span>
                                                                            <span className="flex items-center gap-1"><Users size={11} />{currentRoom.players.length}/{currentRoom.maxPlayers} players</span>
                                                                            {currentRoom.isPrivate && <span className="flex items-center gap-1 text-yellow-500/70"><Lock size={11} />Private</span>}
                                                                        </p>
                                                                    </div>
                                                                    <button onClick={handleLeaveRoom} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-red-400 border border-red-500/30 bg-red-500/5 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors">
                                                                        <X size={14} /> {mySocketId === currentRoom.hostSocketId ? 'Dissolve' : 'Leave'}
                                                                    </button>
                                                                </div>
                                                                {lobbyError && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg font-bold">{lobbyError}</div>}
                                                                <div className="flex flex-col gap-2 flex-1">
                                                                    {Array.from({ length: currentRoom.maxPlayers }).map((_, idx) => {
                                                                        const player = currentRoom.players[idx];
                                                                        const isHost = player?.socketId === currentRoom.hostSocketId;
                                                                        const isMe = player?.socketId === mySocketId;
                                                                        return (
                                                                            <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${player ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-dashed border-white/10'}`}>
                                                                                {player ? (
                                                                                    <>
                                                                                        <img src={player.avatar} alt={player.username} className="w-10 h-10 rounded-full object-cover border-2 border-white/10" />
                                                                                        <div className="flex-1">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <span className="font-black text-white text-sm">{player.username}</span>
                                                                                                {isHost && <span className="flex items-center gap-1 text-[9px] font-black text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-1.5 py-0.5 rounded-full uppercase tracking-widest"><Crown size={10} /> Host</span>}
                                                                                                {isMe && <span className="text-[9px] font-black text-[#3b82f6] bg-[#3b82f6]/10 border border-[#3b82f6]/30 px-1.5 py-0.5 rounded-full uppercase tracking-widest">You</span>}
                                                                                            </div>
                                                                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Slot {player.slot.toUpperCase()}</span>
                                                                                        </div>
                                                                                        {mySocketId === currentRoom.hostSocketId && !isMe && (
                                                                                            <button onClick={() => handleKick(player.socketId)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors" title="Kick player">
                                                                                                <UserX size={16} />
                                                                                            </button>
                                                                                        )}
                                                                                    </>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-3 flex-1 opacity-30">
                                                                                        <div className="w-10 h-10 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center"><UserIcon size={16} className="text-gray-600" /></div>
                                                                                        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">{t('play.waitingForPlayer')}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {mySocketId === currentRoom.hostSocketId ? (
                                                                    <button onClick={handleStartGame} disabled={currentRoom.players.length < 2} className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.15em] text-sm flex items-center justify-center gap-2 transition-all ${currentRoom.players.length >= 2 ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb] shadow-[0_0_25px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}`}>
                                                                        <PlayIcon size={18} />{currentRoom.players.length < 2 ? `${t('play.waitingForPlayer')} (${currentRoom.players.length}/${currentRoom.maxPlayers})` : t('play.startGame')}
                                                                    </button>
                                                                ) : (
                                                                    <div className="w-full py-4 rounded-xl font-black uppercase tracking-[0.15em] text-sm flex items-center justify-center gap-2 bg-white/5 text-gray-500 border border-white/5">
                                                                        <Clock size={16} /> {t('play.waitingForHost')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            /* ── LOBBY LIST VIEW ── */
                                                            <>
                                                                <div className="flex items-center justify-between mb-6">
                                                                    <h3 className="text-xs font-bold text-white tracking-[0.2em] uppercase flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span> {t('play.openLobbies')}
                                                                    </h3>
                                                                    <div className="flex items-center gap-2 bg-[#0f0814] border border-white/10 rounded-lg px-3 py-1.5 focus-within:border-[#3b82f6]/50 transition-colors">
                                                                        <Search size={14} className="text-gray-500" />
                                                                        <input type="text" placeholder={t('play.searchLobby')} value={lobbySearch} onChange={e => setLobbySearch(e.target.value)} className="bg-transparent border-none outline-none text-xs text-white w-32 placeholder-gray-600" />
                                                                    </div>
                                                                </div>
                                                                {lobbyError && <div className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg font-bold">{lobbyError}</div>}
                                                                <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                                                    {filteredLobbies.length === 0 ? (
                                                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                                                            <Globe size={40} className="text-gray-700 mb-4" />
                                                                            <p className="text-gray-500 font-bold text-sm">{t('play.noLobbies')}</p>
                                                                            <p className="text-gray-600 text-xs mt-1">{t('play.beFirstCreate')}</p>
                                                                        </div>
                                                                    ) : filteredLobbies.map(lobby => (
                                                                        <div key={lobby.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group">
                                                                            <div className="flex flex-col gap-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <h4 className="font-bold text-white text-sm">{lobby.name}</h4>
                                                                                    {lobby.isPrivate && <Lock size={12} className="text-yellow-400" />}
                                                                                </div>
                                                                                <p className="text-[10px] text-gray-400 tracking-wider uppercase font-medium">Host: <span className="text-gray-300">{lobby.host}</span></p>
                                                                                <p className="text-[10px] text-gray-600 font-bold flex items-center gap-1"><Clock size={10} />{lobby.turnTime}s per turn</p>
                                                                            </div>
                                                                            <div className="flex items-center gap-6">
                                                                                <div className="flex flex-col items-end gap-1 text-right">
                                                                                    <span className={`text-xs font-black tracking-widest uppercase ${lobby.players >= lobby.maxPlayers ? 'text-red-400' : 'text-green-400'}`}>{lobby.players}/{lobby.maxPlayers} Players</span>
                                                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{lobby.isPrivate ? '🔒 Private' : '🌐 Public'}</span>
                                                                                </div>
                                                                                <button disabled={lobby.players >= lobby.maxPlayers} onClick={() => handleJoinRoom(lobby.id, lobby.isPrivate)} className={`px-5 py-2.5 rounded-lg text-xs font-black border tracking-widest uppercase transition-all ${lobby.players >= lobby.maxPlayers ? 'bg-white/5 text-gray-600 border-white/10 cursor-not-allowed' : 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30 hover:bg-[#3b82f6] hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]'}`}>
                                                                                    {lobby.players >= lobby.maxPlayers ? 'FULL' : 'JOIN'}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : selectedMode === 'ranked' ? (
                                                    // RANKED: searching state or info
                                                    <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
                                                        {rankedSearching ? (
                                                            <>
                                                                <div className="relative w-24 h-24 mb-6">
                                                                    <div className="absolute inset-0 rounded-full border-4 border-red-500/20 animate-ping" />
                                                                    <div className="absolute inset-0 rounded-full border-4 border-red-500/40" />
                                                                    <div className="w-full h-full rounded-full bg-red-500/10 flex items-center justify-center">
                                                                        <Loader2 size={36} className="text-red-400 animate-spin" />
                                                                    </div>
                                                                </div>
                                                                <h3 className="text-xl font-black italic tracking-tighter uppercase text-white mb-2">{t('play.searchingOpponent')}</h3>
                                                                <p className="text-gray-400 text-sm mb-1">Looking for {playerCount === 2 ? '1v1' : '4-player'} ranked match</p>
                                                                <p className="text-xs text-gray-600 mb-8">Matching with players 1 rank above or below yours</p>
                                                                {user.rankConfig?.iconUrl && (
                                                                    <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                                                                        <img src={user.rankConfig.iconUrl} className="w-6 h-6 object-contain" style={{ transform: `scale(${user.rankConfig.iconScale ?? 1})` }} />
                                                                        <span className="font-black text-sm" style={{ color: user.rankConfig.color }}>{user.rankConfig.name}</span>
                                                                        <span className="text-gray-500 text-xs">— {user.mmr ?? 0} MMR</span>
                                                                    </div>
                                                                )}
                                                                <button onClick={handleCancelRanked} className="px-8 py-3 rounded-xl border border-red-500/40 text-red-400 text-sm font-black uppercase tracking-widest hover:bg-red-500/10 transition-colors">
                                                                    <X size={14} className="inline mr-2" />Cancel
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Trophy size={64} className="text-red-500/20 mb-6 drop-shadow-[0_0_30px_rgba(239,68,68,0.2)]" />
                                                                <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white mb-4">Ascend the Ranks</h3>
                                                                <p className="text-gray-400 text-sm leading-relaxed max-w-md">Every match impacts your MMR rating. Face off against players of similar skill — only opponents within ±1 rank of yours.</p>
                                                                {playerCount === 2 && <div className="mt-8 px-4 py-2 border border-red-500/30 bg-red-500/10 rounded-lg text-xs font-bold tracking-widest uppercase text-red-400">Standard Duel • 1v1 Ruleset Active</div>}
                                                                {playerCount === 4 && <div className="mt-8 px-4 py-2 border border-orange-500/30 bg-orange-500/10 rounded-lg text-xs font-bold tracking-widest uppercase text-orange-400">Chaotic Melee • 4-Player Ruleset Active</div>}
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // AI SPLASH INFO
                                                    <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
                                                        <Bot size={64} className="text-green-500/20 mb-6 drop-shadow-[0_0_30px_rgba(16,185,129,0.2)]" />
                                                <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white mb-4">{t('play.neuralTesting')}</h3>
                                                <p className="text-gray-400 text-sm leading-relaxed max-w-md">{t('play.neuralTestingDesc')}</p>
                                                    </div>
                                                )}

                                            </div>

                                        </div>
                                    );
                                })()}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* --- BOTTOM NAVIGATION BAR (Reused) --- */}
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
                        const isActive = item.id === 'play';

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

            {/* ── CREATE ROOM MODAL ── */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setShowCreateModal(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#120a1f] border border-white/10 rounded-2xl p-7 w-full max-w-md shadow-[0_0_60px_rgba(59,130,246,0.2)]" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black uppercase tracking-tighter text-white">{t('play.createRoomTitle')}</h2>
                                <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
                            </div>
                            <div className="flex flex-col gap-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('play.roomName')}</label>
                                    <input type="text" maxLength={40} placeholder="My Awesome Room" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-[#0f0814] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#3b82f6]/60 transition-colors placeholder-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('play.maxPlayers')}</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {([2, 4] as const).map(n => (
                                            <button key={n} onClick={() => setCreateForm(f => ({ ...f, maxPlayers: n }))} className={`py-3 rounded-xl text-sm font-black border transition-all ${createForm.maxPlayers === n ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>{n} Players</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('play.turnTime')}</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {([30, 45, 60] as const).map(t => (
                                            <button key={t} onClick={() => setCreateForm(f => ({ ...f, turnTime: t }))} className={`py-3 rounded-xl text-sm font-black border transition-all ${createForm.turnTime === t ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>{t}s</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-center gap-2">
                                        <Lock size={16} className="text-yellow-400" />
                                        <div>
                                            <p className="text-sm font-bold text-white">{t('play.privateRoom')}</p>
                                            <p className="text-[10px] text-gray-500">{t('play.passwordRequired')}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setCreateForm(f => ({ ...f, isPrivate: !f.isPrivate, password: '' }))} className={`w-12 h-6 rounded-full transition-colors relative ${createForm.isPrivate ? 'bg-yellow-500' : 'bg-white/10'}`}>
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow ${createForm.isPrivate ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                {createForm.isPrivate && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
                                        <input type="password" placeholder="Room password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} className="w-full bg-[#0f0814] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-yellow-500/60 transition-colors placeholder-gray-600" />
                                    </div>
                                )}
                                {lobbyError && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg font-bold">{lobbyError}</div>}
                                <button onClick={handleCreateRoom} className="w-full py-4 rounded-xl bg-[#3b82f6] text-white font-black uppercase tracking-[0.15em] text-sm hover:bg-[#2563eb] transition-colors shadow-[0_0_25px_rgba(59,130,246,0.4)]">
                                    {t('play.createRoomTitle')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── JOIN PASSWORD MODAL ── */}
            <AnimatePresence>
                {joinPasswordModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => { setJoinPasswordModal(null); setJoinPassword(''); }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#120a1f] border border-yellow-500/20 rounded-2xl p-7 w-full max-w-sm shadow-[0_0_60px_rgba(234,179,8,0.15)]" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-5">
                                <Lock size={20} className="text-yellow-400" />
                                <h2 className="text-lg font-black uppercase tracking-tighter text-white">Private Room</h2>
                            </div>
                            <p className="text-sm text-gray-400 mb-4">Enter the room password to join.</p>
                            <input type="password" placeholder="Password" value={joinPassword} onChange={e => setJoinPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleJoinWithPassword()} className="w-full bg-[#0f0814] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-yellow-500/60 transition-colors placeholder-gray-600 mb-4" autoFocus />
                            {lobbyError && <div className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg font-bold">{lobbyError}</div>}
                            <div className="flex gap-3">
                                <button onClick={() => { setJoinPasswordModal(null); setJoinPassword(''); }} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-black hover:bg-white/10 transition-colors">Cancel</button>
                                <button onClick={handleJoinWithPassword} className="flex-1 py-3 rounded-xl bg-yellow-500 text-black text-sm font-black hover:bg-yellow-400 transition-colors">Join</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scrollbar styling for lobbies list */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(176,38,255,0.5); }
            `}</style>

            {/* ── RANKED MATCH FOUND OVERLAY ── */}
            <AnimatePresence>
                {matchFound && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-lg"
                    >
                        {/* Ambient pulse */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-500/5 animate-ping" style={{ animationDuration: '2s' }} />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-red-500/20" />
                        </div>

                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 40 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="relative w-full max-w-3xl mx-4 bg-[#0f0814] border border-red-500/30 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(239,68,68,0.2)]"
                        >
                            {/* Header */}
                            <div className="flex flex-col items-center pt-8 pb-4 px-8">
                                <div className="flex items-center gap-2 text-red-400 text-[10px] font-black tracking-[0.3em] uppercase mb-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    RANKED MATCH FOUND
                                </div>
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white drop-shadow-lg">MATCH FOUND!</h2>

                                {/* Countdown ring */}
                                <div className="relative mt-4 w-16 h-16 flex items-center justify-center">
                                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                                        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="4" />
                                        <circle cx="32" cy="32" r="28" fill="none" stroke="#ef4444" strokeWidth="4"
                                            strokeDasharray={`${2 * Math.PI * 28}`}
                                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - matchCountdown / 5)}`}
                                            strokeLinecap="round"
                                            style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
                                    </svg>
                                    <span className="text-2xl font-black text-white tabular-nums">{matchCountdown}</span>
                                </div>
                                <p className="text-gray-500 text-xs mt-1 font-bold">Game starting in {matchCountdown}s…</p>
                            </div>

                            {/* Players */}
                            {matchFound.players.length === 2 ? (
                                <div className="flex items-stretch px-8 pb-8 gap-0">
                                    {[0, 1].map((idx) => {
                                        const p = matchFound.players[idx];
                                        const isMe = p.slot === matchFound.slot;
                                        const fc = p.frame ? (() => { try { return parseFrameConfig(p.frame); } catch { return null; } })() : null;
                                        const pc: PetConfig | null = p.pet ? (() => { try { return JSON.parse(p.pet); } catch { return null; } })() : null;
                                        const card = (
                                            <div key={p.slot} className={`flex-1 flex flex-col items-center gap-3 pt-6 pb-4 px-4 rounded-2xl transition-all ${isMe ? 'bg-white/5 border border-white/10' : 'bg-transparent'}`}>
                                                <div className="relative">
                                                    <FramedAvatar src={p.avatar} size={96} frameConfig={fc} />
                                                    {pc && pc.modelUrl && (
                                                        <div className="absolute -bottom-3 -right-3">
                                                            <PetViewer petConfig={pc} size={40} withBackground={false} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-center mt-2">
                                                    <p className="font-black text-white text-base tracking-tight">{p.username}</p>
                                                    {isMe && <span className="text-[9px] font-black text-[#ef4444] bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-widest">YOU</span>}
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs font-black text-white">
                                                    <span className="text-[10px] text-gray-400">LVL</span>
                                                    <span>{p.level}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10">
                                                    {p.rankConfig?.iconUrl ? (
                                                        <img src={p.rankConfig.iconUrl} className="w-5 h-5 object-contain" style={{ transform: `scale(${p.rankConfig.iconScale ?? 1})` }} />
                                                    ) : (
                                                        <Shield size={14} className="text-gray-400" />
                                                    )}
                                                    <span className="text-xs font-black" style={{ color: p.rankConfig?.color || '#9ca3af' }}>
                                                        {p.rankConfig?.name || p.rank}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-bold">{p.mmr} MMR</p>
                                            </div>
                                        );
                                        if (idx === 0) return (
                                            <>
                                                {card}
                                                <div className="flex flex-col items-center justify-center px-4 shrink-0">
                                                    <div className="w-px h-16 bg-gradient-to-b from-transparent via-red-500/50 to-transparent" />
                                                    <span className="text-red-400 font-black italic text-2xl tracking-tighter my-2">VS</span>
                                                    <div className="w-px h-16 bg-gradient-to-b from-transparent via-red-500/50 to-transparent" />
                                                </div>
                                            </>
                                        );
                                        return card;
                                    })}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 px-8 pb-8">
                                    {matchFound.players.map((p: any) => {
                                        const isMe = p.slot === matchFound.slot;
                                        const fc = p.frame ? (() => { try { return parseFrameConfig(p.frame); } catch { return null; } })() : null;
                                        const pc: PetConfig | null = p.pet ? (() => { try { return JSON.parse(p.pet); } catch { return null; } })() : null;
                                        return (
                                            <div key={p.slot} className={`flex flex-col items-center gap-2 pt-4 pb-3 px-3 rounded-2xl ${isMe ? 'bg-white/5 border border-white/10' : 'bg-black/20 border border-white/5'}`}>
                                                <div className="relative">
                                                    <FramedAvatar src={p.avatar} size={72} frameConfig={fc} />
                                                    {pc && pc.modelUrl && (
                                                        <div className="absolute -bottom-2 -right-2">
                                                            <PetViewer petConfig={pc} size={30} withBackground={false} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-black text-white text-sm">{p.username}</p>
                                                    {isMe && <span className="text-[8px] font-black text-[#ef4444] bg-red-500/10 border border-red-500/20 px-1 py-0.5 rounded-full uppercase">YOU</span>}
                                                </div>
                                                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-black text-gray-300">
                                                    LVL {p.level}
                                                </div>
                                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 border border-white/10">
                                                    {p.rankConfig?.iconUrl ? (
                                                        <img src={p.rankConfig.iconUrl} className="w-4 h-4 object-contain" />
                                                    ) : (
                                                        <Shield size={11} className="text-gray-400" />
                                                    )}
                                                    <span className="text-[10px] font-black" style={{ color: p.rankConfig?.color || '#9ca3af' }}>{p.rankConfig?.name || p.rank}</span>
                                                </div>
                                                <p className="text-[9px] text-gray-500 font-bold">{p.mmr} MMR</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Red progress bar at bottom */}
                            <div className="h-1 bg-white/5">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-red-600 to-orange-500"
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: 5, ease: 'linear' }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
