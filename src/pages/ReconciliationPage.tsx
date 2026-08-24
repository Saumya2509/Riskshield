import { useState, useEffect } from 'react'
import TopNav from '../dashboard/TopNav'
import Sidebar from '../dashboard/Sidebar'
import ReconciliationRun from '../finance/ReconciliationRun'
import MatchSummary from '../finance/MatchSummary'
import ExceptionList from '../finance/ExceptionList'
import MLAnomalyPanel from '../finance/MLAnomalyPanel'
import SettlementQAPanel from '../finance/SettlementQAPanel'
import CashForecastChart from '../finance/CashForecastChart'
import TaxLineMatcherPanel from '../finance/TaxLineMatcherPanel'
import type { ReconciliationReport } from '../finance/reconciliationEngine'
import { buildForecast } from '../finance/cashForecast'
import { runTaxLineMatcher } from '../finance/taxLineMatcher'
import { useFinanceContext } from '../finance/FinanceContext'
import '../dashboard/dashboard.css'
import '../finance/finance.css'

export default function ReconciliationPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const ctx = useFinanceContext()
  const [report, setReport] = useState<ReconciliationReport | null>(ctx.report)

  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const mainEl = document.querySelector('.d-main')
    if (mainEl) mainEl.scrollTop = 0
  }, [])

  function handleComplete(r: ReconciliationReport) {
    setReport(r)
    ctx.setReport(r)
  }

  const activeReport = report || ctx.report
  const forecast = activeReport ? buildForecast(activeReport) : null
  const taxSummary = activeReport ? runTaxLineMatcher(activeReport) : null
  const mlResult = ctx.mlResult

  return (
    <div className="dash-app fin-page">
      <TopNav onMenu={() => setMenuOpen(true)} />
      <div className="d-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} activeId="reconciliation" />
        <main className="d-main">

          {/* Page header */}
          <header className="d-pagehead">
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                Reconciliation Engine
                {activeReport && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', background: '#dcfce7', color: '#15803d', borderRadius: 999 }}>
                    LIVE BATCH
                  </span>
                )}
              </h1>
              <p>
                Multi-source batch ingestion · 3-pass automated matching · BANK · LEDGER · INVOICE
              </p>
            </div>
            <div className="d-page-actions">
              {activeReport && (
                <span style={{ fontSize: '0.82rem', color: '#64748b', marginRight: 8, display: 'flex', alignItems: 'center' }}>
                  {activeReport.runTimeMs}ms execution · {activeReport.matchRate.toFixed(1)}% match rate
                </span>
              )}
              <a
                href="#/exceptions"
                className="d-btn d-btn-ghost"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                View Exceptions ({activeReport?.exceptionList.length ?? 0}) →
              </a>
            </div>
          </header>

          {/* Reconciliation Run with CSV Upload & 5 Pre-Saved 500-Record Batches */}
          <ReconciliationRun onComplete={handleComplete} />

          {activeReport ? (
            <>
              {/* Summary KPIs */}
              <MatchSummary report={activeReport} />

              {/* Exception list preview */}
              <ExceptionList report={activeReport} />

              {/* ML insights & Q&A */}
              <div className="fin-two-col">
                {mlResult && <MLAnomalyPanel mlResult={mlResult} />}
                <SettlementQAPanel report={activeReport} />
              </div>

              {/* Forward Cash forecast */}
              {forecast && <CashForecastChart forecast={forecast} />}

              {/* Tax-Line Matcher */}
              {taxSummary && <TaxLineMatcherPanel taxSummary={taxSummary} />}
            </>
          ) : (
            <div className="fin-card" style={{ textAlign: 'center', padding: '56px 32px' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>
                Ready to Reconcile Multi-Source Batches
              </p>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, maxWidth: 520, marginInline: 'auto', lineHeight: 1.6 }}>
                Click <strong>Upload CSV</strong> above or select one of the 5 pre-saved 500-record batch sets in <code>public/</code> to trigger the 6-phase reconciliation loop across Bank statements, Ledger entries, and Invoices.
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
