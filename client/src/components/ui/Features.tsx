import { motion } from 'framer-motion';
import { Layers, Swords, Trophy, Shirt, Users, Zap } from 'lucide-react';

const FEATURES = [
    {
        icon: Swords,
        color: '#ef4444',
        glow: 'rgba(239,68,68,0.3)',
        tag: 'Core Gameplay',
        title: 'Real-Time Multiplayer Duels',
        description: 'Face opponents live in turn-based battles. Play cards, form sets, and be the first to empty your hand before the time runs out.',
    },
    {
        icon: Layers,
        color: '#b026ff',
        glow: 'rgba(176,38,255,0.3)',
        tag: 'Deck Strategy',
        title: 'Outsmart Your Opponents',
        description: 'Every game is different. Manage your hand, block your rivals from going out, and use JOKER cards to turn the tide at the last second.',
    },
    {
        icon: Trophy,
        color: '#eab308',
        glow: 'rgba(234,179,8,0.3)',
        tag: 'Competitive',
        title: 'Ranked Seasons & Tournaments',
        description: 'Climb the global MMR ladder, unlock exclusive seasonal rewards, and compete in head-to-head tournaments for rare prizes.',
    },
    {
        icon: Shirt,
        color: '#22c55e',
        glow: 'rgba(34,197,94,0.3)',
        tag: 'Cosmetics',
        title: 'Rare Card Sleeves & Pets',
        description: 'Stand out at the table with Legendary card sleeves, animated pets, glowing profile frames and exclusive avatar art.',
    },
    {
        icon: Users,
        color: '#3b82f6',
        glow: 'rgba(59,130,246,0.3)',
        tag: 'Social',
        title: 'Private Rooms & Friends',
        description: 'Create private lobbies, invite friends and rematch rivals. 2-player and 4-player modes for fast or intense sessions.',
    },
    {
        icon: Zap,
        color: '#d685ff',
        glow: 'rgba(214,133,255,0.3)',
        tag: 'Progression',
        title: 'Battle Pass & Daily XP',
        description: 'Earn XP every match, level up your Battle Pass and unlock exclusive rewards just by playing every day.',
    },
];

export default function Features() {
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
                    <span className="text-[11px] font-black tracking-[0.3em] text-[#b026ff] uppercase mb-4 block">Why Players Stay</span>
                    <h2 className="text-4xl md:text-5xl font-black italic text-white uppercase tracking-tight leading-tight">
                        Everything You Need<br /><span className="text-[#b026ff]">to Win.</span>
                    </h2>
                </motion.div>

                {/* Feature grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {FEATURES.map((f, i) => {
                        const Icon = f.icon;
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
                                        <span className="text-[10px] font-black tracking-[0.2em] uppercase mb-1.5 block" style={{ color: f.color }}>{f.tag}</span>
                                        <h3 className="text-base font-black text-white mb-2 leading-tight">{f.title}</h3>
                                        <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
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
