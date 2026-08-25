import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import TrustMetrics from '../components/TrustMetrics'
import ScrollytellingSection from '../components/ScrollytellingSection'
import Features from '../components/Features'
import InteractiveTerminal from '../components/InteractiveTerminal'
import FAQ from '../components/FAQ'
import FinalCTA from '../components/FinalCTA'
import Footer from '../components/Footer'
import '../landing.css'

export default function Landing() {
  return (
    <div className="page">
      <Navbar />
      <main>
        <Hero />
        <TrustMetrics />
        <ScrollytellingSection />
        <Features />
        <InteractiveTerminal />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
