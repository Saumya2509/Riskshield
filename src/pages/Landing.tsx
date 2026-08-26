import { useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import TrustMetrics from '../components/TrustMetrics'
import InteractiveMatchVisualizer from '../components/InteractiveMatchVisualizer'
import ScrollytellingSection from '../components/ScrollytellingSection'
import Features from '../components/Features'
import InteractiveTerminal from '../components/InteractiveTerminal'
import RoiCalculator from '../components/RoiCalculator'
import FAQ from '../components/FAQ'
import FinalCTA from '../components/FinalCTA'
import Footer from '../components/Footer'
import '../landing.css'

export default function Landing() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`
        glowRef.current.style.top = `${e.clientY}px`
      }
    }

    window.addEventListener('mousemove', handlePointerMove, { passive: true })
    return () => window.removeEventListener('mousemove', handlePointerMove)
  }, [])

  return (
    <div className="lp">
      {/* Interactive Global Cursor Spotlight */}
      <div ref={glowRef} className="lp-cursor-glow" />

      {/* Cyber Grid Background Matrix */}
      <div className="lp-cyber-grid" />

      <Navbar />
      <main style={{ position: 'relative', zIndex: 2 }}>
        <Hero />
        <TrustMetrics />
        <InteractiveMatchVisualizer />
        <ScrollytellingSection />
        <Features />
        <InteractiveTerminal />
        <div id="roi">
          <RoiCalculator />
        </div>
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
