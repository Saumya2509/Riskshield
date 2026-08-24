import { useState } from 'react'

const faqs = [
  {
    q: 'How does the 3-Pass Reconciliation algorithm work?',
    a: 'Pass 1 performs exact matching on Reference ID, Amount (within ±₹0.01), and Currency. Pass 2 handles fuzzy matches allowing ±1% fee tolerance and ±2 days settlement lag. Pass 3 classifies partial short-pays and disputes. Anything remaining is categorized into specific exception reason codes.',
  },
  {
    q: 'How does the 1-Click AI Auto-Resolve engine work?',
    a: 'The engine parses all 7 exception codes (AMOUNT_MISMATCH, MISSING_REF, DUPLICATE, CURRENCY_MISMATCH, DATE_WINDOW_EXCEEDED, NO_MATCH, ORPHAN_LEDGER) and applies legally compliant GAAP accounting actions (e.g. posting delta variances to Gateway Fee GL 6140 or assigning Suspense Clearing GL 2190) in one click.',
  },
  {
    q: 'How does RiskShield mitigate CBDT Section 270A 200% penalties?',
    a: 'When high-risk statutory scrutiny notices (Section 148 / 143(2) / Form 15CB) are detected, RiskShield prepares a verified Section 144B Electronic Written Submission with full 3-way ERP reconciliation proofs and CA Digital Signature (DSC Class-3) certification.',
  },
  {
    q: 'How is the Forward Cash Forecaster calculated?',
    a: 'The cash forecaster uses realistic settlement weight curves (front-loaded T+1/T+2 arrivals, AR exception recovery, and AP payables schedule) combined with day-of-week multipliers to project daily opening, inflow, outflow, and closing balances in Indian Rupees (₹).',
  },
  {
    q: 'Can I upload custom company CSV files?',
    a: 'Yes. You can upload custom multi-source CSV files with BANK, LEDGER, and INVOICE rows directly via the "📁 Upload CSV" button or choose from pre-built 500-record enterprise batches.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState(0)

  return (
    <section className="section" id="faq" style={{ background: '#090d16' }}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="soft-badge">
              <span className="badge-dot" />
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2>Product &amp; Architecture Details</h2>
          </div>
          <p className="lead">
            Everything you need to know about the reconciliation engine, the mathematical models, and statutory audit compliance.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 840 }}>
          {faqs.map((item, index) => {
            const isOpen = open === index
            return (
              <div
                key={item.q}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: isOpen ? '1px solid #4f46e5' : '1px solid rgba(148, 163, 184, 0.12)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s'
                }}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.96rem',
                    fontWeight: 700,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>{item.q}</span>
                  <span style={{ fontSize: '1.3rem', color: isOpen ? '#818cf8' : '#64748b', fontWeight: 300, marginLeft: 16 }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 20px 18px', color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    {item.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
