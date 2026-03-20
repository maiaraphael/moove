import { useState } from 'react';
import { User, AtSign, Lock, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import MouseGlow from '../components/ui/MouseGlow';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem('token', data.token);
                navigate('/dashboard');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            console.error(err);
            setError('Network error');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-brand-darker)] text-white font-sans selection:bg-[#b026ff] selection:text-white relative flex items-center justify-center p-6">
            <MouseGlow />

            <Link to="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold tracking-widest uppercase">Back to Grid</span>
            </Link>

            <div className="relative z-10 w-full max-w-lg flex flex-col items-center">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full flex flex-col items-center text-center mb-10"
                >
                    <div className="px-4 py-1.5 rounded-full border border-[#b026ff]/30 bg-[#120a1f]/70 mb-6 backdrop-blur-md">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-[#b026ff] uppercase">
                            System Online
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase mb-4 drop-shadow-lg">
                        Join the <span className="text-[#b026ff] text-glow">Moove</span> Network
                    </h1>

                    <p className="text-gray-400 text-xs md:text-sm tracking-[0.2em] uppercase font-semibold">
                        Initialize your pilot status
                    </p>
                </motion.div>

                {/* Form Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="w-full bg-[#120a1f]/80 backdrop-blur-xl border border-[#b026ff]/20 rounded-2xl p-8 md:p-10 shadow-[0_0_50px_rgba(176,38,255,0.05)] relative overflow-hidden"
                >
                    {/* subtle interior glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-[#b026ff]/50 to-transparent" />

                    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>

                        {/* Nickname */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase ml-1">
                                Nickname
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-4 text-[#b026ff]/60">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter your callsign"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-[#0a0510]/80 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#b026ff]/50 focus:ring-1 focus:ring-[#b026ff]/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Email Address */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase ml-1">
                                Email Address
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-4 text-[#b026ff]/60">
                                    <AtSign size={18} />
                                </div>
                                <input
                                    type="email"
                                    placeholder="pilot@moove.network"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#0a0510]/80 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#b026ff]/50 focus:ring-1 focus:ring-[#b026ff]/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Password Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Password */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase ml-1">
                                    Password
                                </label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 text-[#b026ff]/60">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#0a0510]/80 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#b026ff]/50 focus:ring-1 focus:ring-[#b026ff]/50 transition-all font-medium tracking-widest"
                                    />
                                </div>
                            </div>

                            {/* Confirm */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase ml-1">
                                    Confirm
                                </label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 text-[#b026ff]/60">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-[#0a0510]/80 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#b026ff]/50 focus:ring-1 focus:ring-[#b026ff]/50 transition-all font-medium tracking-widest"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && <div className="text-red-500 text-xs font-bold uppercase tracking-widest text-center">{error}</div>}

                        {/* Submit */}
                        <button onClick={handleRegister} className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-[#b026ff] to-[#d685ff] hover:from-[#9d1ce6] hover:to-[#c461f0] text-white text-sm font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(176,38,255,0.4)] transition-all group overflow-hidden relative">
                            <span className="relative z-10 flex items-center gap-2">
                                Initialize Pilot <Zap size={16} className="fill-white" />
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                        </button>

                    </form>

                    {/* Login Link */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-400 text-xs font-medium">
                            Already have a profile?{' '}
                            <Link to="/login" className="text-white hover:text-[#b026ff] transition-colors font-bold">
                                Log in
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
