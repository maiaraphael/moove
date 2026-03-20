import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function MouseGlow() {
    const [isHovering, setIsHovering] = useState(false);

    // Core tracking spring (fast)
    const springX = useSpring(-100, { stiffness: 400, damping: 28 });
    const springY = useSpring(-100, { stiffness: 400, damping: 28 });

    // Trailing spring (slower, creates movement trail)
    const trailX = useSpring(-100, { stiffness: 100, damping: 30 });
    const trailY = useSpring(-100, { stiffness: 100, damping: 30 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            springX.set(e.clientX);
            springY.set(e.clientY);
            trailX.set(e.clientX);
            trailY.set(e.clientY);

            // Detect if hovering over clickable elements
            const target = e.target as HTMLElement;
            setIsHovering(!!target.closest('button, a'));
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [springX, springY, trailX, trailY]);

    return (
        <>
            {/* Precision Grid Background */}
            <div
                className="fixed inset-0 z-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: `
            linear-gradient(to right, rgba(176, 38, 255, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(176, 38, 255, 0.4) 1px, transparent 1px)
          `,
                    backgroundSize: '80px 80px'
                }}
            />
            {/* Sub-grid (crosshairs) */}
            <div
                className="fixed inset-0 z-0 opacity-[0.015] pointer-events-none"
                style={{
                    backgroundImage: `
            radial-gradient(circle at center, #ffffff 1px, transparent 1.5px)
          `,
                    backgroundSize: '20px 20px'
                }}
            />

            {/* Diagonal Stripes Background */}
            <div
                className="fixed inset-0 z-[0] opacity-[0.15] pointer-events-none mix-blend-multiply"
                style={{
                    backgroundImage: `repeating-linear-gradient(
                        -45deg,
                        transparent,
                        transparent 15px,
                        #000000 15px,
                        #000000 30px
                    )`
                }}
            />

            {/* Main Ambiance Glow (Very large, subtle tracking) */}
            <motion.div
                className="fixed top-0 left-0 w-[1000px] h-[1000px] rounded-full pointer-events-none z-0 blur-[120px]"
                style={{
                    x: trailX,
                    y: trailY,
                    translateX: '-50%',
                    translateY: '-50%',
                    background: 'radial-gradient(circle, rgba(176,38,255,0.06) 0%, rgba(9,5,18,0) 60%)',
                }}
            />

            {/* Primary Cyber Cursor (Inner ring) */}
            <motion.div
                className="fixed top-0 left-0 border border-[#b026ff]/60 rounded-full pointer-events-none z-50 flex items-center justify-center mix-blend-screen"
                animate={{
                    width: isHovering ? 60 : 32,
                    height: isHovering ? 60 : 32,
                    scale: isHovering ? 1.2 : 1,
                    opacity: 0.8
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{
                    x: springX,
                    y: springY,
                    translateX: '-50%',
                    translateY: '-50%',
                    boxShadow: '0 0 15px rgba(176,38,255,0.4), inset 0 0 10px rgba(176,38,255,0.2)'
                }}
            >
                {/* Core Dot */}
                <motion.div
                    className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_4px_rgba(176,38,255,0.8)]"
                    animate={{ scale: isHovering ? 0 : 1 }}
                />

                {/* Targeting crosshairs that appear on hover */}
                {isHovering && (
                    <motion.div
                        initial={{ opacity: 0, rotate: -45 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        className="absolute inset-[-4px] border border-dashed border-[#b026ff]/80 rounded-full"
                        style={{ animation: 'spin 8s linear infinite' }}
                    />
                )}
            </motion.div>

            {/* Trailing Cyber Cursor (Outer ring delay) */}
            <motion.div
                className="fixed top-0 left-0 w-16 h-16 rounded-full pointer-events-none z-40 flex items-center justify-center opacity-30 mix-blend-screen"
                style={{
                    x: trailX,
                    y: trailY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
            >
                <div className="w-full h-full border border-[#b026ff]/30 rounded-full blur-[1px]" />
            </motion.div>

            {/* Global CSS for spins (since we don't have it in tailwind by default) */}
            <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
        </>
    );
}
