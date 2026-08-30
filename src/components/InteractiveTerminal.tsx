import { useState } from 'react'

export default function InteractiveTerminal() {
  const [activeTab, setActiveTab] = useState<'3way' | 'ml' | 'tax' | 'cash'>('3way')
  const [isRunning, setIsRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [copied, setCopied] = useState(false)

  function runSim() {
    setIsRunning(true)
    setStep(1)
    setTimeout(() => setStep(2), 350)
    setTimeout(() => setStep(3), 700)
    setTimeout(() => setStep(4), 1050)
    setTimeout(() => {
      setIsRunning(false)
      setStep(4)
    }, 1400)
  }

  function handleCopy() {
    const cmd = activeTab === '3way'
      ? 'riskshield reconcile --sources=bank,ledger,invoice --tolerance=1.00%'
      : activeTab === 'ml'
      ? 'riskshield ml-score --model=isolation-forest --trees=100'
      : activeTab === 'tax'
      ? 'riskshield statutory-defense --regime=115BAA --din=DIN-2026-CBDT-849204'
      : 'riskshield forecast-cash --horizon=7d --confidence=0.95'

    navigator.clipboard.writeText(cmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="demo" className="lp-section" style={{ background: '#070b14' }}>
      <div className="lp-wrap">
        <div className="lp-section-head">
          <div className="lp-badge-shimmer">
            <span className="lp-pulse-dot" />
            CLI &amp; ALGORITHMIC RUNNER
          </div>
          <h2>Live Terminal Execution Sandbox</h2>
          <p>Run simulated sub-3ms multi-source reconciliation, ML vector anomaly detection, and statutory defense directly in the browser.</p>
        </div>

        <div className="lp-terminal-mac">
          {/* macOS Top Bar */}
          <div className="lp-mac-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="lp-mac-dots">
                <span className="lp-mac-dot" style={{ background: '#ef4444' }} />
                <span className="lp-mac-dot" style={{ background: '#f59e0b' }} />
                <span className="lp-mac-dot" style={{ background: '#10b981' }} />
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                riskshield-controller · zsh · 80x24
              </span>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: '3way' as const, label: '1. 3-Way Match' },
                { id: 'ml' as const, label: '2. ML Scoring' },
                { id: 'tax' as const, label: '3. Tax Defense' },
                { id: 'cash' as const, label: '4. Cash Forecast' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTab(t.id); setStep(0); }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: activeTab === t.id ? '#2563eb' : 'rgba(255,255,255,0.05)',
                    color: activeTab === t.id ? '#ffffff' : '#94a3b8',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Console Output */}
          <div className="lp-mac-body">
            {activeTab === '3way' && (
              <div>
                <div style={{ color: '#60a5fa' }}>$ riskshield reconcile --sources=bank,ledger,invoice --tolerance=1.00%</div>
                <div style={{ color: '#94a3b8' }}>[00:01] Ingesting 500 records from MT940 feed and SAP ECC GL dump...</div>
                <div style={{ color: step >= 1 ? '#4ade80' : '#475569' }}>[00:02] Pass 1 Exact: Matched 432 / 500 records (86.4%) with 0.00 delta</div>
                <div style={{ color: step >= 2 ? '#38bdf8' : '#475569' }}>[00:03] Pass 2 Fuzzy: Reconciled 46 records within ±1.5% MDR gateway fee tolerance</div>
                <div style={{ color: step >= 3 ? '#f59e0b' : '#475569' }}>[00:04] Pass 3 Partial: Flagged 22 short-pay items and 2 duplicate billing entries</div>
                <div style={{ color: step >= 4 ? '#4ade80' : '#475569', fontWeight: 800, marginTop: 4 }}>
                  [00:05] ✓ Batch Summary: 89.7% initial match rate ➔ 39 exceptions auto-settled via GL 6140 (Final 100%)
                </div>
              </div>
            )}

            {activeTab === 'ml' && (
              <div>
                <div style={{ color: '#a5b4fc' }}>$ riskshield ml-score --model=isolation-forest --trees=100 --depth=8</div>
                <div style={{ color: '#94a3b8' }}>[00:01] Building 6-dimensional feature vectors across 500 transactions...</div>
                <div style={{ color: '#4ade80' }}>[00:02] Evaluating variance, lag, currency volatility, and round-sum frequency...</div>
                <div style={{ color: '#f87171' }}>[00:03] ⚠️ Anomaly Flagged: Record B1-BNK-042 [Score 0.91] — Unregistered vendor wire ₹1,40,000</div>
                <div style={{ color: '#38bdf8' }}>[00:04] ✓ False-positive suppression active: 98.7% AUC-ROC precision verified</div>
              </div>
            )}

            {activeTab === 'tax' && (
              <div>
                <div style={{ color: '#60a5fa' }}>$ riskshield statutory-defense --regime=115BAA --din=DIN-2026-CBDT-849204</div>
                <div style={{ color: '#94a3b8' }}>[00:01] Fetching Section 148 / 143(2) scrutiny notice from NFAC New Delhi...</div>
                <div style={{ color: '#4ade80' }}>[00:02] Assembling Section 144B Electronic Written Submission with Reconciled Trail...</div>
                <div style={{ color: '#a5b4fc' }}>[00:03] Submission formatted for CA Digital Signature Certificate (DSC Class-3) sign-off</div>
                <div style={{ color: '#4ade80', fontWeight: 800, marginTop: 4 }}>
                  [00:04] ✓ Audit Trail Generated for CA 270A Response (₹1,24,000 Misreporting Defense)
                </div>
              </div>
            )}

            {activeTab === 'cash' && (
              <div>
                <div style={{ color: '#38bdf8' }}>$ riskshield forecast-cash --horizon=7d --confidence=0.95 --stress-dso=2.5d</div>
                <div style={{ color: '#94a3b8' }}>[00:01] Computing historical settlement velocity across 500 accounts receivable records...</div>
                <div style={{ color: '#4ade80' }}>[00:02] Day 1 (T+1): ₹1,24,85,000 Inflow (+35% Front-Loaded Settlement)</div>
                <div style={{ color: '#38bdf8' }}>[00:03] Day 3 (T+3): DSO Lag Stress-Test (±2.5 Days) ➔ Peak Liquidity ₹1,86,40,000</div>
                <div style={{ color: '#4ade80', fontWeight: 800, marginTop: 4 }}>
                  [00:04] ✓ Working Capital Runway: 42 Days Covered (95% Epistemic Confidence Interval)
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div style={{
            padding: '16px 24px',
            background: 'rgba(13, 20, 36, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={runSim}
                disabled={isRunning}
                className="lp-btn-glow"
                style={{ fontSize: '0.84rem', padding: '9px 18px' }}
              >
                {isRunning ? '⚡ Running Batch…' : '▶ Execute Live Batch'}
              </button>

              <button
                onClick={handleCopy}
                className="lp-btn-glass"
                style={{ fontSize: '0.84rem', padding: '9px 16px' }}
              >
                {copied ? '✓ Command Copied!' : '📋 Copy CLI Command'}
              </button>
            </div>

            <a
              href="#/reconciliation"
              className="lp-btn-glow"
              style={{ fontSize: '0.84rem', padding: '9px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}
            >
              Open Full Controller App ➔
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
