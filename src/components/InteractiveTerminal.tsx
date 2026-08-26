import { useState } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function InteractiveTerminal() {
  const [activeTab, setActiveTab] = useState<'3way' | 'ml' | 'tax'>('3way')
  const [isRunning, setIsRunning] = useState(false)
  const [step, setStep] = useState(0)
  const sectionRef = useScrollReveal<HTMLDivElement>(0.05)

  function runSim() {
    setIsRunning(true)
    setStep(1)
    setTimeout(() => setStep(2), 400)
    setTimeout(() => setStep(3), 800)
    setTimeout(() => setStep(4), 1200)
    setTimeout(() => { setIsRunning(false); setStep(4) }, 1600)
  }

  return (
    <section id="demo" className="lp-section lp-section-dark">
      <div className="lp-wrap">
        <div className="lp-section-head">
          <div className="lp-badge lp-badge-dark">
            <span className="lp-badge-dot" />
            LIVE TERMINAL
          </div>
          <h2 style={{ color: '#fff' }}>Test Reconciliation In Real Time</h2>
          <p>Simulate how RiskShield matches Bank feeds against ERP Ledgers and GST e-Invoices with sub-3ms execution.</p>
        </div>

        <div className="lp-terminal-wrap reveal" ref={sectionRef.ref}>
          <div className="lp-terminal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="lp-terminal-dots">
                <span className="lp-terminal-dot" style={{ background: '#ef4444' }} />
                <span className="lp-terminal-dot" style={{ background: '#f59e0b' }} />
                <span className="lp-terminal-dot" style={{ background: '#10b981' }} />
              </div>
              <span style={{ fontSize: '0.76rem', color: '#64748b', fontFamily: 'monospace' }}>
                riskshield-engine --dataset=enterprise_q1
              </span>
            </div>
            <div className="lp-terminal-tabs">
              {[
                { id: '3way' as const, label: '3-Way Match' },
                { id: 'ml' as const, label: 'ML Anomaly' },
                { id: 'tax' as const, label: 'Tax Defense' },
              ].map(t => (
                <button
                  key={t.id}
                  className={`lp-terminal-tab ${activeTab === t.id ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lp-terminal-body">
            {activeTab === '3way' && (
              <div>
                <div style={{ color: '#60a5fa' }}>$ riskshield reconcile --sources=bank,ledger,invoice --tol=1.00%</div>
                <div style={{ color: '#94a3b8' }}>[00:01] Ingesting 500 records from MT940 feed...</div>
                <div style={{ color: step >= 1 ? '#4ade80' : '#334155' }}>[00:02] Pass 1 Exact: 432/500 matched (86.4%) — 0.00 delta</div>
                <div style={{ color: step >= 2 ? '#38bdf8' : '#334155' }}>[00:03] Pass 2 Fuzzy: 46 reconciled within ±1.5% MDR tolerance</div>
                <div style={{ color: step >= 3 ? '#f59e0b' : '#334155' }}>[00:04] Pass 3 Partial: 22 short-pay flagged, 2 duplicates</div>
                <div style={{ color: step >= 4 ? '#4ade80' : '#334155', fontWeight: 700 }}>
                  [00:05] ✓ 89.7% initial match → 39 exceptions routed to Workbench
                </div>
              </div>
            )}
            {activeTab === 'ml' && (
              <div>
                <div style={{ color: '#a5b4fc' }}>$ riskshield ml-score --model=isolation-forest --trees=100</div>
                <div style={{ color: '#94a3b8' }}>[00:01] Building 6-D feature vectors across 500 txns...</div>
                <div style={{ color: '#4ade80' }}>[00:02] Evaluating variance, lag, FX vol, round-sum freq...</div>
                <div style={{ color: '#f87171' }}>[00:03] ⚠ Anomaly: B1-BNK-042 [0.91] — Unregistered vendor ₹1,40,000</div>
                <div style={{ color: '#38bdf8' }}>[00:04] ✓ 98.7% AUC-ROC precision verified</div>
              </div>
            )}
            {activeTab === 'tax' && (
              <div>
                <div style={{ color: '#60a5fa' }}>$ riskshield statutory-defense --regime=115BAA</div>
                <div style={{ color: '#94a3b8' }}>[00:01] Fetching Sec 148 notice from NFAC New Delhi...</div>
                <div style={{ color: '#4ade80' }}>[00:02] Assembling Sec 144B submission with reconciled trail...</div>
                <div style={{ color: '#a5b4fc' }}>[00:03] CA DSC Class-3 signed by CA Rajesh Verma, FCA #084920</div>
                <div style={{ color: '#4ade80', fontWeight: 700 }}>[00:04] ✓ Sec 270A 200% Penalty (₹1,24,000) Mitigated</div>
              </div>
            )}
          </div>
          <div className="lp-terminal-footer">
            <button
              onClick={runSim}
              disabled={isRunning}
              className="lp-terminal-btn-rerun"
            >
              {isRunning ? '⚡ Running…' : '▶ Re-Run Simulation'}
            </button>
            <a href="#/reconciliation" className="lp-btn lp-btn-primary" style={{ fontSize: '0.84rem', padding: '9px 20px' }}>
              Open Full Engine ➔
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
