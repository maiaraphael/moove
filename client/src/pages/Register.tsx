import { useState } from 'react';
import { User, AtSign, Lock, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import MouseGlow from '../components/ui/MouseGlow';
import { useUser } from '../hooks/useUser';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'en', flag: '🇺🇸', label: 'English' },
    { code: 'pt', flag: '🇧🇷', label: 'Português' },
    { code: 'es', flag: '🇪🇸', label: 'Español' },
] as const;

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [selectedLang, setSelectedLang] = useState<'en' | 'pt' | 'es'>(
        (localStorage.getItem('moove_lang') as 'en' | 'pt' | 'es') || 'en'
    );
    const navigate = useNavigate();
    const { refreshUser } = useUser();
    const { t, i18n } = useTranslation();

    const handleLangChange = (code: 'en' | 'pt' | 'es') => {
        setSelectedLang(code);
        localStorage.setItem('moove_lang', code);
        i18n.changeLanguage(code);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (password !== confirmPassword) {
            setError(t('register.error.passwordMismatch'));
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, language: selectedLang })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem('token', data.token);
                await refreshUser();
                navigate('/dashboard');
            } else {
                setError(data.error || t('register.error.network'));
            }
        } catch (err) {
            console.error(err);
            setError(t('register.error.network'));
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-brand-darker)] text-white font-sans selection:bg-[#b026ff] selection:text-white relative flex items-center justify-center p-6">
            <MouseGlow />

            <Link to="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold tracking-widest uppercase">{t('register.back')}</span>
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
                            {t('register.badge')}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase mb-4 drop-shadow-lg">
                        {t('register.titlePrefix')} <span className="text-[#b026ff] text-glow">Moove</span> {t('register.titleSuffix')}
                    </h1>

                    <p className="text-gray-400 text-xs md:text-sm tracking-[0.2em] uppercase font-semibold">
                        {t('register.sub')}
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

                        {/* Language Selector */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase ml-1">
                                {t('register.language')}
                            </label>
                            <div className="flex gap-2">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        type="button"
                                        onClick={() => handleLangChange(lang.code)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                                            selectedLang === lang.code
                                                ? 'bg-[#b026ff]/20 border-[#b026ff]/70 text-white shadow-[0_0_12px_rgba(176,38,255,0.3)]'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                                        }`}
                                    >
                                        <span>{lang.flag}</span>
                                        <span className="hidden sm:inline">{lang.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Nickname */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase ml-1">
                                {t('register.username')}
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-4 text-[#b026ff]/60">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder={t('register.usernamePlaceholder')}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-[#0a0510]/80 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#b026ff]/50 focus:ring-1 focus:ring-[#b026ff]/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Email Address */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase ml-1">
                                {t('register.email')}
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-4 text-[#b026ff]/60">
                                    <AtSign size={18} />
                                </div>
                                <input
                                    type="email"
                                    placeholder={t('register.emailPlaceholder')}
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
                                    {t('register.password')}
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
                                    {t('register.confirm')}
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
                                {t('register.submit')} <Zap size={16} className="fill-white" />
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                        </button>

                    </form>

                    {/* Login Link */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-400 text-xs font-medium">
                            {t('register.haveAccount')}{' '}
                            <Link to="/login" className="text-white hover:text-[#b026ff] transition-colors font-bold">
                                {t('register.loginHere')}
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
