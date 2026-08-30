import { useState } from 'react'

interface Scenario {
  id: string
  title: string
  subtitle: string
  bank: { id: string; desc: string; amount: string; date: string; fee: string }
  ledger: { id: string; desc: string; amount: string; account: string; status: string }
  invoice: { id: string; desc: string; amount: string; gstin: string; tax: string }
  verdict: {
    status: 'EXACT_MATCH' | 'FUZZY_RECONCILED' | 'EXCEPTION_SOLVED'
    statusLabel: string
    color: string
    delta: string
    mechanism: string
    speed: string
  }
}

const SCENARIOS: Scenario[] = [
  {
    id: 'pass1',
    title: '1. Pass 1 Exact (100% Hash Match)',
    subtitle: 'High-volume recurring vendor settlement with zero variance',
    bank: { id: 'B1-BNK-001', desc: 'NEFT Clrg Razorpay Soft', amount: '₹4,50,000.00', date: '2026-03-15', fee: '₹0.00' },
    ledger: { id: 'B1-LDG-001', desc: 'Vendor Settlement AP 2010', amount: '₹4,50,000.00', account: 'GL 2010 (Trade AP)', status: 'Posted' },
    invoice: { id: 'INV-2026-089', desc: 'Cloud Infra Q1 License', amount: '₹4,50,000.00', gstin: '27AABCR1234F1Z5', tax: '18% GST (₹68,644)' },
    verdict: {
      status: 'EXACT_MATCH',
      statusLabel: '✓ 100% Deterministic Match',
      color: '#10b981',
      delta: '₹0.00 (Zero Delta)',
      mechanism: 'SHA-256 Hash reference verified across all 3 feeds',
      speed: '0.8 ms execution'
    }
  },
  {
    id: 'pass2',
    title: '2. Pass 2 Fuzzy (±1.5% MDR & Lag)',
    subtitle: 'Payment gateway settlement with MDR fee deduction and T+2 settlement lag',
    bank: { id: 'B1-BNK-019', desc: 'PG Payout Net Deposit', amount: '₹98,500.00', date: '2026-03-17', fee: '₹1,500.00 (MDR)' },
    ledger: { id: 'B1-LDG-019', desc: 'Customer AR Invoice 104', amount: '₹1,00,000.00', account: 'GL 1120 (Trade AR)', status: 'Pending Rec' },
    invoice: { id: 'INV-2026-104', desc: 'Enterprise SaaS Annual', amount: '₹1,00,000.00', gstin: '29ABCDE5678G1Z2', tax: '18% GST (₹15,254)' },
    verdict: {
      status: 'FUZZY_RECONCILED',
      statusLabel: '✓ Fuzzy Reconciled (MDR Auto-Split)',
      color: '#38bdf8',
      delta: '₹1,500.00 MDR Gateway Fee',
      mechanism: 'Tolerated within ±1.5% threshold & auto-posted to GL 6140 Fee Expense',
      speed: '1.4 ms execution'
    }
  },
  {
    id: 'pass3',
    title: '3. 1-Click Autonomous Exception Settlement',
    subtitle: 'Duplicate invoice flag with automatic debit memo issuance & statutory DIN logging',
    bank: { id: 'B1-BNK-042', desc: 'Direct Debit Overseas Wire', amount: '₹2,48,000.00', date: '2026-03-20', fee: '₹200.00 FX' },
    ledger: { id: 'B1-LDG-042', desc: 'Overseas Tech Consultancy', amount: '₹2,50,000.00', account: 'GL 2190 (Suspense)', status: 'Blocked' },
    invoice: { id: 'INV-2026-142', desc: 'Form 15CB Cross-Border Svc', amount: '₹2,48,000.00', gstin: 'NON-RESIDENT DTAA', tax: 'WHT 10% (Sec 195)' },
    verdict: {
      status: 'EXCEPTION_SOLVED',
      statusLabel: '🛡️ Form 15CB DTAA Defense Filed',
      color: '#f59e0b',
      delta: '₹2,000.00 FX Variance',
      mechanism: 'Form 15CB formatted for CA DSC Class-3 sign-off · Builds audit trail for CA\'s 270A response',
      speed: '2.8 ms execution'
    }
  }
]

export default function InteractiveMatchVisualizer() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const current = SCENARIOS[selectedIdx]

  return (
    <section className="lp-section" style={{ background: 'linear-gradient(180deg, #060913 0%, #0a0f1d 100%)' }}>
      <div className="lp-wrap">
        <div className="lp-section-head">
          <div className="lp-badge-shimmer">
            <span className="lp-pulse-dot" />
            INTERACTIVE RECONCILIATION SANDBOX
          </div>
          <h2>Experience 3-Way Matching In Action</h2>
          <p>Click through live scenarios to see how RiskShield converges Bank Feeds, ERP Ledgers, and GST e-Invoices in real time.</p>
        </div>

        <div className="lp-playground-box">
          {/* Scenario Buttons */}
          <div className="lp-scenario-tabs">
            {SCENARIOS.map((s, idx) => (
              <button
                key={s.id}
                className={`lp-scenario-btn ${selectedIdx === idx ? 'active' : ''}`}
                onClick={() => setSelectedIdx(idx)}
              >
                {s.title}
              </button>
            ))}
          </div>

          <div style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: 20 }}>
            {current.subtitle}
          </div>

          {/* 3 Source Columns */}
          <div className="lp-3way-display-grid">
            {/* Bank Stream */}
            <div className="lp-stream-card">
              <div className="lp-stream-title">
                <span>🏦 Bank Statement Feed (MT940)</span>
                <span style={{ fontSize: '0.68rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: 4 }}>LIVE FEED</span>
              </div>
              <div className="lp-stream-field"><span>Txn ID:</span><strong>{current.bank.id}</strong></div>
              <div className="lp-stream-field"><span>Narration:</span><strong>{current.bank.desc}</strong></div>
              <div className="lp-stream-field"><span>Value Date:</span><strong>{current.bank.date}</strong></div>
              <div className="lp-stream-field"><span>Fee Split:</span><strong style={{ color: '#38bdf8' }}>{current.bank.fee}</strong></div>
              <div className="lp-stream-field" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, marginTop: 8 }}>
                <span>Net Bank Deposit:</span><strong style={{ color: '#ffffff', fontSize: '1rem' }}>{current.bank.amount}</strong>
              </div>
            </div>

            {/* ERP Ledger Stream */}
            <div className="lp-stream-card">
              <div className="lp-stream-title">
                <span>📑 ERP General Ledger (SAP/Oracle)</span>
                <span style={{ fontSize: '0.68rem', color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '2px 6px', borderRadius: 4 }}>SYNCED</span>
              </div>
              <div className="lp-stream-field"><span>Voucher ID:</span><strong>{current.ledger.id}</strong></div>
              <div className="lp-stream-field"><span>Line Desc:</span><strong>{current.ledger.desc}</strong></div>
              <div className="lp-stream-field"><span>GL Posting:</span><strong>{current.ledger.account}</strong></div>
              <div className="lp-stream-field"><span>State:</span><strong style={{ color: '#86efac' }}>{current.ledger.status}</strong></div>
              <div className="lp-stream-field" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, marginTop: 8 }}>
                <span>Ledger Credit:</span><strong style={{ color: '#ffffff', fontSize: '1rem' }}>{current.ledger.amount}</strong>
              </div>
            </div>

            {/* GST Invoice Stream */}
            <div className="lp-stream-card">
              <div className="lp-stream-title">
                <span>🧾 GST e-Invoice (IRN / QR)</span>
                <span style={{ fontSize: '0.68rem', color: '#fbbf24', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 4 }}>VERIFIED</span>
              </div>
              <div className="lp-stream-field"><span>Invoice Ref:</span><strong>{current.invoice.id}</strong></div>
              <div className="lp-stream-field"><span>Item Heading:</span><strong>{current.invoice.desc}</strong></div>
              <div className="lp-stream-field"><span>Counterparty GSTIN:</span><strong>{current.invoice.gstin}</strong></div>
              <div className="lp-stream-field"><span>Statutory Tax:</span><strong style={{ color: '#fca5a5' }}>{current.invoice.tax}</strong></div>
              <div className="lp-stream-field" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, marginTop: 8 }}>
                <span>Gross Invoice Total:</span><strong style={{ color: '#ffffff', fontSize: '1rem' }}>{current.invoice.amount}</strong>
              </div>
            </div>
          </div>

          {/* Verdict Banner */}
          <div className="lp-verdict-banner" style={{ borderColor: `${current.verdict.color}40`, background: `${current.verdict.color}10` }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: current.verdict.color, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{current.verdict.statusLabel}</span>
                <span style={{ fontSize: '0.74rem', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 6, color: '#f1f5f9' }}>
                  {current.verdict.speed}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: 4 }}>
                {current.verdict.mechanism} · <strong style={{ color: '#ffffff' }}>{current.verdict.delta}</strong>
              </div>
            </div>

            <a
              href="#/reconciliation"
              className="lp-btn-glow"
              style={{ padding: '8px 18px', fontSize: '0.84rem' }}
            >
              Test In Workbench ➔
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
