import { useState } from 'react'
import TopNav from '../dashboard/TopNav'
import Sidebar from '../dashboard/Sidebar'
import ReconciliationRun from './ReconciliationRun'
import MatchSummary from './MatchSummary'
import ExceptionList from './ExceptionList'
import SettlementQAPanel from './SettlementQAPanel'
import CashForecastChart from './CashForecastChart'
import MLAnomalyPanel from './MLAnomalyPanel'
import TaxLineMatcherPanel from './TaxLineMatcherPanel'
import type { ReconciliationReport } from './reconciliationEngine'
import { buildForecast } from './cashForecast'
import { runTaxLineMatcher } from './taxLineMatcher'
import { useFinanceContext } from './FinanceContext'
import '../dashboard/dashboard.css'
import './finance.css'

export default function FinancePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [report, setReport] = useState<ReconciliationReport | null>(null)
  const ctx = useFinanceContext()

  const forecast = report ? buildForecast(report) : null
  const taxSummary = report ? runTaxLineMatcher(report) : null
  const mlResult = ctx.mlResult

  return (
    <div className="dash-app fin-page">
      <TopNav onMenu={() => setMenuOpen(true)} />
      <div className="d-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} activeId="finance" />
        <main className="d-main">

          {/* Page header — clean, no clutter */}
          <header className="d-pagehead">
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                Finance Controller
                {report && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', background: '#dcfce7', color: '#15803d', borderRadius: 999, verticalAlign: 'middle' }}>
                    LIVE
                  </span>
                )}
              </h1>
              <p>
                Multi-source reconciliation · ML anomaly scoring · Settlement Q&amp;A · Forward cash forecaster · Tax-line matcher · BANK · LEDGER · INVOICE
              </p>
            </div>
            <div className="d-page-actions">
              {report && (
                <span style={{ fontSize: '0.82rem', color: '#64748b', marginRight: 8 }}>
                  {report.runTimeMs}ms · {mlResult ? `ML ${mlResult?.runTimeMs}ms` : ''}
                </span>
              )}
              <button
                className="d-btn d-btn-ghost"
                onClick={() => { window.location.hash = '#/dashboard' }}
                type="button"
              >
                Dashboard
              </button>
            </div>
          </header>

          {/* Run panel */}
          <ReconciliationRun onComplete={setReport} />

          {report ? (
            <>
              {/* Hero metrics */}
              <MatchSummary report={report} />

              {/* Exception list — full width */}
              <ExceptionList report={report} />

              {/* ML insights + Q&A — 2 col */}
              <div className="fin-two-col">
                {mlResult && <MLAnomalyPanel mlResult={mlResult} />}
                <SettlementQAPanel report={report} />
              </div>

              {/* Forward Cash forecast — full width */}
              {forecast && <CashForecastChart forecast={forecast} />}

              {/* Tax-Line Matcher — full width */}
              {taxSummary && <TaxLineMatcherPanel taxSummary={taxSummary} />}
            </>
          ) : (
            /* Pre-run state */
            <div className="fin-card" style={{ textAlign: 'center', padding: '56px 32px' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>
                Ready to reconcile records
              </p>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, maxWidth: 460, marginInline: 'auto', lineHeight: 1.6 }}>
                Click <strong>Upload CSV</strong> or <strong>Load 500 Records CSV</strong> above to start the 6-phase loop: ingest → 3-pass rule engine →
                ML anomaly scoring → exception classification. Match rate and anomaly scores are computed across your dataset in real-time.
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
