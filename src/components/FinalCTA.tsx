export default function FinalCTA() {
  return (
    <section className="section" style={{ background: '#080c14', textAlign: 'center', padding: '88px 0', borderTop: '1px solid rgba(148, 163, 184, 0.08)' }}>
      <div className="wrap" style={{ maxWidth: 760 }}>
        <span className="soft-badge" style={{ margin: '0 auto 16px' }}>
          <span className="badge-dot" />
          ENTERPRISE CONTROLLER OS
        </span>
        <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', marginBottom: 14 }}>
          Run The Books &amp; Protect Cash Flow
        </h2>
        <p className="lead" style={{ margin: '0 auto 28px' }}>
          Experience deterministic 3-way automated matching, 6-D vector ML anomaly scoring, statutory notice defense, and forward cash forecasting in action.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a className="btn btn-primary" href="#/reconciliation" style={{ padding: '12px 26px' }}>
            ⚡ Launch Reconciliation Engine ➔
          </a>
          <a className="btn btn-secondary" href="#/dashboard" style={{ padding: '12px 26px' }}>
            📊 Open Executive Dashboard
          </a>
        </div>
      </div>
    </section>
  )
}
