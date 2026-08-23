import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Logo />
              <strong style={{ color: '#fff', fontSize: '1.15rem' }}>RiskShield</strong>
            </div>
            <p style={{ maxWidth: 320, lineHeight: 1.6, margin: 0, fontSize: '0.86rem' }}>
              Autonomous 3-Way Financial Reconciliation, Machine Learning Anomaly Detection, and Forward Liquidity Forecasting.
            </p>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="#/dashboard">Dashboard</a></li>
              <li><a href="#/reconciliation">Reconciliation Engine</a></li>
              <li><a href="#/exceptions">Exceptions Workbench</a></li>
              <li><a href="#/cash-forecast">Cash Forecaster</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Intelligence</h4>
            <ul>
              <li><a href="#/reports">Executive Reports</a></li>
              <li><a href="#/ai-assistant">AI Settlement Copilot</a></li>
              <li><a href="#/settings">Matching Rules</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Architecture</h4>
            <ul>
              <li><span style={{ color: '#94a3b8' }}>3-Pass Rule Engine</span></li>
              <li><span style={{ color: '#94a3b8' }}>Isolation Forest ML</span></li>
              <li><span style={{ color: '#94a3b8' }}>Supabase PostgreSQL</span></li>
              <li><span style={{ color: '#94a3b8' }}>Indian Rupee (INR / ₹)</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} RiskShield Financial Intelligence. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ color: '#22c55e', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              System Operational · v2.4 Active
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
