import { useState } from 'react'

const faqs = [
  {
    q: 'How does the 3-Pass Reconciliation algorithm work?',
    a: 'Pass 1 performs exact matching on Reference ID, Amount (within ±₹0.01), and Currency. Pass 2 handles fuzzy matches allowing ±1% fee tolerance and ±2 days settlement lag. Pass 3 classifies partial short-pays and disputes. Anything remaining is categorized into specific exception reason codes.',
  },
  {
    q: 'How is the Forward Cash Forecaster calculated?',
    a: 'The cash forecaster uses realistic settlement weight curves (front-loaded T+1/T+2 arrivals, AR exception recovery, and AP payables schedule) combined with day-of-week multipliers to project daily opening, inflow, outflow, and closing balances in Indian Rupees (₹).',
  },
  {
    q: 'Can I upload my own company CSV files?',
    a: 'Yes. You can upload custom multi-source CSV files with BANK, LEDGER, and INVOICE rows directly via the "📁 Upload CSV" button or choose from pre-built 500-record enterprise batches.',
  },
  {
    q: 'How does Supabase cloud database integration work?',
    a: 'RiskShield connects securely to Supabase PostgreSQL using environment variables. When configured, every batch reconciliation run, analyst assignment, and resolution note is automatically synced to your cloud database with full ACID compliance and row-level security.',
  },
  {
    q: 'What is the AI Settlement Assistant and how does it answer?',
    a: 'The AI assistant answers natural language finance questions by auditing the active reconciliation dataset. It first displays a progressive "Thinking Trace" showing its multi-step evaluation steps before outputting verified numbers, root-cause explanations, and preview drill-down tables.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState(0)

  return (
    <section className="section" id="faq">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>Frequently asked questions about RiskShield.</h2>
          </div>
        </div>
        <div className="faq-list">
          {faqs.map((item, index) => {
            const isOpen = open === index
            return (
              <article className="faq" key={item.q}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                >
                  {item.q}
                  <span>{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen ? <p>{item.a}</p> : null}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
