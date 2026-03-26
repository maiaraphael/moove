import { useEffect } from 'react';
import type { FrameConfig } from '../../utils/frameUtils';

function injectKeyframes() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('moove-frame-kf')) return;
    const s = document.createElement('style');
    s.id = 'moove-frame-kf';
    s.textContent = `
        @keyframes frame-rotate {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
        }
        @keyframes frame-pulse {
            0%, 100% { filter: brightness(1); }
            50%       { filter: brightness(1.7) drop-shadow(0 0 8px currentColor); }
        }
        @keyframes frame-flicker {
            0%, 88%, 100% { opacity: 1; }
            90%, 94%, 98% { opacity: 0.15; }
            92%, 96%      { opacity: 0.85; }
        }
        @keyframes frame-ice-shimmer {
            0%   { transform: rotate(0deg);   filter: brightness(0.9) saturate(0.8); }
            25%  { transform: rotate(90deg);  filter: brightness(1.7) saturate(1.8); }
            50%  { transform: rotate(180deg); filter: brightness(0.8) saturate(0.6); }
            75%  { transform: rotate(270deg); filter: brightness(1.6) saturate(1.5); }
            100% { transform: rotate(360deg); filter: brightness(0.9) saturate(0.8); }
        }
        @keyframes frame-smoke {
            0%   { transform: rotate(0deg);   filter: blur(0px)   opacity(0.75); }
            20%  { transform: rotate(72deg);  filter: blur(2px)   opacity(0.45); }
            40%  { transform: rotate(144deg); filter: blur(0.5px) opacity(0.9);  }
            60%  { transform: rotate(216deg); filter: blur(2.5px) opacity(0.4);  }
            80%  { transform: rotate(288deg); filter: blur(1px)   opacity(0.7);  }
            100% { transform: rotate(360deg); filter: blur(0px)   opacity(0.75); }
        }
        @keyframes frame-aurora {
            0%   { transform: rotate(0deg);   filter: hue-rotate(0deg)   brightness(1.15); }
            100% { transform: rotate(360deg); filter: hue-rotate(120deg) brightness(1.15); }
        }
        @keyframes frame-void {
            0%, 100% { transform: rotate(0deg);   filter: brightness(0.5) saturate(2.5); }
            50%      { transform: rotate(180deg); filter: brightness(1.6) saturate(3.5); }
        }
        @keyframes frame-plasma {
            0%   { transform: rotate(0deg);   filter: hue-rotate(0deg)   brightness(1.4) saturate(1.8); }
            100% { transform: rotate(360deg); filter: hue-rotate(360deg) brightness(1.4) saturate(1.8); }
        }
        @keyframes frame-matrix-flicker {
            0%, 75%, 100% { filter: brightness(1)   saturate(1);   }
            77%           { filter: brightness(3.5) saturate(0.2); }
            79%           { filter: brightness(0.2) saturate(2.5); }
            81%           { filter: brightness(2.8) saturate(0.4); }
            83%           { filter: brightness(1)   saturate(1.5); }
        }
        @keyframes frame-glitch {
            0%   { transform: rotate(0deg);   filter: hue-rotate(0deg)   saturate(1)   brightness(1);   }
            38%  { transform: rotate(137deg); filter: hue-rotate(0deg)   saturate(1)   brightness(1);   }
            40%  { transform: rotate(137deg); filter: hue-rotate(180deg) saturate(3.5) brightness(2.5); }
            42%  { transform: rotate(195deg); filter: hue-rotate(-90deg) saturate(2)   brightness(0.3); }
            44%  { transform: rotate(137deg); filter: hue-rotate(120deg) saturate(3)   brightness(2);   }
            46%  { transform: rotate(166deg); filter: hue-rotate(0deg)   saturate(1)   brightness(1);   }
            84%  { transform: rotate(302deg); filter: hue-rotate(0deg)   saturate(1)   brightness(1);   }
            86%  { transform: rotate(332deg); filter: hue-rotate(-180deg) saturate(4)  brightness(3);   }
            88%  { transform: rotate(278deg); filter: hue-rotate(90deg)  saturate(2)   brightness(0.2); }
            90%  { transform: rotate(324deg); filter: hue-rotate(-60deg) saturate(3)   brightness(2.2); }
            92%  { transform: rotate(324deg); filter: hue-rotate(0deg)   saturate(1)   brightness(1);   }
            100% { transform: rotate(360deg); filter: hue-rotate(0deg)   saturate(1)   brightness(1);   }
        }
        @keyframes frame-quantum {
            0%   { transform: rotate(0deg)   scale(1);    filter: brightness(1)   hue-rotate(0deg);   }
            25%  { transform: rotate(90deg)  scale(1.05); filter: brightness(1.9) hue-rotate(90deg);  }
            50%  { transform: rotate(180deg) scale(0.96); filter: brightness(0.6) hue-rotate(180deg); }
            75%  { transform: rotate(270deg) scale(1.05); filter: brightness(1.9) hue-rotate(270deg); }
            100% { transform: rotate(360deg) scale(1);    filter: brightness(1)   hue-rotate(360deg); }
        }
        @keyframes frame-shadow {
            0%   { transform: rotate(0deg);   filter: brightness(0.4) saturate(3)   contrast(1.5); }
            20%  { transform: rotate(72deg);  filter: brightness(2.2) saturate(4.5) contrast(2);   }
            40%  { transform: rotate(144deg); filter: brightness(0.25) saturate(2)  contrast(1);   }
            60%  { transform: rotate(216deg); filter: brightness(2.5) saturate(5)   contrast(2.5); }
            80%  { transform: rotate(288deg); filter: brightness(0.35) saturate(3)  contrast(1.5); }
            100% { transform: rotate(360deg); filter: brightness(0.4) saturate(3)   contrast(1.5); }
        }
        @keyframes frame-cyber-flash {
            0%, 72%, 100% { filter: brightness(1)   saturate(1); }
            74%           { filter: brightness(3.5) saturate(0); }
            75%           { filter: brightness(0.4) saturate(2); }
            76%           { filter: brightness(3)   saturate(0.3); }
            78%           { filter: brightness(1)   saturate(1); }
        }
    `;
    document.head.appendChild(s);
}

/**
 * Renders an avatar image with an optional CSS-only profile frame.
 * No images needed — the frame is rendered entirely with CSS.
 *
 * @param size   — outer size in px (the whole component including the frame ring)
 * @param rounded — 'full' for circle, 'xl' for rounded-square (used in game)
 */
export default function FramedAvatar({
    src,
    alt = 'Avatar',
    size = 48,
    frameConfig,
    rounded = 'full',
    className = '',
    previewOnly = false,
}: {
    src: string;
    alt?: string;
    size?: number;
    frameConfig?: FrameConfig | null;
    rounded?: 'full' | 'xl';
    className?: string;
    previewOnly?: boolean;
}) {
    useEffect(() => { injectKeyframes(); }, []);

    const rFull = rounded === 'full' ? '50%' : '0.75rem';
    const rInner = rounded === 'full' ? '50%' : '0.65rem';
    const sizeStyle: React.CSSProperties = { width: size, height: size, minWidth: size, minHeight: size };

    const avatarInner = previewOnly
        ? <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 35% 35%, #1e0a35, #0a0516)' }} />
        : <img src={src} alt={alt} className="w-full h-full object-cover" />;

    /* ── No frame: default purple border ── */
    if (!frameConfig) {
        return (
            <div
                className={`overflow-hidden flex-shrink-0 ${className}`}
                style={{ ...sizeStyle, borderRadius: rFull, border: '2px solid #b026ff', boxShadow: '0 0 15px rgba(176,38,255,0.4)' }}
            >
                {avatarInner}
            </div>
        );
    }

    const { color, secondaryColor, effect, intensity } = frameConfig;
    const c2  = secondaryColor || color;
    const bw  = 2 + Math.floor(intensity / 3);          // border width: 2–5 px
    const g   = 4  + intensity * 2;                     // glow radius: 6–24 px

    /* ── OVERLAY effects: animated ring behind avatar ── */
    const OVERLAY_GRADIENTS: Record<string, string> = {
        rotating:    `conic-gradient(from 0deg, ${color}, ${c2}, ${color})`,
        holographic: `conic-gradient(from 0deg, #ff0080, #ff8c00, #ffd700, #00ff7f, #00bfff, #b026ff, #ff0080)`,
        flame:       `conic-gradient(from 0deg, #ff2000, #ff6600, #ffd700, #ff8800, #ff2200, #ff4500, #ff2000)`,
        ice:         `conic-gradient(from 0deg, #ffffff, #c8eeff, #4ca3dd, #99d6ff, #e8f8ff, #4ca3dd, #ffffff)`,
        smoke:       `conic-gradient(from 0deg, #1a1a2e, #3a3a5a, #1a1a2e, #4a4a6a, #2a2a3e, #1a1a2e)`,
        aurora:      `conic-gradient(from 0deg, #00ff87, #60efff, #00bfff, #9b59b6, #00e5ff, #00ff87)`,
        void:        `conic-gradient(from 0deg, #000000, #16003a, #07001a, #3b0072, #000000)`,
        lava:        `conic-gradient(from 0deg, #8b0000, #cc2200, #ff6b00, #ffd700, #ff4400, #cc1100, #8b0000)`,
        plasma:      `conic-gradient(from 0deg, #ff00ff, #00aaff, #ff00aa, #aa00ff, #ff00ff)`,
        matrix:      `conic-gradient(from 0deg, #00ff41, #002200, #00cc22, #001400, #00ff41, #003300, #00ee33, #001800, #00ff41)`,
        glitch:      `conic-gradient(from 0deg, #ff0044, #00ffcc, #ff0044, #0044ff, #ff0044, #00ff88, #ff0044, #00ccff, #ff0044)`,
        quantum:     `conic-gradient(from 0deg, #b026ff, #00ffe7, #7700ff, #00c9ff, #ff00cc, #4400ff, #b026ff)`,
        shadow:      `conic-gradient(from 0deg, #000000, #2a003a, #050010, #4a007a, #000000, #1a0030, #000000, #380060, #000000)`,
        cyber:       `conic-gradient(from 0deg, #00e5ff, #0055ff, #00e5ff, #ffffff, #00e5ff, #003aff, #00aaff, #ffffff, #00e5ff)`,
    };

    if (OVERLAY_GRADIENTS[effect]) {
        const speed = 1.4 + (10 - intensity) * 0.15;

        const OVERLAY_ANIMS: Record<string, string> = {
            rotating:    `frame-rotate ${speed}s linear infinite`,
            holographic: `frame-rotate ${speed}s linear infinite`,
            flame:       `frame-rotate ${speed * 0.7}s linear infinite`,
            ice:         `frame-ice-shimmer ${5.5 - intensity * 0.2}s ease-in-out infinite`,
            smoke:       `frame-smoke ${5 - intensity * 0.15}s ease-in-out infinite`,
            aurora:      `frame-aurora ${speed * 1.4}s linear infinite`,
            void:        `frame-void ${6.5 - intensity * 0.2}s ease-in-out infinite`,
            lava:        `frame-rotate ${speed * 0.65}s linear infinite`,
            plasma:      `frame-plasma ${Math.max(0.8, 1.8 - intensity * 0.06)}s linear infinite`,
            matrix:      `frame-rotate ${Math.max(0.6, speed * 0.45)}s linear infinite, frame-matrix-flicker ${2.8 - intensity * 0.1}s ease-in-out infinite`,
            glitch:      `frame-glitch ${Math.max(1.5, 9 - intensity * 0.5)}s linear infinite`,
            quantum:     `frame-quantum ${Math.max(0.9, 3.2 - intensity * 0.18)}s ease-in-out infinite`,
            shadow:      `frame-shadow ${Math.max(1.2, 6 - intensity * 0.25)}s ease-in-out infinite`,
            cyber:       `frame-rotate ${Math.max(0.5, speed * 0.55)}s linear infinite, frame-cyber-flash ${2.5 - intensity * 0.08}s ease-in-out infinite`,
        };

        const OVERLAY_GLOWS: Record<string, string> = {
            holographic: `0 0 ${g}px rgba(180,80,255,0.4)`,
            flame:       `0 0 ${g}px #ff450055, 0 0 ${g * 2}px #ff220022`,
            ice:         `0 0 ${g}px #a8e0ff88, 0 0 ${g * 2}px #00bfff33, 0 0 2px #fff8`,
            smoke:       `0 0 ${g * 0.6}px rgba(80,80,130,0.35)`,
            aurora:      `0 0 ${g}px #00ff8766, 0 0 ${g * 2}px #00bfff22`,
            void:        `0 0 ${g * 2}px rgba(60,0,120,0.7), 0 0 ${g * 4}px rgba(10,0,30,0.4)`,
            lava:        `0 0 ${g}px #ff450055, 0 0 ${g * 2}px #8b000022`,
            plasma:      `0 0 ${g}px #ff00ff55, 0 0 ${g * 2}px #00ffff33`,
            matrix:      `0 0 ${g}px #00ff4199, 0 0 ${g * 2}px #00ff4133, 0 0 2px #00ff41cc`,
            glitch:      `0 0 ${g}px #ff004466, 0 0 ${g}px #00ffcc44, 0 0 ${g * 2}px #0044ff33`,
            quantum:     `0 0 ${g}px #b026ff88, 0 0 ${g * 2}px #00ffe755, 0 0 ${g * 3}px #7700ff22`,
            shadow:      `0 0 ${g * 2}px rgba(74,0,122,0.85), 0 0 ${g * 4}px rgba(8,0,18,0.55)`,
            cyber:       `0 0 ${g}px #00e5ffaa, 0 0 ${g * 2}px #0077ff44, 0 0 2px #ffffffdd`,
        };

        return (
            <div className={`relative flex-shrink-0 ${className}`} style={{ ...sizeStyle, borderRadius: rFull, overflow: 'hidden' }}>
                {/* Spinning gradient ring */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    borderRadius: rFull,
                    background: OVERLAY_GRADIENTS[effect],
                    animation: OVERLAY_ANIMS[effect] ?? `frame-rotate ${speed}s linear infinite`,
                    boxShadow: OVERLAY_GLOWS[effect] ?? '',
                }} />
                {/* Avatar cutout */}
                <div style={{
                    position: 'absolute',
                    top: bw, left: bw, right: bw, bottom: bw,
                    borderRadius: rInner,
                    overflow: 'hidden',
                    zIndex: 1,
                }}>
                    {avatarInner}
                </div>
            </div>
        );
    }

    /* ── GRADIENT effect: background-clip border-box trick ── */
    if (effect === 'gradient') {
        return (
            <div
                className={`overflow-hidden flex-shrink-0 ${className}`}
                style={{
                    ...sizeStyle,
                    borderRadius: rFull,
                    background: `linear-gradient(#0f0814, #0a0516) padding-box, linear-gradient(135deg, ${color}, ${c2}) border-box`,
                    border: `${bw}px solid transparent`,
                }}
            >
                {avatarInner}
            </div>
        );
    }

    /* ── SIMPLE effects: border + box-shadow ── */
    const SHADOWS: Record<string, string> = {
        solid:    `0 0 ${g / 3}px ${color}44`,
        glow:     `0 0 ${g}px ${color}99, 0 0 ${g * 2}px ${color}44, inset 0 0 ${g / 2}px ${color}22`,
        neon:     `0 0 4px ${color}, 0 0 ${g}px ${color}, 0 0 ${g * 2}px ${color}88, 0 0 ${g * 3}px ${color}44`,
        pulse:    `0 0 ${g}px ${color}99, 0 0 ${g * 2}px ${color}44`,
        electric: `0 0 4px #00dfff, 0 0 ${g}px #00bfff99, 0 0 ${g * 2}px #0088ff44`,
    };

    const ANIMS: Record<string, string> = {
        pulse:    `frame-pulse ${1.6 - intensity * 0.09}s ease-in-out infinite`,
        electric: `frame-flicker 0.14s linear infinite`,
    };

    return (
        <div
            className={`overflow-hidden flex-shrink-0 ${className}`}
            style={{
                ...sizeStyle,
                borderRadius: rFull,
                border: `${bw}px solid ${effect === 'electric' ? '#00dfff' : color}`,
                boxShadow: SHADOWS[effect] ?? SHADOWS.solid,
                animation: ANIMS[effect],
            }}
        >
            {avatarInner}
        </div>
    );
}
