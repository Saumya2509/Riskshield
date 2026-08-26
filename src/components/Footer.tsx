import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <h4>
              <Logo />
              <span>RiskShield</span>
            </h4>
            <p>
              Autonomous 3-Way Financial Reconciliation, ML Anomaly Detection, and Statutory Tax Defense OS.
            </p>
            <div className="lp-footer-status">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              All Systems Operational · v2.4
            </div>
          </div>

          <div className="lp-footer-col">
            <h5>Product</h5>
            <ul>
              <li><a href="#/reconciliation">Reconciliation Engine</a></li>
              <li><a href="#/exceptions">Exception Workbench</a></li>
              <li><a href="#/cash-forecast">Cash Forecaster</a></li>
              <li><a href="#/tax-matcher">Tax Defense</a></li>
              <li><a href="#/reports">Audit Reports</a></li>
            </ul>
          </div>

          <div className="lp-footer-col">
            <h5>Engine</h5>
            <ul>
              <li><a href="#how-it-works">3-Pass Heuristics</a></li>
              <li><a href="#how-it-works">Isolation Forest ML</a></li>
              <li><a href="#how-it-works">GAAP Settlement</a></li>
              <li><a href="#how-it-works">Liquidity Forecasting</a></li>
              <li><a href="#how-it-works">DSO Stress-Testing</a></li>
            </ul>
          </div>

          <div className="lp-footer-col">
            <h5>Compliance</h5>
            <ul>
              <li><a href="#/tax-matcher">CBDT Section 115BAA</a></li>
              <li><a href="#/tax-matcher">Section 148 Defense</a></li>
              <li><a href="#/tax-matcher">Form 15CB DTAA</a></li>
              <li><a href="#/tax-matcher">CA DSC Class-3</a></li>
              <li><a href="#/tax-matcher">Row-Level Security</a></li>
            </ul>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} RiskShield Financial Intelligence. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
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
