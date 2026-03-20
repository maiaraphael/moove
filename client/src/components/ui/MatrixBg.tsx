import { useEffect } from 'react';

export default function MatrixBg() {
    useEffect(() => {
        const canvas = document.getElementById('matrix-bg') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%""\'#&_(),.;:?!\\|{}<>[]^~'.split('');
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops: number[] = [];
        for (let x = 0; x < columns; x++) drops[x] = 1;

        const draw = () => {
            ctx.fillStyle = 'rgba(10, 5, 15, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#b026ff';
            ctx.font = fontSize + 'px monospace';
            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        };
        const interval = setInterval(draw, 33);
        const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', handleResize);
        return () => { clearInterval(interval); window.removeEventListener('resize', handleResize); };
    }, []);

    return <canvas id="matrix-bg" className="absolute inset-0 w-full h-full opacity-20 pointer-events-none mix-blend-screen" />;
}
