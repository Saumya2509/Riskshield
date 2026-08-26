import { useScrollReveal } from '../hooks/useScrollReveal'

export default function FinalCTA() {
  const sectionRef = useScrollReveal<HTMLElement>(0.15)

  return (
    <section className="lp-cta reveal" ref={sectionRef.ref}>
      <div className="lp-cta-orb lp-cta-orb-1" />
      <div className="lp-cta-orb lp-cta-orb-2" />

      <div className="lp-wrap">
        <h2>Ready to Automate Financial Reconciliation?</h2>
        <p>Start matching Bank, Ledger, and Invoice records in under 3ms with enterprise-grade ML scoring and statutory compliance.</p>
        <div className="lp-cta-actions">
          <a href="#/reconciliation" className="lp-cta-btn-white">⚡ Open Reconciliation Engine</a>
          <a href="#/dashboard" className="lp-btn lp-btn-outline-light" style={{ padding: '14px 28px', fontSize: '0.95rem' }}>Explore Dashboard ➔</a>
        </div>
      </div>
    </section>
  )
}
