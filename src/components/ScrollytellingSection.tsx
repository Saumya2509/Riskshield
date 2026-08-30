import { useState } from 'react'

const PIPELINE_STAGES = [
  {
    step: '01',
    badge: 'STAGE 01 · NORMALIZATION',
    title: 'Multi-Source Feed Ingestion & Data Normalizer',
    subtitle: 'BANK MT940 + SAP GL + GST E-INVOICE QR/IRN',
    desc: 'Ingests disparate bank statement MT940 feeds, ERP general ledger dumps, and statutory e-invoice QR logs. Cleans, deduplicates, and structures transactions with UTF-8 encoding.',
    tags: ['Bank MT940', 'SAP ECC GL', 'GST e-Invoice'],
    metrics: { speed: '0.8 ms', status: 'Active Ingest' },
    color: '#38bdf8'
  },
  {
    step: '02',
    badge: 'STAGE 02 · 3-PASS HEURISTICS',
    title: '3-Pass Deterministic Heuristic Reconciliation',
    subtitle: 'EXACT 100% + FUZZY MDR (±1.5%) + PARTIAL SHORT-PAY',
    desc: 'Pass 1 establishes deterministic SHA-256 hash matches; Pass 2 reconciles payment gateway fee splits within customizable percentage windows; Pass 3 isolates partial short-pay discrepancies.',
    tags: ['Exact Hash Lock', 'MDR Fee Split', 'Lag Window'],
    metrics: { match: '98.4%', speed: '2.8 ms' },
    color: '#10b981'
  },
  {
    step: '03',
    badge: 'STAGE 03 · ISOLATION FOREST',
    title: '6-Dimensional Vector ML Anomaly Detection',
    subtitle: 'UNSUPERVISED FRAUD & DISCREPANCY SCORING',
    desc: 'Calculates high-dimensional anomaly scores per transaction across 6 parameters: variance delta, settlement window lag, currency volatility, round-number frequency, counterparty velocity, and GL account deviation.',
    tags: ['6-D Vectors', '98.7% AUC-ROC', 'False-Positive Shield'],
    metrics: { precision: '98.7%', threshold: '0.65' },
    color: '#a78bfa'
  },
  {
    step: '04',
    badge: 'STAGE 04 · GAAP WORKBENCH',
    title: '1-Click Autonomous Exception Settlement',
    subtitle: 'DEBIT MEMOS, SUSPENSE GL 2190 & SPOT FX ADJ',
    desc: 'Categorizes exceptions into 7 standard accounting codes (AMOUNT_MISMATCH, MISSING_REF, DUPLICATE, CURRENCY_MISMATCH, DATE_WINDOW_EXCEEDED, NO_MATCH, ORPHAN_LEDGER). 1-click batch resolution applies GAAP/IFRS compliant fixes.',
    tags: ['7 GAAP Codes', '1-Click Batch', 'ACID Audit Trail'],
    metrics: { resolved: '100.0%', export: 'Dark Navy .xls' },
    color: '#fbbf24'
  },
  {
    step: '05',
    badge: 'STAGE 05 · STATUTORY & LIQUIDITY',
    title: 'CBDT Statutory Notice Defense & Cash Forecaster',
    subtitle: 'SECTION 148 SCRUTINY, FORM 15CB DTAA & T+7 RUNWAY',
    desc: 'Simulates corporate tax liabilities under Section 115BAA, builds audit trail for CA\'s 270A response with Section 144B e-filing formatted for CA DSC Class-3 sign-off, and projects forward cash runway with 95% epistemic confidence.',
    tags: ['CBDT DIN Verified', 'Formatted for CA DSC', 'T+1…T+7 Runway'],
    metrics: { shield: '100% CA Trail', runway: '42 Days' },
    color: '#f43f5e'
  }
]

export default function ScrollytellingSection() {
  const [activeStage, setActiveStage] = useState(0)
  const current = PIPELINE_STAGES[activeStage]

  return (
    <section id="workflow" className="lp-section" style={{ background: '#060913' }}>
      <div className="lp-wrap">
        <div className="lp-section-head">
          <div className="lp-badge-shimmer">
            <span className="lp-pulse-dot" />
            5-STAGE ARCHITECTURE
          </div>
          <h2>How RiskShield Runs Autonomous Finance</h2>
          <p>The end-to-end verification pipeline transforming raw banking feeds into certified audit books and forward liquidity forecasts.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '32px', alignItems: 'start' }}>
          {/* Left Column: Stage Selector Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {PIPELINE_STAGES.map((s, idx) => (
              <div
                key={s.step}
                onClick={() => setActiveStage(idx)}
                style={{
                  background: activeStage === idx ? 'rgba(37, 99, 235, 0.15)' : 'rgba(14, 21, 37, 0.5)',
                  border: `1px solid ${activeStage === idx ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '14px',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: s.color, letterSpacing: '0.04em' }}>
                  {s.badge}
                </div>
                <div style={{ fontSize: '0.94rem', fontWeight: 750, color: '#ffffff', marginTop: 4 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                  {s.subtitle}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Stage Inspection Card */}
          <div className="lp-glass-card" style={{ padding: '36px', minHeight: '440px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: current.color, background: `${current.color}15`, border: `1px solid ${current.color}40`, padding: '4px 12px', borderRadius: 999 }}>
                  {current.badge}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                  STEP {current.step} OF 05
                </span>
              </div>

              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginBottom: 8, letterSpacing: '-0.02em' }}>
                {current.title}
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#38bdf8', fontWeight: 650, marginBottom: 16 }}>
                {current.subtitle}
              </p>
              <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: 24 }}>
                {current.desc}
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {current.tags.map(t => (
                  <span key={t} style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '5px 12px', borderRadius: 8, fontWeight: 600 }}>
                    ✓ {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions & Link */}
            <div style={{
              background: 'rgba(6, 10, 20, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14
            }}>
              <div style={{ display: 'flex', gap: 20 }}>
                {Object.entries(current.metrics).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>{k}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: current.color }}>{v}</div>
                  </div>
                ))}
              </div>

              <a
                href="#/reconciliation"
                className="lp-btn-glow"
                style={{ fontSize: '0.84rem', padding: '8px 18px' }}
              >
                Launch This Step ➔
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
