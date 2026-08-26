import { useState, useEffect } from 'react'
import Logo from './Logo'
import HackathonPitchModal from './HackathonPitchModal'

const links = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#features', label: 'Features' },
  { href: '#demo', label: 'Live Demo' },
  { href: '#faq', label: 'FAQ' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pitchOpen, setPitchOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : 'lp-nav--top'}`}>
        <div className="lp-nav-inner">
          <a href="#top" className="lp-nav-brand" aria-label="RiskShield">
            <Logo />
            <span>RiskShield</span>
          </a>

          <nav className="lp-nav-links">
            {links.map(l => (
              <a key={l.href} href={l.href} className="lp-nav-link">{l.label}</a>
            ))}
          </nav>

          <div className="lp-nav-actions">
            <button type="button" className="lp-hackathon-btn" onClick={() => setPitchOpen(true)}>
              🏆 Hackathon Brief
            </button>
            <a href="#/reconciliation" className="lp-nav-cta lp-nav-cta-ghost">Reconciliation</a>
            <a href="#/dashboard" className="lp-nav-cta lp-nav-cta-fill">Open Platform ➔</a>
            <button type="button" className="lp-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lp-mobile-drawer">
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>{l.label}</a>
            ))}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button type="button" onClick={() => { setMobileOpen(false); setPitchOpen(true) }} style={{ padding: '10px', borderRadius: 8, border: '1px solid #fcd34d', background: '#fffbeb', color: '#b45309', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                🏆 Hackathon Brief
              </button>
              <a href="#/dashboard" onClick={() => setMobileOpen(false)} className="lp-btn lp-btn-primary" style={{ textAlign: 'center' }}>
                Open Platform ➔
              </a>
            </div>
          </div>
        )}
      </header>

      <HackathonPitchModal isOpen={pitchOpen} onClose={() => setPitchOpen(false)} />
    </>
  )
}
