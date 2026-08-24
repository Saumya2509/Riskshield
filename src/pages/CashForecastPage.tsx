import { useState } from 'react'
import TopNav from '../dashboard/TopNav'
import Sidebar from '../dashboard/Sidebar'
import CashForecastChart from '../finance/CashForecastChart'
import CashCompositionCharts from '../finance/CashCompositionCharts'
import { useFinanceContext } from '../finance/FinanceContext'
import { buildForecast } from '../finance/cashForecast'
import '../dashboard/dashboard.css'
import '../finance/finance.css'

export default function CashForecastPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const ctx = useFinanceContext()
  const report = ctx.report
  const forecast = report ? buildForecast(report) : null

  const [simDays, setSimDays] = useState(7)

  return (
    <div className="dash-app fin-page">
      <TopNav onMenu={() => setMenuOpen(true)} />
      <div className="d-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} activeId="cash-forecast" />
        <main className="d-main">

          {/* Header */}
          <header className="d-pagehead">
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                Forward Cash Forecaster
                <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '2px 9px', background: report ? '#dbeafe' : '#f1f5f9', color: report ? '#1e40af' : '#64748b', borderRadius: 999 }}>
                  {report ? 'T+1 … T+7 Simulation' : 'Zero State (Awaiting Ingest)'}
                </span>
              </h1>
              <p>
                Dynamic liquidity trajectory · Settlement lag curve · Inflow vs Outflow daily cash schedule
              </p>
            </div>
            {report && (
              <div className="d-page-actions">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                    Horizon:
                  </span>
                  <button
                    className={`d-btn ${simDays === 7 ? 'd-btn-primary' : 'd-btn-ghost'}`}
                    onClick={() => setSimDays(7)}
                    type="button"
                    style={{ height: 32, padding: '0 12px', fontSize: '0.78rem' }}
                  >
                    7 Days
                  </button>
                </div>
              </div>
            )}
          </header>

          {/* Zero State for New Users */}
          {!forecast ? (
            <div className="fin-card" style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📈</div>
              <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>
                No Active Cash Flow Projections
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '0.86rem', maxWidth: 480, marginInline: 'auto', lineHeight: 1.6 }}>
                Forward liquidity curves and DSO settlement stress-testing require an active reconciliation batch. Ingest your CSV files or run a pre-loaded enterprise batch in Multi-Source Recon to start forecasting.
              </p>
              <a
                href="#/reconciliation"
                className="d-btn d-btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', fontSize: '0.88rem', fontWeight: 700 }}
              >
                🔄 Go to Multi-Source Recon
              </a>
            </div>
          ) : (
            <>
              {/* 1. Cash Forecast SVG Trajectory & Day Selector */}
              <CashForecastChart forecast={forecast} />

              {/* 2. Donut Pie Chart & Daily Delta Histogram with Stress-Testing */}
              <CashCompositionCharts forecast={forecast} />

              {/* Detailed Daily Cash Schedule Table */}
              <div className="fin-card" style={{ marginTop: 24 }}>
                <div className="fin-card-hd">
                  <div>
                    <h2 className="fin-card-title">Daily Cash Position &amp; Settlement Flow Schedule</h2>
                    <p className="fin-card-desc">
                      Granular projection per banking day with epistemic model confidence ratings
                    </p>
                  </div>
                </div>

                <div className="fin-rec-wrap">
                  <table className="fin-tbl" style={{ minWidth: 860 }}>
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'right' }}>Opening Balance</th>
                        <th style={{ textAlign: 'right' }}>Cleared Inflows</th>
                        <th style={{ textAlign: 'right' }}>Operating Outflows</th>
                        <th style={{ textAlign: 'right' }}>Net Daily Cash Delta</th>
                        <th style={{ textAlign: 'right' }}>Projected Closing</th>
                        <th style={{ textAlign: 'center' }}>Model Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.forecastDays.slice(0, simDays).map((d, idx) => {
                        const isPositive = d.netFlow >= 0

                        return (
                          <tr key={d.date}>
                            <td style={{ fontWeight: 700, color: '#0f172a' }}>Day {idx + 1} ({d.shortLabel})</td>
                            <td className="fin-mono" style={{ color: '#64748b' }}>{d.date}</td>
                            <td className="fin-mono" style={{ textAlign: 'right' }}>
                              ₹{Math.round(d.openingBalance).toLocaleString('en-IN')}
                            </td>
                            <td className="fin-mono" style={{ textAlign: 'right', color: '#16a34a', fontWeight: 650 }}>
                              +₹{Math.round(d.projectedInflow).toLocaleString('en-IN')}
                            </td>
                            <td className="fin-mono" style={{ textAlign: 'right', color: '#dc2626', fontWeight: 650 }}>
                              −₹{Math.round(d.projectedOutflow).toLocaleString('en-IN')}
                            </td>
                            <td className="fin-mono" style={{ textAlign: 'right', fontWeight: 700, color: isPositive ? '#16a34a' : '#dc2626' }}>
                              {isPositive ? '+' : ''}₹{Math.round(d.netFlow).toLocaleString('en-IN')}
                            </td>
                            <td className="fin-mono" style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                              ₹{Math.round(d.closingBalance).toLocaleString('en-IN')}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: d.confidence >= 90 ? '#dcfce7' : '#fef3c7',
                                color: d.confidence >= 90 ? '#15803d' : '#92400e',
                              }}>
                                {d.confidence}% Conf
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  )
}
