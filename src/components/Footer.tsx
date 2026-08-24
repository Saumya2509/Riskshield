import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="rich-footer">
      <div className="wrap">
        <div className="footer-top">
          {/* Brand Info */}
          <div className="footer-brand">
            <h4>
              <Logo />
              <span>RiskShield</span>
            </h4>
            <p>
              Autonomous 3-Way Financial Reconciliation, Machine Learning Anomaly Detection, and Statutory Tax Defense OS.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 6, fontSize: '0.74rem', color: '#4ade80' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              All Systems Operational · v2.4 Enterprise
            </div>
          </div>

          {/* Product Column */}
          <div className="footer-col">
            <h5>Product</h5>
            <ul>
              <li><a href="#/reconciliation">Multi-Source Recon Engine</a></li>
              <li><a href="#/exceptions">1-Click Exception Workbench</a></li>
              <li><a href="#/cash-forecast">Forward Cash Forecaster</a></li>
              <li><a href="#/tax-matcher">Statutory Tax &amp; Notice Defense</a></li>
              <li><a href="#/reports">Executive Audit Reports</a></li>
            </ul>
          </div>

          {/* Reconciliation Tech Column */}
          <div className="footer-col">
            <h5>Engine Tech</h5>
            <ul>
              <li><a href="#workflow">3-Pass Heuristic Rules</a></li>
              <li><a href="#workflow">6-D Isolation Forest ML</a></li>
              <li><a href="#workflow">GAAP Exception Balancing</a></li>
              <li><a href="#workflow">Spline Liquidity Trajectory</a></li>
              <li><a href="#workflow">DSO Lag Stress-Testing</a></li>
            </ul>
          </div>

          {/* Compliance & Security Column */}
          <div className="footer-col">
            <h5>Compliance &amp; Security</h5>
            <ul>
              <li><a href="#/tax-matcher">CBDT Section 115BAA Simulator</a></li>
              <li><a href="#/tax-matcher">Section 148 / 143(2) Defense</a></li>
              <li><a href="#/tax-matcher">Form 15CB DTAA Clearance</a></li>
              <li><a href="#/tax-matcher">CA DSC Class-3 Digital Signing</a></li>
              <li><a href="#/tax-matcher">PostgreSQL Row-Level Security</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} RiskShield Financial Intelligence. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <span>Indian Rupee (INR / ₹) Native</span>
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
