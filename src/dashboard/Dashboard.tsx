import { useState, useEffect } from 'react'
import TopNav from './TopNav'
import Sidebar from './Sidebar'
import MetricCards from './MetricCards'
import RiskTrendChart from './RiskTrendChart'
import TransactionTable from './TransactionTable'
import { useFinanceContext } from '../finance/FinanceContext'
import './dashboard.css'

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { report, mlResult, lastRunAt } = useFinanceContext()
  const hasFinance = !!report

  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const mainEl = document.querySelector('.d-main')
    if (mainEl) mainEl.scrollTop = 0
  }, [])

  return (
    <div className="dash-app">
      <TopNav onMenu={() => setMenuOpen(true)} />
      <div className="d-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="d-main">

          {/* Page header — only working actions shown */}
          <header className="d-pagehead fade-in">
            <div>
              <h1>Dashboard</h1>
              <p>
                {hasFinance
                  ? `Reconciliation Engine · last run ${lastRunAt?.toLocaleTimeString()} · ${report.totalRecords} records processed`
                  : 'Multi-source reconciliation & risk console — upload CSV to populate live data'}
              </p>
            </div>
            <div className="d-page-actions">
              <a
                href="#/reconciliation"
                className={`d-btn ${hasFinance ? 'd-btn-ghost' : 'd-btn-primary'}`}
                style={{ textDecoration: 'none' }}
              >
                {hasFinance ? 'Reconciliation Engine →' : '📁 Upload CSV & Reconcile'}
              </a>
            </div>
          </header>

          {/* Finance status bar — shown only when run complete */}
          {hasFinance && report && (
            <div className="d-fin-banner fade-in">
              <div className="d-fin-banner-icon">◈</div>
              <div className="d-fin-banner-body">
                <div className="d-fin-banner-title">Finance Controller — Reconciliation complete</div>
                <div className="d-fin-banner-sub">
                  {report.totalRecords} records · BANK · LEDGER · INVOICE ·
                  3-pass rule engine · ML anomaly scoring
                </div>
              </div>
              <div className="d-fin-banner-kpis">
                <div className="d-fin-kpi-chip" style={{ color: '#4ade80' }}>
                  <strong>{report.matchRate.toFixed(1)}%</strong>
                  <span>Match Rate</span>
                </div>
                <div className="d-fin-kpi-chip" style={{ color: '#60a5fa' }}>
                  <strong>₹{report.clearedAmount >= 100000 ? `${(report.clearedAmount / 100000).toFixed(1)}L` : `${(report.clearedAmount / 1000).toFixed(0)}K`}</strong>
                  <span>Cleared</span>
                </div>
                <div className="d-fin-kpi-chip" style={{ color: '#f87171' }}>
                  <strong>{report.exceptions}</strong>
                  <span>Exceptions</span>
                </div>
                <div className="d-fin-kpi-chip" style={{ color: '#a78bfa' }}>
                  <strong>{report.accuracy.toFixed(0)}%</strong>
                  <span>Accuracy</span>
                </div>
                {mlResult && (
                  <div className="d-fin-kpi-chip" style={{ color: '#c084fc' }}>
                    <strong>{mlResult.highRiskCount}</strong>
                    <span>ML Flagged</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metric cards */}
          <MetricCards />

          {/* Chart — shows real reconciliation data when available */}
          <RiskTrendChart />

          {/* Transaction table — auto finance mode when data available */}
          <TransactionTable />

        </main>
      </div>
    </div>
  )
}
