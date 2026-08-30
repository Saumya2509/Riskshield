export default function FinalCTA() {
  return (
    <section className="lp-cta-aurora">
      <div className="lp-wrap" style={{ maxWidth: '800px' }}>
        <div className="lp-badge-shimmer" style={{ marginBottom: 20 }}>
          <span className="lp-pulse-dot" />
          START RECONCILING TODAY
        </div>

        <h2 style={{ fontSize: 'clamp(2.2rem, 4.2vw, 3.4rem)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 18 }}>
          Ready for Autonomous <br />
          <span className="text-gradient-cyan">3-Way Financial Control?</span>
        </h2>

        <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: 36 }}>
          Join high-growth enterprise finance teams, CFO controllers, and audit partners using RiskShield to eliminate reconciliation discrepancies and defend statutory filings.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="#/reconciliation"
            className="lp-btn-glow"
            style={{ fontSize: '1rem', padding: '15px 32px' }}
          >
            ⚡ Open Reconciliation Engine
          </a>
          <a
            href="#/dashboard"
            className="lp-btn-glass"
            style={{ fontSize: '1rem', padding: '15px 30px' }}
          >
            Launch Executive Dashboard ➔
          </a>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 40, fontSize: '0.82rem', color: '#64748b' }}>
          <span>✓ Sub-3ms Runtime</span>
          <span>·</span>
          <span>✓ 100% ACID Audit Logs</span>
          <span>·</span>
          <span>✓ CA 270A Audit Trail</span>
        </div>
      </div>
    </section>
  )
}
