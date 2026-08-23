const metrics = [
  {
    num: '98.4%',
    title: 'Automated Match Rate',
    body: 'Deterministic 3-pass matching resolves exact pairs and fee variances without human touch.',
  },
  {
    num: '< 1.8s',
    title: 'Engine Run Latency',
    body: 'Processes 500+ heterogeneous records across 3 independent financial sources instantly.',
  },
  {
    num: '100%',
    title: 'ACID Ledger Accuracy',
    body: 'Full zero-discrepancy math in Indian Rupees (₹) backed by PostgreSQL and Supabase cloud.',
  },
  {
    num: 'T+1…T+7',
    title: 'Forward Cash Realization',
    body: 'Predictive daily cash schedule with Inflow/Outflow Donut charts & Net Delta Histograms.',
  },
]

export default function TrustMetrics() {
  return (
    <section className="trust">
      <div className="wrap trust-grid">
        {metrics.map((item) => (
          <article className="trust-card" key={item.title}>
            <strong>{item.num}</strong>
            <p style={{ color: '#fff', fontWeight: 700, margin: '2px 0 0', fontSize: '0.94rem' }}>{item.title}</p>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
