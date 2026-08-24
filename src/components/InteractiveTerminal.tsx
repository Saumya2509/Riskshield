import { useState } from 'react'

export default function InteractiveTerminal() {
  const [activeTab, setActiveTab] = useState<'3way' | 'ml' | 'tax'>('3way')
  const [isSimulating, setIsSimulating] = useState(false)
  const [simStep, setSimStep] = useState(0)

  function runLiveSim() {
    setIsSimulating(true)
    setSimStep(1)
    setTimeout(() => setSimStep(2), 400)
    setTimeout(() => setSimStep(3), 800)
    setTimeout(() => setSimStep(4), 1200)
    setTimeout(() => {
      setIsSimulating(false)
      setSimStep(4)
    }, 1600)
  }

  return (
    <section id="demo" className="section" style={{ background: '#090d16' }}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="soft-badge">
              <span className="badge-dot" />
              INTERACTIVE RECONCILIATION TERMINAL
            </span>
            <h2>Test 3-Way Reconciliation In Real Time</h2>
          </div>
          <p className="lead">
            Simulate how RiskShield matches Bank Feeds against ERP General Ledgers and statutory GST e-Invoices with sub-3ms algorithmic execution.
          </p>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)'
        }}>
          {/* Terminal Header */}
          <div style={{
            background: 'rgba(11, 15, 25, 0.9)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981' }} />
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                riskshield-engine --dataset=enterprise_q1_500.csv
              </span>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: '3way', label: '1. 3-Way Match' },
                { id: 'ml', label: '2. ML Anomaly' },
                { id: 'tax', label: '3. Tax Defense' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.74rem',
                    fontWeight: 650,
                    cursor: 'pointer',
                    background: activeTab === t.id ? '#2563eb' : 'rgba(255,255,255,0.05)',
                    color: '#ffffff'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Console Output */}
          <div style={{ padding: '22px', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.7, minHeight: 260, color: '#cbd5e1' }}>
            {activeTab === '3way' && (
              <div>
                <div style={{ color: '#60a5fa' }}>$ riskshield reconcile --sources=bank,ledger,invoice --tolerance=1.00%</div>
                <div style={{ color: '#94a3b8' }}>[00:01] Ingesting 500 records from MT940 feed and SAP ECC GL dump...</div>
                <div style={{ color: simStep >= 1 ? '#4ade80' : '#64748b' }}>[00:02] Pass 1 Exact: Matched 432 / 500 records (86.4%) with 0.00 delta</div>
                <div style={{ color: simStep >= 2 ? '#38bdf8' : '#64748b' }}>[00:03] Pass 2 Fuzzy: Reconciled 46 records within ±1.5% MDR gateway fee tolerance</div>
                <div style={{ color: simStep >= 3 ? '#f59e0b' : '#64748b' }}>[00:04] Pass 3 Partial: Flagged 22 short-pay items and 2 duplicate billing entries</div>
                <div style={{ color: simStep >= 4 ? '#4ade80' : '#64748b', fontWeight: 700 }}>
                  [00:05] ✓ Batch Summary: 89.7% initial match rate ➔ 39 exceptions routed to Workbench
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
                <div style={{ color: '#a5b4fc' }}>[00:03] CA Digital Signature Certificate (DSC Class-3) signed by CA Rajesh Verma, FCA #084920</div>
                <div style={{ color: '#4ade80', fontWeight: 700 }}>[00:04] ✓ Section 270A 200% Misreporting Penalty ($15,000 / ₹1,24,000) Successfully Mitigated</div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div style={{
            padding: '14px 22px',
            background: 'rgba(11, 15, 25, 0.9)',
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <button
              onClick={runLiveSim}
              disabled={isSimulating}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 16px' }}
            >
              {isSimulating ? '⚡ Running Simulation…' : '▶ Re-Run Live Terminal Test'}
            </button>

            <a
              href="#/reconciliation"
              className="btn btn-primary"
              style={{ fontSize: '0.82rem', padding: '8px 18px' }}
            >
              Open Full Controller App ➔
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
