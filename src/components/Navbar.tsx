import Logo from './Logo'

const links = [
  { href: '#workflow', label: 'Workflow' },
  { href: '#features', label: 'Capabilities' },
  { href: '#demo', label: 'Interactive Terminal' },
  { href: '#metrics', label: 'Trust & ROI' },
  { href: '#faq', label: 'FAQ' },
]

export default function Navbar() {
  return (
    <header className="nav" style={{
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
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
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            padding: '2px 8px',
            borderRadius: 6,
            letterSpacing: '0.02em'
          }}>
            Autonomous Finance OS
          </span>
        </div>

        <nav className="nav-links" style={{ display: 'flex', gap: 24 }}>
          {links.map((link) => (
            <a key={link.href} href={link.href} style={{ fontSize: '0.86rem', color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>
              {link.label}
            </a>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a className="btn btn-secondary" href="#/reconciliation" style={{ fontSize: '0.82rem', padding: '8px 16px' }}>
            Reconciliation
          </a>
          <a className="btn btn-primary" href="#/dashboard" style={{ fontSize: '0.82rem', padding: '8px 18px' }}>
            Open Platform ➔
          </a>
        </div>
      </div>
    </header>
  )
}
