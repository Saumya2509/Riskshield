import { useState } from 'react'
import Logo from './Logo'
import HackathonPitchModal from './HackathonPitchModal'

const links = [
  { href: '#workflow', label: 'Workflow' },
  { href: '#features', label: 'Capabilities' },
  { href: '#demo', label: 'Interactive Terminal' },
  { href: '#metrics', label: 'Trust & ROI' },
  { href: '#faq', label: 'FAQ' },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pitchModalOpen, setPitchModalOpen] = useState(false)

  return (
    <>
      <header className="nav" style={{
        background: 'rgba(11, 15, 25, 0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="wrap" style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="#top" aria-label="RiskShield home" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: '1.15rem', color: '#ffffff', textDecoration: 'none' }}>
              <Logo />
              <span>RiskShield</span>
            </a>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#818cf8',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              padding: '2px 8px',
              borderRadius: 6,
              letterSpacing: '0.02em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              Autonomous Finance OS
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="nav-links" style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
            {links.map((link) => (
              <a key={link.href} href={link.href} style={{ fontSize: '0.86rem', color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s', fontWeight: 500 }}>
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions & Hackathon Brief */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Hackathon Pitch Modal Trigger Button */}
            <button
              type="button"
              onClick={() => setPitchModalOpen(true)}
              style={{
                fontSize: '0.78rem',
                fontWeight: 750,
                padding: '7px 13px',
                borderRadius: 8,
                border: '1px solid #f59e0b',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
                color: '#fbbf24',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.2)',
                transition: 'all 0.15s'
              }}
            >
              🏆 Hackathon Brief
            </button>

            <a className="btn btn-secondary" href="#/reconciliation" style={{ fontSize: '0.82rem', padding: '8px 14px' }}>
              Reconciliation
            </a>
            <a className="btn btn-primary" href="#/dashboard" style={{ fontSize: '0.82rem', padding: '8px 16px' }}>
              Open Platform ➔
            </a>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-nav-toggle"
              aria-label="Toggle navigation menu"
              style={{
                display: 'none',
                background: 'transparent',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                color: '#ffffff',
                padding: '6px 10px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div style={{
            background: '#0b0f19',
            borderTop: '1px solid rgba(148, 163, 184, 0.15)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{ fontSize: '0.92rem', color: '#e2e8f0', textDecoration: 'none', padding: '6px 0' }}
              >
                {link.label}
              </a>
            ))}
            <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); setPitchModalOpen(true); }}
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  border: '1px solid #f59e0b',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  fontWeight: 750,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                🏆 View Hackathon Architecture Brief
              </button>
              <a className="btn btn-primary" href="#/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ textAlign: 'center', fontSize: '0.88rem', padding: '10px' }}>
                Open Autonomous Platform ➔
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Render Hackathon Pitch Modal */}
      <HackathonPitchModal isOpen={pitchModalOpen} onClose={() => setPitchModalOpen(false)} />
    </>
  )
}
