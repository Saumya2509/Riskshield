import { useState } from 'react'
import Logo from './Logo'

const links = [
  { href: '#workflow', label: 'Workflow' },
  { href: '#features', label: 'Capabilities' },
  { href: '#why', label: 'Why RiskShield' },
  { href: '#faq', label: 'FAQ' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a className="brand" href="#top" aria-label="RiskShield home">
          <Logo />
          RiskShield
        </a>
        <nav className="nav-links" aria-label="Primary">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="nav-cta">
          <a className="btn btn-ghost" href="#/reconciliation">
            Reconciliation
          </a>
          <a className="btn btn-primary" href="#/dashboard">
            Open Dashboard
          </a>
          <button
            className="menu-btn"
            type="button"
            aria-expanded={open}
            aria-label="Toggle menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>
      <div className={`mobile-panel${open ? ' open' : ''}`}>
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
        <a className="btn btn-primary" href="#/dashboard" onClick={() => setOpen(false)}>
          Open Dashboard
        </a>
      </div>
    </header>
  )
}
