export default function OfferSection() {
  return (
    <section id="offer" className="section" style={{ background: '#070a10' }}>
      <div className="wrap">
        <div className="offer-box">
          <div>
            <span className="rzp-badge">
              <span className="rzp-badge-pulse" />
              THE RAZORPAY BUILDATHON OFFER
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.7rem)', marginBottom: 14 }}>
              Your Code Speaks Louder Than Your Resume.
            </h2>
            <p style={{ fontSize: '0.94rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 24, maxWidth: '48ch' }}>
              Shortlisted builders go straight to a panel. No aptitude test. No group discussion. 6 or 12 month AI Builder Internship in Bangalore starting September 2026.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a
                href="#/reconciliation"
                className="btn btn-primary"
                style={{ fontSize: '0.88rem', padding: '12px 24px' }}
              >
                🚀 Test RiskShield Live Build
              </a>
              <a
                href="https://github.com/Saumya2509/Riskshield"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: '0.88rem', padding: '12px 24px' }}
              >
                📄 View Open GitHub Repo
              </a>
            </div>
          </div>

          <div className="offer-kpis">
            <div className="offer-kpi-card">
              <div className="offer-kpi-val">₹75,000</div>
              <div className="offer-kpi-lbl">Monthly Stipend</div>
            </div>

            <div className="offer-kpi-card">
              <div className="offer-kpi-val">6 or 12</div>
              <div className="offer-kpi-lbl">Months (Your Choice)</div>
            </div>

            <div className="offer-kpi-card">
              <div className="offer-kpi-val">Bangalore</div>
              <div className="offer-kpi-lbl">In-Person from Sept</div>
            </div>

            <div className="offer-kpi-card">
              <div className="offer-kpi-val">Direct Panel</div>
              <div className="offer-kpi-lbl">No Resume Screening</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
