import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import MouseGlow from '../components/ui/MouseGlow';
import { useUser } from '../hooks/useUser';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshUser } = useUser();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setErrorMsg('Verification link is invalid.');
            return;
        }

        fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-email?token=${token}`)
            .then(res => res.json())
            .then(async data => {
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    await refreshUser();
                    setStatus('success');
                    setTimeout(() => navigate('/dashboard'), 2500);
                } else if (data.error === 'TOKEN_INVALID_OR_EXPIRED') {
                    setStatus('error');
                    setErrorMsg('This verification link has expired or is invalid. Please request a new one.');
                } else {
                    setStatus('error');
                    setErrorMsg(data.error || 'Verification failed.');
                }
            })
            .catch(() => {
                setStatus('error');
                setErrorMsg('Network error. Please try again.');
            });
    }, []);

    return (
        <div className="min-h-screen bg-[var(--color-brand-darker)] text-white font-sans flex items-center justify-center p-6 relative">
            <MouseGlow />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative z-10 w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col items-center text-center gap-6 backdrop-blur-md shadow-[0_0_60px_rgba(176,38,255,0.15)]"
            >
                {status === 'loading' && (
                    <>
                        <Loader size={48} className="text-[#b026ff] animate-spin" />
                        <p className="text-gray-300 font-bold">Verifying your email…</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
                            <CheckCircle size={56} className="text-green-400" />
                        </motion.div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Email Confirmed!</h2>
                            <p className="text-gray-400 text-sm">Your account is now active. Redirecting to dashboard…</p>
                        </div>
                        <div className="w-8 h-1 bg-[#b026ff] rounded-full animate-pulse" />
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle size={56} className="text-red-400" />
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Verification Failed</h2>
                            <p className="text-gray-400 text-sm">{errorMsg}</p>
                        </div>
                        <a
                            href="/login"
                            className="mt-2 px-6 py-2.5 rounded-xl bg-[#b026ff] hover:bg-[#c040ff] text-white text-sm font-black uppercase tracking-widest transition-colors"
                        >
                            Back to Login
                        </a>
                    </>
                )}
            </motion.div>
        </div>
    );
}
