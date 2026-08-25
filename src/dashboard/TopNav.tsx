import { useState } from 'react'
import Logo from '../components/Logo'
import HackathonPitchModal from '../components/HackathonPitchModal'

type TopNavProps = {
  onMenu: () => void
}

export default function TopNav({ onMenu }: TopNavProps) {
  const [pitchOpen, setPitchOpen] = useState(false)

  return (
    <>
      <header className="d-topnav">
        <button className="d-icon-btn d-menu" type="button" onClick={onMenu} aria-label="Open navigation">
          ☰
        </button>
        <a className="d-brand" href="#/dashboard">
          <Logo variant="dash" size={30} />
          <span>RiskShield</span>
        </a>
        <label className="d-search">
          <span className="d-search-icon" aria-hidden="true">⌕</span>
          <input type="search" placeholder="Search batches, records, counterparties…" />
        </label>
        <div className="d-top-actions">
          {/* Hackathon Judge Pitch & Architecture Button */}
          <button
            type="button"
            onClick={() => setPitchOpen(true)}
            className="d-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.78rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
            }}
          >
            <span>🏆</span>
            <span className="d-pitch-label">Architecture &amp; ROI</span>
          </button>

          <button className="d-icon-btn" type="button" aria-label="Notifications">
            <span className="d-dot" />
            🔔
          </button>
          <div className="d-user">
            <span className="d-avatar">AM</span>
            <span className="d-user-meta">
              <strong>Alex Morgan</strong>
              <small>Risk analyst</small>
            </span>
          </div>
        </div>
      </header>

      {/* Pitch Deck Modal */}
      <HackathonPitchModal isOpen={pitchOpen} onClose={() => setPitchOpen(false)} />
    </>
  )
}
