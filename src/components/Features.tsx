export default function Features() {
  return (
    <section className="section" id="features">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="eyebrow">Platform Capabilities</p>
            <h2>Built for modern treasury, accounting, and controllers.</h2>
          </div>
          <p className="lead">
            Every tool required to close month-end books faster, catch hidden cash leaks, and give CFOs real-time visibility into net liquidity.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature">
            <div className="icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
            </div>
            <h3>3-Pass Reconciliation Engine</h3>
            <p>Automated multi-pass architecture matching Exact IDs, tolerance-based banking fees (±1%), and short-pay partial variances across 500+ records in &lt;1.8s.</p>
          </article>

          <article className="feature">
            <div className="icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <h3>AI Settlement Copilot</h3>
            <p>Ask complex finance queries in plain language. The AI displays progressive multi-step thinking traces before answering with verified ledger evidence in ₹ INR.</p>
          </article>

          <article className="feature">
            <div className="icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <h3>Forward Cash Forecaster</h3>
            <p>Interactive T+1…T+7 liquidity trajectory, Inflow vs Outflow Donut chart, and Net Flow Delta Histograms with real-time scenario stress-testing.</p>
          </article>

          <article className="feature">
            <div className="icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3>Tax-Line Matcher & GL Classifier</h3>
            <p>Classifies revenue, operating expenses, and foreign vendor payments into corporate income tax and foreign withholding (WHT) liability estimates.</p>
          </article>

          <article className="feature">
            <div className="icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3>Isolation Forest Anomaly Scoring</h3>
            <p>Evaluates 6-feature vector weights to detect duplicate billings, timing lag anomalies, and orphaned ledger items on a 0–100 risk confidence scale.</p>
          </article>

          <article className="feature">
            <div className="icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
            </div>
            <h3>Supabase PostgreSQL Cloud Backend</h3>
            <p>Full ACID ledger integrity with built-in audit trails, row-level security, and 1-click cloud sync of all reconciliation batches and resolution notes.</p>
          </article>
        </div>
      </div>
    </section>
  )
}
