import { useEffect, useState } from 'react'

export default function Hero() {
  const [tickerIndex, setTickerIndex] = useState(0)

  const tickerLogs = [
    { pass: 'PASS 1 EXACT', text: '432 / 500 records matched with hash ref (0.00 delta)', color: '#4ade80' },
    { pass: 'PASS 2 FUZZY', text: '46 records reconciled within ±1.5% MDR fee tolerance', color: '#38bdf8' },
    { pass: 'AUTONOMOUS SOLVE', text: '39 exceptions auto-settled via Gateway Fee GL 6140', color: '#fbbf24' },
    { pass: 'STATUTORY DEFENSE', text: 'NFAC DIN-849204 Verified · Builds Audit Trail for CA 270A Response', color: '#a78bfa' }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerLogs.length)
    }, 2800)
    return () => clearInterval(timer)
  }, [tickerLogs.length])

  return (
    <section className="lp-hero" id="top">
      {/* Aurora Ambient Glow Cones */}
      <div className="lp-hero-aurora" />

      <div className="lp-wrap">
        <div className="lp-hero-grid-split">
          {/* Left Column: Headline & Value Proposition */}
          <div>
            <div className="lp-badge-shimmer">
              <span className="lp-pulse-dot" />
              AUTONOMOUS 3-WAY FINANCIAL RECONCILIATION
            </div>

            <h1 className="lp-hero-title">
              Audit, Match &amp; Shield{' '}
              <span className="text-gradient-cyan">3 Financial Feeds</span> in Sub-3ms.
            </h1>

            <p className="lp-hero-desc">
              Ingest Bank MT940 statements, ERP General Ledgers, and GST e-Invoices. Execute 3-pass deterministic matching, isolate high-risk anomalies with 6-D vector ML, and build audit trails for CA's 270A response.
            </p>

            <div className="lp-hero-actions">
              <a href="#/reconciliation" className="lp-btn-glow">
                ⚡ Open Reconciliation Engine
              </a>
              <a href="#demo" className="lp-btn-glass">
                ▶ Interactive Terminal
              </a>
              <a href="#roi" className="lp-btn-glass">
                📊 Calculate ROI
              </a>
            </div>

            <div className="lp-hero-badges-row">
              <div className="lp-hero-badge-item">
                <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span> 3-Pass Rule Engine
              </div>
              <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
              <div className="lp-hero-badge-item">
                <span style={{ color: '#38bdf8', fontWeight: 800 }}>✓</span> 6-D Isolation Forest ML
              </div>
              <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
              <div className="lp-hero-badge-item">
                <span style={{ color: '#a78bfa', fontWeight: 800 }}>✓</span> DIN Notice &amp; Formatted for CA DSC
              </div>
            </div>
          </div>

          {/* Right Column: 3-Way Ingestion Hologram */}
          <div>
            <div className="lp-hologram-card">
              <div className="lp-hologram-header">
                <div className="lp-hologram-title">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Live Reconciliation Telemetry · Batch #1
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                  500 RECS / BATCH
                </span>
              </div>

              {/* 3 Source Nodes */}
              <div className="lp-sources-row">
                <div className="lp-source-pill">
                  <div className="lp-source-icon">🏦</div>
                  <div className="lp-source-name">Bank MT940</div>
                  <div className="lp-source-sub">Razorpay / HDFC</div>
                </div>

                <div className="lp-source-pill">
                  <div className="lp-source-icon">📑</div>
                  <div className="lp-source-name">SAP ECC / GL</div>
                  <div className="lp-source-sub">General Ledger</div>
                </div>

                <div className="lp-source-pill">
                  <div className="lp-source-icon">🧾</div>
                  <div className="lp-source-name">GST e-Invoice</div>
                  <div className="lp-source-sub">IRN / QR Feeds</div>
                </div>
              </div>

              {/* Central AI Engine Node */}
              <div className="lp-convergence-core">
                <div className="lp-core-status">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                  3-Pass Convergence Active (98.4% Matched)
                </div>

                <div className="lp-kpis-mini">
                  <div className="lp-kpi-item-mini">
                    <div className="lp-kpi-val-mini" style={{ color: '#10b981' }}>₹1.48 Cr</div>
                    <div className="lp-kpi-lbl-mini">Cleared Value</div>
                  </div>

                  <div className="lp-kpi-item-mini">
                    <div className="lp-kpi-val-mini" style={{ color: '#38bdf8' }}>2.8 ms</div>
                    <div className="lp-kpi-lbl-mini">Engine Latency</div>
                  </div>

                  <div className="lp-kpi-item-mini">
                    <div className="lp-kpi-val-mini" style={{ color: '#a78bfa' }}>₹3.42 L</div>
                    <div className="lp-kpi-lbl-mini">270A CA Trail</div>
                  </div>
                </div>
              </div>

              {/* Live Scanning Diff Log */}
              <div className="lp-ticker-box">
                <div style={{ color: '#64748b', fontSize: '0.65rem', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Live Event Stream:
                </div>
                <div style={{ color: tickerLogs[tickerIndex].color, fontWeight: 600 }}>
                  [{tickerLogs[tickerIndex].pass}] {tickerLogs[tickerIndex].text}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
