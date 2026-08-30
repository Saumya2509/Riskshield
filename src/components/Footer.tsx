import Logo from './Logo'

export default function Footer() {
  return (
    <footer style={{ background: '#05070d', borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '72px 0 36px', color: '#94a3b8' }}>
      <div className="lp-wrap">
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: '48px', marginBottom: '56px' }}>
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Logo />
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>RiskShield</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.7, maxWidth: '32ch', margin: '0 0 20px' }}>
              Autonomous 3-Way Financial Reconciliation, Machine Learning Anomaly Detection, and Statutory Tax Defense OS.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 8, fontSize: '0.74rem', color: '#34d399', fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              All Systems Operational · v2.4 Enterprise
            </div>
          </div>

          {/* Column 1: Platform */}
          <div>
            <h5 style={{ fontSize: '0.8rem', fontWeight: 750, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 18px' }}>
              Platform
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.86rem' }}>
              <li><a href="#/reconciliation" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>Multi-Source Recon</a></li>
              <li><a href="#/exceptions" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>1-Click Workbench</a></li>
              <li><a href="#/cash-forecast" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>Forward Cash Forecaster</a></li>
              <li><a href="#/tax-matcher" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>Statutory Tax Matcher</a></li>
              <li><a href="#/reports" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>Executive Audit Reports</a></li>
            </ul>
          </div>

          {/* Column 2: Architecture */}
          <div>
            <h5 style={{ fontSize: '0.8rem', fontWeight: 750, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 18px' }}>
              Architecture
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.86rem' }}>
              <li><a href="#workflow" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>3-Pass Rule Engine</a></li>
              <li><a href="#workflow" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>6-D Isolation Forest ML</a></li>
              <li><a href="#workflow" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>GAAP Balancing Rules</a></li>
              <li><a href="#workflow" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>Epistemic Spline Forecaster</a></li>
              <li><a href="#workflow" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>DSO Lag Stress Test</a></li>
            </ul>
          </div>

          {/* Column 3: Compliance & Security */}
          <div>
            <h5 style={{ fontSize: '0.8rem', fontWeight: 750, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 18px' }}>
              Compliance
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.86rem' }}>
              <li><a href="#/tax-matcher" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>CBDT Section 115BAA</a></li>
              <li><a href="#/tax-matcher" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>Section 148 Defense</a></li>
              <li><a href="#/tax-matcher" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>Form 15CB DTAA Portal</a></li>
              <li><a href="#/tax-matcher" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>Formatted for CA DSC Class-3 Sign-Off</a></li>
              <li><a href="#/tax-matcher" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}>PostgreSQL RLS Vault</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '28px', fontSize: '0.82rem', color: '#64748b', flexWrap: 'wrap', gap: 16 }}>
          <span>© {new Date().getFullYear()} RiskShield Financial Intelligence OS. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <span>INR (₹) Native</span>
            <span>·</span>
            <span>CBDT DIN Verified</span>
            <span>·</span>
            <span>ACID Audit Trails</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
