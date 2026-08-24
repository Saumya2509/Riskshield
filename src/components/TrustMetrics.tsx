const metrics = [
  {
    num: '98.4%',
    title: 'Automated Match Rate',
    body: 'Deterministic 3-pass matching resolves exact pairs, fee variances, and partial short-pays without human touch.',
    color: '#60a5fa'
  },
  {
    num: '2.8 ms',
    title: 'Engine Run Latency',
    body: 'Processes 500+ heterogeneous records across 3 independent financial sources with sub-3ms algorithmic speed.',
    color: '#34d399'
  },
  {
    num: '₹0 Penalty',
    title: 'Section 270A Defense',
    body: 'CBDT Section 148 scrutiny, Form 15CB DTAA, and GST DRC-01 covered with CA DSC Class-3 e-filing.',
    color: '#a78bfa'
  },
  {
    num: 'T+1…T+7',
    title: 'Forward Cash Realization',
    body: 'Spline liquidity trajectory with daily settlement schedules and DSO payment lag stress-testing slider.',
    color: '#fbbf24'
  },
]

export default function TrustMetrics() {
  return (
    <section id="metrics" className="trust" style={{ background: '#090d16', padding: '56px 0', borderTop: '1px solid rgba(148, 163, 184, 0.08)', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        {metrics.map((item) => (
          <div
            key={item.title}
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              borderRadius: 14,
              padding: '22px',
            }}
          >
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: item.color, letterSpacing: '-0.02em' }}>
              {item.num}
            </div>
            <div style={{ color: '#ffffff', fontWeight: 750, margin: '4px 0', fontSize: '0.96rem' }}>
              {item.title}
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
