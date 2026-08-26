import { useState } from 'react'

const FAQS = [
  {
    q: 'How does RiskShield 3-way reconciliation differ from traditional 2-way matching?',
    a: 'Traditional 2-way matching only cross-checks purchase invoices against vendor bills. RiskShield simultaneously ingests Bank MT940 statements, ERP General Ledger postings (SAP/Oracle), AND statutory GST e-Invoices. This catches settlement lag variances, gateway MDR fee deductions, and cross-border WHT discrepancies that 2-way matching fundamentally misses.'
  },
  {
    q: 'What is the 3-Pass Rule Engine and how does it achieve sub-3ms latency?',
    a: 'Pass 1 executes deterministic SHA-256 hash matching on identical amounts and reference IDs with zero delta. Pass 2 applies heuristic fuzzy matching to account for payment gateway fee absorption (±1.5% MDR) and settlement window lag (±2 days). Pass 3 flags partial short-pays and duplicate billings. The entire algorithm is compiled in optimized TypeScript executing 500 records in 2.8ms.'
  },
  {
    q: 'How does RiskShield mitigate Income Tax Section 270A penalties?',
    a: 'Under Section 270A of the Income Tax Act, under-reporting or misreporting of income incurs a mandatory 200% penalty. RiskShield reconciles tax-deductible expenses against GST DRC-01 and Section 148 notices, automatically generating Section 144B e-filing defense submissions and Form 26A/201(1) certificates digitally signed with CA DSC Class-3 credentials.'
  },
  {
    q: 'Can RiskShield integrate with SAP ECC, Oracle NetSuite, and custom bank feeds?',
    a: 'Yes. RiskShield\'s normalization layer natively accepts standard banking MT940 and CAMT.053 XML feeds, ERP General Ledger CSV/XLSX exports, and GST e-Invoice JSON dumps. All records are normalized with UTF-8 encoding and sanitized before entering the 3-pass reconciliation pipeline.'
  },
  {
    q: 'How does the forward cash forecaster model liquidity across T+1 to T+7?',
    a: 'The forward cash forecaster computes opening bank balances, models accounts receivable settlement velocity with front-loaded payout curves, applies dynamic DSO lag stress-testing, and projects closing liquidity bands with 95% epistemic confidence intervals.'
  }
]

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section id="faq" className="lp-section" style={{ background: '#070b14' }}>
      <div className="lp-wrap" style={{ maxWidth: '840px' }}>
        <div className="lp-section-head">
          <div className="lp-badge-shimmer">
            <span className="lp-pulse-dot" />
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h2>Everything You Need to Know</h2>
          <p>Clear answers on 3-way reconciliation architecture, Section 270A penalty protection, and enterprise integrations.</p>
        </div>

        <div>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className={`lp-faq-item ${openIdx === i ? 'open' : ''}`}
            >
              <button
                className="lp-faq-btn"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span>{faq.q}</span>
                <span style={{ fontSize: '1.2rem', color: openIdx === i ? '#38bdf8' : '#64748b', transition: 'transform 0.2s', transform: openIdx === i ? 'rotate(45deg)' : 'none' }}>
                  +
                </span>
              </button>
              <div className="lp-faq-body">
                <p style={{ margin: 0 }}>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
