import { useState, useEffect, useRef } from 'react'

const STAGES = [
  {
    id: 'stage-1',
    number: '01',
    badge: '3-PASS HEURISTIC MATCHING',
    title: 'Multi-Source Ingestion & Automated Reconciliation',
    subtitle: 'BANK MT940 + SAP GL + GST E-INVOICE 3-WAY MATCH',
    desc: 'Ingests disparate bank statement MT940 feeds, ERP general ledger dumps, and e-invoice QR logs. Executes Pass 1 Exact (100% hash match), Pass 2 Fuzzy (±1% fee tolerance, ±2d settlement lag), and Pass 3 Partial Short-Pay in sub-3ms runtime.',
    kpis: [
      { label: 'Pass 1 Exact Rate', val: '86.4%' },
      { label: 'Pass 2 Fuzzy Match', val: '9.2%' },
      { label: 'Processing Speed', val: '2.8ms / 500 recs' }
    ]
  },
  {
    id: 'stage-2',
    number: '02',
    badge: 'ISOLATION FOREST ML',
    title: '6-Dimensional Vector Anomaly Detection',
    subtitle: 'UNSUPERVISED FRAUD & DISCREPANCY SCORING',
    desc: 'Calculates high-dimensional anomaly scores per transaction across 6 parameters: variance delta, settlement window lag, currency volatility, round-number frequency, counterparty velocity, and GL account deviation.',
    kpis: [
      { label: 'Feature Vectors', val: '6 Dimensions' },
      { label: 'AUC-ROC Precision', val: '98.7%' },
      { label: 'Anomaly Threshold', val: '0.65 Score' }
    ]
  },
  {
    id: 'stage-3',
    number: '03',
    badge: 'AUTONOMOUS GAAP SOLVER',
    title: '1-Click Exception Settlement Workbench',
    subtitle: 'AUTOMATED DEBIT MEMOS, SUSPENSE GL 2190 & SPOT FX',
    desc: 'Categorizes exceptions into 7 standard accounting codes (AMOUNT_MISMATCH, MISSING_REF, DUPLICATE, CURRENCY_MISMATCH, DATE_WINDOW_EXCEEDED, NO_MATCH, ORPHAN_LEDGER). 1-click batch resolution applies GAAP/IFRS compliant fixes in milliseconds.',
    kpis: [
      { label: 'Auto-Resolve Speed', val: '39 recs / 1-click' },
      { label: 'Final Match Rate', val: '100.0%' },
      { label: 'Audit Trail Export', val: 'Dark Navy .xls' }
    ]
  },
  {
    id: 'stage-4',
    number: '04',
    badge: 'STATUTORY DEFENSE TERMINAL',
    title: 'Statutory Tax Notice & Dispute Defense',
    subtitle: 'SECTION 148 SCRUTINY, FORM 15CB DTAA & GST RULE 88C',
    desc: 'Maps expenses to corporate tax regimes (Section 115BAA @ 25.17%, Old @ 34.94%, 115BAB @ 17.16%). Mitigates Section 270A 200% misreporting penalties through Section 144B e-filing, Form 26A/201(1) CA certificates, and DSC Class-3 signing.',
    kpis: [
      { label: 'Penalty Mitigated', val: '100% Protected' },
      { label: 'Compliance Level', val: 'Sec 144B / DIN' },
      { label: 'CA Signature', val: 'DSC Class-3' }
    ]
  },
  {
    id: 'stage-5',
    number: '05',
    badge: 'FORWARD LIQUIDITY FORECASTER',
    title: 'Forward Cash Forecaster (T+1 … T+7 Simulation)',
    subtitle: 'SETTLEMENT LAG TRAJECTORY & DSO STRESS-TESTING',
    desc: 'Generates daily opening balance, cleared inflow trajectories, operating expense outflows, and closing liquidity with epistemic confidence bounds. Includes interactive DSO lag stress-testing slider.',
    kpis: [
      { label: 'Forecast Horizon', val: 'T+1 … T+7 Days' },
      { label: 'Confidence Band', val: '95% Epistemic' },
      { label: 'Stress Testing', val: 'Dynamic DSO' }
    ]
  }
]

export default function ScrollytellingSection() {
  const [activeStage, setActiveStage] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const totalH = rect.height - window.innerHeight
      if (totalH <= 0) return

      const progress = Math.max(0, Math.min(1, -rect.top / totalH))
      const stageIdx = Math.min(STAGES.length - 1, Math.floor(progress * STAGES.length))
      setActiveStage(stageIdx)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const current = STAGES[activeStage]

  return (
    <section id="workflow" className="section" ref={containerRef} style={{ background: '#0a0e18', borderTop: '1px solid rgba(148, 163, 184, 0.08)', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="soft-badge">
              <span className="badge-dot" />
              THE 5-STEP RECONCILIATION PIPELINE
            </span>
            <h2>How RiskShield Runs Autonomous Finance</h2>
          </div>
          <p className="lead">
            Explore the 5-stage verification architecture that transforms raw multi-source ledger data into certified audit trails and forward liquidity forecasts.
          </p>
        </div>

        <div className="scrolly-container">
          {/* Left Sticky Navigation Column */}
          <div className="scrolly-nav-sticky">
            {STAGES.map((s, idx) => (
              <div
                key={s.id}
                className={`scrolly-tab ${activeStage === idx ? 'is-active' : ''}`}
                onClick={() => setActiveStage(idx)}
              >
                <div className="scrolly-num">STAGE {s.number} · {s.badge}</div>
                <div className="scrolly-title">{s.title}</div>
                <div className="scrolly-desc">{s.subtitle}</div>
              </div>
            ))}
          </div>

          {/* Right Dynamic Stage Viewport */}
          <div className="scrolly-stage-panel">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 750,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#818cf8',
                  background: 'rgba(99, 102, 241, 0.1)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  {current.badge}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>
                  STEP {current.number} OF 05
                </span>
              </div>

              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginBottom: 6, letterSpacing: '-0.02em' }}>
                {current.title}
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#93c5fd', fontWeight: 600, marginBottom: 12 }}>
                {current.subtitle}
              </p>
              <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: 20 }}>
                {current.desc}
              </p>
            </div>

            {/* Interactive Stage Simulation Box */}
            <div style={{
              background: 'rgba(11, 15, 25, 0.9)',
              border: '1px solid rgba(148, 163, 184, 0.14)',
              borderRadius: 12,
              padding: '18px 20px',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              color: '#e2e8f0',
              marginBottom: 20,
              lineHeight: 1.6
            }}>
              {activeStage === 0 && (
                <div>
                  <div style={{ color: '#4ade80', marginBottom: 4 }}>✓ 3-Pass Rule Engine Telemetry:</div>
                  <div style={{ color: '#94a3b8' }}>» Pass 1 Exact: <span style={{ color: '#fff' }}>B1-BNK-001 ⟷ B1-LDG-001 ⟷ INV-001</span> (Delta: ₹0.00 | Conf: 100%)</div>
                  <div style={{ color: '#94a3b8' }}>» Pass 2 Fuzzy: <span style={{ color: '#38bdf8' }}>B1-BNK-019 (₹98,500) ⟷ B1-LDG-019 (₹1,00,000)</span> [MDR Fee ±1.5%]</div>
                  <div style={{ color: '#94a3b8' }}>» Pass 3 Partial: <span style={{ color: '#f59e0b' }}>B1-BNK-042 (₹3,400 Short-Pay Flagged)</span> ➔ Exception Workbench</div>
                  <div style={{ color: '#818cf8', marginTop: 6 }}>⚡ Runtime: 500 records processed in 2.8ms</div>
                </div>
              )}

              {activeStage === 1 && (
                <div>
                  <div style={{ color: '#a5b4fc', marginBottom: 4 }}>🔮 6-Dimensional Isolation Forest Matrix:</div>
                  <div style={{ color: '#94a3b8' }}>» Vector: [Variance: 0.84, Lag: +4d, FX: 1.00, RoundSum: 0.95, Freq: 0.12, GL: 0.88]</div>
                  <div style={{ color: '#f87171' }}>» ANOMALY DETECTED [Score 0.89]: High-risk unverified counterparty wire ₹1,40,000</div>
                  <div style={{ color: '#818cf8', marginTop: 6 }}>🛡️ ML Heuristic: Flagged for mandatory dual-controller signoff</div>
                </div>
              )}

              {activeStage === 2 && (
                <div>
                  <div style={{ color: '#4ade80', marginBottom: 4 }}>⚡ 1-Click Autonomous GAAP Settlement:</div>
                  <div style={{ color: '#94a3b8' }}>» AMOUNT_MISMATCH (31 items) ➔ <span style={{ color: '#4ade80' }}>Debit Memo Issued / Gateway Fee GL 6140</span></div>
                  <div style={{ color: '#94a3b8' }}>» MISSING_REF (4 items) ➔ <span style={{ color: '#4ade80' }}>Suspense Clearing GL 2190 Assigned</span></div>
                  <div style={{ color: '#94a3b8' }}>» DUPLICATE (2 items) ➔ <span style={{ color: '#4ade80' }}>Voided Duplicate / Primary Unblocked</span></div>
                  <div style={{ color: '#818cf8', marginTop: 6 }}>✓ Batch Settlement Complete: Global Match Rate 100.0%</div>
                </div>
              )}

              {activeStage === 3 && (
                <div>
                  <div style={{ color: '#38bdf8', marginBottom: 4 }}>🏛️ CBDT Statutory Notice &amp; Dispute Defense:</div>
                  <div style={{ color: '#94a3b8' }}>» Document ID: <span style={{ color: '#fff' }}>DIN-2026-CBDT-849204 (NFAC New Delhi)</span></div>
                  <div style={{ color: '#94a3b8' }}>» Remedy: <span style={{ color: '#4ade80' }}>Section 144B Electronic Written Submission with Reconciled Trail</span></div>
                  <div style={{ color: '#94a3b8' }}>» CA Sign-off: <span style={{ color: '#a5b4fc' }}>CA Rajesh Verma, FCA #084920 (DSC Class-3)</span></div>
                  <div style={{ color: '#4ade80', marginTop: 6 }}>✓ Section 270A 200% Misreporting Penalty Mitigated: ₹1,24,000</div>
                </div>
              )}

              {activeStage === 4 && (
                <div>
                  <div style={{ color: '#38bdf8', marginBottom: 4 }}>📈 Epistemic Liquidity Forecast (T+1 … T+7):</div>
                  <div style={{ color: '#94a3b8' }}>» Day 1 (T+1): ₹1,24,85,000 Inflow (+35% Front-Loaded Settlement)</div>
                  <div style={{ color: '#94a3b8' }}>» Day 3 (T+3): DSO Lag Stress-Test (±2.5 Days) ➔ Peak Liquidity ₹1,86,40,000</div>
                  <div style={{ color: '#94a3b8' }}>» Day 7 (T+7): Projected Closing Cash ₹1,48,20,000 (95% Epistemic Confidence)</div>
                  <div style={{ color: '#4ade80', marginTop: 6 }}>✓ Working Capital Runway: 42 Days Covered</div>
                </div>
              )}
            </div>

            {/* Stage KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              {current.kpis.map(k => (
                <div key={k.label} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: 10, padding: '12px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>{k.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
