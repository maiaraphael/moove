import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Diamond, Zap, Flame } from 'lucide-react';

interface LoginBonus {
    xp: number;
    credits: number;
    gems: number;
    streak: number;
}

interface Props {
    bonus: LoginBonus | null;
    onClose: () => void;
}

const DAY_LABELS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7+'];

export default function LoginBonusModal({ bonus, onClose }: Props) {
    if (!bonus) return null;

    const streakDay = Math.min(bonus.streak, 7);

    return (
        <AnimatePresence>
            {bonus && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="bg-[#120a1f] border border-[#b026ff]/30 rounded-2xl w-full max-w-sm shadow-[0_0_80px_rgba(176,38,255,0.25)] overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Top glow banner */}
                        <div className="relative h-32 bg-gradient-to-b from-[#b026ff]/30 to-transparent flex flex-col items-center justify-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                                className="w-16 h-16 rounded-full bg-[#b026ff]/20 border-2 border-[#b026ff]/50 flex items-center justify-center"
                            >
                                <Flame size={32} className="text-[#b026ff] fill-[#b026ff]/30" />
                            </motion.div>
                        </div>

                        <div className="px-6 pb-6 -mt-2 text-center">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Daily Bonus!</h2>
                            <p className="text-gray-400 text-sm mt-1">You logged in {bonus.streak} day{bonus.streak !== 1 ? 's' : ''} in a row</p>

                            {/* Streak days bar */}
                            <div className="flex items-center justify-center gap-1.5 mt-4 mb-5">
                                {DAY_LABELS.map((label, i) => {
                                    const day = i + 1;
                                    const isActive = day <= streakDay;
                                    const isCurrent = day === streakDay;
                                    return (
                                        <div key={label} className="flex flex-col items-center gap-1">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                                                isCurrent
                                                    ? 'bg-[#b026ff] text-white shadow-[0_0_12px_rgba(176,38,255,0.6)] scale-110'
                                                    : isActive
                                                    ? 'bg-[#b026ff]/40 text-white'
                                                    : 'bg-white/5 text-gray-600'
                                            }`}>
                                                {day < streakDay ? '✓' : day}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Rewards */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                    className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex flex-col items-center gap-1.5"
                                >
                                    <Zap size={18} className="text-blue-400" />
                                    <span className="text-lg font-black text-white">+{bonus.xp}</span>
                                    <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">XP</span>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                                    className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex flex-col items-center gap-1.5"
                                >
                                    <CreditCard size={18} className="text-yellow-400" />
                                    <span className="text-lg font-black text-white">+{bonus.credits}</span>
                                    <span className="text-[9px] text-yellow-400 font-bold uppercase tracking-wider">Credits</span>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                    className={`border rounded-xl p-3 flex flex-col items-center gap-1.5 ${bonus.gems > 0 ? 'bg-[#b026ff]/10 border-[#b026ff]/20' : 'bg-white/3 border-white/5 opacity-40'}`}
                                >
                                    <Diamond size={18} className={bonus.gems > 0 ? 'text-[#b026ff]' : 'text-gray-600'} />
                                    <span className="text-lg font-black text-white">{bonus.gems > 0 ? `+${bonus.gems}` : '–'}</span>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${bonus.gems > 0 ? 'text-[#b026ff]' : 'text-gray-600'}`}>
                                        {bonus.gems > 0 ? 'Gems' : 'Day 3+'}
                                    </span>
                                </motion.div>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={onClose}
                                className="w-full py-3 rounded-xl bg-[#b026ff] hover:bg-[#c95bff] text-white font-black uppercase tracking-[0.1em] transition-colors shadow-[0_0_25px_rgba(176,38,255,0.4)]"
                            >
                                Collect Rewards
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
