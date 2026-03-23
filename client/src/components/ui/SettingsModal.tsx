import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Globe, Eye, EyeOff, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'password' | 'language';

const LANGUAGES = [
    { code: 'en', flag: '🇺🇸', label: 'English' },
    { code: 'pt', flag: '🇧🇷', label: 'Português' },
    { code: 'es', flag: '🇪🇸', label: 'Español' },
];

export default function SettingsModal({ isOpen, onClose }: Props) {
    const { t, i18n } = useTranslation();
    const [tab, setTab] = useState<Tab>('password');

    // Password form state
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState(false);

    function resetPwForm() {
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
        setPwError('');
        setPwSuccess(false);
    }

    function handleClose() {
        resetPwForm();
        onClose();
    }

    async function handlePasswordChange(e: React.FormEvent) {
        e.preventDefault();
        setPwError('');
        setPwSuccess(false);

        if (newPw !== confirmPw) {
            setPwError(t('settings.error.mismatch'));
            return;
        }
        if (newPw.length < 6) {
            setPwError(t('settings.error.tooShort'));
            return;
        }

        setPwLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 401) {
                    setPwError(t('settings.error.incorrect'));
                } else {
                    setPwError(data.error || t('settings.error.generic'));
                }
            } else {
                setPwSuccess(true);
                resetPwForm();
            }
        } catch {
            setPwError(t('settings.error.generic'));
        } finally {
            setPwLoading(false);
        }
    }

    function handleLanguageChange(code: string) {
        i18n.changeLanguage(code);
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300]"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        className="fixed inset-0 z-[301] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="pointer-events-auto w-full max-w-md bg-[#120a1f] border border-white/10 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.9)] overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                                <h2 className="text-base font-black uppercase tracking-widest text-white">
                                    {t('settings.title')}
                                </h2>
                                <button onClick={handleClose} className="text-white/30 hover:text-white/70 transition-colors p-1">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-white/8">
                                {([
                                    { key: 'password' as Tab, icon: Lock, label: t('settings.changePassword') },
                                    { key: 'language' as Tab, icon: Globe, label: t('settings.language') },
                                ] as const).map(({ key, icon: Icon, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setTab(key)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                                            tab === key
                                                ? 'text-[#b026ff] border-b-2 border-[#b026ff]'
                                                : 'text-white/40 hover:text-white/70'
                                        }`}
                                    >
                                        <Icon size={14} />
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="px-6 py-5">
                                {/* Password Tab */}
                                {tab === 'password' && (
                                    <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
                                        {/* Current Password */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                                                {t('settings.currentPassword')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrent ? 'text' : 'password'}
                                                    value={currentPw}
                                                    onChange={e => setCurrentPw(e.target.value)}
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b026ff]/50 pr-10"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrent(v => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                                >
                                                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* New Password */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                                                {t('settings.newPassword')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNew ? 'text' : 'password'}
                                                    value={newPw}
                                                    onChange={e => setNewPw(e.target.value)}
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b026ff]/50 pr-10"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNew(v => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                                >
                                                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Confirm New Password */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                                                {t('settings.confirmPassword')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirm ? 'text' : 'password'}
                                                    value={confirmPw}
                                                    onChange={e => setConfirmPw(e.target.value)}
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b026ff]/50 pr-10"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirm(v => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                                >
                                                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Error / Success */}
                                        {pwError && (
                                            <p className="text-xs text-red-400 font-semibold">{pwError}</p>
                                        )}
                                        {pwSuccess && (
                                            <div className="flex items-center gap-2 text-xs text-green-400 font-semibold">
                                                <Check size={14} /> {t('settings.success')}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={pwLoading}
                                            className="mt-1 w-full py-3 bg-[#b026ff] hover:bg-[#9d1ce6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(176,38,255,0.4)] hover:shadow-[0_0_30px_rgba(176,38,255,0.7)] transition-all"
                                        >
                                            {pwLoading ? t('settings.saving') : t('settings.savePassword')}
                                        </button>
                                    </form>
                                )}

                                {/* Language Tab */}
                                {tab === 'language' && (
                                    <div className="flex flex-col gap-3">
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-1">
                                            {t('settings.selectLanguage')}
                                        </p>
                                        {LANGUAGES.map(lang => {
                                            const isActive = i18n.language === lang.code || i18n.language.startsWith(lang.code);
                                            return (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => handleLanguageChange(lang.code)}
                                                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all ${
                                                        isActive
                                                            ? 'bg-[#b026ff]/15 border-[#b026ff]/50 text-white'
                                                            : 'bg-white/3 border-white/8 text-white/60 hover:bg-white/8 hover:text-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl">{lang.flag}</span>
                                                        <span className="font-bold text-sm">{lang.label}</span>
                                                    </div>
                                                    {isActive && (
                                                        <div className="w-5 h-5 rounded-full bg-[#b026ff] flex items-center justify-center">
                                                            <Check size={12} className="text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
