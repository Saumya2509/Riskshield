import { useState } from 'react'
import Logo from '../components/Logo'
import HackathonPitchModal from '../components/HackathonPitchModal'

type TopNavProps = {
  onMenu: () => void
}

export default function TopNav({ onMenu }: TopNavProps) {
  const [pitchOpen, setPitchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return
    const term = searchTerm.toLowerCase().trim()
    if (term.includes('tax') || term.includes('notice') || term.includes('148') || term.includes('gst')) {
      window.location.hash = '#/tax-matcher'
    } else if (term.includes('cash') || term.includes('forecast') || term.includes('liquidity')) {
      window.location.hash = '#/cash-forecast'
    } else if (term.includes('exception') || term.includes('error') || term.includes('mismatch')) {
      window.location.hash = '#/exceptions'
    } else if (term.includes('report') || term.includes('pdf') || term.includes('audit')) {
      window.location.hash = '#/reports'
    } else if (term.includes('ai') || term.includes('copilot') || term.includes('agent') || term.includes('chat')) {
      window.location.hash = '#/ai-assistant'
    } else {
      window.location.hash = '#/reconciliation'
    }
  }

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
        <form className="d-search" onSubmit={handleSearchSubmit}>
          <span className="d-search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search batches, records, counterparties, tax notices… (Press Enter)"
          />
        </form>
        <div className="d-top-actions" style={{ position: 'relative' }}>
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

          {/* Notifications Button */}
          <button
            className="d-icon-btn"
            type="button"
            aria-label="Notifications"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <span className="d-dot" />
            🔔
          </button>

          {/* Notifications Dropdown Popover */}
          {notifOpen && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: '80px',
              width: '320px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
              border: '1px solid #cbd5e1',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Real-Time System Alerts</strong>
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#dbeafe', color: '#1e40af', borderRadius: 999, fontWeight: 700 }}>3 New</span>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <a
                  href="#/tax-matcher"
                  onClick={() => setNotifOpen(false)}
                  style={{ display: 'block', padding: '10px 14px', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626' }}>🚨 CBDT Sec 148 Notice Flagged</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>DIN scrutiny notice requires Form 15CB &amp; 3-way reconciliation defense</div>
                </a>
                <a
                  href="#/reconciliation"
                  onClick={() => setNotifOpen(false)}
                  style={{ display: 'block', padding: '10px 14px', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d97706' }}>⚡ 6-D Vector ML Anomaly</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>High risk score (94.2) flagged on non-standard FX reference</div>
                </a>
                <a
                  href="#/cash-forecast"
                  onClick={() => setNotifOpen(false)}
                  style={{ display: 'block', padding: '10px 14px', textDecoration: 'none' }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>📈 Cash Forecaster Updated</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>T+5 peak liquidity projected at ₹22.8L (95% confidence)</div>
                </a>
              </div>
            </div>
          )}

          <div className="d-user">
            <span className="d-avatar">AM</span>
            <span className="d-user-meta">
              <strong>Alex Morgan</strong>
              <small>Finance controller</small>
            </span>
          </div>
        </div>
      </header>

      {/* Pitch Deck Modal */}
      <HackathonPitchModal isOpen={pitchOpen} onClose={() => setPitchOpen(false)} />
    </>
  )
}
