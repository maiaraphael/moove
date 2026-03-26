import { useState } from 'react';
import { AtSign, Lock, ChevronRight, ArrowLeft, Mail, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import MouseGlow from '../components/ui/MouseGlow';
import { useUser } from '../hooks/useUser';
import { useTranslation } from 'react-i18next';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [unverified, setUnverified] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendSent, setResendSent] = useState(false);
    const navigate = useNavigate();
    const { refreshUser } = useUser();
    const { t, i18n } = useTranslation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: email, password })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.removeItem('moove_user_avatar');
                localStorage.setItem('token', data.token);
                if (data.loginBonus) {
                    sessionStorage.setItem('loginBonus', JSON.stringify(data.loginBonus));
                }
                // Apply user's saved language preference
                if (data.user?.preferredLanguage) {
                    const lang = data.user.preferredLanguage;
                    localStorage.setItem('moove_lang', lang);
                    i18n.changeLanguage(lang);
                }
                // Fetch user data now so the dashboard doesn't spin with user=null
                await refreshUser();
                navigate('/dashboard');
            } else {
                if (data.error === 'EMAIL_NOT_VERIFIED') {
                    setUnverified(true);
                } else {
                    setError(data.error || t('login.error.invalid'));
                }
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
                <span className="text-sm font-bold tracking-widest uppercase">{t('login.back')}</span>
            </Link>

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full flex flex-col items-center text-center mb-10"
                >
                    <div className="px-4 py-1.5 rounded-full border border-[#b026ff]/30 bg-[#120a1f]/70 mb-6 backdrop-blur-md">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-[#b026ff] uppercase">
                            {t('login.badge')}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase mb-4 drop-shadow-lg">
                        {t('login.title')} <span className="text-[#b026ff] text-glow">{t('login.titleAccent')}</span>
                    </h1>

                    <p className="text-gray-400 text-xs md:text-sm tracking-[0.2em] uppercase font-semibold">
                        {t('login.sub')}
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

                        {/* Email Address */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase ml-1">
                                {t('login.emailOrUser')}
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

                        {/* Password */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase">
                                    {t('login.password')}
                                </label>
                                <Link to="/forgot-password" className="text-[10px] font-bold text-[#b026ff] hover:text-[#d685ff] tracking-widest uppercase transition-colors">
                                    {t('login.forgot')}
                                </Link>
                            </div>
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

                        {error && <div className="text-red-500 text-xs font-bold uppercase tracking-widest text-center">{error}</div>}

                        {unverified && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex flex-col gap-3 text-center">
                                <div className="flex items-center justify-center gap-2 text-yellow-300 font-black text-sm">
                                    <Mail size={16} /> Email not confirmed
                                </div>
                                <p className="text-gray-400 text-xs">Check your inbox and click the confirmation link before logging in.</p>
                                <button
                                    disabled={resending || resendSent}
                                    onClick={async () => {
                                        setResending(true);
                                        await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend-verification`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ email }),
                                        });
                                        setResending(false);
                                        setResendSent(true);
                                    }}
                                    className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-[#b026ff] hover:text-[#d685ff] disabled:opacity-50 transition-colors"
                                >
                                    <RefreshCcw size={12} className={resending ? 'animate-spin' : ''} />
                                    {resendSent ? 'Email sent!' : 'Resend confirmation email'}
                                </button>
                            </div>
                        )}

                        {/* Submit */}
                        <button onClick={handleLogin} className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-[#b026ff] to-[#d685ff] hover:from-[#9d1ce6] hover:to-[#c461f0] text-white text-sm font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(176,38,255,0.4)] transition-all group overflow-hidden relative">
                            <span className="relative z-10 flex items-center gap-2">
                                {t('login.submit')} <ChevronRight size={18} className="translate-y-[1px]" />
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                        </button>

                    </form>

                    {/* Register Link */}
                    <div className="mt-8 text-center flex flex-col gap-3">
                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <p className="text-gray-400 text-xs font-medium pt-3">
                            {t('login.noAccount')}{' '}
                            <Link to="/register" className="text-white hover:text-[#b026ff] transition-colors font-bold">
                                {t('login.register')}
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
