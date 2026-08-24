export default function Hero() {
  return (
    <section className="hero" id="top" style={{ paddingTop: 36, paddingBottom: 56 }}>
      <div className="wrap hero-split">
        <div>
          <span className="soft-badge">
            <span className="badge-dot" />
            AUTONOMOUS 3-WAY FINANCIAL RECONCILIATION
          </span>
          <h1 style={{ marginBottom: 16 }}>
            Audit, match, and forecast <span style={{ color: '#60a5fa' }}>cash across 3 sources in seconds</span>
          </h1>
          <p className="lead" style={{ marginBottom: 28 }}>
            RiskShield ingests Bank Statements, ERP General Ledgers, and GST e-Invoices.
            Execute deterministic 3-pass matching, isolate anomalies with 6-D vector ML, forecast 7-day liquidity,
            and defend corporate balance sheets with Section 148 statutory automation.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
            <a className="btn btn-primary" href="#/reconciliation">
              ⚡ Open Reconciliation Engine
            </a>
            <a className="btn btn-secondary" href="#workflow">
              📜 Explore Workflow Engine
            </a>
            <a className="btn btn-secondary" href="#demo">
              ▶ Live Terminal
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.8rem', color: '#94a3b8', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#93c5fd' }}>
              ✓ 3-Pass Rule Engine
            </span>
            <span>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a5b4fc' }}>
              ✓ Isolation Forest ML
            </span>
            <span>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#86efac' }}>
              ✓ DIN Notice Defense &amp; DSC Class-3
            </span>
          </div>
        </div>

        {/* Live Controller Preview Card */}
        <div className="preview-card">
          <div className="preview-header">
            <div className="preview-title">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Live Audit Engine · Batch #1 (Enterprise Q1)
            </div>
            <div className="preview-dots">
              <span className="preview-dot" style={{ background: '#ef4444' }} />
              <span className="preview-dot" style={{ background: '#f59e0b' }} />
              <span className="preview-dot" style={{ background: '#10b981' }} />
            </div>
          </div>

          <div className="preview-kpis">
            <div className="preview-kpi">
              <div className="preview-kpi-lbl">Cleared Value</div>
              <div className="preview-kpi-val" style={{ color: '#10b981' }}>₹1.48 Cr</div>
              <span style={{ fontSize: '0.7rem', color: '#86efac' }}>✓ 100% Reconciled</span>
            </div>

            <div className="preview-kpi">
              <div className="preview-kpi-lbl">Sec 270A Penalty Shield</div>
              <div className="preview-kpi-val" style={{ color: '#818cf8' }}>₹3.42 L</div>
              <span style={{ fontSize: '0.7rem', color: '#c7d2fe' }}>DSC Class-3 Signed</span>
            </div>

            <div className="preview-kpi">
              <div className="preview-kpi-lbl">Engine Runtime</div>
              <div className="preview-kpi-val" style={{ color: '#38bdf8' }}>2.8 ms</div>
              <span style={{ fontSize: '0.7rem', color: '#bae6fd' }}>500 Recs / Batch</span>
            </div>

            <div className="preview-kpi">
              <div className="preview-kpi-lbl">Working Capital Runway</div>
              <div className="preview-kpi-val" style={{ color: '#f59e0b' }}>42 Days</div>
              <span style={{ fontSize: '0.7rem', color: '#fde68a' }}>T+1 … T+7 Forecast</span>
            </div>
          </div>

          {/* Mini 3-Pass Telemetry Row */}
          <div style={{
            background: 'rgba(11, 15, 25, 0.8)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            borderRadius: 10,
            padding: '12px 14px',
            fontFamily: 'monospace',
            fontSize: '0.74rem',
            lineHeight: 1.6
          }}>
            <div style={{ color: '#4ade80' }}>[PASS 1 EXACT] 432 / 500 records matched with hash ref (0.00 delta)</div>
            <div style={{ color: '#38bdf8' }}>[PASS 2 FUZZY] 46 records reconciled within ±1.5% MDR fee tolerance</div>
            <div style={{ color: '#f87171' }}>[AUTONOMOUS SOLVE] 39 exceptions settled via Gateway Fee GL 6140</div>
          </div>
        </div>
      </div>
    </section>
  )
}
