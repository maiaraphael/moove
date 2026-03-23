import { motion } from 'framer-motion';
import { Layers, Swords, Trophy, Shirt, Users, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FEATURE_ICONS = [
    { icon: Swords, color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
    { icon: Layers, color: '#b026ff', glow: 'rgba(176,38,255,0.3)' },
    { icon: Trophy, color: '#eab308', glow: 'rgba(234,179,8,0.3)' },
    { icon: Shirt, color: '#22c55e', glow: 'rgba(34,197,94,0.3)' },
    { icon: Users, color: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
    { icon: Zap, color: '#d685ff', glow: 'rgba(214,133,255,0.3)' },
];

export default function Features() {
    const { t } = useTranslation();
    const items = t('features.items', { returnObjects: true }) as Array<{ tag: string; title: string; description: string }>;
    return (
        <section className="relative w-full py-28 overflow-hidden">
            <div className="absolute inset-0 bg-[#0a050f]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-[#b026ff]/50" />

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-20"
                >
                    <span className="text-[11px] font-black tracking-[0.3em] text-[#b026ff] uppercase mb-4 block">{t('features.sectionTag')}</span>
                    <h2 className="text-4xl md:text-5xl font-black italic text-white uppercase tracking-tight leading-tight">
                        {t('features.sectionTitle')}<br /><span className="text-[#b026ff]">{t('features.sectionTitleAccent')}</span>
                    </h2>
                </motion.div>

                {/* Feature grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {FEATURE_ICONS.map((f, i) => {
                        const Icon = f.icon;
                        const item = items[i] ?? { tag: '', title: '', description: '' };
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.08 }}
                                className="group relative p-6 rounded-2xl border border-white/8 hover:border-white/20 transition-all duration-300 overflow-hidden cursor-default"
                                style={{ background: 'linear-gradient(135deg, #13092090, #0a050f)' }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 40px ${f.glow}`)}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                            >
                                {/* Top shimmer line colored by feature */}
                                <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: `linear-gradient(90deg, transparent, ${f.color}, transparent)` }} />

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                                        style={{ background: `${f.color}18`, boxShadow: `0 0 20px ${f.glow}` }}>
                                        <Icon size={22} style={{ color: f.color }} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black tracking-[0.2em] uppercase mb-1.5 block" style={{ color: f.color }}>{item.tag}</span>
                                        <h3 className="text-base font-black text-white mb-2 leading-tight">{item.title}</h3>
                                        <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
