import { motion } from 'framer-motion';
import { BookOpen, Layers, GitMerge, AlertTriangle } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import MouseGlow from '../components/ui/MouseGlow';

export default function Rules() {
    return (
        <div className="min-h-screen bg-[#0a050f] text-gray-300 font-sans selection:bg-[#b026ff]/30 relative overflow-hidden flex flex-col">
            <MouseGlow />
            <Navbar />

            <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-32 z-10 relative">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-16 text-center">
                    <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-[#120a1f] border border-white/10 shadow-2xl mb-6 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#b026ff]/20 to-transparent group-hover:from-[#b026ff]/30 transition-all" />
                        <BookOpen className="text-[#b026ff] w-10 h-10 relative z-10" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#b026ff] uppercase tracking-tighter mix-blend-screen drop-shadow-lg mb-4">
                        Game Protocol
                    </h1>
                    <p className="text-gray-400 font-bold max-w-2xl mx-auto text-lg">
                        The definitive ruleset for the Moove Grid. Master the sets, control the runs, dominate the table.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#120a1f]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
                        <h2 className="text-3xl font-black text-white mb-4 flex items-center gap-3">
                            <Layers className="text-blue-500" size={32} /> Sets (Groups)
                        </h2>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            A valid Set consists of three or four cards of the <strong>same number</strong> but <strong>different colors</strong>.
                        </p>
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex gap-2 justify-center mb-4">
                            <span className="w-10 h-14 bg-red-900 border border-red-500 rounded flex items-center justify-center font-black text-xl text-white shadow-lg">8</span>
                            <span className="w-10 h-14 bg-blue-900 border border-blue-500 rounded flex items-center justify-center font-black text-xl text-white shadow-lg">8</span>
                            <span className="w-10 h-14 bg-green-900 border border-green-500 rounded flex items-center justify-center font-black text-xl text-white shadow-lg">8</span>
                        </div>
                        <p className="text-xs text-gray-500 text-center font-bold">Valid Set Example: Red 8, Blue 8, Green 8</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-[#120a1f]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
                        <h2 className="text-3xl font-black text-white mb-4 flex items-center gap-3">
                            <GitMerge className="text-green-500" size={32} /> Runs (Sequences)
                        </h2>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            A valid Run consists of three or more consecutive numbers of the <strong>same color</strong>.
                        </p>
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex gap-2 justify-center mb-4">
                            <span className="w-10 h-14 bg-yellow-900 border border-yellow-500 rounded flex items-center justify-center font-black text-xl text-white shadow-lg">4</span>
                            <span className="w-10 h-14 bg-yellow-900 border border-yellow-500 rounded flex items-center justify-center font-black text-xl text-white shadow-lg">5</span>
                            <span className="w-10 h-14 bg-yellow-900 border border-yellow-500 rounded flex items-center justify-center font-black text-xl text-white shadow-lg">6</span>
                            <span className="w-10 h-14 bg-yellow-900 border border-yellow-500 rounded flex items-center justify-center font-black text-xl text-white shadow-lg">7</span>
                        </div>
                        <p className="text-xs text-gray-500 text-center font-bold">Valid Run Example: Yellow 4, 5, 6, 7</p>
                    </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-r from-[#b026ff]/20 to-transparent border border-[#b026ff]/30 rounded-3xl p-8 mb-12 relative overflow-hidden">
                    <h2 className="text-3xl font-black text-white mb-4">The Moove Rule</h2>
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                        The core mechanic of the game. Once a valid Set or Run is on the table, it belongs to the grid. On your turn, you can take any cards from existing table combinations, mix them with cards from your hand, and form entirely new Sets and Runs.
                    </p>
                    <div className="bg-black/40 p-4 rounded-xl text-sm text-[#b026ff] font-mono border border-white/10">
                        &gt; The only rule: Before you pass your turn, all cards on the table MUST be part of a valid group of 3 or more. You cannot leave invalid fragments on the grid.
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-r from-red-900/20 to-transparent border border-red-500/30 rounded-3xl p-8 flex items-start gap-4">
                    <AlertTriangle className="text-red-500 shrink-0 mt-1" size={28} />
                    <div>
                        <h2 className="text-xl font-black text-white mb-2">Victory Conditions</h2>
                        <ul className="text-gray-400 space-y-2 list-disc pl-4 text-sm">
                            <li>The first runner to empty their rack completely triggers the Endgame Protocol and wins the match.</li>
                            <li>If the central Deck runs out and no player can make a move, the runner with the lowest sum of card points left in their hand wins.</li>
                            <li>A Joker left in your hand at the end of the game counts as 20 penalty points!</li>
                        </ul>
                    </div>
                </motion.div>

            </main>

            <Footer />
        </div>
    );
}
