import { useEffect, useState } from 'react'
import Logo from './Logo'
import HackathonPitchModal from './HackathonPitchModal'

const links = [
  { href: '#workflow', label: 'Workflow' },
  { href: '#features', label: 'Capabilities' },
  { href: '#demo', label: 'Live Terminal' },
  { href: '#roi', label: 'ROI Calculator' },
  { href: '#faq', label: 'FAQ' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pitchOpen, setPitchOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`}>
        <div className="lp-wrap lp-nav-inner">
          {/* Logo & Platform Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <a href="#top" className="lp-nav-brand" aria-label="RiskShield Home">
              <Logo />
              <span>RiskShield</span>
            </a>
            <span className="lp-nav-pill">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              2.8ms Latency
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="lp-nav-links">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="lp-nav-link">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Actions & Hackathon Brief */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => setPitchOpen(true)}
              style={{
                fontSize: '0.78rem',
                fontWeight: 750,
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid #f59e0b',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#fbbf24',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              🏆 Hackathon Brief
            </button>

            <a
              href="#/reconciliation"
              className="lp-btn-glass"
              style={{ fontSize: '0.84rem', padding: '8px 16px' }}
            >
              Reconciliation
            </a>

            <a
              href="#/dashboard"
              className="lp-btn-glow"
              style={{ fontSize: '0.84rem', padding: '8px 18px' }}
            >
              Open Platform ➔
            </a>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                display: 'none',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                padding: '6px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '1.1rem'
              }}
              className="lp-mobile-toggle"
              aria-label="Menu"
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div style={{
            background: '#070b14',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                style={{ fontSize: '0.94rem', color: '#e2e8f0', textDecoration: 'none', padding: '6px 0' }}
              >
                {l.label}
              </a>
            ))}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={() => { setMobileOpen(false); setPitchOpen(true); }}
                style={{
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid #f59e0b',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  fontWeight: 750,
                  fontSize: '0.86rem',
                  cursor: 'pointer'
                }}
              >
                🏆 View Hackathon Architecture Brief
              </button>
              <a
                href="#/dashboard"
                onClick={() => setMobileOpen(false)}
                className="lp-btn-glow"
                style={{ textAlign: 'center', fontSize: '0.9rem', padding: '10px' }}
              >
                Open Autonomous Platform ➔
              </a>
            </div>
          </div>
        )}
      </header>

      <HackathonPitchModal isOpen={pitchOpen} onClose={() => setPitchOpen(false)} />
    </>
  )
}
