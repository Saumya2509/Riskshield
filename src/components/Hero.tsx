export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="wrap hero-grid">
        <div>
          <p className="eyebrow">Autonomous Financial Reconciliation</p>
          <h1>
            Audit, match, and forecast <span>cash across 3 sources in seconds</span>
          </h1>
          <p className="lead">
            RiskShield ingests Bank Statements, ERP General Ledgers, and Invoices.
            Execute deterministic 3-pass matching, isolate anomalies with ML, forecast 7-day liquidity,
            and resolve discrepancies with zero manual spreadsheet chaos.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#/reconciliation">
              Open Reconciliation Engine
            </a>
            <a className="btn btn-ghost" href="#workflow">
              Explore 6-Step Workflow
            </a>
          </div>
          <div className="hero-note">
            <span>3-Pass Rule Engine</span>
            <span>·</span>
            <span>Isolation Forest ML</span>
            <span>·</span>
            <span>Supabase PostgreSQL</span>
          </div>
        </div>

        <LiveReconciliationPreview />
      </div>
    </section>
  )
}

function LiveReconciliationPreview() {
  return (
    <div className="dash-preview-card" aria-label="RiskShield live reconciliation preview">
      <div className="dash-top">
        <div className="dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span>Batch Audit · 500 Records (INR ₹)</span>
        <span style={{ color: '#10b981', fontWeight: 600 }}>98.4% Matched</span>
      </div>

      <div className="dash-body">
        {/* KPI Row */}
        <div className="dash-kpi-row">
          <div className="dash-kpi-box">
            <small>Cleared Value</small>
            <strong style={{ color: '#10b981' }}>₹1.42 Cr</strong>
          </div>
          <div className="dash-kpi-box">
            <small>Open Exceptions</small>
            <strong style={{ color: '#f87171' }}>₹4.15 L</strong>
          </div>
          <div className="dash-kpi-box">
            <small>7-Day Net Cash</small>
            <strong style={{ color: '#38bdf8' }}>+₹84.2 L</strong>
          </div>
        </div>

        {/* 3-Way Match Table Preview */}
        <div style={{ overflowX: 'auto' }}>
          <table className="dash-tbl-preview">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Source</th>
                <th style={{ textAlign: 'right' }}>Invoice</th>
                <th style={{ textAlign: 'right' }}>Bank</th>
                <th style={{ textAlign: 'right' }}>Diff</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontFamily: 'monospace', color: '#93c5fd', fontWeight: 600 }}>B1-BNK-001</td>
                <td><span style={{ background: '#1e293b', color: '#94a3b8', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 600 }}>BANK</span></td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹1,48,200</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹1,48,200</td>
                <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>₹0.00</td>
                <td style={{ textAlign: 'center' }}><span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', padding: '2px 6px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)' }}>Exact (P1)</span></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace', color: '#93c5fd', fontWeight: 600 }}>B1-BNK-002</td>
                <td><span style={{ background: '#1e293b', color: '#94a3b8', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 600 }}>BANK</span></td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹84,500</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹84,077</td>
                <td style={{ textAlign: 'right', color: '#fbbf24', fontWeight: 600 }}>−₹423.00</td>
                <td style={{ textAlign: 'center' }}><span style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', padding: '2px 6px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 600, border: '1px solid rgba(245, 158, 11, 0.2)' }}>Fuzzy (P2)</span></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace', color: '#93c5fd', fontWeight: 600 }}>B1-BNK-003</td>
                <td><span style={{ background: '#1e293b', color: '#94a3b8', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 600 }}>BANK</span></td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹3,12,000</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹2,80,800</td>
                <td style={{ textAlign: 'right', color: '#f87171', fontWeight: 600 }}>−₹31,200</td>
                <td style={{ textAlign: 'center' }}><span style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', padding: '2px 6px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)' }}>Partial (P3)</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Real-time ML Evaluation Footnote */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px solid #1e293b', paddingTop: 10 }}>
          <span>Isolation Forest: <strong>0 Anomalies</strong></span>
          <span style={{ color: '#60a5fa' }}>T+1…T+7 Liquidity Schedule Active</span>
        </div>
      </div>
    </div>
  )
}
