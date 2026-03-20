import { AtSign, RefreshCcw, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import MouseGlow from '../components/ui/MouseGlow';
import { useState } from 'react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Unknown error');
            setSent(true);
        } catch (err: any) {
            setError(err.message || 'Request failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[var(--color-brand-darker)] text-white font-sans selection:bg-[#b026ff] selection:text-white relative flex items-center justify-center p-6">
            <MouseGlow />
            <div className="relative z-10 w-full max-w-md flex flex-col items-center">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full flex flex-col items-center text-center mb-10"
                >
                    <div className="px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 mb-6 backdrop-blur-md flex items-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.8)] animate-pulse" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-yellow-500 uppercase">System Recovery</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase mb-4 drop-shadow-lg">
                        Reset <span className="text-yellow-500" style={{ textShadow: '0 0 10px rgba(234,179,8,0.6)' }}>Key</span>
                    </h1>
                    <p className="text-gray-400 text-xs md:text-sm tracking-[0.2em] uppercase font-semibold">
                        Re-establish pilot connection
                    </p>
                </motion.div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="w-full bg-[#120a1f]/80 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-8 md:p-10 shadow-[0_0_50px_rgba(234,179,8,0.05)] relative overflow-hidden"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />

                    {sent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4 py-4"
                        >
                            <CheckCircle size={48} className="text-yellow-400" />
                            <h2 className="text-lg font-black uppercase tracking-wider text-white">Protocol Transmitted</h2>
                            <p className="text-gray-400 text-sm text-center leading-relaxed">
                                If an account with that email exists, a reset link has been sent. Check your inbox (and spam folder).
                            </p>
                            <Link to="/login" className="mt-4 inline-flex items-center gap-2 text-yellow-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.1em]">
                                <ArrowLeft size={14} /> Back to Login
                            </Link>
                        </motion.div>
                    ) : (
                        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                            <p className="text-sm font-medium text-gray-400 leading-relaxed text-center mb-2">
                                Enter the email address associated with your account. A recovery link will be sent to it.
                            </p>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase ml-1">
                                    Email Address
                                </label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 text-yellow-500/60">
                                        <AtSign size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="pilot@moove.network"
                                        required
                                        className="w-full bg-[#0a0510]/80 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-xs text-center font-semibold">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-4 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:opacity-60 text-black text-sm font-black tracking-[0.15em] uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all group overflow-hidden relative"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {loading ? 'Transmitting...' : <><RefreshCcw size={16} className="text-black" /> Transmit Protocol</>}
                                </span>
                                <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                            </button>
                        </form>
                    )}

                    {!sent && (
                        <div className="mt-8 text-center flex flex-col gap-3">
                            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="pt-3">
                                <Link to="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.1em]">
                                    <ArrowLeft size={14} /> Cancel sequence
                                </Link>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
