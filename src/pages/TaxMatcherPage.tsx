import { useState, useEffect } from 'react'
import TopNav from '../dashboard/TopNav'
import Sidebar from '../dashboard/Sidebar'
import { useFinanceContext } from '../finance/FinanceContext'
import { runTaxLineMatcher, getEmptyTaxSummary } from '../finance/taxLineMatcher'
import TaxLineMatcherPanel from '../finance/TaxLineMatcherPanel'
import '../dashboard/dashboard.css'
import '../finance/finance.css'

export default function TaxMatcherPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const ctx = useFinanceContext()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const mainEl = document.querySelector('.d-main')
    if (mainEl) mainEl.scrollTop = 0
  }, [])
  
  // If no report in context (new user), use clean empty zero-state summary
  const report = ctx.report
  const taxSummary = report ? runTaxLineMatcher(report) : getEmptyTaxSummary()

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
                <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '2px 8px', background: report ? '#dbeafe' : '#f1f5f9', color: report ? '#1d4ed8' : '#64748b', borderRadius: 999 }}>
                  {report ? 'CBDT 25% Baseline' : 'Zero State (Awaiting Ingest)'}
                </span>
              </h1>
              <p>
                Automated corporate tax mapping · Section 32/37/195 deduction classification · Cross-border treaty WHT · AI Tax Shield Optimization
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
