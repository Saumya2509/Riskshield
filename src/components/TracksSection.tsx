const TRACKS = [
  {
    number: '01',
    title: 'AI Growth & Agentic Commerce',
    desc: 'Grow the merchant’s revenue, and make them sellable to AI buyers. Build an agent that grows revenue for a merchant on Razorpay test-mode APIs.',
    direction: 'Conversational checkout, Agent-readable catalog, Upsell orchestrator',
    bar: 'Every money action explainable, bounded and gated.',
    isChampion: false
  },
  {
    number: '02',
    title: 'AI Risk Manager',
    desc: 'Stop the merchant losing money to fraud, returns and chargebacks. Build a working detector with measured precision and recall on held-out test sets.',
    direction: 'Chargeback responder, Return-risk scorer, Abuse sentinel',
    bar: 'Honest metrics including false-positive cost. Defense-only.',
    isChampion: false
  },
  {
    number: '03',
    title: 'AI Revenue Recovery',
    desc: 'Find revenue that’s slipping away and win it back. Detect revenue at risk and execute bounded recovery from payment failures to overdue receivables.',
    direction: 'Checkout drop-off recovery, B2B receivables chaser, Mandate retry sequencer',
    bar: 'Measured money recovered across a batch with compliant escalation.',
    isChampion: false
  },
  {
    number: '04',
    title: 'AI Finance Controller (RiskShield)',
    desc: 'Run the books and the cash position. The 2026 builder consensus: verification capacity, not generation speed, is the bottleneck.',
    direction: 'Multi-source reconciliation, Settlement Q&A, Forward cash forecaster, Statutory tax defense',
    bar: 'Throughput plus measured accuracy plus honest exception resolution.',
    isChampion: true
  },
  {
    number: '05',
    title: 'Open Track',
    desc: 'Build what you believe should exist. Pick a real problem, use AI meaningfully, and show us something that works end to end.',
    direction: 'Surprise us with deep domain execution and reliability',
    bar: 'Working product, meaningful AI, and proof of real value creation.',
    isChampion: false
  }
]

export default function TracksSection() {
  return (
    <section id="tracks" className="section">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="rzp-badge">
              <span className="rzp-badge-pulse" />
              RAZORPAY AI BUILDATHON · 5 OFFICIAL TRACKS
            </span>
            <h2>Choose Your Track. Build Something Real.</h2>
          </div>
          <p className="lead">
            No resume screening. No aptitude test. Four steps: pick a track, build something real, show your work, and get shortlisted straight to the panel.
          </p>
        </div>

        <div className="tracks-grid">
          {TRACKS.map(t => (
            <div
              key={t.number}
              className={`track-card ${t.isChampion ? 'track-card--featured' : ''}`}
            >
              <div className="track-num">
                <span>TRACK {t.number}</span>
                {t.isChampion && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: 999,
                    letterSpacing: '0.04em'
                  }}>
                    ★ ACTIVE RISKSHIELD BUILD
                  </span>
                )}
              </div>

              <h3 className="track-title">{t.title}</h3>
              <p className="track-summary">{t.desc}</p>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: 12 }}>
                <div style={{ fontSize: '0.68rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Example Directions:
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 3 }}>
                  {t.direction}
                </div>
              </div>

              <div style={{ fontSize: '0.74rem', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 10 }}>
                <strong style={{ color: '#f1f5f9' }}>The Bar:</strong> {t.bar}
              </div>

              {t.isChampion && (
                <div style={{ marginTop: 18 }}>
                  <a
                    href="#/reconciliation"
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '0.82rem', padding: '10px 0' }}
                  >
                    ⚡ Test Track 04 Build Live ➔
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
