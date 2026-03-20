import { motion } from 'framer-motion';
import { Crosshair, Users, Map } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import MouseGlow from '../components/ui/MouseGlow';

export default function Lore() {
    return (
        <div className="min-h-screen bg-[#0a050f] text-gray-300 font-sans selection:bg-[#b026ff]/30 relative overflow-hidden flex flex-col">
            <MouseGlow />
            <Navbar />

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-32 z-10 relative">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-16 text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-[#b026ff] uppercase tracking-tighter mix-blend-screen drop-shadow-2xl mb-4">
                        The Syndicates of<br />Neon City
                    </h1>
                    <p className="text-gray-400 font-bold max-w-2xl mx-auto text-lg">
                        Dive into the history of the underground Moove tournaments and the data-runners who play them.
                    </p>
                </motion.div>

                <div className="space-y-12">
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="flex gap-6 items-start">
                        <div className="w-16 h-16 shrink-0 rounded-2xl bg-red-500/20 border border-red-500/50 flex items-center justify-center mt-2 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                            <Map className="text-red-500" size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white mb-3">Neon City Underbelly</h2>
                            <p className="text-lg text-gray-400 leading-relaxed font-medium">
                                In 2084, Megacorporations control the physical world, but the digital grid belongs to the runners. Neon City is a sprawling megalopolis where the sun never sets, thanks to the endless glow of holographic advertisements. In its deepest sectors, beyond corporate firewalls, lies the true heart of the city: The Underground. Here, disputes are no longer settled with violence, but with complex algorithms and high-stakes deck manipulation.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex gap-6 items-start flex-row-reverse text-right">
                        <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#b026ff]/20 border border-[#b026ff]/50 flex items-center justify-center mt-2 shadow-[0_0_30px_rgba(176,38,255,0.3)]">
                            <Crosshair className="text-[#b026ff]" size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white mb-3">The Moove Protocol</h2>
                            <p className="text-lg text-gray-400 leading-relaxed font-medium">
                                Originally a data decryption tool designed by a rogue AI known as the "Joker," the Moove Protocol evolved into a competitive card game. It requires players to arrange data packets (cards) into logical sequences (Runs) and identical hashes across different spectrums (Sets). The ability to instantly manipulate the grid—taking existing data blocks and tearing them apart to form new, advantageous structures—became the ultimate test of a runner's intellect.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex gap-6 items-start">
                        <div className="w-16 h-16 shrink-0 rounded-2xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center mt-2 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                            <Users className="text-blue-500" size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white mb-3">The Syndicate Tournaments</h2>
                            <p className="text-lg text-gray-400 leading-relaxed font-medium">
                                To prevent unstructured chaos, shadowy groups known as the Syndicates formed organized tournaments. Winning a high-stakes Moove tournament doesn't just grant Credits (CR) and Neon Tokens (NT)—it grants respect, security codes, and territorial control over the grid's bandwidth.
                            </p>
                        </div>
                    </motion.div>
                </div>

            </main>

            <Footer />
        </div>
    );
}
