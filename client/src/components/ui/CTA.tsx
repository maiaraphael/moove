import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ChevronRight } from 'lucide-react';

// Mini card for the background decoration
function MiniCard({ num, color, style }: { num: string; color: string; style: React.CSSProperties }) {
    return (
        <div className="absolute w-16 h-24 rounded-xl border-2 flex items-center justify-center pointer-events-none select-none"
            style={{
                borderColor: color,
                background: 'linear-gradient(135deg, #1a0d2e, #0a050f)',
                boxShadow: `0 0 20px ${color}44`,
                opacity: 0.4,
                ...style
            }}>
            <span className="text-2xl font-black" style={{ color, textShadow: `0 0 10px ${color}` }}>{num}</span>
        </div>
    );
}

export default function CTA() {
    return (
        <section className="relative w-full py-32 overflow-hidden">
            <div className="absolute inset-0 bg-[#0c0618]" />

            {/* Glow center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[700px] h-[400px] bg-[#b026ff]/12 rounded-full blur-[120px]" />
            </div>

            {/* Decorative scattered cards */}
            <MiniCard num="7" color="#22c55e" style={{ top: '12%', left: '5%', rotate: '-20deg' }} />
            <MiniCard num="4" color="#eab308" style={{ top: '55%', left: '8%', rotate: '15deg' }} />
            <MiniCard num="J" color="#b026ff" style={{ top: '8%', right: '7%', rotate: '18deg' }} />
            <MiniCard num="2" color="#ef4444" style={{ top: '60%', right: '5%', rotate: '-14deg' }} />
            <MiniCard num="9" color="#3b82f6" style={{ bottom: '10%', left: '20%', rotate: '8deg' }} />
            <MiniCard num="6" color="#d685ff" style={{ bottom: '8%', right: '22%', rotate: '-10deg' }} />

            {/* Horizontal lines */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#b026ff]/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#b026ff]/30 to-transparent" />

            <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="text-[11px] font-black tracking-[0.3em] text-[#b026ff] uppercase mb-6 block">The Table is Set</span>

                    <h2 className="text-5xl md:text-7xl font-black italic text-white uppercase leading-[0.88] tracking-tighter mb-8">
                        YOUR NEXT<br />
                        <span style={{ WebkitTextStroke: '2px #b026ff', color: 'transparent' }}>VICTORY</span><br />
                        AWAITS.
                    </h2>

                    <p className="text-gray-400 text-base md:text-lg max-w-lg mx-auto leading-relaxed mb-10">
                        Join thousands of players already competing. Create your account in seconds — no download required.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register"
                            className="relative group flex items-center gap-2 px-10 py-4 bg-[#b026ff] rounded-xl text-white font-black text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(176,38,255,0.5)] hover:shadow-[0_0_60px_rgba(176,38,255,0.8)] hover:bg-[#c040ff] transition-all overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2"><Zap size={16} className="fill-white" /> Create Free Account</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        </Link>
                        <Link to="/login"
                            className="flex items-center gap-1 text-sm text-gray-400 font-semibold hover:text-white transition-colors"
                        >
                            Already have an account? <span className="text-[#b026ff] font-black">Log In</span> <ChevronRight size={14} />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
