import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import TrustMetrics from '../components/TrustMetrics'
import Problem from '../components/Problem'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import WhyChoose from '../components/WhyChoose'
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
        <Problem />
        <Features />
        <HowItWorks />
        <WhyChoose />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
