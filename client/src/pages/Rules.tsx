import { useState } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Layers, GitMerge, Shuffle, Trophy, Lightbulb, ChevronRight } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import MouseGlow from '../components/ui/MouseGlow';
import OnboardingModal from '../components/ui/OnboardingModal';

const Card = ({ num, color }: { num: string | number; color: string }) => {
    const palette: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
        red:    { bg: 'bg-red-900/70',    border: 'border-red-500',    text: 'text-red-300',    shadow: 'shadow-red-900/60' },
        blue:   { bg: 'bg-blue-900/70',   border: 'border-blue-500',   text: 'text-blue-300',   shadow: 'shadow-blue-900/60' },
        green:  { bg: 'bg-green-900/70',  border: 'border-green-500',  text: 'text-green-300',  shadow: 'shadow-green-900/60' },
        yellow: { bg: 'bg-yellow-900/70', border: 'border-yellow-400', text: 'text-yellow-300', shadow: 'shadow-yellow-900/60' },
        joker:  { bg: 'bg-[#b026ff]/30',  border: 'border-[#b026ff]',  text: 'text-[#d47fff]',  shadow: 'shadow-purple-900/60' },
    };
    const p = palette[color] ?? palette.red;
    return (
        <motion.span
            whileHover={{ y: -4, scale: 1.08 }}
            className={`w-10 h-[3.5rem] rounded-lg ${p.bg} border-2 ${p.border} flex items-center justify-center font-black text-xl ${p.text} shadow-lg ${p.shadow} cursor-default select-none`}
        >
            {num}
        </motion.span>
    );
};

const TABS = [
    { id: 'intro',   label: 'Visão Geral',  icon: <BookOpen size={16} /> },
    { id: 'sets',    label: 'Sets',          icon: <Layers size={16} /> },
    { id: 'runs',    label: 'Runs',          icon: <GitMerge size={16} /> },
    { id: 'moove',   label: 'Regra Moove',   icon: <Shuffle size={16} /> },
    { id: 'victory', label: 'Vitória',        icon: <Trophy size={16} /> },
    { id: 'tips',    label: 'Dicas',          icon: <Lightbulb size={16} /> },
] as const;

type TabId = typeof TABS[number]['id'];

function IntroTab() {
    return (
        <div className="space-y-8">
            <p className="text-gray-300 text-lg leading-relaxed">
                Moove é um jogo de cartas estratégico para <strong className="text-white">2 a 4 jogadores</strong>. O objetivo é{' '}
                <strong className="text-[#b026ff]">esvaziar sua mão</strong> antes dos adversários, formando grupos válidos de cartas na mesa.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { title: 'O baralho', desc: 'Cartas numeradas de 1 a 13 em 4 cores: vermelho, azul, verde e amarelo. Mais 2 Coringas.', color: 'border-[#b026ff]/30 bg-[#b026ff]/5' },
                    { title: 'Cada turno', desc: 'Jogue cartas formando Sets ou Runs na mesa, ou pegue 1 carta do baralho se não conseguir jogar.', color: 'border-blue-500/30 bg-blue-500/5' },
                    { title: 'Mão inicial', desc: 'Cada jogador começa com 14 cartas na mão (ou 13 se for o primeiro a jogar).', color: 'border-green-500/30 bg-green-500/5' },
                    { title: 'Entrada mínima', desc: 'Na primeira jogada, o valor total das cartas que você colocar na mesa deve ser ≥ 30 pontos.', color: 'border-yellow-500/30 bg-yellow-500/5' },
                ].map(item => (
                    <div key={item.title} className={`rounded-xl p-5 border ${item.color}`}>
                        <h3 className="font-black text-white mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-center py-4">
                {(['red','blue','green','yellow'] as const).flatMap(c =>
                    [1, 7, 13].map(n => <Card key={`${c}-${n}`} num={n} color={c} />)
                )}
                <Card num="★" color="joker" />
            </div>
        </div>
    );
}

function SetsTab() {
    return (
        <div className="space-y-8">
            <p className="text-gray-300 leading-relaxed">
                Um <strong className="text-white">Set</strong> é um grupo de <strong className="text-white">3 ou 4 cartas com o mesmo número</strong>,
                cada uma em uma cor diferente. Não pode repetir cor.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-green-900/10 border border-green-500/30 rounded-2xl p-6 flex flex-col items-center gap-4">
                    <span className="text-xs font-black text-green-400 uppercase tracking-wider">✓ Válidos</span>
                    <div className="flex gap-2">
                        <Card num={8} color="red" /><Card num={8} color="blue" /><Card num={8} color="green" />
                    </div>
                    <p className="text-xs text-gray-400 text-center">Três 8s — cores diferentes</p>
                    <div className="flex gap-2">
                        <Card num={3} color="red" /><Card num={3} color="blue" /><Card num={3} color="green" /><Card num={3} color="yellow" />
                    </div>
                    <p className="text-xs text-gray-400 text-center">Quatro 3s — todas as cores</p>
                </div>

                <div className="bg-red-900/10 border border-red-500/30 rounded-2xl p-6 flex flex-col items-center gap-4">
                    <span className="text-xs font-black text-red-400 uppercase tracking-wider">✗ Inválidos</span>
                    <div className="flex gap-2">
                        <Card num={5} color="red" /><Card num={5} color="red" /><Card num={5} color="blue" />
                    </div>
                    <p className="text-xs text-gray-400 text-center">Cor repetida (dois vermelhos)</p>
                    <div className="flex gap-2">
                        <Card num={7} color="green" /><Card num={7} color="yellow" />
                    </div>
                    <p className="text-xs text-gray-400 text-center">Apenas 2 cartas — mínimo é 3</p>
                </div>
            </div>

            <div className="bg-[#b026ff]/10 border border-[#b026ff]/30 rounded-xl p-4 text-sm text-gray-300">
                <strong className="text-[#d47fff]">Coringa:</strong> pode substituir qualquer carta em um Set.
                Exemplo: <span className="inline-flex gap-1 items-end align-bottom"><Card num={9} color="red" /><Card num={9} color="blue" /><Card num="★" color="joker" /></span>{' '}
                é um Set válido de 9s (o Coringa é o 9 verde ou amarelo).
            </div>
        </div>
    );
}

function RunsTab() {
    return (
        <div className="space-y-8">
            <p className="text-gray-300 leading-relaxed">
                Um <strong className="text-white">Run</strong> é uma sequência de <strong className="text-white">3 ou mais cartas consecutivas</strong>,
                todas da mesma cor. A ordem importa.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-green-900/10 border border-green-500/30 rounded-2xl p-6 flex flex-col items-center gap-4">
                    <span className="text-xs font-black text-green-400 uppercase tracking-wider">✓ Válidos</span>
                    <div className="flex gap-2 flex-wrap justify-center">
                        <Card num={4} color="yellow" /><Card num={5} color="yellow" /><Card num={6} color="yellow" /><Card num={7} color="yellow" />
                    </div>
                    <p className="text-xs text-gray-400 text-center">Amarelo 4–7</p>
                    <div className="flex gap-2 flex-wrap justify-center">
                        <Card num={11} color="red" /><Card num={12} color="red" /><Card num={13} color="red" />
                    </div>
                    <p className="text-xs text-gray-400 text-center">Vermelho 11–13</p>
                </div>

                <div className="bg-red-900/10 border border-red-500/30 rounded-2xl p-6 flex flex-col items-center gap-4">
                    <span className="text-xs font-black text-red-400 uppercase tracking-wider">✗ Inválidos</span>
                    <div className="flex gap-2">
                        <Card num={3} color="blue" /><Card num={4} color="green" /><Card num={5} color="blue" />
                    </div>
                    <p className="text-xs text-gray-400 text-center">Cores diferentes</p>
                    <div className="flex gap-2">
                        <Card num={6} color="green" /><Card num={8} color="green" /><Card num={9} color="green" />
                    </div>
                    <p className="text-xs text-gray-400 text-center">Sequência não-consecutiva (falta o 7)</p>
                </div>
            </div>

            <div className="bg-[#b026ff]/10 border border-[#b026ff]/30 rounded-xl p-4 text-sm text-gray-300">
                <strong className="text-[#d47fff]">Coringa num Run:</strong>{' '}
                <span className="inline-flex gap-1 items-end align-bottom"><Card num={2} color="blue" /><Card num="★" color="joker" /><Card num={4} color="blue" /></span>{' '}
                é válido — o Coringa representa o azul 3.
            </div>
        </div>
    );
}

function MooveTab() {
    return (
        <div className="space-y-8">
            <p className="text-gray-300 leading-relaxed">
                Este é o diferencial do jogo. Uma vez que um grupo está na mesa, <strong className="text-white">qualquer jogador pode usá-lo</strong>.
                No seu turno, você pode pegar cartas de grupos já formados, combiná-las com cartas da sua mão, e criar grupos completamente novos.
            </p>

            <div className="bg-[#b026ff]/10 border border-[#b026ff]/30 rounded-2xl p-6 space-y-4">
                <h3 className="font-black text-white text-lg">Exemplo de Moove</h3>
                <div className="space-y-3">
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Mesa antes do seu turno</p>
                        <div className="flex gap-2 flex-wrap">
                            <Card num={5} color="red" /><Card num={6} color="red" /><Card num={7} color="red" />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Run: vermelho 5-6-7</p>
                    </div>
                    <ChevronRight className="text-[#b026ff]" />
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Você tem na mão</p>
                        <div className="flex gap-2 flex-wrap">
                            <Card num={7} color="blue" /><Card num={7} color="green" />
                        </div>
                    </div>
                    <ChevronRight className="text-[#b026ff]" />
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Novo estado da mesa (após o Moove)</p>
                        <div className="flex gap-2 flex-wrap mb-1">
                            <Card num={5} color="red" /><Card num={6} color="red" />
                        </div>
                        <p className="text-xs text-gray-400 mb-2">Run: vermelho 5-6 (mínimo de 2 não é válido...)</p>
                        <div className="flex gap-2 flex-wrap">
                            <Card num={7} color="red" /><Card num={7} color="blue" /><Card num={7} color="green" />
                        </div>
                        <p className="text-xs text-green-400 mt-1">✓ Set: três 7s — você pegou o vermelho 7 do Run!</p>
                    </div>
                </div>
            </div>

            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-4 text-sm text-gray-300">
                <strong className="text-red-400">⚠️ Regra crucial:</strong> ao final do seu turno, <strong className="text-white">todas as cartas na mesa devem estar em grupos válidos</strong> (mínimo 3 cartas cada). Se você não conseguir resolver, devolve
                tudo para onde estava e pega <strong className="text-red-400">3 cartas do baralho</strong> como penalidade.
            </div>
        </div>
    );
}

function VictoryTab() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { icon: '🏆', title: 'Condição de vitória', desc: 'O primeiro jogador a esvaziar a mão completamente vence a partida e aciona o "Endgame Protocol".', color: 'border-yellow-500/30 bg-yellow-500/5' },
                    { icon: '🃏', title: 'Penalidade — Coringa', desc: 'Se o jogo terminar com um Coringa na sua mão, ele conta como 20 pontos de penalidade.', color: 'border-red-500/30 bg-red-500/5' },
                    { icon: '📭', title: 'Baralho esgotado', desc: 'Se ninguém conseguir jogar e o baralho acabar, o jogador com a menor soma de cartas na mão vence.', color: 'border-blue-500/30 bg-blue-500/5' },
                    { icon: '⚡', title: 'Entrada mínima', desc: 'Na sua primeira jogada na mesa, a soma dos valores das cartas colocadas deve ser de pelo menos 30 pontos.', color: 'border-[#b026ff]/30 bg-[#b026ff]/5' },
                ].map(item => (
                    <div key={item.title} className={`rounded-xl p-5 border ${item.color}`}>
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <h3 className="font-black text-white mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                ))}
            </div>

            <div className="bg-[#120a1f] border border-white/10 rounded-2xl p-6">
                <h3 className="font-black text-white mb-4 text-lg">Sistema de Ranking & XP</h3>
                <div className="space-y-3">
                    {[
                        ['🎮', 'Casual / vs IA', '+XP', 'text-blue-400', '0 MMR'],
                        ['🏆', 'Ranked — Vitória', '+XP +MMR', 'text-green-400', 'com base no adversário'],
                        ['💀', 'Ranked — Derrota', '-MMR', 'text-red-400', 'com base no adversário'],
                    ].map(([icon, mode, reward, clr, note]) => (
                        <div key={mode as string} className="flex items-center justify-between bg-black/30 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{icon}</span>
                                <span className="text-sm font-bold text-white">{mode as string}</span>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-black ${clr}`}>{reward as string}</p>
                                <p className="text-xs text-gray-500">{note as string}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TipsTab() {
    const tips = [
        { emoji: '🃏', title: 'Guarde os Coringas', desc: 'Use Coringas estrategicamente para completar grupos difíceis — mas não fique com eles na mão no fim.' },
        { emoji: '👀', title: 'Observe a mesa', desc: 'Antes de pegar carta do baralho, analise os grupos na mesa — você pode reorganizá-los para jogar.' },
        { emoji: '🎯', title: 'Entrada mínima de 30', desc: 'Planeje sua primeira jogada para atingir os 30 pontos — cartas altas (10, 11, 12, 13) ajudam muito.' },
        { emoji: '🚀', title: 'Esvazie rápido', desc: 'Quanto mais rápido você esvaziar a mão, mais XP você ganha. Priorize jogar em vez de pegar cartas.' },
        { emoji: '🛡️', title: 'Não deixe o adversário vencer fácil', desc: 'Se um adversário estiver com poucas cartas, reorganize a mesa para dificultar as jogadas dele.' },
        { emoji: '📚', title: 'Pratique vs IA', desc: 'O modo vs IA é perfeito para treinar estratégias sem perder MMR. Use antes de entrar no Ranked.' },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tips.map(tip => (
                <motion.div
                    key={tip.title}
                    whileHover={{ scale: 1.02 }}
                    className="bg-[#120a1f] border border-white/10 rounded-xl p-5 cursor-default"
                >
                    <div className="text-2xl mb-2">{tip.emoji}</div>
                    <h3 className="font-black text-white mb-1 text-sm">{tip.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{tip.desc}</p>
                </motion.div>
            ))}
        </div>
    );
}

const TAB_CONTENT: Record<TabId, React.ReactElement> = {
    intro:   <IntroTab />,
    sets:    <SetsTab />,
    runs:    <RunsTab />,
    moove:   <MooveTab />,
    victory: <VictoryTab />,
    tips:    <TipsTab />,
};

export default function Rules() {
    const [activeTab, setActiveTab] = useState<TabId>('intro');
    const [showOnboarding, setShowOnboarding] = useState(false);

    return (
        <div className="min-h-screen bg-[#0a050f] text-gray-300 font-sans selection:bg-[#b026ff]/30 relative overflow-hidden flex flex-col">
            <MouseGlow />
            <Navbar />

            <AnimatePresence>
                {showOnboarding && (
                    <OnboardingModal onClose={() => setShowOnboarding(false)} />
                )}
            </AnimatePresence>

            <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-28 z-10 relative">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
                    <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-[#120a1f] border border-white/10 shadow-2xl mb-6 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#b026ff]/20 to-transparent group-hover:from-[#b026ff]/30 transition-all" />
                        <BookOpen className="text-[#b026ff] w-10 h-10 relative z-10" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#b026ff] uppercase tracking-tighter mb-4">
                        Game Protocol
                    </h1>
                    <p className="text-gray-400 font-bold max-w-2xl mx-auto text-lg mb-6">
                        Domine o grid. Aprenda as regras, forme grupos, reorganize a mesa.
                    </p>
                    <button
                        onClick={() => setShowOnboarding(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#b026ff]/40 bg-[#b026ff]/10 text-[#d47fff] font-black text-sm hover:bg-[#b026ff]/20 transition-colors"
                    >
                        🎓 Iniciar Tutorial Interativo
                    </button>
                </motion.div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 justify-center">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                activeTab === tab.id
                                    ? 'bg-[#b026ff] text-white shadow-[0_0_20px_rgba(176,38,255,0.4)]'
                                    : 'bg-[#120a1f] border border-white/10 text-gray-400 hover:text-white hover:border-[#b026ff]/40'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="bg-[#120a1f]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
                    >
                        {TAB_CONTENT[activeTab]}
                    </motion.div>
                </AnimatePresence>
            </main>

            <Footer />
        </div>
    );
}

