import type { MouseEvent } from 'react'

export default function Features() {
  function handleCardMouseMove(e: MouseEvent<HTMLDivElement>) {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    card.style.setProperty('--card-x', `${x}px`)
    card.style.setProperty('--card-y', `${y}px`)
  }

  return (
    <section id="features" className="lp-section" style={{ background: '#060913' }}>
      <div className="lp-wrap">
        <div className="lp-section-head">
          <div className="lp-badge-shimmer">
            <span className="lp-pulse-dot" />
            CORE CAPABILITIES
          </div>
          <h2>Architected for Zero Financial Variance</h2>
          <p>Every layer of the RiskShield engine is designed to eliminate manual spreadsheet matching, detect subtle fraud, and certify tax compliance.</p>
        </div>

        <div className="lp-bento-grid">
          {/* Card 1: 3-Pass Rule Engine (Span 2) */}
          <div
            className="lp-glass-card lp-bento-card span-2"
            onMouseMove={handleCardMouseMove}
          >
            <div>
              <div className="lp-bento-icon-glow">⚡</div>
              <div className="lp-bento-title">3-Pass Deterministic Matching Engine</div>
              <p className="lp-bento-desc">
                Executes multi-pass matching across Bank feeds, ERP General Ledgers, and GST e-Invoices. Pass 1 locks exact SHA-256 hash matches (0.00 delta); Pass 2 reconciles payment gateway MDR fees within ±1.5% tolerance; Pass 3 aggregates partial short-pay vouchers.
              </p>
            </div>

            <div style={{
              background: 'rgba(6, 10, 20, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Pass 1 Exact</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>86.4%</div>
                <div style={{ fontSize: '0.68rem', color: '#86efac' }}>Zero variance lock</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Pass 2 Fuzzy</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>9.2%</div>
                <div style={{ fontSize: '0.68rem', color: '#bae6fd' }}>MDR auto-split</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Throughput</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a78bfa', marginTop: 2 }}>2.8 ms</div>
                <div style={{ fontSize: '0.68rem', color: '#ddd6fe' }}>500 recs / batch</div>
              </div>
            </div>
          </div>

          {/* Card 2: 6-D Isolation Forest ML */}
          <div
            className="lp-glass-card lp-bento-card"
            onMouseMove={handleCardMouseMove}
          >
            <div>
              <div className="lp-bento-icon-glow" style={{ color: '#a78bfa', borderColor: 'rgba(167, 139, 250, 0.3)' }}>🔮</div>
              <div className="lp-bento-title">6-D Isolation Forest ML</div>
              <p className="lp-bento-desc">
                High-dimensional unsupervised anomaly detection analyzing variance delta, settlement window lag, round-number frequency, FX volatility, counterparty velocity, and GL account deviation.
              </p>
            </div>

            <div style={{ background: 'rgba(6, 10, 20, 0.7)', borderRadius: 12, padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: 6 }}>
                <span style={{ color: '#94a3b8' }}>Anomaly Detection Precision:</span>
                <strong style={{ color: '#4ade80' }}>98.7% AUC-ROC</strong>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: '98.7%', height: '100%', background: 'linear-gradient(90deg, #38bdf8, #4ade80)' }} />
              </div>
            </div>
          </div>

          {/* Card 3: 1-Click Exception Workbench */}
          <div
            className="lp-glass-card lp-bento-card"
            onMouseMove={handleCardMouseMove}
          >
            <div>
              <div className="lp-bento-icon-glow" style={{ color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.3)' }}>🛡️</div>
              <div className="lp-bento-title">1-Click GAAP Settlement</div>
              <p className="lp-bento-desc">
                Automatically categorizes discrepancies into 7 GAAP exception codes. Batch-apply debit memos, clear suspense GL 2190, void duplicates, or log MDR fee splits in milliseconds.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Debit Memos', 'Suspense GL 2190', 'Duplicate Void', 'FX Spot Adj'].map(t => (
                <span key={t} style={{ fontSize: '0.72rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.25)', color: '#fde68a', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
                  ✓ {t}
                </span>
              ))}
            </div>
          </div>

          {/* Card 4: Statutory Tax Defense Terminal (Span 2) */}
          <div
            className="lp-glass-card lp-bento-card span-2"
            onMouseMove={handleCardMouseMove}
          >
            <div>
              <div className="lp-bento-icon-glow" style={{ color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)' }}>🏛️</div>
              <div className="lp-bento-title">Statutory Tax &amp; DIN Notice Defense Terminal</div>
              <p className="lp-bento-desc">
                Simulate corporate tax liabilities across Section 115BAA (@25.17%), Old Regime (@34.94%), and Section 115BAB (@17.16%). Builds audit trail for CA's 270A response through automated Section 144B e-filing submissions formatted for CA DSC Class-3 sign-off.
              </p>
            </div>

            <div style={{
              background: 'rgba(6, 10, 20, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Government NFAC Verification</div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#f1f5f9', marginTop: 2 }}>
                  DIN-2026-CBDT-849204 · UDIN 26084920AAAA0029
                </div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', borderRadius: 8, color: '#4ade80', fontSize: '0.78rem', fontWeight: 700 }}>
                ✓ CA 270A Audit Trail
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
