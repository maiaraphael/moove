/**
 * PetViewer – renderiza a imagem do pet com animações CSS puras.
 *
 * Tipos de animação (petConfig.animationType):
 *  FLOATING  – sobe e desce suavemente no lugar (idle mágico)
 *  FLYING    – percorre arco amplo esquerda↔direita inclinando no movimento
 *  WALKING   – caminha esquerda↔direita próximo ao chão
 *  NONE      – sem animação CSS (apenas o GIF nativo)
 */

import { useEffect, useRef } from 'react';

export type PetAnimationType = 'FLOATING' | 'FLYING' | 'WALKING' | 'NONE';
export type PetEffectType    = 'XP_BONUS' | 'COIN_BONUS' | 'GEMS_BONUS' | 'TIMEBANK_BONUS' | 'NONE';

export interface PetConfig {
    modelUrl:      string;   // URL da imagem do pet (PNG, GIF, WebP…)
    animationType: PetAnimationType;
    effectType:    PetEffectType;
    effectValue:   number;
    /** Fator de escala da imagem dentro do container. Default 1.0 (75% do container). */
    scale?:        number;
}

export const PET_EFFECT_LABELS: Record<PetEffectType, string> = {
    XP_BONUS:       '% Bônus de XP por partida',
    COIN_BONUS:     '% Bônus de Moedas por partida',
    GEMS_BONUS:     '% Bônus de Gems por partida',
    TIMEBANK_BONUS: 's extras no Time Bank por turno',
    NONE:           'Sem efeito passivo',
};

export const PET_ANIMATION_LABELS: Record<PetAnimationType, string> = {
    FLOATING: 'Flutuando (idle, sobe/desce suave)',
    FLYING:   'Voando (arco amplo, inclina no movimento)',
    WALKING:  'Caminhando (passeia no chão)',
    NONE:     'Sem animação (apenas GIF nativo)',
};

export const DEFAULT_PET_CONFIG: PetConfig = {
    modelUrl:      '',
    animationType: 'FLOATING',
    effectType:    'NONE',
    effectValue:   0,
    scale:         1,
};

// ─── CSS keyframes injetados uma única vez no <head> ─────────────────────────
let injected = false;
function injectStyles() {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pet-float {
            0%,100% { transform: translateY(0px) rotate(0deg); }
            30%      { transform: translateY(-10px) rotate(-2deg); }
            70%      { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes pet-fly-lr {
            0%   { transform: translateX(-55px) translateY(0px)   scaleX(1)  rotate(-8deg); }
            25%  { transform: translateX(0px)   translateY(-16px) scaleX(1)  rotate(0deg); }
            50%  { transform: translateX(55px)  translateY(0px)   scaleX(-1) rotate(8deg); }
            75%  { transform: translateX(0px)   translateY(-16px) scaleX(-1) rotate(0deg); }
            100% { transform: translateX(-55px) translateY(0px)   scaleX(1)  rotate(-8deg); }
        }
        @keyframes pet-walk-lr {
            0%   { transform: translateX(-36px) scaleX(1); }
            49%  { transform: translateX(36px)  scaleX(1); }
            50%  { transform: translateX(36px)  scaleX(-1); }
            99%  { transform: translateX(-36px) scaleX(-1); }
            100% { transform: translateX(-36px) scaleX(1); }
        }
        @keyframes pet-walk-bounce {
            0%,100% { margin-bottom: 0px; }
            50%     { margin-bottom: 5px; }
        }
    `;
    document.head.appendChild(style);
}

// ─── Mapa de animação → CSS ───────────────────────────────────────────────────
const ANIM_STYLE: Record<PetAnimationType, React.CSSProperties> = {
    FLOATING: {
        animation: 'pet-float 3s ease-in-out infinite',
    },
    FLYING: {
        animation: 'pet-fly-lr 3.5s ease-in-out infinite',
    },
    WALKING: {
        animation: 'pet-walk-lr 3s linear infinite, pet-walk-bounce 0.4s ease-in-out infinite',
    },
    NONE: {},
};

// ─── Componente público ───────────────────────────────────────────────────────
interface Props {
    petConfig: PetConfig;
    /** Tamanho do container em px. Default 80. */
    size?: number;
    /** Mostra fundo escuro arredondado. Default true. */
    withBackground?: boolean;
}

export default function PetViewer({ petConfig, size = 80, withBackground = true }: Props) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => { injectStyles(); }, []);

    if (!petConfig?.modelUrl) {
        return (
            <div
                style={{ width: size, height: size }}
                className="flex items-center justify-center rounded-xl bg-black/40 border border-white/10 text-gray-600 text-xs font-bold flex-col gap-1"
            >
                <span className="text-xl">🐾</span>
                <span className="text-[10px]">Sem imagem</span>
            </div>
        );
    }

    const imgSize = Math.round(size * 0.75 * (petConfig.scale ?? 1));

    return (
        <div
            ref={ref}
            style={{
                width: size,
                height: size,
                ...(withBackground ? { background: 'rgba(13,8,32,0.7)', borderRadius: 12 } : {}),
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
            }}
        >
            <img
                src={petConfig.modelUrl}
                alt="pet"
                style={{
                    width: imgSize,
                    height: imgSize,
                    objectFit: 'contain',
                    display: 'block',
                    ...ANIM_STYLE[petConfig.animationType],
                }}
                draggable={false}
            />
        </div>
    );
}
