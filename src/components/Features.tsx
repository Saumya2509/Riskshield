export default function Features() {
  return (
    <section className="section" id="features" style={{ background: '#0b0f19' }}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="soft-badge">
              <span className="badge-dot" />
              CORE CAPABILITIES
            </span>
            <h2>Built For Modern Finance Controllers &amp; CFOs</h2>
          </div>
          <p className="lead">
            Every capability required to automate month-end books close, isolate balance sheet anomalies, and protect cash flow with full audit compliance.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 16, padding: '24px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', marginBottom: 16, fontSize: '1.2rem' }}>
              🔄
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 750, color: '#ffffff', marginBottom: 8 }}>3-Pass Multi-Source Reconciliation</h3>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Ingests Bank Statements, ERP General Ledgers, and GST e-Invoices. Deterministic exact, fuzzy tolerance (±1%), and partial matching across 500+ records in &lt;2.8ms.
            </p>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 16, padding: '24px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', marginBottom: 16, fontSize: '1.2rem' }}>
              ⚡
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 750, color: '#ffffff', marginBottom: 8 }}>1-Click Exception Workbench</h3>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Auto-categorizes variances into 7 GAAP exception codes. 1-click bulk solver posts debit memos, assigns suspense clearing GL 2190, and exports styled Dark Navy Excel (.xls) sheets.
            </p>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 16, padding: '24px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', marginBottom: 16, fontSize: '1.2rem' }}>
              📈
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 750, color: '#ffffff', marginBottom: 8 }}>Forward Cash Forecaster (T+1…T+7)</h3>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Spline liquidity projection with daily settlement schedules, Inflow vs Outflow Donut visualization, and dynamic DSO payment lag stress-testing slider.
            </p>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 16, padding: '24px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', marginBottom: 16, fontSize: '1.2rem' }}>
              🏛️
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 750, color: '#ffffff', marginBottom: 8 }}>Statutory Tax & Notice Defense</h3>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Simulates Section 115BAA vs Old Regimes, files Section 144B e-responses for CBDT Section 148 notices, and mitigates Section 270A 200% misreporting penalties with CA DSC Class-3 signing.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
