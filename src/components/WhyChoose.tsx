const reasons = [
  {
    title: '3-Way Cross-Verification, Not 2-Way',
    body: 'RiskShield links Invoice ↔ Bank Statement ↔ General Ledger simultaneously, eliminating false positives and ensuring true accounting truth.',
  },
  {
    title: 'Explainable AI with Step-by-Step Reasoning',
    body: 'No black-box guesses. Our AI copilot displays transparent thinking chains explaining exactly why an amount differed and provides actionable next steps.',
  },
  {
    title: 'Integrated Liquidity Forecasting',
    body: 'Reconciliation output directly feeds forward cash forecasters, rendering Inflow/Outflow Donut charts and daily Net Delta Histograms in ₹ INR.',
  },
  {
    title: 'Enterprise Supabase PostgreSQL Storage',
    body: 'Audit logs, analyst assignments, and certified reports are secured with ACID compliance, Row-Level Security, and instant cloud sync.',
  },
]

export default function WhyChoose() {
  return (
    <section className="section" id="why">
      <div className="wrap why-grid">
        <div>
          <p className="eyebrow">Why RiskShield</p>
          <h2>The modern autonomous reconciliation standard.</h2>
          <p className="lead">
            Built for enterprise controllers, CFOs, and treasury analysts who require precision, automation, and audit-ready peace of mind.
          </p>
        </div>
        <div className="why-list">
          {reasons.map((item, index) => (
            <article className="why-item" key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
