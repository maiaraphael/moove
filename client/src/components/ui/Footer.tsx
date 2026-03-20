import { Hexagon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="w-full bg-[#0a0510] border-t border-white/5 pt-16 pb-8 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

                <div className="md:col-span-2">
                    <div className="flex items-center gap-2 cursor-pointer mb-6">
                        <Hexagon size={24} fill="#b026ff" className="text-[#b026ff]" />
                        <span className="text-xl font-bold tracking-[0.2em] text-white">MOOVE</span>
                    </div>
                    <p className="text-gray-400 text-xs md:text-sm max-w-sm leading-relaxed mb-6">
                        The next generation of competitive card gaming. Built on neural networks, designed for the future of digital combat.
                    </p>
                    <div className="flex items-center gap-3">
                        <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                            <span className="sr-only">Discord</span>
                            D
                        </button>
                        <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                            <span className="sr-only">Twitter</span>
                            X
                        </button>
                        <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                            <span className="sr-only">Forum</span>
                            F
                        </button>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-white uppercase text-sm mb-6 tracking-wider">The Network</h4>
                    <ul className="flex flex-col gap-4 text-sm text-gray-400">
                        <li><Link to="/rules" className="hover:text-[#b026ff] transition-colors">Game Rules</Link></li>
                        <li><Link to="/database" className="hover:text-[#b026ff] transition-colors">Card Database</Link></li>
                        <li><Link to="/lore" className="hover:text-[#b026ff] transition-colors">Lore</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white uppercase text-sm mb-6 tracking-wider">Support</h4>
                    <ul className="flex flex-col gap-4 text-sm text-gray-400">
                        <li><Link to="/status" className="hover:text-[#b026ff] transition-colors">System Status</Link></li>
                        <li><Link to="/privacy" className="hover:text-[#b026ff] transition-colors">Privacy Policy</Link></li>
                        <li><Link to="/terms" className="hover:text-[#b026ff] transition-colors">Terms of Service</Link></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-gray-500 text-xs">
                    © 2026 Moove Gaming Systems. All rights reserved.
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-green-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_5px_rgba(74,222,128,0.8)]" />
                    System Status: Online
                </div>
            </div>
        </footer>
    );
}
