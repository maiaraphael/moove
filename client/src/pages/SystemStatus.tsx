import { motion } from 'framer-motion';
import { Activity, CheckCircle2, ShieldAlert } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import MouseGlow from '../components/ui/MouseGlow';

const SERVICES = [
    { name: 'Core Matchmaking Grid', status: 'operational', ping: '12ms' },
    { name: 'Neural Database Sync', status: 'operational', ping: '18ms' },
    { name: 'Security Gateway', status: 'warning', ping: '45ms', message: 'High load detected in Sector 4' },
    { name: 'Global CDN Nodes', status: 'operational', ping: '20ms' },
    { name: 'Asset Delivery System', status: 'operational', ping: '8ms' },
    { name: 'Card Logic Engine', status: 'operational', ping: '15ms' }
];

export default function SystemStatus() {
    return (
        <div className="min-h-screen bg-[#0a050f] text-gray-300 font-sans selection:bg-[#b026ff]/30 relative overflow-hidden flex flex-col">
            <MouseGlow />
            <Navbar />

            <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-32 z-10 relative">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-12 flex items-center justify-between flex-wrap gap-6">
                    <div>
                        <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#120a1f] border border-white/10 shadow-2xl mb-6 relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent group-hover:from-green-500/30 transition-all" />
                            <Activity className="text-green-500 w-8 h-8 sm:w-10 sm:h-10 relative z-10" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-green-500 uppercase tracking-tighter mix-blend-screen drop-shadow-lg mb-4">
                            System Status
                        </h1>
                        <p className="text-gray-400 font-bold max-w-2xl text-lg flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> All primary systems operational
                        </p>
                    </div>

                    <div className="bg-[#120a1f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex gap-8">
                        <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Grid Uptime</p>
                            <p className="text-xl text-white font-mono">99.98%</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Active Runners</p>
                            <p className="text-xl text-white font-mono">1,402</p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {SERVICES.map((service, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`bg-[#120a1f]/80 backdrop-blur-xl border rounded-2xl p-6 shadow-xl relative overflow-hidden
                                ${service.status === 'operational' ? 'border-green-500/20' : 'border-yellow-500/30'}
                            `}
                        >
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${service.status === 'operational' ? 'green' : 'yellow'}-500 to-transparent opacity-50`} />

                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-lg font-black text-white">{service.name}</h3>
                                {service.status === 'operational'
                                    ? <CheckCircle2 className="text-green-500" size={24} />
                                    : <ShieldAlert className="text-yellow-500" size={24} />
                                }
                            </div>

                            <div className="flex justify-between border-t border-white/5 pt-4 mt-auto">
                                <p className="text-xs font-bold font-mono text-gray-500">Latency</p>
                                <p className="text-xs font-bold font-mono text-[#b026ff]">{service.ping}</p>
                            </div>

                            {service.message && (
                                <p className="text-xs text-yellow-500 font-bold mt-2 bg-yellow-500/10 p-2 rounded">
                                    {service.message}
                                </p>
                            )}
                        </motion.div>
                    ))}
                </div>

            </main>

            <Footer />
        </div>
    );
}
