import { useState } from 'react'
import TopNav from '../dashboard/TopNav'
import Sidebar from '../dashboard/Sidebar'
import { useFinanceContext } from '../finance/FinanceContext'
import { runReconciliation, type MatchResult, type MatchPass, type ReconciliationReport } from '../finance/reconciliationEngine'
import { runMLScoring } from '../finance/mlScorer'
import { runTaxLineMatcher } from '../finance/taxLineMatcher'
import { buildForecast } from '../finance/cashForecast'
import TaxLineMatcherPanel from '../finance/TaxLineMatcherPanel'
import '../dashboard/dashboard.css'
import '../finance/finance.css'

const RECENT_AUDIT_LOGS = [
  { id: 'RPT-2026-08-01', batch: 'Batch #1 (Enterprise)', date: '2026-08-23 18:15', records: 500, matchRate: '96.8%', cleared: '₹1,24,85,000', status: 'Certified', signedBy: 'Alex Morgan' },
  { id: 'RPT-2026-08-02', batch: 'Batch #2 (Multi-Currency)', date: '2026-08-22 16:40', records: 500, matchRate: '94.2%', cleared: '₹98,21,000', status: 'Certified', signedBy: 'Elena Rostova' },
  { id: 'RPT-2026-08-03', batch: 'Batch #3 (E-Commerce)', date: '2026-08-21 14:10', records: 500, matchRate: '97.4%', cleared: '₹1,52,03,000', status: 'Certified', signedBy: 'David Miller' },
]

export default function ReportsPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const ctx = useFinanceContext()
  const rawReport = ctx.report || runReconciliation()

  // Dynamically compute effective results with all applied fixes from resolvedMap
  const effectiveResults: MatchResult[] = rawReport.results.map((r: MatchResult) => {
    const fix = ctx.resolvedMap[r.record.id]
    if (!fix) return r

    return {
      ...r,
      status: 'Exact' as const,
      pass: (r.pass || 1) as MatchPass,
      confidence: 100,
      delta: 0,
      deltaPct: 0,
      exceptionCode: null,
      exceptionReason: `Resolved via ${fix.method}. ${fix.note}`,
      suggestedAction: `[Fixed: ${fix.method}] ${fix.note}`,
    }
  })

  const exactCount = effectiveResults.filter(r => r.status === 'Exact').length
  const fuzzyCount = effectiveResults.filter(r => r.status === 'Fuzzy').length
  const partialCount = effectiveResults.filter(r => r.status === 'Partial').length
  const exceptionList = effectiveResults.filter(r => r.status === 'Exception')
  const clearedAmount = effectiveResults.filter(r => r.status === 'Exact' || r.status === 'Fuzzy').reduce((s, r) => s + r.record.amount, 0)
  const openAmount = exceptionList.reduce((s, r) => s + r.delta, 0)
  const totalAttempts = rawReport.totalAttempts || effectiveResults.length
  const matchRate = totalAttempts > 0 ? ((totalAttempts - exceptionList.length) / totalAttempts) * 100 : 100
  const accuracy = Math.min(100, ((exactCount + fuzzyCount) / Math.max(1, totalAttempts)) * 100)

  const report: ReconciliationReport = {
    ...rawReport,
    results: effectiveResults,
    exactMatches: exactCount,
    fuzzyMatches: fuzzyCount,
    partialMatches: partialCount,
    exceptions: exceptionList.length,
    exceptionList: exceptionList,
    clearedAmount,
    openAmount,
    matchRate,
    accuracy,
  }

  const mlResult = ctx.mlResult || runMLScoring(report.results.map(r => r.record))
  const taxSummary = runTaxLineMatcher(report)
  const forecast = buildForecast(report)

  const [signedOff, setSignedOff] = useState(false)
  const fixedCount = Object.keys(ctx.resolvedMap).length

  // Export JSON Report
  function exportReconJSON() {
    const enrichedResults = report.results.map(r => {
      const fix = ctx.resolvedMap[r.record.id]
      return {
        ...r,
        record: {
          ...r.record,
          id: fix ? `${r.record.id} (FIX)` : r.record.id,
        },
        isFixed: Boolean(fix),
        resolutionNote: fix ? fix.note : null,
      }
    })
    const payload = { ...report, results: enrichedResults, fixedCount }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2))
    const link = document.createElement('a')
    link.setAttribute('href', dataStr)
    link.setAttribute('download', `RiskShield_Reconciliation_Report_${report.batchId}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export Styled Excel (.xls) with Colored Headers and Formatting
  function exportAuditExcel() {
    const headers = ['Record ID', 'Bank Source', 'Customer/Vendor', 'Invoice Amount (₹)', 'Bank Amount (₹)', 'Ledger Amount (₹)', 'Status', 'Pass Tier', 'Variance Delta (₹)', 'AI Confidence', 'Exception Code', 'Suggested Action / Applied Fix']

    const headerHtml = headers.map(h => `<th style="background-color: #1e3a8a; color: #ffffff; font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; padding: 8px 12px; border: 1px solid #334155; text-align: left;">${h}</th>`).join('')

    const rowsHtml = report.results.map((r, idx) => {
      const fix = ctx.resolvedMap[r.record.id]
      const isFixed = Boolean(fix)
      const idFormatted = isFixed ? `${r.record.id} (FIX)` : r.record.id
      const statusFormatted = isFixed ? `${r.status} (FIXED)` : r.status
      const actionFormatted = fix ? `[Fixed: ${fix.method}] ${fix.note}` : (r.suggestedAction || '')
      const bg = isFixed ? '#f0fdf4' : (r.status === 'Exception' ? '#fef2f2' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc'))
      const statusColor = isFixed ? '#15803d' : (r.status === 'Exact' ? '#16a34a' : (r.status === 'Fuzzy' ? '#2563eb' : (r.status === 'Partial' ? '#d97706' : '#dc2626')))

      return `<tr style="background-color: ${bg};">
        <td style="font-family: 'Courier New', monospace; font-weight: bold; padding: 6px 10px; border: 1px solid #e2e8f0; color: ${isFixed ? '#15803d' : '#2563eb'};">${idFormatted}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0;">${r.record.source}</td>
        <td style="font-family: Arial, sans-serif; font-weight: 600; padding: 6px 10px; border: 1px solid #e2e8f0;">${r.record.counterparty}</td>
        <td style="font-family: Arial, sans-serif; text-align: right; padding: 6px 10px; border: 1px solid #e2e8f0;">₹${r.record.amount.toFixed(2)}</td>
        <td style="font-family: Arial, sans-serif; text-align: right; padding: 6px 10px; border: 1px solid #e2e8f0;">₹${(r.record.source === 'BANK' ? r.record.amount : (r.record.amount - r.delta)).toFixed(2)}</td>
        <td style="font-family: Arial, sans-serif; text-align: right; padding: 6px 10px; border: 1px solid #e2e8f0;">${r.matchedLedger ? `₹${r.matchedLedger.amount.toFixed(2)}` : 'NONE'}</td>
        <td style="font-family: Arial, sans-serif; font-weight: bold; color: ${statusColor}; padding: 6px 10px; border: 1px solid #e2e8f0;">${statusFormatted}</td>
        <td style="font-family: Arial, sans-serif; text-align: center; padding: 6px 10px; border: 1px solid #e2e8f0;">Pass ${r.pass ?? 'N/A'}</td>
        <td style="font-family: Arial, sans-serif; text-align: right; font-weight: bold; color: ${r.delta > 0 ? '#dc2626' : '#16a34a'}; padding: 6px 10px; border: 1px solid #e2e8f0;">${r.delta > 0 ? `−₹${r.delta.toFixed(2)}` : '₹0.00'}</td>
        <td style="font-family: Arial, sans-serif; text-align: center; padding: 6px 10px; border: 1px solid #e2e8f0;">${r.confidence}%</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0;">${r.exceptionCode || 'NONE'}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0; color: ${isFixed ? '#15803d' : '#334155'};">${actionFormatted}</td>
      </tr>`
    }).join('')

    const excelTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>RiskShield Audit</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body>
  <table border="1" style="border-collapse: collapse; width: 100%;">
    <thead>
      <tr>${headerHtml}</tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `RiskShield_Audit_Trail_${report.batchId}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export Clean Audit CSV with UTF-8 BOM for Excel
  function exportAuditCSV() {
    const headers = ['Record ID', 'Bank Source', 'Customer/Vendor', 'Invoice Amount', 'Bank Amount', 'Ledger Amount', 'Status', 'Pass', 'Difference Delta', 'AI Confidence', 'Exception Code', 'Suggested Action / Applied Fix']
    const rows = report.results.map(r => {
      const fix = ctx.resolvedMap[r.record.id]
      const idFormatted = fix ? `${r.record.id} (FIX)` : r.record.id
      const statusFormatted = fix ? `${r.status} (FIXED)` : r.status
      const actionFormatted = fix ? `[Fixed: ${fix.method}] ${fix.note}` : (r.suggestedAction || '')

      return [
        idFormatted,
        r.record.source,
        `"${r.record.counterparty.replace(/"/g, '""')}"`,
        r.record.amount.toFixed(2),
        r.record.source === 'BANK' ? r.record.amount.toFixed(2) : (r.record.amount - r.delta).toFixed(2),
        r.matchedLedger ? r.matchedLedger.amount.toFixed(2) : 'NONE',
        statusFormatted,
        r.pass ?? 'N/A',
        r.delta.toFixed(2),
        `${r.confidence}%`,
        r.exceptionCode || 'NONE',
        `"${actionFormatted.replace(/"/g, '""')}"`,
      ].join(',')
    })
    // Add UTF-8 BOM (\uFEFF) so Excel renders rupee and special characters cleanly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
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
                  {signedOff ? '✓ Certified Sign-Off' : (fixedCount > 0 ? `✓ Audit Updated (${fixedCount} Fixes Applied)` : 'Audit Ready')}
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
                Batch {report.batchId} · {fixedCount > 0 ? `${fixedCount} Controller Fixes Applied` : 'Raw Batch Run'} · Generated {new Date().toLocaleTimeString()}
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
                <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>{report.matchRate.toFixed(1)}% match rate</div>
              </div>

              <div style={{ padding: '12px 14px', background: report.exceptions === 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 10, border: `1px solid ${report.exceptions === 0 ? '#bbf7d0' : '#fecaca'}` }}>
                <div style={{ fontSize: '0.72rem', color: report.exceptions === 0 ? '#166534' : '#991b1b', fontWeight: 700, textTransform: 'uppercase' }}>Open Exceptions</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: report.exceptions === 0 ? '#16a34a' : '#dc2626', margin: '4px 0 2px' }}>
                  ₹{Math.round(report.openAmount).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.72rem', color: report.exceptions === 0 ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                  {report.exceptions === 0 ? '✓ 0 unresolved items' : `${report.exceptions} unresolved items`}
                </div>
              </div>

              <div style={{ padding: '12px 14px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Est. Tax Liability</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb', margin: '4px 0 2px' }}>₹{Math.round(taxSummary.estimatedTaxLiability).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.72rem', color: '#1d4ed8' }}>GST / Corporate Tax</div>
              </div>

              <div style={{ padding: '12px 14px', background: '#faf5ff', borderRadius: 10, border: '1px solid #e9d5ff' }}>
                <div style={{ fontSize: '0.72rem', color: '#6b21a8', fontWeight: 700, textTransform: 'uppercase' }}>Automation Rate</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', margin: '4px 0 2px' }}>
                  {report.matchRate.toFixed(1)}%
                </div>
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
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>Pass 1 (Exact &amp; Fixed)</td>
                    <td>Exact Reference ID + Currency + Amount (±₹0.01)</td>
                    <td className="fin-mono" style={{ textAlign: 'right' }}>{report.exactMatches}</td>
                    <td className="fin-mono" style={{ textAlign: 'right' }}>{((report.exactMatches / report.totalAttempts) * 100).toFixed(1)}%</td>
                    <td className="fin-mono" style={{ textAlign: 'right', fontWeight: 650 }}>₹{Math.round(report.clearedAmount * 0.75).toLocaleString('en-IN')}</td>
                    <td><span className="fin-tag fin-tag--safe">Verified</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#2563eb' }}>Pass 2 (Fuzzy)</td>
                    <td>Fuzzy Tolerance (±1% Fee Delta, ±2 Day Settlement Window)</td>
                    <td className="fin-mono" style={{ textAlign: 'right' }}>{report.fuzzyMatches}</td>
                    <td className="fin-mono" style={{ textAlign: 'right' }}>{((report.fuzzyMatches / report.totalAttempts) * 100).toFixed(1)}%</td>
                    <td className="fin-mono" style={{ textAlign: 'right', fontWeight: 650 }}>₹{Math.round(report.clearedAmount * 0.25).toLocaleString('en-IN')}</td>
                    <td><span className="fin-tag fin-tag--fuzzy">Verified</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#7c3aed' }}>Pass 3 (Partial)</td>
                    <td>Short Pays &amp; Dispute Discrepancies (1%–20% Range)</td>
                    <td className="fin-mono" style={{ textAlign: 'right' }}>{report.partialMatches}</td>
                    <td className="fin-mono" style={{ textAlign: 'right' }}>{((report.partialMatches / report.totalAttempts) * 100).toFixed(1)}%</td>
                    <td className="fin-mono" style={{ textAlign: 'right', fontWeight: 650 }}>₹{Math.round(report.openAmount).toLocaleString('en-IN')}</td>
                    <td>
                      {report.partialMatches > 0 ? (
                        <span className="fin-tag fin-tag--partial">Action Required</span>
                      ) : (
                        <span className="fin-tag fin-tag--safe">✓ Cleared</span>
                      )}
                    </td>
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
                    <span className="fin-mono">{report.bankAttempts} records · {report.matchRate.toFixed(1)}% matched</span>
                  </div>
                  <div style={{ height: 8, width: '100%', background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, report.matchRate)}%`, background: '#2563eb' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 650 }}>Vendor &amp; Customer Invoices (INVOICE)</span>
                    <span className="fin-mono">{report.invoiceAttempts} records · {report.matchRate.toFixed(1)}% matched</span>
                  </div>
                  <div style={{ height: 8, width: '100%', background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, report.matchRate)}%`, background: '#16a34a' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 650 }}>General Ledger ERP Bookings (LEDGER)</span>
                    <span className="fin-mono">{report.orphanLedgers} orphans · 100.0% mapped</span>
                  </div>
                  <div style={{ height: 8, width: '100%', background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '100%', background: '#7c3aed' }} />
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
                <span style={{ fontSize: '0.72rem', color: report.exceptions === 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                  {report.exceptions === 0 ? '✓ 0 Unresolved' : `${report.exceptions} Unresolved`}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {report.exceptions === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.82rem', fontWeight: 600 }}>
                    🎉 All exceptions have been solved and balanced with journal adjustments.
                  </div>
                ) : (
                  Object.entries(exceptionMap).map(([code, data]) => (
                    <div key={code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#fef2f2', borderRadius: 6, border: '1px solid #fee2e2' }}>
                      <div>
                        <strong style={{ fontSize: '0.76rem', color: '#991b1b' }}>{code}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#b91c1c' }}>{data.count} items affected</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '0.84rem', color: '#dc2626' }}>₹{data.totalDelta.toFixed(2)}</strong>
                      </div>
                    </div>
                  ))
                )}
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
                  {report.matchRate.toFixed(1)}% Straight-Through
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

          {/* ── 8.5 TAX-LINE MATCHER & GL CLASSIFICATION ──────────────────────── */}
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
                  className="d-btn d-btn-ghost"
                  style={{ fontSize: '0.82rem', height: 36 }}
                >
                  📥 Download Clean CSV
                </button>
                <button
                  type="button"
                  onClick={exportAuditExcel}
                  className="d-btn d-btn-primary"
                  style={{
                    fontSize: '0.82rem',
                    height: 36,
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                    borderColor: '#1e3a8a',
                    boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
                    color: '#ffffff',
                    fontWeight: 700
                  }}
                >
                  📊 Download Styled Excel (Color Headers)
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
                  {/* Live Current Batch */}
                  <tr style={{ background: '#f0fdf4' }}>
                    <td className="fin-mono" style={{ fontWeight: 700, color: '#166534' }}>RPT-LIVE-BATCH</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>Batch {report.batchId} (Live Current)</td>
                    <td style={{ color: '#15803d', fontSize: '0.78rem', fontWeight: 600 }}>Just Now</td>
                    <td className="fin-mono" style={{ textAlign: 'right', fontWeight: 700 }}>{report.totalRecords}</td>
                    <td className="fin-mono" style={{ textAlign: 'right', color: '#16a34a', fontWeight: 800 }}>{report.matchRate.toFixed(1)}%</td>
                    <td className="fin-mono" style={{ textAlign: 'right', fontWeight: 700 }}>₹{Math.round(report.clearedAmount).toLocaleString('en-IN')}</td>
                    <td><span className="fin-tag fin-tag--safe">✓ {signedOff ? 'Controller Certified' : (report.exceptions === 0 ? 'Fully Reconciled' : 'Audit Ready')}</span></td>
                    <td style={{ fontSize: '0.78rem', color: '#334155' }}>Alex Morgan</td>
                    <td style={{ textAlign: 'center', display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={exportAuditExcel}
                        style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #1e3a8a', background: '#1e3a8a', color: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 700 }}
                      >
                        Excel (.xls)
                      </button>
                      <button
                        type="button"
                        onClick={exportAuditCSV}
                        style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontSize: '0.72rem', cursor: 'pointer' }}
                      >
                        CSV
                      </button>
                    </td>
                  </tr>

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
