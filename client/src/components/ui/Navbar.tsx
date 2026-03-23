import { Link } from 'react-router-dom';
import { Layers, Trophy, BookOpen, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
    const { t } = useTranslation();
    return (
        <nav className="w-full fixed top-0 left-0 z-50">
            <div className="absolute inset-0 bg-[#0a050f]/80 backdrop-blur-xl border-b border-white/5" />
            <div className="relative max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 bg-[#b026ff] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(176,38,255,0.5)] group-hover:shadow-[0_0_25px_rgba(176,38,255,0.8)] transition-all">
                        <Zap size={18} className="text-white fill-white" />
                    </div>
                    <span className="text-xl font-black tracking-[0.15em] text-white">MOOVE</span>
                </Link>

                {/* Links */}
                <div className="hidden md:flex items-center gap-1">
                    {[
                        { labelKey: 'nav.cards', icon: Layers, href: '/database' },
                        { labelKey: 'nav.tournaments', icon: Trophy, href: '/tournaments' },
                        { labelKey: 'nav.howToPlay', icon: BookOpen, href: '/rules' },
                    ].map(item => {
                        const Icon = item.icon;
                        return (
                            <Link key={item.labelKey} to={item.href}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                <Icon size={14} />
                                {t(item.labelKey)}
                            </Link>
                        );
                    })}
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center gap-3">
                    <Link to="/login"
                        className="hidden sm:flex px-5 py-2 text-sm font-bold text-gray-300 hover:text-white transition-colors">
                        {t('nav.login')}
                    </Link>
                    <Link to="/register"
                        className="px-5 py-2 text-sm font-black text-white bg-[#b026ff] rounded-lg hover:bg-[#9d1ce6] shadow-[0_0_20px_rgba(176,38,255,0.35)] hover:shadow-[0_0_30px_rgba(176,38,255,0.6)] transition-all uppercase tracking-widest">
                        {t('nav.playFree')}
                    </Link>
                </div>
            </div>
        </nav>
    );
}
