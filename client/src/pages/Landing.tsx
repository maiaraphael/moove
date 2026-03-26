import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import Hero from '../components/ui/Hero';
import Features from '../components/ui/Features';
import CTA from '../components/ui/CTA';
import Footer from '../components/ui/Footer';

export default function Landing() {
    const navigate = useNavigate();
    useEffect(() => {
        if (localStorage.getItem('token')) navigate('/dashboard', { replace: true });
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#0a050f] text-white font-sans selection:bg-[#b026ff] selection:text-white">
            <Navbar />
            <Hero />
            <Features />
            <CTA />
            <Footer />
        </div>
    );
}
