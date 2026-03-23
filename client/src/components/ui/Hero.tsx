import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, Trophy, Users, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Fake game cards to show off the real aesthetic
const DEMO_CARDS = [
    { num: '9', color: '#22c55e',  border: '#16a34a', glow: 'rgba(34,197,94,0.6)',   rotate: -18, x: -280, y: 30,  z: 1, scale: 0.92 },
    { num: '4', color: '#eab308',  border: '#ca8a04', glow: 'rgba(234,179,8,0.6)',   rotate: -8,  x: -160, y: -20, z: 2, scale: 1.0  },
    { num: '7', color: '#3b82f6',  border: '#2563eb', glow: 'rgba(59,130,246,0.6)',  rotate: 2,   x: -40,  y: 10,  z: 3, scale: 1.08 },
    { num: '2', color: '#ef4444',  border: '#dc2626', glow: 'rgba(239,68,68,0.6)',   rotate: 12,  x: 80,   y: -15, z: 2, scale: 1.0  },
    { num: 'J', color: '#b026ff',  border: '#9d1ce6', glow: 'rgba(176,38,255,0.8)',  rotate: 22,  x: 200,  y: 25,  z: 1, scale: 0.92 },
];

function GameCard({ card, delay }: { card: typeof DEMO_CARDS[0]; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 80, rotate: card.rotate - 10 }}
            animate={{ opacity: 1, y: 0,  rotate: card.rotate }}
            transition={{ duration: 0.8, delay, type: 'spring', stiffness: 80 }}
            style={{ zIndex: card.z }}
            className="absolute w-[90px] h-[130px] sm:w-[110px] sm:h-[155px] rounded-2xl flex flex-col items-center justify-center select-none"
            whileHover={{ y: -12, scale: 1.08, transition: { duration: 0.2 } }}
        >
            <div
                className="w-full h-full rounded-2xl border-2 flex flex-col items-center justify-center relative overflow-hidden"
                style={{
                    borderColor: card.border,
                    background: `linear-gradient(135deg, #18102a 0%, #0d0818 100%)`,
                    boxShadow: `0 0 30px ${card.glow}, inset 0 0 20px ${card.color}22`,
                }}
            >
                {/* Grid texture */}
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: `linear-gradient(${card.color}33 1px, transparent 1px), linear-gradient(90deg, ${card.color}33 1px, transparent 1px)`, backgroundSize: '16px 16px' }} />
                {/* Top-left number */}
                <span className="absolute top-2 left-2.5 text-xs font-black leading-none" style={{ color: card.color }}>{card.num}</span>
                {/* Center big number */}
                <span className="relative z-10 text-5xl sm:text-6xl font-black leading-none drop-shadow-2xl" style={{ color: card.color, textShadow: `0 0 20px ${card.glow}` }}>{card.num}</span>
                {/* Bottom-right number (inverted) */}
                <span className="absolute bottom-2 right-2.5 text-xs font-black leading-none rotate-180" style={{ color: card.color }}>{card.num}</span>
                {/* Shimmer line */}
                <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${card.color}, transparent)` }} />
            </div>
        </motion.div>
    );
}

export default function Hero() {
    const { t } = useTranslation();
    return (
        <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">

            {/* Deep background layers */}
            <div className="absolute inset-0 bg-[#0a050f]" />
            <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[900px] h-[600px] bg-[#b026ff]/8 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Dot-grid overlay */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            {/* ── Text Content ── */}
            <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-5xl mx-auto">

                {/* Live badge */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#b026ff]/10 border border-[#b026ff]/30 mb-8 backdrop-blur-sm"
                >
                    <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,1)] animate-pulse" />
                    <span className="text-[11px] font-bold tracking-[0.2em] text-[#d685ff] uppercase">{t('hero.badge')}</span>
                </motion.div>

                {/* Main headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.2 }}
                    className="text-[3.2rem] sm:text-[5rem] md:text-[6rem] font-black italic tracking-tighter leading-[0.88] text-white uppercase mb-6"
                >
                    {t('hero.headline1')}<br />
                    <span style={{ WebkitTextStroke: '2px #b026ff', color: 'transparent' }}>{t('hero.headline2')}</span><br />
                    <span className="text-[#b026ff]">{t('hero.headline3')}</span>
                </motion.h1>

                {/* Sub */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-gray-400 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
                >
                    {t('hero.sub')}
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.55 }}
                    className="flex flex-col sm:flex-row items-center gap-4 mb-14"
                >
                    <Link to="/register"
                        className="relative group flex items-center gap-2 px-8 py-4 bg-[#b026ff] rounded-xl text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(176,38,255,0.5)] hover:shadow-[0_0_50px_rgba(176,38,255,0.8)] hover:bg-[#c040ff] transition-all overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2"><Zap size={16} className="fill-white" /> {t('hero.playFree')}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </Link>
                    <Link to="/rules"
                        className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/15 text-gray-300 font-bold text-sm uppercase tracking-widest hover:border-white/30 hover:text-white hover:bg-white/5 transition-all"
                    >
                        {t('hero.howToPlay')} <ChevronRight size={16} />
                    </Link>
                </motion.div>

                {/* Stats row */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.7 }}
                    className="flex items-center gap-8 sm:gap-12 text-center"
                >
                    {[
                        { icon: Users, value: '12K+', labelKey: 'hero.stats.players' },
                        { icon: Trophy, value: '500+', labelKey: 'hero.stats.tournaments' },
                        { icon: Zap, value: '120+', labelKey: 'hero.stats.cards' },
                    ].map(({ icon: Icon, value, labelKey }) => (
                        <div key={labelKey} className="flex flex-col items-center gap-1">
                            <span className="text-2xl sm:text-3xl font-black text-white">{value}</span>
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold uppercase tracking-widest">
                                <Icon size={11} className="text-[#b026ff]" />{t(labelKey)}
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* ── Floating Cards fan ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="relative z-10 mt-20 mb-0 h-[180px] sm:h-[240px] w-full flex items-end justify-center"
                style={{ perspective: 1000 }}
            >
                {DEMO_CARDS.map((card, i) => (
                    <div key={i} style={{ position: 'absolute', left: `calc(50% + ${card.x}px)`, bottom: 0, transform: `scale(${card.scale})`, transformOrigin: 'bottom center' }}>
                        <GameCard card={card} delay={0.4 + i * 0.1} />
                    </div>
                ))}
            </motion.div>

            {/* Bottom fade into next section */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a050f] to-transparent pointer-events-none z-30" />
        </section>
    );
}
