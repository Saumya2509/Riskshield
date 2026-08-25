import { useState, useEffect } from 'react'
import TopNav from '../dashboard/TopNav'
import Sidebar from '../dashboard/Sidebar'
import '../dashboard/dashboard.css'
import '../finance/finance.css'

function loadSetting(key: string, fallback: string): string {
  try { return localStorage.getItem(`rs_${key}`) ?? fallback } catch { return fallback }
}

export default function SettingsPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  // Config states — load from localStorage with sensible defaults
  const [fuzzyTol, setFuzzyTol] = useState(() => loadSetting('fuzzyTol', '1.0'))
  const [dateWindow, setDateWindow] = useState(() => loadSetting('dateWindow', '2'))
  const [partialMax, setPartialMax] = useState(() => loadSetting('partialMax', '20.0'))
  const [mlHighRisk, setMlHighRisk] = useState(() => loadSetting('mlHighRisk', '45'))
  const [mlCritical, setMlCritical] = useState(() => loadSetting('mlCritical', '70'))
  const [taxRate, setTaxRate] = useState(() => loadSetting('taxRate', '25.17'))
  const [whtRate, setWhtRate] = useState(() => loadSetting('whtRate', '15'))

  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const mainEl = document.querySelector('.d-main')
    if (mainEl) mainEl.scrollTop = 0
  }, [])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      localStorage.setItem('rs_fuzzyTol', fuzzyTol)
      localStorage.setItem('rs_dateWindow', dateWindow)
      localStorage.setItem('rs_partialMax', partialMax)
      localStorage.setItem('rs_mlHighRisk', mlHighRisk)
      localStorage.setItem('rs_mlCritical', mlCritical)
      localStorage.setItem('rs_taxRate', taxRate)
      localStorage.setItem('rs_whtRate', whtRate)
    } catch { /* localStorage unavailable */ }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="dash-app fin-page">
      <TopNav onMenu={() => setMenuOpen(true)} />
      <div className="d-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} activeId="settings" />
        <main className="d-main">

          {/* Header */}
          <header className="d-pagehead">
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                System Configuration &amp; Reconciliation Rules
              </h1>
              <p>
                Configure multi-pass tolerance thresholds, ML anomaly parameters, and tax rate schedules
              </p>
            </div>
            <div className="d-page-actions">
              {saved && (
                <span style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                  ✓ Settings Saved Successfully
                </span>
              )}
            </div>
          </header>

          <form onSubmit={handleSave} style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 3-Pass Rule Tolerances */}
            <div className="fin-card" style={{ padding: '24px' }}>
              <h2 className="fin-card-title" style={{ marginBottom: 4 }}>3-Pass Reconciliation Tolerances</h2>
              <p className="fin-card-desc" style={{ marginBottom: 20 }}>
                Adjust boundary thresholds for exact, fuzzy, and partial matching passes
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 650, color: '#334155', marginBottom: 6 }}>
                    Pass 2 Fuzzy Amount Tolerance (±%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={fuzzyTol}
                    onChange={(e) => setFuzzyTol(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: 4 }}>Default: 1.0% (covers standard banking fees)</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 650, color: '#334155', marginBottom: 6 }}>
                    Pass 2 Settlement Lag Window (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="14"
                    value={dateWindow}
                    onChange={(e) => setDateWindow(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: 4 }}>Default: 2 days (ACH &amp; wire settlement window)</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 650, color: '#334155', marginBottom: 6 }}>
                    Pass 3 Partial Match Ceiling (Max %)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="5"
                    max="50"
                    value={partialMax}
                    onChange={(e) => setPartialMax(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: 4 }}>Default: 20.0% variance threshold</span>
                </div>
              </div>
            </div>

            {/* ML Anomaly Scorer Settings */}
            <div className="fin-card" style={{ padding: '24px' }}>
              <h2 className="fin-card-title" style={{ marginBottom: 4 }}>ML Anomaly Isolation Thresholds</h2>
              <p className="fin-card-desc" style={{ marginBottom: 20 }}>
                Set risk boundary points for Isolation Forest score grading (0–100 scale)
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 650, color: '#334155', marginBottom: 6 }}>
                    High Risk Threshold (Points)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="80"
                    value={mlHighRisk}
                    onChange={(e) => setMlHighRisk(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: 4 }}>Default: 45 pts (Elevated vs High)</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 650, color: '#334155', marginBottom: 6 }}>
                    Critical Anomaly Threshold (Points)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="95"
                    value={mlCritical}
                    onChange={(e) => setMlCritical(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: 4 }}>Default: 70 pts (Triggers immediate analyst alert)</span>
                </div>
              </div>
            </div>

            {/* Tax Rates Configuration */}
            <div className="fin-card" style={{ padding: '24px' }}>
              <h2 className="fin-card-title" style={{ marginBottom: 4 }}>Tax-Line Matcher &amp; GL Schedule</h2>
              <p className="fin-card-desc" style={{ marginBottom: 20 }}>
                Configure corporate income tax rates and treaty foreign withholding percentages
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 650, color: '#334155', marginBottom: 6 }}>
                    Corporate Income Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: 4 }}>Default: 21.0% (standard rate)</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 650, color: '#334155', marginBottom: 6 }}>
                    Foreign Withholding Tax (WHT %)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="35"
                    value={whtRate}
                    onChange={(e) => setWhtRate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: 4 }}>Default: 15.0% treaty withholding rate</span>
                </div>
              </div>
            </div>

            {/* Save Action */}
            <div>
              <button
                className="d-btn d-btn-primary"
                type="submit"
                style={{ padding: '0 24px' }}
              >
                Save Settings
              </button>
            </div>
          </form>

        </main>
      </div>
    </div>
  )
}
