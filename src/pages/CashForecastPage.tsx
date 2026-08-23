import { useState } from 'react'
import TopNav from '../dashboard/TopNav'
import Sidebar from '../dashboard/Sidebar'
import CashForecastChart from '../finance/CashForecastChart'
import CashCompositionCharts from '../finance/CashCompositionCharts'
import { useFinanceContext } from '../finance/FinanceContext'
import { runReconciliation } from '../finance/reconciliationEngine'
import { buildForecast } from '../finance/cashForecast'
import '../dashboard/dashboard.css'
import '../finance/finance.css'

export default function CashForecastPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const ctx = useFinanceContext()
  const report = ctx.report || runReconciliation()
  const forecast = buildForecast(report)

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
                <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '2px 9px', background: '#dbeafe', color: '#1e40af', borderRadius: 999 }}>
                  T+1 … T+7 Simulation
                </span>
              </h1>
              <p>
                Dynamic liquidity trajectory · Settlement lag curve · Inflow vs Outflow daily cash schedule
              </p>
            </div>
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
          </header>

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
              <table className="fin-tbl">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Opening Balance</th>
                    <th style={{ textAlign: 'right' }}>Projected Inflow</th>
                    <th style={{ textAlign: 'right' }}>Projected Outflow</th>
                    <th style={{ textAlign: 'right' }}>Net Daily Flow</th>
                    <th style={{ textAlign: 'right' }}>Closing Balance</th>
                    <th style={{ textAlign: 'center' }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.forecastDays.map(day => (
                    <tr key={day.date} style={{ background: day.isWeekend ? '#fbfcfe' : '#fff' }}>
                      <td style={{ fontWeight: 600, color: day.isWeekend ? '#94a3b8' : '#0f172a' }}>
                        {day.label}
                      </td>
                      <td className="fin-mono" style={{ color: '#64748b' }}>{day.date}</td>
                      <td className="fin-mono" style={{ textAlign: 'right' }}>
                        ₹{Math.round(day.openingBalance).toLocaleString('en-IN')}
                      </td>
                      <td className="fin-mono" style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                        +₹{Math.round(day.projectedInflow).toLocaleString('en-IN')}
                      </td>
                      <td className="fin-mono" style={{ textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>
                        −₹{Math.round(day.projectedOutflow).toLocaleString('en-IN')}
                      </td>
                      <td className="fin-mono" style={{ textAlign: 'right', fontWeight: 700, color: day.netFlow >= 0 ? '#16a34a' : '#dc2626' }}>
                        {day.netFlow >= 0 ? '+' : ''}₹{Math.round(day.netFlow).toLocaleString('en-IN')}
                      </td>
                      <td className="fin-mono" style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        ₹{Math.round(day.closingBalance).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                          background: day.confidence >= 80 ? '#dcfce7' : day.confidence >= 60 ? '#fef3c7' : '#fee2e2',
                          color: day.confidence >= 80 ? '#15803d' : day.confidence >= 60 ? '#92400e' : '#991b1b',
                        }}>
                          {day.confidence}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
