export interface FrameConfig {
    color: string;
    secondaryColor?: string;
    effect: 'solid' | 'glow' | 'neon' | 'pulse' | 'gradient' | 'rotating' | 'holographic' | 'flame' | 'electric' | 'ice' | 'smoke' | 'aurora' | 'void' | 'lava' | 'plasma' | 'matrix' | 'glitch' | 'quantum' | 'shadow' | 'cyber';
    intensity: number; // 1-10
}

export const DEFAULT_FRAME_CONFIG: FrameConfig = {
    color: '#b026ff',
    secondaryColor: '#3b82f6',
    effect: 'glow',
    intensity: 7,
};

export const DEFAULT_FRAME_CONFIG_STR = JSON.stringify(DEFAULT_FRAME_CONFIG);

export function parseFrameConfig(raw?: string | null): FrameConfig | null {
    if (!raw) return null;
    try { return JSON.parse(raw) as FrameConfig; } catch { return null; }
}

export const FRAME_EFFECTS: { value: FrameConfig['effect']; label: string; desc: string }[] = [
    { value: 'solid',       label: 'Solid',        desc: 'Clean solid color border' },
    { value: 'glow',        label: 'Glow',         desc: 'Soft glowing halo' },
    { value: 'neon',        label: 'Neon',         desc: 'Multi-layer neon tube glow' },
    { value: 'pulse',       label: 'Pulse',        desc: 'Breathing glow animation' },
    { value: 'gradient',    label: 'Gradient',     desc: 'Smooth two-color gradient border' },
    { value: 'rotating',    label: 'Rotating',     desc: 'Spinning gradient ring' },
    { value: 'holographic', label: 'Holographic',  desc: 'Rainbow spinning shimmer' },
    { value: 'flame',       label: 'Flame',        desc: 'Fiery animated ring' },
    { value: 'electric',    label: 'Electric',     desc: 'Cyan electric flicker' },
    { value: 'ice',         label: 'Ice',          desc: 'Crystalline frozen shimmer' },
    { value: 'smoke',       label: 'Smoke',        desc: 'Mysterious dark smoke swirl' },
    { value: 'aurora',      label: 'Aurora',       desc: 'Shifting northern lights' },
    { value: 'void',        label: 'Void',         desc: 'Dark matter gravitational pull' },
    { value: 'lava',        label: 'Lava',         desc: 'Molten rock volcanic ring' },
    { value: 'plasma',      label: 'Plasma',       desc: 'Superheated plasma color shift' },
    { value: 'matrix',      label: 'Matrix',       desc: 'Digital green code rain com flicker' },
    { value: 'glitch',      label: 'Glitch',       desc: 'Corrupção RGB com saltos digitais' },
    { value: 'quantum',     label: 'Quantum',      desc: 'Superposição quântica pulsante' },
    { value: 'shadow',      label: 'Shadow',       desc: 'Trevas com clarões sombrios' },
    { value: 'cyber',       label: 'Cyber',        desc: 'Stream de dados Tron-style' },
];
