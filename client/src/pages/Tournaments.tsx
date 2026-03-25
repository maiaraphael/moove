import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Gamepad2, Trophy, User, Layers, ShoppingBag, Diamond, Users, X, CheckCircle2, Medal, Loader2, Shield, Swords } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopHeader from '../components/ui/TopHeader';
import { TournamentsSkeleton } from '../components/ui/PageLoader';
import { useUser } from '../hooks/useUser';

interface Tournament {
    id: string;
    title: string;
    description: string | null;
    prizePool: number;
    entryFee: number;
    maxPlayers: number;
    currentPlayers: number;
    status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
    img: string;
    time: string;
    scope: string;
    isEnrolled: boolean;
    bracketGenerated?: boolean;
}

const calculatePrizePool = (prizePool: number, entryFee: number, playerCount: number) => {
    return Math.max(prizePool, playerCount * entryFee);
};

const calculatePayouts = (prizePool: number, playerCount: number) => {
    if (playerCount === 0) return [];
    if (playerCount <= 3) return [{ rank: "1st", percent: 100, amount: prizePool }];
    if (playerCount <= 10) return [
        { rank: "1st", percent: 70, amount: Math.floor(prizePool * 0.7) },
        { rank: "2nd", percent: 30, amount: Math.floor(prizePool * 0.3) }
    ];
    if (playerCount <= 30) return [
        { rank: "1st", percent: 50, amount: Math.floor(prizePool * 0.5) },
        { rank: "2nd", percent: 30, amount: Math.floor(prizePool * 0.3) },
        { rank: "3rd", percent: 20, amount: Math.floor(prizePool * 0.2) }
    ];
    return [
        { rank: "1st", percent: 40, amount: Math.floor(prizePool * 0.4) },
        { rank: "2nd", percent: 25, amount: Math.floor(prizePool * 0.25) },
        { rank: "3rd", percent: 15, amount: Math.floor(prizePool * 0.15) },
        { rank: "4th-5th", percent: 10, amount: Math.floor(prizePool * 0.1) },
    ];
};

// Mock Data removed — tournaments are fetched dynamically from the API


export default function Tournaments() {
    const { user, isLoading, refreshUser } = useUser();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [tournamentsLoading, setTournamentsLoading] = useState(true);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [enrolling, setEnrolling] = useState<string | null>(null);
    const [enrollError, setEnrollError] = useState<string | null>(null);

    type BracketPlayer = { id: string; username: string; avatarUrl?: string | null; mmr: number; rank: string; level: number } | null;
    type BracketMatchType = { id: string; round: number; matchIndex: number; status: string; p1Slot: string | null; p2Slot: string | null; winnerId: string | null; player1: BracketPlayer; player2: BracketPlayer; winner: BracketPlayer };
    type BracketDataType = { rounds: Record<number, BracketMatchType[]>; bracketSize: number; totalRounds: number };

    const [detailTab, setDetailTab] = useState<'details' | 'bracket'>('details');
    const [bracketData, setBracketData] = useState<BracketDataType | null>(null);
    const [bracketLoading, setBracketLoading] = useState(false);
    const [settingWinner, setSettingWinner] = useState<string | null>(null);

    const loadBracket = async (tournamentId: string) => {
        setBracketLoading(true);
        setBracketData(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tournaments/${tournamentId}/bracket`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setBracketData(data);
        } catch {}
        setBracketLoading(false);
    };

    const handleSetWinner = async (matchId: string, winnerId: string) => {
        if (settingWinner) return;
        setSettingWinner(matchId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tournaments/${selectedTournament!.id}/matches/${matchId}/result`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ winnerId }),
            });
            if (res.ok) {
                await loadBracket(selectedTournament!.id);
                fetchTournaments();
            }
        } catch {}
        setSettingWinner(null);
    };

    const fetchTournaments = () => {
        const token = localStorage.getItem('token');
        if (!token) { setTournamentsLoading(false); return; }
        fetch(`${import.meta.env.VITE_API_URL}/api/tournaments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setTournaments(Array.isArray(data) ? data : []))
            .catch(console.error)
            .finally(() => setTournamentsLoading(false));
    };

    useEffect(() => { fetchTournaments(); }, []);

    if (isLoading || !user) return <TournamentsSkeleton />;

    const isAdmin = user.role === 'ADMIN' || user.role === 'MODERATOR';

    const handleJoin = async (tournament: Tournament) => {
        if (enrolling) return;
        setEnrollError(null);
        if (tournament.entryFee > 0 && (!user || user.gems < tournament.entryFee)) {
            setEnrollError(`Gems insuficientes. Você precisa de ${tournament.entryFee} 💎 mas tem ${user?.gems ?? 0} 💎`);
            return;
        }
        setEnrolling(tournament.id);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tournaments/${tournament.id}/join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) { setEnrollError(data.error || 'Erro ao se inscrever'); return; }
            fetchTournaments();
            if (refreshUser) refreshUser();
        } catch (err) {
            setEnrollError('Erro de conexão');
        } finally {
            setEnrolling(null);
        }
    };

    const handleLeave = async (tournament: Tournament) => {
        if (enrolling) return;
        setEnrollError(null);
        setEnrolling(tournament.id);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tournaments/${tournament.id}/leave`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) { setEnrollError(data.error || 'Erro ao cancelar inscrição'); return; }
            fetchTournaments();
            if (refreshUser) refreshUser();
        } catch (err) {
            setEnrollError('Erro de conexão');
        } finally {
            setEnrolling(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0814] text-white font-sans selection:bg-[#b026ff] pb-24 relative overflow-hidden">

            {/* Ambient Background */}
            <div className="fixed top-[0%] left-[-10%] w-[50%] h-[50%] bg-[#b026ff]/10 rounded-full blur-[150px] pointer-events-none" />

            {/* --- TOP HEADER --- */}
            <TopHeader user={user} />

            {/* --- MAIN CONTENT --- */}
            <main className="max-w-7xl mx-auto px-6 pt-8 pb-12 relative z-10">
                <div className="mb-10">
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase drop-shadow-md">
                        GLOBAL <span className="text-[#b026ff]">TOURNAMENTS</span>
                    </h1>
                    <p className="text-sm text-gray-400 font-medium mt-1">Compete against the best, win exclusive rewards.</p>
                </div>

                {/* Tournament List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournamentsLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-[#120a1f]/80 border border-white/10 rounded-2xl h-72 animate-pulse" />
                        ))
                    ) : tournaments.length === 0 ? (
                        <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
                            <Trophy size={48} className="text-[#b026ff]/30 mb-4" />
                            <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">Nenhum torneio ativo</p>
                            <p className="text-gray-600 text-sm mt-2">Novos torneios serão anunciados em breve.</p>
                        </div>
                    ) : (
                        tournaments.map((tourney, idx) => (
                            <motion.div
                                key={tourney.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative bg-[#120a1f]/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all flex flex-col"
                                style={{ boxShadow: `0 0 40px inset ${tourney.status === 'ONGOING' ? '#10b98115' : '#b026ff15'}` }}
                            >
                                {/* Image Header */}
                                <div className="h-40 relative overflow-hidden">
                                    <img src={tourney.img} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity group-hover:scale-105 duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#120a1f] to-transparent" />
                                    <div className="absolute top-4 right-4 px-3 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black tracking-widest uppercase">
                                        {tourney.status === 'ONGOING' ? 'Ongoing' : tourney.status === 'UPCOMING' ? 'Enrolling' : tourney.status}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-black italic uppercase mb-2 text-white">{tourney.title}</h3>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Diamond size={14} className="text-[#b026ff]" />
                                        <span className="text-sm font-bold text-gray-300 tracking-wide">
                                            {calculatePrizePool(tourney.prizePool, tourney.entryFee, tourney.currentPlayers).toLocaleString()} Gems Prize
                                        </span>
                                    </div>
                                    {tourney.entryFee > 0 && (
                                        <p className="text-xs text-gray-500 mb-3 font-bold">Entrada: {tourney.entryFee} 💎 Gems</p>
                                    )}
                                    <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-6">
                                        {tourney.time}
                                    </div>

                                    <button
                                        onClick={() => { setSelectedTournament(tourney); setEnrollError(null); setDetailTab('details'); setBracketData(null); }}
                                        className="mt-auto w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-black tracking-widest uppercase transition-colors"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </main>

            {/* --- TOURNAMENT DETAILS MODAL --- */}
            <AnimatePresence>
                {selectedTournament && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTournament(null)}
                            className="absolute inset-0 bg-[#0f0814]/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#120a1f] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header Image */}
                            <div className="h-48 relative shrink-0">
                                <img src={selectedTournament.img} className="w-full h-full object-cover opacity-50" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#120a1f] to-transparent" />
                                <button
                                    onClick={() => setSelectedTournament(null)}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-white/10 rounded-full backdrop-blur-md border border-white/10 transition-colors z-20"
                                >
                                    <X size={18} />
                                </button>
                                <div className="absolute bottom-4 left-6">
                                    <h2 className="text-3xl font-black italic tracking-tighter uppercase drop-shadow-lg">{selectedTournament.title}</h2>
                                    <p className="text-[#b026ff] font-bold tracking-widest text-sm uppercase mt-1">
                                        Prize Pool: {calculatePrizePool(selectedTournament.prizePool, selectedTournament.entryFee, selectedTournament.currentPlayers).toLocaleString()} 💎 Gems
                                    </p>
                                </div>
                            </div>

                            {/* Modal Tabs */}
                            {(selectedTournament.bracketGenerated || selectedTournament.status === 'ONGOING' || selectedTournament.status === 'COMPLETED') && (
                                <div className="flex gap-1 px-5 py-2 bg-[#120a1f] border-b border-white/5 shrink-0">
                                    <button onClick={() => setDetailTab('details')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${detailTab === 'details' ? 'border-[#b026ff] text-white' : 'border-transparent text-gray-500 hover:text-white'}`}>Details</button>
                                    <button onClick={() => { setDetailTab('bracket'); if (!bracketData) loadBracket(selectedTournament.id); }} className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${detailTab === 'bracket' ? 'border-[#b026ff] text-white' : 'border-transparent text-gray-500 hover:text-white'}`}><Trophy size={12} /> Bracket</button>
                                </div>
                            )}

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                {detailTab === 'details' && (<>
                                {/* Details Grid */}
                                <h3 className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-4">Tournament Info</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                        <Users size={20} className="text-[#3b82f6] mb-2" />
                                        <span className="text-xs text-gray-400 uppercase tracking-widest">Players</span>
                                        <span className="font-bold text-sm">{selectedTournament.currentPlayers} / {selectedTournament.maxPlayers}</span>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                        <Diamond size={20} className="text-[#b026ff] mb-2" />
                                        <span className="text-xs text-gray-400 uppercase tracking-widest">Entry Fee</span>
                                        <span className="font-bold text-sm">{selectedTournament.entryFee > 0 ? `${selectedTournament.entryFee} 💎 Gems` : 'Free'}</span>
                                        {selectedTournament.entryFee > 0 && (
                                            <span className={`text-[9px] font-bold mt-1 ${(user?.gems ?? 0) >= selectedTournament.entryFee ? 'text-green-400' : 'text-red-400'}`}>
                                                Você tem: {user?.gems ?? 0} 💎
                                            </span>
                                        )}
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                        <Trophy size={20} className="text-yellow-500 mb-2" />
                                        <span className="text-xs text-gray-400 uppercase tracking-widest">Scope</span>
                                        <span className="font-bold text-sm">{selectedTournament.scope}</span>
                                    </div>
                                </div>

                                {/* Prize Pool Distribution */}
                                <h3 className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-4 mt-6">Prize Pool Distribution</h3>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                                    {(() => {
                                        const currentPlayers = selectedTournament.currentPlayers;
                                        const totalPrize = calculatePrizePool(selectedTournament.prizePool, selectedTournament.entryFee, currentPlayers);
                                        const getPayouts = (prize: number, count: number) => {
                                            if (count <= 0) return [];
                                            if (count <= 3) return [{ rank: '1st', percent: 100, amount: prize }];
                                            if (count <= 10) return [
                                                { rank: '1st', percent: 70, amount: Math.floor(prize * 0.7) },
                                                { rank: '2nd', percent: 30, amount: Math.floor(prize * 0.3) }
                                            ];
                                            if (count <= 30) return [
                                                { rank: '1st', percent: 50, amount: Math.floor(prize * 0.5) },
                                                { rank: '2nd', percent: 30, amount: Math.floor(prize * 0.3) },
                                                { rank: '3rd', percent: 20, amount: Math.floor(prize * 0.2) }
                                            ];
                                            return [
                                                { rank: '1st', percent: 40, amount: Math.floor(prize * 0.4) },
                                                { rank: '2nd', percent: 25, amount: Math.floor(prize * 0.25) },
                                                { rank: '3rd', percent: 15, amount: Math.floor(prize * 0.15) },
                                                { rank: '4th-5th', percent: 10, amount: Math.floor(prize * 0.1) },
                                            ];
                                        };
                                        const payouts = getPayouts(totalPrize, currentPlayers);

                                        if (currentPlayers === 0) return (
                                            <div className="text-center text-xs text-gray-500 py-2 uppercase tracking-widest font-bold">Aguardando inscrições. Garantido: {selectedTournament.prizePool.toLocaleString()} 💎 Gems</div>
                                        );

                                        return (
                                            <div className="flex flex-col gap-2">
                                                {payouts.map((p, i) => (
                                                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                                                        <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : i === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/50' : i === 2 ? 'bg-orange-700/20 text-orange-500 border border-orange-700/50' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                                                                {p.rank}
                                                            </div>
                                                            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{p.percent}% of Pool</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-right">
                                                            <Diamond size={14} className="text-[#b026ff]" />
                                                            <span className="text-sm font-black text-white">{p.amount.toLocaleString()} 💎 Gems</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Enrolled Players List */}
                                <h3 className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-4">Inscritos ({selectedTournament.currentPlayers})</h3>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                                    <p className="text-center text-xs text-gray-500 py-4 uppercase tracking-widest font-bold">
                                        {selectedTournament.currentPlayers} / {selectedTournament.maxPlayers} jogadores inscritos
                                    </p>
                                </div>

                                {/* Error message */}
                                {enrollError && (
                                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold text-center">
                                        {enrollError}
                                    </div>
                                )}

                                {/* Enrollment Action */}
                                <div className="flex items-center justify-end border-t border-white/10 pt-6">
                                    {selectedTournament.status === 'UPCOMING' ? (
                                        selectedTournament.isEnrolled ? (
                                            <button
                                                onClick={() => handleLeave(selectedTournament)}
                                                disabled={enrolling === selectedTournament.id}
                                                className="w-full sm:w-auto px-8 py-3 rounded-xl border border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-xs font-black tracking-widest uppercase transition-all disabled:opacity-50"
                                            >
                                                {enrolling === selectedTournament.id ? 'Cancelando...' : 'Cancel Registration'}
                                                {selectedTournament.entryFee > 0 && ` (+${selectedTournament.entryFee} 💎 reembolso)`}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleJoin(selectedTournament)}
                                                disabled={enrolling === selectedTournament.id}
                                                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#b026ff] text-white hover:bg-[#9d1ce6] shadow-[0_0_20px_rgba(176,38,255,0.4)] text-xs font-black tracking-widest uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {enrolling === selectedTournament.id ? 'Inscrevendo...' : (
                                                    <><CheckCircle2 size={16} /> Enroll Now {selectedTournament.entryFee > 0 ? `— ${selectedTournament.entryFee} 💎` : '(Free)'}</>
                                                )}
                                            </button>
                                        )
                                    ) : (
                                        <button disabled className="w-full sm:w-auto px-8 py-3 rounded-xl bg-white/5 text-gray-500 cursor-not-allowed border border-white/10 text-xs font-black tracking-widest uppercase">
                                            {selectedTournament.status === 'ONGOING' ? 'Ongoing' : 'Encerrado'}
                                        </button>
                                    )}
                                </div>
                                </>)}
                                {detailTab === 'bracket' && (
                                    bracketLoading ? (
                                        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-[#b026ff]" /></div>
                                    ) : !bracketData ? (
                                        <div className="text-center py-16 text-gray-500">
                                            <Trophy size={40} className="mx-auto mb-3 opacity-20" />
                                            <p className="font-bold text-sm">Bracket not generated yet.</p>
                                            {isAdmin && (
                                                <button
                                                    onClick={async () => {
                                                        const token = localStorage.getItem('token');
                                                        await fetch(`${import.meta.env.VITE_API_URL}/api/tournaments/${selectedTournament.id}/bracket/generate`, {
                                                            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
                                                        });
                                                        loadBracket(selectedTournament.id);
                                                        fetchTournaments();
                                                    }}
                                                    className="mt-4 px-5 py-2 bg-[#b026ff] hover:bg-[#9010e0] text-white text-xs font-black rounded-xl transition-colors inline-flex items-center gap-2"
                                                >
                                                    <Trophy size={13} /> Generate Bracket
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto pb-2 -mx-2 px-2">
                                            <div className="flex gap-3 min-w-max pb-2">
                                                {(Object.entries(bracketData.rounds) as [string, any[]][]).sort(([a], [b]) => Number(a) - Number(b)).map(([rn, matches]) => {
                                                    const roundNum = Number(rn);
                                                    const label = roundNum === bracketData.totalRounds ? 'Final' : roundNum === bracketData.totalRounds - 1 && bracketData.totalRounds > 1 ? 'Semi-Final' : `Round ${roundNum}`;
                                                    return (
                                                        <div key={rn} className="flex flex-col gap-2 w-44 shrink-0">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-center text-[#b026ff] py-1">{label}</p>
                                                            {matches.map((match: any) => {
                                                                const p1 = match.player1;
                                                                const p2 = match.player2;
                                                                const winner = match.winner;
                                                                const isPending = match.status === 'PENDING';
                                                                const isBye = match.status === 'BYE';
                                                                return (
                                                                    <div key={match.id} className={`bg-[#0a0510]/80 border rounded-xl overflow-hidden ${winner ? 'border-green-500/30' : isBye ? 'border-gray-700/30' : 'border-white/10'}`}>
                                                                        {[{ player: p1, slotIsBye: false }, { player: p2, slotIsBye: isBye }].map(({ player, slotIsBye }, slot) => (
                                                                            <div key={slot}>
                                                                                {slot === 1 && <div className="border-t border-white/5" />}
                                                                                <div className={`flex items-center gap-2 px-2.5 py-2 ${winner && player && winner.id === player.id ? 'bg-green-500/15' : ''}`}>
                                                                                    <div className="w-5 h-5 rounded-full bg-white/10 overflow-hidden shrink-0">
                                                                                        {player && <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`} className="w-full h-full object-cover" alt="" />}
                                                                                    </div>
                                                                                    <span className={`text-[11px] font-bold flex-1 truncate ${slotIsBye ? 'text-gray-600 italic' : !player ? 'text-gray-600 italic' : winner && player && winner.id === player.id ? 'text-green-400' : 'text-white'}`}>
                                                                                        {slotIsBye ? 'BYE' : player ? player.username : 'TBD'}
                                                                                    </span>
                                                                                    {winner && player && winner.id === player.id && <Trophy size={9} className="text-green-400 shrink-0" />}
                                                                                    {isPending && p1 && p2 && !isBye && isAdmin && (
                                                                                        <button
                                                                                            disabled={settingWinner === match.id}
                                                                                            onClick={() => handleSetWinner(match.id, slot === 0 ? p1.id : p2.id)}
                                                                                            className="shrink-0 text-[8px] bg-green-500/15 hover:bg-green-500/30 text-green-400 px-1.5 py-0.5 rounded transition-colors font-black disabled:opacity-40"
                                                                                        >W</button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )
                                )}
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
                        const isActive = item.id === 'tourney'; // Active for Tournaments

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
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(176,38,255,0.5); }
            `}</style>
        </div>
    );
}
