import { useState, useEffect, useRef } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'

const FAQS = [
  {
    q: 'How does 3-way reconciliation differ from 2-way matching?',
    a: 'Traditional 2-way matching compares invoices against purchase orders. RiskShield\'s 3-way engine cross-references Bank Statements, ERP General Ledgers, AND GST e-Invoices simultaneously — catching discrepancies that 2-way matching fundamentally cannot detect, like settlement lag variances and gateway fee absorption.'
  },
  {
    q: 'What happens when the engine encounters an exception?',
    a: 'Exceptions are auto-classified into 7 GAAP standard codes (AMOUNT_MISMATCH, MISSING_REF, DUPLICATE, etc.) and routed to the 1-Click Exception Workbench. You can batch-resolve with compliant accounting fixes — debit memos, suspense GL 2190 clearing, or duplicate voiding — in milliseconds.'
  },
  {
    q: 'How does the Section 270A penalty defense work?',
    a: 'RiskShield maps expenses to corporate tax regimes (115BAA @ 25.17%, Old @ 34.94%) and generates statutory defense submissions with Section 144B e-filing, Form 26A certificates, and CA DSC Class-3 digital signatures. This mitigates the 200% misreporting penalty under Section 270A of the Income Tax Act.'
  },
  {
    q: 'What data formats does the ingestion layer support?',
    a: 'The normalizer accepts Bank MT940/CAMT.053 statements, SAP/Oracle ERP GL exports (CSV/XLSX), and GST e-Invoice JSON/XML feeds. All data is UTF-8 normalized and deduplicated before entering the 3-pass matching pipeline.'
  },
  {
    q: 'How accurate is the Isolation Forest anomaly detection?',
    a: 'The 6-dimensional Isolation Forest model achieves 98.7% AUC-ROC precision across variance delta, settlement lag, FX volatility, round-number frequency, counterparty velocity, and GL account deviation vectors — with built-in false-positive suppression.'
  },
]

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const sectionRef = useScrollReveal<HTMLElement>(0.05)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const items = container.querySelectorAll('.reveal-item')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            const idx = Array.from(items).indexOf(el)
            el.style.transitionDelay = `${idx * 80}ms`
            el.classList.add('revealed')
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.1 }
    )
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="faq" className="lp-section lp-section-light" ref={sectionRef.ref}>
      <div className="lp-wrap">
        <div className="lp-section-head">
          <div className="lp-badge lp-badge-blue">
            <span className="lp-badge-dot" />
            FAQ
          </div>
          <h2>Frequently Asked Questions</h2>
          <p>Common questions about RiskShield's reconciliation engine, ML scoring, and statutory defense capabilities.</p>
        </div>

        <div className="lp-faq-list" ref={containerRef}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className={`lp-faq-item reveal-item ${openIdx === i ? 'is-open' : ''}`}
            >
              <button className="lp-faq-q" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                <span>{faq.q}</span>
                <span className="lp-faq-chevron">▼</span>
              </button>
              <div className="lp-faq-a">
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
