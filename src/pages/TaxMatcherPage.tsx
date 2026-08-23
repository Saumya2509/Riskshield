import { useState } from 'react'
import TopNav from '../dashboard/TopNav'
import Sidebar from '../dashboard/Sidebar'
import { useFinanceContext } from '../finance/FinanceContext'
import { runReconciliation } from '../finance/reconciliationEngine'
import { runTaxLineMatcher } from '../finance/taxLineMatcher'
import TaxLineMatcherPanel from '../finance/TaxLineMatcherPanel'
import '../dashboard/dashboard.css'
import '../finance/finance.css'

export default function TaxMatcherPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const ctx = useFinanceContext()
  const report = ctx.report || runReconciliation()
  const taxSummary = runTaxLineMatcher(report)

  return (
    <div className="dash-app fin-page">
      <TopNav onMenu={() => setMenuOpen(true)} />
      <div className="d-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} activeId="tax-matcher" />
        <main className="d-main">
          {/* Header */}
          <header className="d-pagehead">
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                Tax-Line Matcher &amp; GL Classification
                <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 999 }}>
                  CBDT 25% Baseline
                </span>
              </h1>
              <p>
                Automated corporate tax mapping · Section 32/195 deduction classification · Cross-border treaty WHT · Chart of Accounts sync
              </p>
            </div>
          </header>

          {/* Tax Line Matcher Main Component */}
          <TaxLineMatcherPanel taxSummary={taxSummary} />
        </main>
      </div>
    </div>
  )
}
