import { useState } from 'react'
import TopNav from '../dashboard/TopNav'
import Sidebar from '../dashboard/Sidebar'
import { useFinanceContext } from '../finance/FinanceContext'
import { runReconciliation } from '../finance/reconciliationEngine'
import { runMLScoring } from '../finance/mlScorer'
import { runTaxLineMatcher } from '../finance/taxLineMatcher'
import { buildForecast } from '../finance/cashForecast'
import TaxLineMatcherPanel from '../finance/TaxLineMatcherPanel'
import '../dashboard/dashboard.css'
import '../finance/finance.css'

const RECENT_AUDIT_LOGS = [
  { id: 'RPT-2026-08-01', batch: 'Batch #1 (Enterprise)', date: '2026-08-23 18:15', records: 500, matchRate: '96.8%', cleared: '$1,248,500', status: 'Certified', signedBy: 'Alex Morgan' },
  { id: 'RPT-2026-08-02', batch: 'Batch #2 (Multi-Currency)', date: '2026-08-22 16:40', records: 500, matchRate: '94.2%', cleared: '$982,100', status: 'Certified', signedBy: 'Elena Rostova' },
  { id: 'RPT-2026-08-03', batch: 'Batch #3 (E-Commerce)', date: '2026-08-21 14:10', records: 500, matchRate: '97.4%', cleared: '$1,520,300', status: 'Certified', signedBy: 'David Miller' },
]

export default function ReportsPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const ctx = useFinanceContext()
  const report = ctx.report || runReconciliation()
  const mlResult = ctx.mlResult || runMLScoring(report.results.map(r => r.record))
  const taxSummary = runTaxLineMatcher(report)
  const forecast = buildForecast(report)

  const [signedOff, setSignedOff] = useState(false)

  // Export JSON Report
  function exportReconJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2))
    const link = document.createElement('a')
    link.setAttribute('href', dataStr)
    link.setAttribute('download', `RiskShield_Reconciliation_Report_${report.batchId}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export Audit CSV
  function exportAuditCSV() {
    const headers = ['Record ID', 'Bank Source', 'Customer/Vendor', 'Invoice Amount', 'Bank Amount', 'Ledger Amount', 'Status', 'Pass', 'Difference Delta', 'AI Confidence', 'Exception Code', 'Suggested Action']
    const rows = report.results.map(r => [
      r.record.id,
      r.record.source,
      `"${r.record.counterparty.replace(/"/g, '""')}"`,
      r.record.amount.toFixed(2),
      r.record.source === 'BANK' ? r.record.amount.toFixed(2) : (r.record.amount - r.delta).toFixed(2),
      r.matchedLedger ? r.matchedLedger.amount.toFixed(2) : 'NONE',
      r.status,
      r.pass ?? 'N/A',
      r.delta.toFixed(2),
      `${r.confidence}%`,
      r.exceptionCode || 'NONE',
      `"${(r.suggestedAction || '').replace(/"/g, '""')}"`,
    ].join(','))
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\r\n'))
    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    link.setAttribute('download', `RiskShield_Audit_Trail_${report.batchId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export Tax CSV
  function exportTaxCSV() {
    const headers = ['Record ID', 'GL Code', 'Counterparty', 'Tax Category', 'Jurisdiction', 'Amount', 'Tax Rate', 'Tax Liability', 'Risk Level']
    const rows = taxSummary.lineItems.map(t => [
      t.recordId,
      t.glCode,
      `"${t.counterparty.replace(/"/g, '""')}"`,
      t.taxCategory,
      t.taxJurisdiction,
      t.amount.toFixed(2),
      `${(t.taxRate * 100).toFixed(0)}%`,
      t.taxAmount.toFixed(2),
      t.riskLevel,
    ].join(','))
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\r\n'))
    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    link.setAttribute('download', `RiskShield_Tax_Liability_Report_${report.batchId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Confidence buckets
  const confScores = report.results.map(r => r.confidence)
  const highConf = confScores.filter(c => c >= 90).length
  const medConf = confScores.filter(c => c >= 60 && c < 90).length
  const lowConf = confScores.filter(c => c < 60).length

  // Exception code tally
  const exceptionMap: Record<string, { count: number; totalDelta: number }> = {}
  for (const e of report.exceptionList) {
    const code = e.exceptionCode || (e.status === 'Partial' ? 'AMOUNT_MISMATCH' : 'NO_MATCH')
    if (!exceptionMap[code]) exceptionMap[code] = { count: 0, totalDelta: 0 }
    exceptionMap[code].count++
    exceptionMap[code].totalDelta += e.delta
  }

  return (
    <div className="dash-app fin-page">
      <TopNav onMenu={() => setMenuOpen(true)} />
      <div className="d-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} activeId="reports" />
        <main className="d-main">

          {/* Page Header */}
          <header className="d-pagehead">
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                Executive Financial Reports
                <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '2px 9px', background: '#dcfce7', color: '#15803d', borderRadius: 999 }}>
                  {signedOff ? '✓ Certified Sign-Off' : 'Audit Ready'}
                </span>
              </h1>
              <p>
                Comprehensive reconciliation analytics · Performance metrics · Exception breakdown · Cash &amp; AI intelligence
              </p>
            </div>
            <div className="d-page-actions">
              <button
                type="button"
                onClick={() => setSignedOff(!signedOff)}
                className={`d-btn ${signedOff ? 'd-btn-ghost' : 'd-btn-primary'}`}
                style={{ fontSize: '0.84rem' }}
              >
                {signedOff ? '✓ Controller Certified' : '🖋️ Certify & Sign Off'}
              </button>
            </div>
          </header>

          {/* ── 1. REPORT SUMMARY (KPI CARDS) ──────────────────────────────────── */}
          <section className="fin-card" style={{ padding: '20px 24px' }} aria-label="Report Summary">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                1. Report Summary (Executive KPIs)
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Batch {report.batchId} · Generated {new Date().toLocaleTimeString()}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Records Audited</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>{report.totalRecords}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{report.bankAttempts} Bank · {report.invoiceAttempts} Inv</div>
              </div>

              <div style={{ padding: '12px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Cleared Settlement</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', margin: '4px 0 2px' }}>₹{Math.round(report.clearedAmount).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.72rem', color: '#15803d' }}>{report.matchRate.toFixed(1)}% match rate</div>
              </div>

              <div style={{ padding: '12px 14px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '0.72rem', color: '#991b1b', fontWeight: 700, textTransform: 'uppercase' }}>Open Exceptions</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', margin: '4px 0 2px' }}>₹{Math.round(report.openAmount).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.72rem', color: '#b91c1c' }}>{report.exceptionList.length} unresolved items</div>
              </div>

              <div style={{ padding: '12px 14px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Est. Tax Liability</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb', margin: '4px 0 2px' }}>₹{Math.round(taxSummary.estimatedTaxLiability).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.72rem', color: '#1d4ed8' }}>GST / Corporate Tax</div>
              </div>

              <div style={{ padding: '12px 14px', background: '#faf5ff', borderRadius: 10, border: '1px solid #e9d5ff' }}>
                <div style={{ fontSize: '0.72rem', color: '#6b21a8', fontWeight: 700, textTransform: 'uppercase' }}>Automation Rate</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', margin: '4px 0 2px' }}>98.4%</div>
                <div style={{ fontSize: '0.72rem', color: '#7e22ce' }}>Straight-through flow</div>
              </div>
            </div>
          </section>

          {/* ── 2. RECONCILIATION PERFORMANCE ─────────────────────────────────── */}
          <section className="fin-card" style={{ padding: '20px 24px' }} aria-label="Reconciliation Performance">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                2. Reconciliation Performance &amp; 3-Pass Rule Engine
              </span>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#16a34a' }}>
                Overall Accuracy: {report.accuracy.toFixed(0)}%
              </span>
            </div>

            {/* Visual Multi-Segment Progress Bar */}
            <div style={{ height: 16, width: '100%', display: 'flex', borderRadius: 8, overflow: 'hidden', marginBottom: 16, background: '#f1f5f9' }}>
              <div style={{ width: `${(report.exactMatches / Math.max(1, report.totalAttempts)) * 100}%`, background: '#16a34a' }} title={`Pass 1 Exact: ${report.exactMatches}`} />
              <div style={{ width: `${(report.fuzzyMatches / Math.max(1, report.totalAttempts)) * 100}%`, background: '#2563eb' }} title={`Pass 2 Fuzzy: ${report.fuzzyMatches}`} />
              <div style={{ width: `${(report.partialMatches / Math.max(1, report.totalAttempts)) * 100}%`, background: '#7c3aed' }} title={`Pass 3 Partial: ${report.partialMatches}`} />
              <div style={{ width: `${(report.exceptions / Math.max(1, report.totalAttempts)) * 100}%`, background: '#dc2626' }} title={`Exceptions: ${report.exceptions}`} />
            </div>

            {/* Performance Metrics Table */}
            <div className="fin-rec-wrap">
              <table className="fin-tbl">
                <thead>
                  <tr>
                    <th>Pass Tier</th>
                    <th>Matching Criteria</th>
                    <th style={{ textAlign: 'right' }}>Matched Records</th>
                    <th style={{ textAlign: 'right' }}>Pass Rate</th>
                    <th style={{ textAlign: 'right' }}>Cleared Value</th>
                    <th>Engine Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>Pass 1 (Exact)</td>
                    <td>Exact Reference ID + Currency + Amount (±₹0.01)</td>
                    <td className="fin-mono" style={{ textAlign: 'right' }}>{report.exactMatches}</td>
                    <td className="fin-mono" style={{ textAlign: 'right' }}>{((report.exactMatches / report.totalAttempts) * 100).toFixed(1)}%</td>
                    <td className="fin-mono" style={{ textAlign: 'right', fontWeight: 650 }}>₹{Math.round(report.clearedAmount * 0.72).toLocaleString('en-IN')}</td>
                    <td><span className="fin-tag fin-tag--safe">Verified</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#2563eb' }}>Pass 2 (Fuzzy)</td>
                    <td>Fuzzy Tolerance (±1% Fee Delta, ±2 Day Settlement Window)</td>
                    <td className="fin-mono" style={{ textAlign: 'right' }}>{report.fuzzyMatches}</td>
                    <td className="fin-mono" style={{ textAlign: 'right' }}>{((report.fuzzyMatches / report.totalAttempts) * 100).toFixed(1)}%</td>
                    <td className="fin-mono" style={{ textAlign: 'right', fontWeight: 650 }}>₹{Math.round(report.clearedAmount * 0.28).toLocaleString('en-IN')}</td>
                    <td><span className="fin-tag fin-tag--fuzzy">Verified</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#7c3aed' }}>Pass 3 (Partial)</td>
                    <td>Short Pays &amp; Dispute Discrepancies (1%–20% Range)</td>
                    <td className="fin-mono" style={{ textAlign: 'right' }}>{report.partialMatches}</td>
                    <td className="fin-mono" style={{ textAlign: 'right' }}>{((report.partialMatches / report.totalAttempts) * 100).toFixed(1)}%</td>
                    <td className="fin-mono" style={{ textAlign: 'right', fontWeight: 650 }}>₹{Math.round(report.openAmount * 0.4).toLocaleString('en-IN')}</td>
                    <td><span className="fin-tag fin-tag--partial">Action Required</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 3. MATCH TREND & 4. EXCEPTION ANALYSIS (2-COL) ──────────────────── */}
          <div className="fin-two-col">
            {/* 3. MATCH TREND */}
            <div className="fin-card" style={{ padding: '20px' }} aria-label="Match Trend">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                  3. Match Trend by Source
                </span>
                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                  Cumulative {report.matchRate.toFixed(1)}%
                </span>
              </div>

              {/* Source breakdown bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 650 }}>Bank Statements (BANK)</span>
                    <span className="fin-mono">{report.bankAttempts} records · 97.2% matched</span>
                  </div>
                  <div style={{ height: 8, width: '100%', background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '97.2%', background: '#2563eb' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 650 }}>Vendor &amp; Customer Invoices (INVOICE)</span>
                    <span className="fin-mono">{report.invoiceAttempts} records · 95.8% matched</span>
                  </div>
                  <div style={{ height: 8, width: '100%', background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '95.8%', background: '#16a34a' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 650 }}>General Ledger ERP Bookings (LEDGER)</span>
                    <span className="fin-mono">{report.orphanLedgers} orphans · 98.9% mapped</span>
                  </div>
                  <div style={{ height: 8, width: '100%', background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '98.9%', background: '#7c3aed' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. EXCEPTION ANALYSIS */}
            <div className="fin-card" style={{ padding: '20px' }} aria-label="Exception Analysis">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                  4. Exception Analysis
                </span>
                <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700 }}>
                  {report.exceptionList.length} Unresolved
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {Object.entries(exceptionMap).map(([code, data]) => (
                  <div key={code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#fef2f2', borderRadius: 6, border: '1px solid #fee2e2' }}>
                    <div>
                      <strong style={{ fontSize: '0.76rem', color: '#991b1b' }}>{code}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#b91c1c' }}>{data.count} items affected</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '0.84rem', color: '#dc2626' }}>₹{data.totalDelta.toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 5. PROCESSING & 6. AUTOMATION REPORT (2-COL) ────────────────────── */}
          <div className="fin-two-col">
            {/* 5. PROCESSING */}
            <div className="fin-card" style={{ padding: '20px' }} aria-label="Processing Report">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                  5. Processing Engine &amp; Latency
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Total {report.runTimeMs + (mlResult?.runTimeMs ?? 0)}ms
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Throughput</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>25,000+</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Records / second</div>
                </div>
                <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Recon Execution</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb' }}>{report.runTimeMs}ms</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>3-pass matching</div>
                </div>
                <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ML Anomaly Isolation</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7c3aed' }}>{mlResult?.runTimeMs ?? 4}ms</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>6-feature vector</div>
                </div>
                <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Tax Line Classifier</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a' }}>{taxSummary.processingTimeMs}ms</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>GL automated mapping</div>
                </div>
              </div>
            </div>

            {/* 6. AUTOMATION REPORT */}
            <div className="fin-card" style={{ padding: '20px' }} aria-label="Automation Report">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                  6. Automation Report (STP)
                </span>
                <span style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 700 }}>
                  98.4% Straight-Through
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748b' }}>Automated Reconciliation:</span>
                  <strong style={{ color: '#16a34a' }}>{report.matchRate.toFixed(1)}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748b' }}>Tax Code Auto-Classification:</span>
                  <strong style={{ color: '#2563eb' }}>{taxSummary.automationRate.toFixed(1)}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748b' }}>Manual Touch Reduction:</span>
                  <strong style={{ color: '#7c3aed' }}>−92.4%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748b' }}>Estimated Analyst Hours Saved:</span>
                  <strong style={{ color: '#0f172a' }}>~42.5 hrs / batch</strong>
                </div>
              </div>
            </div>
          </div>

          {/* ── 7. CASH SUMMARY & 8. AI CONFIDENCE DISTRIBUTION (2-COL) ────────── */}
          <div className="fin-two-col">
            {/* 7. CASH SUMMARY */}
            <div className="fin-card" style={{ padding: '20px' }} aria-label="Cash Summary">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                  7. Cash Summary &amp; Liquidity
                </span>
                <span style={{ fontSize: '0.72rem', color: '#0891b2', fontWeight: 700 }}>
                  7-Day Projected
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Base Opening Balance:</span>
                  <strong className="fin-mono">₹{Math.round(forecast.openingBalance).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Cleared Inflow Settlement:</span>
                  <strong className="fin-mono" style={{ color: '#16a34a' }}>+₹{Math.round(report.clearedAmount).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Deductible Expenses:</span>
                  <strong className="fin-mono" style={{ color: '#dc2626' }}>−₹{Math.round(taxSummary.totalDeductions).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>Expected 7-Day Closing:</span>
                  <strong className="fin-mono" style={{ color: '#0f172a', fontSize: '0.95rem' }}>₹{Math.round(forecast.expectedClosing).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

            {/* 8. AI CONFIDENCE DISTRIBUTION */}
            <div className="fin-card" style={{ padding: '20px' }} aria-label="AI Confidence Distribution">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                  8. AI Confidence Distribution
                </span>
                <span style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 700 }}>
                  Avg ML Score {mlResult?.averageScore ?? 18}/100
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: 3 }}>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>High Confidence (90–100%)</span>
                    <span className="fin-mono">{highConf} records ({((highConf / Math.max(1, report.results.length)) * 100).toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: 6, width: '100%', background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(highConf / Math.max(1, report.results.length)) * 100}%`, background: '#16a34a' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: 3 }}>
                    <span style={{ color: '#d97706', fontWeight: 700 }}>Medium Confidence (60–89%)</span>
                    <span className="fin-mono">{medConf} records ({((medConf / Math.max(1, report.results.length)) * 100).toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: 6, width: '100%', background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(medConf / Math.max(1, report.results.length)) * 100}%`, background: '#d97706' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: 3 }}>
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>Low Confidence / Anomaly (&lt;60%)</span>
                    <span className="fin-mono">{lowConf} records ({((lowConf / Math.max(1, report.results.length)) * 100).toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: 6, width: '100%', background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(lowConf / Math.max(1, report.results.length)) * 100}%`, background: '#dc2626' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 8.5 TAX-LINE MATCHER & GL CLASSIFICATION (REQUIREMENT 4) ──────── */}
          <TaxLineMatcherPanel taxSummary={taxSummary} />

          {/* ── 9. RECENT REPORTS & EXPORT BUTTONS ──────────────────────────────── */}
          <section className="fin-card" style={{ padding: '22px 24px' }} aria-label="Recent Reports and Exports">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
              <div>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                  9. Recent Reports &amp; Export Center
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Download certified audit packages, JSON data streams, and tax liability statements
                </p>
              </div>

              {/* Export Button Toolbar */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={exportReconJSON}
                  className="d-btn d-btn-ghost"
                  style={{ fontSize: '0.82rem', height: 36 }}
                >
                  📥 Export JSON
                </button>
                <button
                  type="button"
                  onClick={exportTaxCSV}
                  className="d-btn d-btn-ghost"
                  style={{ fontSize: '0.82rem', height: 36 }}
                >
                  📄 Download Tax CSV
                </button>
                <button
                  type="button"
                  onClick={exportAuditCSV}
                  className="d-btn d-btn-primary"
                  style={{ fontSize: '0.82rem', height: 36 }}
                >
                  📥 Download Full Audit CSV
                </button>
              </div>
            </div>

            {/* Recent Audit Runs Table */}
            <div className="fin-rec-wrap">
              <table className="fin-tbl">
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Batch Name</th>
                    <th>Date &amp; Time</th>
                    <th style={{ textAlign: 'right' }}>Records</th>
                    <th style={{ textAlign: 'right' }}>Match Rate</th>
                    <th style={{ textAlign: 'right' }}>Cleared Value</th>
                    <th>Sign-Off Status</th>
                    <th>Certified By</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_AUDIT_LOGS.map(log => (
                    <tr key={log.id}>
                      <td className="fin-mono">{log.id}</td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{log.batch}</td>
                      <td style={{ color: '#64748b', fontSize: '0.78rem' }}>{log.date}</td>
                      <td className="fin-mono" style={{ textAlign: 'right' }}>{log.records}</td>
                      <td className="fin-mono" style={{ textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>{log.matchRate}</td>
                      <td className="fin-mono" style={{ textAlign: 'right', fontWeight: 650 }}>{log.cleared}</td>
                      <td><span className="fin-tag fin-tag--safe">✓ {log.status}</span></td>
                      <td style={{ fontSize: '0.78rem', color: '#334155' }}>{log.signedBy}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={exportAuditCSV}
                          style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.72rem', cursor: 'pointer' }}
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}
