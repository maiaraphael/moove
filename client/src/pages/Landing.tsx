import Navbar from '../components/ui/Navbar';
import Hero from '../components/ui/Hero';
import Features from '../components/ui/Features';
import CTA from '../components/ui/CTA';
import Footer from '../components/ui/Footer';

export default function Landing() {
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
