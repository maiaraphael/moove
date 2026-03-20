
import { motion } from 'framer-motion';
import { FileText, ShieldCheck } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import MouseGlow from '../components/ui/MouseGlow';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-[#0a050f] text-gray-300 font-sans selection:bg-[#b026ff]/30 relative overflow-hidden flex flex-col">
            <MouseGlow />
            <Navbar />

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-32 z-10 relative">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#120a1f] border border-white/10 shadow-2xl mb-6 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent group-hover:from-blue-500/30 transition-all" />
                        <FileText className="text-blue-500 w-8 h-8 sm:w-10 sm:h-10 relative z-10" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-500 uppercase tracking-tighter mix-blend-screen drop-shadow-lg mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-gray-400 font-bold max-w-2xl text-lg">
                        USER AGREEMENT 0.9.1 // MANDATORY ACCEPTANCE
                    </p>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-[#120a1f]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col gap-8">
                    <section>
                        <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                            <ShieldCheck className="text-blue-500" size={24} /> 1. Acceptance
                        </h2>
                        <p className="text-gray-400 leading-relaxed mb-4">
                            By plugging into the Moove grid and participating in the Neon City underground tournaments, you explicitly agree to these terms. Failure to comply may result in immediate disconnection, temporary banishment from the grid, or a permanent neural strike on your IP coordinates.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">2. Gameplay Conduct</h2>
                        <p className="text-gray-400 leading-relaxed mb-4">
                            Hacking, exploiting the game state logic, or attempting to artificially inject cards into your hand is strictly prohibited. The Syndicate monitors all packets traversing the game tables. Utilizing a Joker card illegally will trigger an invalid move alert, but bypassing the validation loop entirely will result in a permanent ban.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">3. Virtual Currency</h2>
                        <p className="text-gray-400 leading-relaxed mb-4">
                            All "Credits" (CR) and "Neon Tokens" (NT) generated, won, or acquired in the game are virtual currencies with zero real-world value outside of the Neon City perimeter. The Syndicate reserves the right to wipe, alter, or balance economies as necessary for the survival of the grid.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">4. Liability</h2>
                        <p className="text-gray-400 leading-relaxed mb-4">
                            The creators of Moove and the overseeing Syndicate are not liable for lost connections, missed turns, or virtual currency wiped out due to unexpected grid failures. Play at your own risk.
                        </p>
                    </section>

                    <p className="text-sm text-gray-500 italic mt-8 border-t border-white/10 pt-8">
                        Transmission Terminated. You have been warned.
                    </p>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
