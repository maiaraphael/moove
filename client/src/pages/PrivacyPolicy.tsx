
import { motion } from 'framer-motion';
import { ShieldAlert, Fingerprint } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import MouseGlow from '../components/ui/MouseGlow';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#0a050f] text-gray-300 font-sans selection:bg-[#b026ff]/30 relative overflow-hidden flex flex-col">
            <MouseGlow />
            <Navbar />

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-32 z-10 relative">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#120a1f] border border-white/10 shadow-2xl mb-6 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#b026ff]/20 to-transparent group-hover:from-[#b026ff]/30 transition-all" />
                        <Fingerprint className="text-[#b026ff] w-8 h-8 sm:w-10 sm:h-10 relative z-10" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#b026ff] uppercase tracking-tighter mix-blend-screen drop-shadow-lg mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-gray-400 font-bold max-w-2xl text-lg">
                        DATA SECURITY DIRECTIVE OVERRIDE: 0x992B
                    </p>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-[#120a1f]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col gap-8">
                    <section>
                        <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                            <ShieldAlert className="text-[#b026ff]" size={24} /> 1. Data Collection
                        </h2>
                        <p className="text-gray-400 leading-relaxed mb-4">
                            We collect the minimal data required to connect you to the Neon City network grid. This includes your connection node (IP address), your chosen alias (Name), and your digital signature (Authentication token). Your neural patterns and gameplay metrics are collected anonymously to optimize matchmaking.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">2. Data Usage</h2>
                        <p className="text-gray-400 leading-relaxed mb-4">
                            Your digital signature is used exclusively to maintain connection stability during high-stakes underground tournaments. We do not sell your data to megacorporations. The Syndicate ensures that all records are securely encrypted using SHA-256 neural encryptions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">3. Data Retention</h2>
                        <p className="text-gray-400 leading-relaxed mb-4">
                            Once your connection to the grid is terminated and your account is wiped, all traces of your existence on our servers are zero-filled. Active tournament data is retained for leaderboards and bragging rights in the neon underbelly.
                        </p>
                    </section>

                    <p className="text-sm text-gray-500 italic mt-8 border-t border-white/10 pt-8">
                        Last Updated: Cycle 82.9.2 (2026) // End of file.
                    </p>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
