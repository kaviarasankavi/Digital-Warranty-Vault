import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProblemSection from './components/ProblemSection';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Stats from './components/Stats';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import Gallery from './components/Gallery';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';
import ScrollProgress from './components/ScrollProgress';
import './styles.css';

function App() {
  useEffect(() => {
    // Add loaded class for animations
    document.body.classList.add('loaded');

    // Update year in footer
    const yearElement = document.querySelector('.footer-bottom p');
    if (yearElement) {
      const text = yearElement.textContent;
      yearElement.textContent = text.replace('2024', new Date().getFullYear());
    }
  }, []);

  return (
    <>
      <ScrollProgress />
      <Navbar />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <Features />
      <Stats />
      <Testimonials />
      <Pricing />
      <Gallery />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}

export default App;
