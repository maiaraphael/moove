import { Lock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import MouseGlow from '../components/ui/MouseGlow';
import { useState } from 'react';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (password !== confirm) { setError('Passwords do not match'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Unknown error');
            setDone(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Request failed');
        } finally {
            setLoading(false);
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-[var(--color-brand-darker)] text-white flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4 text-center">
                    <XCircle size={48} className="text-red-400" />
                    <p className="text-gray-300 font-semibold">Invalid or missing reset token.</p>
                    <Link to="/forgot-password" className="text-yellow-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors">
                        Request a new link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-brand-darker)] text-white font-sans selection:bg-[#b026ff] selection:text-white relative flex items-center justify-center p-6">
            <MouseGlow />
            <div className="relative z-10 w-full max-w-md flex flex-col items-center">

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full flex flex-col items-center text-center mb-10"
                >
                    <div className="px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 mb-6 backdrop-blur-md flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-yellow-500 uppercase">New Access Key</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase mb-4 drop-shadow-lg">
                        Set <span className="text-yellow-500" style={{ textShadow: '0 0 10px rgba(234,179,8,0.6)' }}>Password</span>
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="w-full bg-[#120a1f]/80 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-8 md:p-10 shadow-[0_0_50px_rgba(234,179,8,0.05)] relative overflow-hidden"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />

                    {done ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4 py-4"
                        >
                            <CheckCircle size={48} className="text-green-400" />
                            <h2 className="text-lg font-black uppercase tracking-wider text-white">Password Updated</h2>
                            <p className="text-gray-400 text-sm text-center">Redirecting to login...</p>
                        </motion.div>
                    ) : (
                        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase ml-1">New Password</label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 text-yellow-500/60"><Lock size={18} /></div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Min. 6 characters"
                                        required
                                        minLength={6}
                                        className="w-full bg-[#0a0510]/80 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase ml-1">Confirm Password</label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 text-yellow-500/60"><Lock size={18} /></div>
                                    <input
                                        type="password"
                                        value={confirm}
                                        onChange={e => setConfirm(e.target.value)}
                                        placeholder="Repeat your password"
                                        required
                                        className="w-full bg-[#0a0510]/80 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-xs text-center font-semibold">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-4 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:opacity-60 text-black text-sm font-black tracking-[0.15em] uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all"
                            >
                                {loading ? 'Saving...' : 'Confirm New Password'}
                            </button>
                        </form>
                    )}

                    {!done && (
                        <div className="mt-8 text-center flex flex-col gap-3">
                            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="pt-3">
                                <Link to="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.1em]">
                                    <ArrowLeft size={14} /> Back to Login
                                </Link>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
