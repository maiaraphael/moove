import { motion } from 'framer-motion';
import { Database, Zap, Hash, Palette } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import MouseGlow from '../components/ui/MouseGlow';

const COLORS = [
    { name: 'Red', hex: '#ef4444' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Green', hex: '#10b981' },
    { name: 'Yellow', hex: '#eab308' }
];

export default function CardDatabase() {
    return (
        <div className="min-h-screen bg-[#0a050f] text-gray-300 font-sans selection:bg-[#b026ff]/30 relative overflow-hidden flex flex-col">
            <MouseGlow />
            <Navbar />

            <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-32 z-10 relative">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-16 text-center">
                    <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-[#120a1f] border border-white/10 shadow-2xl mb-6 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent group-hover:from-yellow-500/30 transition-all" />
                        <Database className="text-yellow-500 w-10 h-10 relative z-10" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-yellow-500 uppercase tracking-tighter mix-blend-screen drop-shadow-lg mb-4">
                        Card Database
                    </h1>
                    <p className="text-gray-400 font-bold max-w-2xl mx-auto text-lg">
                        Complete manifest of all 85 encrypted data packets (cards) spanning the Moove network protocol.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#120a1f]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
                        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                            <Palette className="text-[#b026ff]" /> The 4 Core Spectrums
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {COLORS.map(c => (
                                <div key={c.name} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 bg-black/40">
                                    <div className="w-12 h-12 rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] border-2 border-white/20" style={{ backgroundColor: c.hex, boxShadow: `0 0 20px ${c.hex}80` }} />
                                    <span className="font-bold uppercase tracking-widest text-xs">{c.name}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-[#120a1f]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl flex flex-col justify-center">
                        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                            <Hash className="text-blue-500" /> Number Values
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                <div key={n} className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center font-black text-xl hover:bg-white/10 transition-colors">
                                    {n}
                                </div>
                            ))}
                        </div>
                        <p className="text-gray-400 mt-6 text-sm">Each number appears <strong>twice</strong> in each of the 4 spectrums. (10 numbers × 4 spectrums × 2 copies = 80 cards).</p>
                    </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-r from-red-900/20 to-transparent border border-red-500/30 rounded-3xl p-8 flex items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />
                    <div className="w-24 h-32 bg-[#120a1f] border-2 border-red-500 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.5)] flex items-center justify-center flex-shrink-0 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=200&auto=format&fit=crop')] opacity-20 mix-blend-overlay group-hover:opacity-40 transition-opacity" />
                        <Zap size={48} className="text-red-500 relative z-10 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                            The Jokers <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold uppercase tracking-widest">Master Key</span>
                        </h2>
                        <p className="text-gray-300 text-lg leading-relaxed">
                            There are exactly <strong>5 Jokers</strong> injected into the system. They act as wildcards, capable of spoofing any number or color required to validate a sequence. Extremely powerful, yet dangerous—leaving a Joker unused in your hand when the game ends adds 20 penalty points to your neural score.
                        </p>
                    </div>
                </motion.div>

            </main>

            <Footer />
        </div>
    );
}
