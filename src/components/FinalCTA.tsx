export default function FinalCTA() {
  return (
    <section className="section final-cta">
      <div className="wrap">
        <h2>Ready to eliminate financial discrepancies?</h2>
        <p>
          Experience 3-way automated matching, forward cash forecasting, and AI settlement intelligence in action.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a className="btn btn-primary" href="#/reconciliation" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
            Launch Reconciliation Engine
          </a>
          <a className="btn btn-ghost" href="#/dashboard" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
            View Executive Dashboard
          </a>
        </div>
      </div>
    </section>
  )
}
