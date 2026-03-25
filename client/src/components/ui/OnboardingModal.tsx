import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Layers, GitMerge, Shuffle, Trophy, Star, Zap, Combine } from 'lucide-react';

interface Props {
    onClose: () => void;
}

const Card = ({ num, color }: { num: string | number; color: string }) => {
    const palette: Record<string, { bg: string; border: string; text: string }> = {
        red:    { bg: 'bg-red-900/70',    border: 'border-red-500',    text: 'text-red-300' },
        blue:   { bg: 'bg-blue-900/70',   border: 'border-blue-500',   text: 'text-blue-300' },
        green:  { bg: 'bg-green-900/70',  border: 'border-green-500',  text: 'text-green-300' },
        yellow: { bg: 'bg-yellow-900/70', border: 'border-yellow-400', text: 'text-yellow-300' },
        joker:  { bg: 'bg-[#b026ff]/30',  border: 'border-[#b026ff]',  text: 'text-[#d47fff]' },
    };
    const p = palette[color] ?? palette.red;
    return (
        <span className={`w-9 h-13 min-w-[2.25rem] h-[3.25rem] rounded-lg ${p.bg} border-2 ${p.border} flex items-center justify-center font-black text-lg ${p.text} shadow-lg`}>
            {num}
        </span>
    );
};

export default function OnboardingModal({ onClose }: Props) {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const [dir, setDir] = useState(1);

    const slides = [
        {
            icon: <Star size={36} className="text-[#b026ff]" />,
            title: t('onboarding.s0_title'),
            subtitle: t('onboarding.s0_sub'),
            body: (
                <div className="text-gray-300 text-sm leading-relaxed space-y-3">
                    <p dangerouslySetInnerHTML={{ __html:
                        t('onboarding.s0_p1')
                            .replace(/(empty your hand|esvaziar sua mão|vaciar tu mano)/i, '<strong class="text-white">$1</strong>')
                    }} />
                    <p dangerouslySetInnerHTML={{ __html:
                        t('onboarding.s0_p2')
                            .replace(/(numbered cards from 1 to 13|cartas numeradas de 1 a 13|cartas numeradas del 1 al 13)/i, '<strong class="text-white">$1</strong>')
                            .replace(/(Jokers?(?:\s*\(Wildcards?\))?|Coringas?\s*\(Jokers?\)?)/i, '<strong class="text-[#d47fff]">$1</strong>')
                    }} />
                    <div className="flex items-center gap-2 mt-4 justify-center flex-wrap">
                        <Card num={7} color="red" />
                        <Card num={7} color="blue" />
                        <Card num={7} color="green" />
                        <Card num={7} color="yellow" />
                        <Card num="★" color="joker" />
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-2">{t('onboarding.s0_note')}</p>
                </div>
            ),
        },
        {
            icon: <Layers size={36} className="text-blue-400" />,
            title: t('onboarding.s1_title'),
            subtitle: t('onboarding.s1_sub'),
            body: (
                <div className="text-gray-300 text-sm leading-relaxed space-y-3">
                    <p dangerouslySetInnerHTML={{ __html:
                        t('onboarding.s1_p1')
                            .replace(/(Set)/g, '<strong class="text-white">$1</strong>')
                            .replace(/(3 or 4 cards|3 ou 4 cartas|3 o 4 cartas)/i, '<strong class="text-white">$1</strong>')
                    }} />
                    <div className="bg-black/40 rounded-xl p-4 border border-white/10 flex flex-col items-center gap-3">
                        <div className="flex gap-2">
                            <Card num={8} color="red" />
                            <Card num={8} color="blue" />
                            <Card num={8} color="green" />
                        </div>
                        <span className="text-xs text-green-400 font-bold">{t('onboarding.s1_valid')}</span>
                    </div>
                    <div className="bg-black/40 rounded-xl p-4 border border-red-500/20 flex flex-col items-center gap-3">
                        <div className="flex gap-2">
                            <Card num={5} color="red" />
                            <Card num={5} color="red" />
                            <Card num={5} color="blue" />
                        </div>
                        <span className="text-xs text-red-400 font-bold">{t('onboarding.s1_invalid')}</span>
                    </div>
                </div>
            ),
        },
        {
            icon: <GitMerge size={36} className="text-green-400" />,
            title: t('onboarding.s2_title'),
            subtitle: t('onboarding.s2_sub'),
            body: (
                <div className="text-gray-300 text-sm leading-relaxed space-y-3">
                    <p dangerouslySetInnerHTML={{ __html:
                        t('onboarding.s2_p1')
                            .replace(/(Run)/g, '<strong class="text-white">$1</strong>')
                            .replace(/(3 or more|3 ou mais|3 o más)/i, '<strong class="text-white">$1</strong>')
                    }} />
                    <div className="bg-black/40 rounded-xl p-4 border border-white/10 flex flex-col items-center gap-3">
                        <div className="flex gap-2">
                            <Card num={4} color="yellow" />
                            <Card num={5} color="yellow" />
                            <Card num={6} color="yellow" />
                            <Card num={7} color="yellow" />
                        </div>
                        <span className="text-xs text-green-400 font-bold">{t('onboarding.s2_valid')}</span>
                    </div>
                    <div className="bg-black/40 rounded-xl p-4 border border-red-500/20 flex flex-col items-center gap-3">
                        <div className="flex gap-2">
                            <Card num={3} color="blue" />
                            <Card num={4} color="green" />
                            <Card num={5} color="blue" />
                        </div>
                        <span className="text-xs text-red-400 font-bold">{t('onboarding.s2_invalid')}</span>
                    </div>
                </div>
            ),
        },
        {
            icon: <Shuffle size={36} className="text-[#b026ff]" />,
            title: t('onboarding.s3_title'),
            subtitle: t('onboarding.s3_sub'),
            body: (
                <div className="text-gray-300 text-sm leading-relaxed space-y-3">
                    <p>{t('onboarding.s3_p1')}</p>
                    <p dangerouslySetInnerHTML={{ __html:
                        t('onboarding.s3_p2')
                            .replace(/(take cards from|pegar cartas de|tomar cartas de)/i, '<strong class="text-[#d47fff]">$1</strong>')
                    }} />
                    <div className="bg-[#b026ff]/10 border border-[#b026ff]/30 rounded-xl p-4 text-xs font-mono text-[#d47fff]">
                        {t('onboarding.s3_warn')}
                    </div>
                    <p className="text-xs text-gray-500">{t('onboarding.s3_joker')}</p>
                </div>
            ),
        },
        {
            icon: <Trophy size={36} className="text-yellow-400" />,
            title: t('onboarding.s4_title'),
            subtitle: t('onboarding.s4_sub'),
            body: (
                <div className="text-gray-300 text-sm leading-relaxed space-y-3">
                    <p dangerouslySetInnerHTML={{ __html:
                        t('onboarding.s4_p1')
                            .replace(/(You win|Você vence|Ganas)/i, '<strong class="text-white">$1</strong>')
                    }} />
                    <p dangerouslySetInnerHTML={{ __html:
                        t('onboarding.s4_p2')
                            .replace(/(20 penalty points|20 pontos de penalidade|20 puntos de penalización)/i, '<strong class="text-red-400">$1</strong>')
                    }} />
                    <div className="bg-black/40 rounded-xl p-3 border border-white/10 space-y-2 text-xs">
                        <div className="flex justify-between"><span>{t('onboarding.s4_r1')}</span><span className="text-green-400">{t('onboarding.s4_r1v')}</span></div>
                        <div className="flex justify-between"><span>{t('onboarding.s4_r2')}</span><span className="text-red-400">{t('onboarding.s4_r2v')}</span></div>
                        <div className="flex justify-between"><span>{t('onboarding.s4_r3')}</span><span className="text-blue-400">{t('onboarding.s4_r3v')}</span></div>
                    </div>
                </div>
            ),
        },
        {
            icon: <Combine size={36} className="text-[#b026ff]" />,
            title: t('onboarding.s5_title'),
            subtitle: t('onboarding.s5_sub'),
            body: (
                <div className="text-gray-300 text-sm leading-relaxed space-y-3">
                    <p dangerouslySetInnerHTML={{ __html:
                        t('onboarding.s5_p1')
                            .replace(/(Multi Plays)/g, '<strong class="text-white">$1</strong>')
                    }} />
                    <div className="bg-[#b026ff]/10 border border-[#b026ff]/30 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-bold text-[#d47fff] uppercase tracking-wider">{t('onboarding.s5_how')}</p>
                        <ol className="space-y-1.5 text-xs text-gray-300 list-decimal pl-4">
                            <li dangerouslySetInnerHTML={{ __html: t('onboarding.s5_step1').replace(/(Multi Plays)/g, '<strong class="text-white">$1</strong>') }} />
                            <li>{t('onboarding.s5_step2')}</li>
                            <li>{t('onboarding.s5_step3')}</li>
                            <li dangerouslySetInnerHTML={{ __html: t('onboarding.s5_step4').replace(/(Confirm|Confirmar)/g, '<strong class="text-white">$1</strong>') }} />
                        </ol>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-200">
                        {t('onboarding.s5_tip')}
                    </div>
                </div>
            ),
        },
        {
            icon: <Zap size={36} className="text-yellow-300" />,
            title: t('onboarding.s6_title'),
            subtitle: t('onboarding.s6_sub'),
            body: (
                <div className="text-gray-300 text-sm leading-relaxed space-y-3">
                    <ul className="space-y-2">
                        {[
                            ['🃏', t('onboarding.s6_tip1')],
                            ['👀', t('onboarding.s6_tip2')],
                            ['⚡', t('onboarding.s6_tip3')],
                            ['🎯', t('onboarding.s6_tip4')],
                            ['📚', t('onboarding.s6_tip5')],
                        ].map(([emoji, tip]) => (
                            <li key={tip as string} className="flex items-start gap-2">
                                <span>{emoji}</span>
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ),
        },
    ];

    const total = slides.length;
    const current = slides[step];

    const goNext = () => {
        if (step === total - 1) { onClose(); return; }
        setDir(1);
        setStep(s => s + 1);
    };

    const goPrev = () => {
        if (step === 0) return;
        setDir(-1);
        setStep(s => s - 1);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.88, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 24 }}
                transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                className="relative bg-[#0d0619] border border-[#b026ff]/30 rounded-2xl w-full max-w-md shadow-[0_0_80px_rgba(176,38,255,0.2)] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Top gradient bar */}
                <div className="h-1 bg-gradient-to-r from-[#b026ff] via-pink-500 to-yellow-400" style={{ width: `${((step + 1) / total) * 100}%`, transition: 'width 0.3s ease' }} />

                {/* Skip */}
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10">
                    <X size={16} />
                </button>

                {/* Slide content */}
                <div className="px-6 pt-6 pb-2 min-h-[420px] flex flex-col">
                    <AnimatePresence mode="wait" custom={dir}>
                        <motion.div
                            key={step}
                            custom={dir}
                            initial={{ x: dir * 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: dir * -40, opacity: 0 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="flex flex-col flex-1"
                        >
                            <div className="flex flex-col items-center text-center mb-5">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-lg">
                                    {current.icon}
                                </div>
                                <h2 className="text-xl font-black text-white">{current.title}</h2>
                                <p className="text-xs text-gray-400 mt-1 font-medium">{current.subtitle}</p>
                            </div>
                            <div className="flex-1">{current.body}</div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 flex items-center justify-between border-t border-white/5">
                    {/* Dots */}
                    <div className="flex gap-1.5">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => { setDir(i > step ? 1 : -1); setStep(i); }}
                                className={`rounded-full transition-all ${i === step ? 'w-5 h-2 bg-[#b026ff]' : 'w-2 h-2 bg-white/20 hover:bg-white/40'}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {step > 0 && (
                            <button onClick={goPrev} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-bold">
                                <ChevronLeft size={16} /> {t('common.back')}
                            </button>
                        )}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={goNext}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-black bg-[#b026ff] hover:bg-[#c95bff] text-white transition-colors shadow-[0_0_15px_rgba(176,38,255,0.35)]"
                        >
                            {step === total - 1 ? t('onboarding.s6_start') : t('common.next')}
                            {step < total - 1 && <ChevronRight size={16} />}
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
