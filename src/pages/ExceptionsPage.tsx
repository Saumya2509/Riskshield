import { useState, useEffect } from 'react'
import TopNav from '../dashboard/TopNav'
import Sidebar from '../dashboard/Sidebar'
import { useFinanceContext } from '../finance/FinanceContext'
import type { MatchResult } from '../finance/reconciliationEngine'
import { updateRecordInSupabase } from '../finance/supabaseClient'
import '../dashboard/dashboard.css'
import '../finance/finance.css'

const EXCEPTION_DESCRIPTIONS: Record<string, { label: string; action: string; badgeColor: { bg: string; text: string } }> = {
  AMOUNT_MISMATCH: {
    label: 'Amount Mismatch / Short Pay',
    action: 'Issue debit memo to counterparty or accept gateway fee variance',
    badgeColor: { bg: '#fee2e2', text: '#991b1b' },
  },
  MISSING_REF: {
    label: 'Missing Reference ID',
    action: 'Assign invoice/PO reference or post to suspense GL 2190 until verified',
    badgeColor: { bg: '#ffedd5', text: '#9a3412' },
  },
  DUPLICATE: {
    label: 'Duplicate Invoice / Billing',
    action: 'Void duplicate billing entry and unblock primary payment',
    badgeColor: { bg: '#fef3c7', text: '#92400e' },
  },
  CURRENCY_MISMATCH: {
    label: 'Foreign Currency Discrepancy',
    action: 'Apply daily spot booking FX rate and post realized FX gain/loss',
    badgeColor: { bg: '#ede9fe', text: '#6d28d9' },
  },
  DATE_WINDOW_EXCEEDED: {
    label: 'Settlement Lag > 5 Days',
    action: 'Verify transaction period and adjust accounting period cutoff',
    badgeColor: { bg: '#e0f2fe', text: '#0369a1' },
  },
  NO_MATCH: {
    label: 'Unmatched External Deposit',
    action: 'Pair with open customer ledger or allocate to suspense deposit GL',
    badgeColor: { bg: '#fee2e2', text: '#b91c1c' },
  },
  ORPHAN_LEDGER: {
    label: 'Orphan Ledger Entry',
    action: 'Reverse uncollected accrual or issue payment reminder notice',
    badgeColor: { bg: '#f1f5f9', text: '#475569' },
  },
}

export default function ExceptionsPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const ctx = useFinanceContext()

  // Only use active report from context. If new user hasn't ingested yet, report is null.
  const report = ctx.report
  const [filterCode, setFilterCode] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Active modal state
  const [solvingItem, setSolvingItem] = useState<MatchResult | null>(null)
  const [activeTab, setActiveTab] = useState<string>('action-1')
  const [customInput, setCustomInput] = useState<string>('')
  const [analystName, setAnalystName] = useState<string>('Sarah Chen (Lead Controller)')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const mainEl = document.querySelector('.d-main')
    if (mainEl) mainEl.scrollTop = 0
  }, [])

  const allExceptions: MatchResult[] = report ? report.exceptionList : []
  const resolvedMap = ctx.resolvedMap
  const resolvedCount = Object.keys(resolvedMap).length

  const filtered = allExceptions.filter(e => {
    const code = e.exceptionCode || (e.status === 'Partial' ? 'AMOUNT_MISMATCH' : 'NO_MATCH')
    if (filterCode !== 'ALL' && code !== filterCode) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        e.record.id.toLowerCase().includes(q) ||
        e.record.counterparty.toLowerCase().includes(q) ||
        e.record.description.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Count by code
  const codeCounts = allExceptions.reduce((acc, e) => {
    const c = e.exceptionCode || 'AMOUNT_MISMATCH'
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalOpenAmount = allExceptions
    .filter(e => !resolvedMap[e.record.id])
    .reduce((s, e) => s + e.record.amount, 0)

  // Open modal handler
  function handleOpenSolveModal(item: MatchResult) {
    setSolvingItem(item)
    setActiveTab('action-1')
    setCustomInput('')
  }

  // Execute resolution
  async function handleExecuteResolution(methodTitle: string, defaultNote: string) {
    if (!solvingItem) return
    setIsSubmitting(true)

    const finalNote = customInput.trim() ? `${methodTitle} — ${customInput}` : `${methodTitle}: ${defaultNote}`
    const recordId = solvingItem.record.id

    // Save in global context
    ctx.applyFix(recordId, {
      method: methodTitle,
      note: finalNote,
      timestamp: new Date().toLocaleTimeString(),
    })

    // Cloud background sync
    try {
      await updateRecordInSupabase(recordId, {
        is_resolved: true,
        assigned_analyst: analystName,
        resolution_notes: finalNote,
      })
    } catch (err) {
      console.warn('Could not sync resolution to Supabase:', err)
    }

    setIsSubmitting(false)
    setSolvingItem(null)

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const mainEl = document.querySelector('.d-main')
    if (mainEl) mainEl.scrollTop = 0
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }, 50)
  }

  // Save changes and update Multi-Source Reconciliation
  function handleSaveToMultiSource() {
    ctx.saveFixesToMultiSource()
    setSaveSuccessMsg(`Saved! ${resolvedCount} resolved record(s) applied to Multi-Source Reconciliation.`)
    setTimeout(() => setSaveSuccessMsg(null), 6000)
  }

  // 1-Click AI Auto-Resolve All Unresolved Exceptions
  function handleAutoResolveAll() {
    const unres = allExceptions.filter(e => !resolvedMap[e.record.id])
    if (unres.length === 0) return

    unres.forEach(item => {
      let method = 'Reconciled & Cleared'
      let note = 'Reconciled with 3-way ERP match.'

      const code = item.exceptionCode
      if (code === 'AMOUNT_MISMATCH') {
        method = 'Debit Memo Issued / Gateway Fee GL 6140'
        note = `Posted delta variance ₹${item.delta.toFixed(2)} to payment gateway processing fee GL 6140.`
      } else if (code === 'MISSING_REF') {
        method = 'Suspense Clearing GL 2190 Assigned'
        note = `Assigned PO/Invoice reference and transferred to Suspense Clearing GL 2190.`
      } else if (code === 'DUPLICATE') {
        method = 'Duplicate Voided & Primary Unblocked'
        note = `Voided duplicate invoice entry. Primary payment matched and cleared.`
      } else if (code === 'CURRENCY_MISMATCH') {
        method = 'Daily Spot FX Booking Rate Applied'
        note = `Applied bank settlement exchange rate. Realized FX variance booked.`
      } else if (code === 'DATE_WINDOW_EXCEEDED') {
        method = 'Accounting Period Cutoff Adjusted'
        note = `Verified banking settlement lag within approved 3-way window.`
      } else if (code === 'NO_MATCH') {
        method = 'Allocated to Suspense Deposit Holding'
        note = `Temporary deposit allocated to Suspense Holding GL 2190 awaiting counterparty claim.`
      } else if (code === 'ORPHAN_LEDGER') {
        method = 'Reversed Uncollected Revenue Accrual'
        note = `Issued accrual reversal voucher #AR-2026 for uncollected ledger record.`
      }

      ctx.applyFix(item.record.id, {
        method,
        note: `${method}: ${note}`,
        timestamp: new Date().toLocaleTimeString(),
      })
    })

    ctx.saveFixesToMultiSource()
    setSaveSuccessMsg(`⚡ AI Auto-Resolved All ${unres.length} Exceptions! Match Rate updated to 100.0%.`)
    setTimeout(() => setSaveSuccessMsg(null), 7000)
  }

  // Export Exceptions Audit Schedule to Styled Excel (.xls) with Colored Headers
  function exportExceptionsExcel() {
    if (allExceptions.length === 0) return

    const headers = [
      'Record ID',
      'Source',
      'Counterparty',
      'Exception Type',
      'Variance Delta (₹)',
      'Resolution Status',
      'Resolution Method Applied / Suggested Action',
      'Auditor Memo / Action Plan',
      'Amount (₹)',
      'Last Updated',
      'Lead Controller'
    ]

    const headerHtml = headers
      .map(h => `<th style="background-color: #1e3a8a; color: #ffffff; font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; padding: 8px 12px; border: 1px solid #334155; text-align: left;">${h}</th>`)
      .join('')

    const rowsHtml = allExceptions.map((item, idx) => {
      const fix = resolvedMap[item.record.id]
      const isSolved = !!fix
      const bg = isSolved ? '#f0fdf4' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc')
      const idFormatted = isSolved ? `${item.record.id} (FIX)` : item.record.id
      const statusFormatted = isSolved ? '✓ SOLVED (FIX)' : '⚠️ OPEN EXCEPTION'
      const statusColor = isSolved ? '#15803d' : '#dc2626'
      const methodFormatted = isSolved ? fix.method : 'Pending Action'
      const memoFormatted = isSolved ? fix.note : (item.suggestedAction || (item.exceptionCode && EXCEPTION_DESCRIPTIONS[item.exceptionCode]?.action) || 'Awaiting reconciliation review')

      return `<tr style="background-color: ${bg};">
        <td style="font-family: 'Courier New', monospace; font-weight: bold; padding: 6px 10px; border: 1px solid #e2e8f0; color: ${isSolved ? '#15803d' : '#2563eb'};">${idFormatted}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0;">${item.record.source}</td>
        <td style="font-family: Arial, sans-serif; font-weight: 600; padding: 6px 10px; border: 1px solid #e2e8f0;">${item.record.counterparty}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0; color: #991b1b; font-weight: bold;">${item.exceptionCode || 'AMOUNT_MISMATCH'}</td>
        <td style="font-family: Arial, sans-serif; text-align: right; padding: 6px 10px; border: 1px solid #e2e8f0; color: #dc2626; font-weight: bold;">−₹${item.delta.toFixed(2)}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: bold; color: ${statusColor};">${statusFormatted}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: bold; color: ${isSolved ? '#166534' : '#334155'};">${methodFormatted}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0; color: #334155;">${memoFormatted}</td>
        <td style="font-family: Arial, sans-serif; text-align: right; padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: bold;">₹${item.record.amount.toFixed(2)}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0; color: #64748b;">${fix?.timestamp || new Date().toLocaleTimeString()}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0;">${analystName}</td>
      </tr>`
    }).join('')

    const excelTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>RiskShield Exceptions</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
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
    link.download = `RiskShield_Exceptions_Audit_${new Date().toISOString().slice(0, 10)}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="dash-app fin-page">
      <TopNav onMenu={() => setMenuOpen(true)} />
      <div className="d-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} activeId="exceptions" />
        <main className="d-main">

          {/* Header */}
          <header className="d-pagehead">
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                Exception Resolution Workbench
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  background: allExceptions.length - resolvedCount > 0 ? '#fee2e2' : '#dcfce7',
                  color: allExceptions.length - resolvedCount > 0 ? '#991b1b' : '#15803d',
                  borderRadius: 999
                }}>
                  {allExceptions.length - resolvedCount} Open Discrepancies
                </span>
                {resolvedCount > 0 && (
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '2px 8px', background: '#dcfce7', color: '#15803d', borderRadius: 999 }}>
                    ✓ {resolvedCount} Fixed
                  </span>
                )}
              </h1>
              <p>
                Interactive 1-click accounting solutions · Debit/Credit Memos · Suspense GL Allocation · Spot FX adjustments
              </p>
            </div>
            <div className="d-page-actions" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'right', marginRight: 4 }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Unresolved Exposure</span>
                <strong style={{ fontSize: '1.15rem', color: totalOpenAmount > 0 ? '#dc2626' : '#16a34a' }}>
                  ₹{Math.round(totalOpenAmount).toLocaleString('en-IN')}
                </strong>
              </div>

              {/* 1-CLICK AI AUTO-RESOLVE ALL EXCEPTIONS */}
              {allExceptions.length > 0 && resolvedCount < allExceptions.length && (
                <button
                  type="button"
                  onClick={handleAutoResolveAll}
                  className="d-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 38,
                    padding: '0 16px',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(124,58,237,0.3)'
                  }}
                  title="Auto-apply recommended accounting fixes (Debit notes, Suspense GL, Spot FX) across all exceptions"
                >
                  ⚡ AI Auto-Resolve All ({allExceptions.length - resolvedCount})
                </button>
              )}

              {/* DOWNLOAD EXCEPTIONS EXCEL BUTTON (Always Available) */}
              {allExceptions.length > 0 && (
                <button
                  type="button"
                  onClick={exportExceptionsExcel}
                  className="d-btn d-btn-ghost"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.82rem',
                    height: 38,
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    borderColor: '#bfdbfe',
                    fontWeight: 700,
                  }}
                  title="Download complete Exceptions Audit Schedule in Styled Excel (.xls) with colored headers"
                >
                  📊 Download Exceptions (.xls)
                </button>
              )}

              {/* SAVE BUTTON FOR FIXES */}
              <button
                type="button"
                onClick={handleSaveToMultiSource}
                disabled={resolvedCount === 0}
                className="d-btn d-btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 38,
                  background: resolvedCount > 0 ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : '#94a3b8',
                  borderColor: resolvedCount > 0 ? '#16a34a' : '#94a3b8',
                  boxShadow: resolvedCount > 0 ? '0 2px 8px rgba(22,163,74,0.3)' : 'none',
                  fontWeight: 700,
                  cursor: resolvedCount > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                💾 Save Changes &amp; Reconcile Multi-Source
              </button>

              {resolvedCount > 0 && (
                <button
                  type="button"
                  onClick={() => ctx.resetFixes()}
                  className="d-btn d-btn-ghost"
                  style={{ fontSize: '0.78rem', height: 38 }}
                >
                  ↺ Reset Fixes
                </button>
              )}
            </div>
          </header>

          {/* Success Banner on Save */}
          {saveSuccessMsg && (
            <div style={{
              padding: '14px 20px',
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: 12,
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              boxShadow: '0 2px 6px rgba(22,163,74,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <div>
                  <strong style={{ fontSize: '0.92rem', color: '#166534', display: 'block' }}>
                    {saveSuccessMsg}
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: '#15803d' }}>
                    All applied fixes are now synced to Multi-Source Reconciliation, cash forecasts, and Supabase audit logs.
                  </span>
                </div>
              </div>
              <a
                href="#/reconciliation"
                className="d-btn d-btn-primary"
                style={{ fontSize: '0.78rem', padding: '6px 14px', textDecoration: 'none', background: '#16a34a', borderColor: '#16a34a' }}
              >
                View Multi-Source Recon →
              </a>
            </div>
          )}

          {/* Category Filter Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
            <div
              onClick={() => setFilterCode('ALL')}
              style={{
                padding: '10px 14px',
                background: filterCode === 'ALL' ? '#eff6ff' : '#fff',
                border: `1px solid ${filterCode === 'ALL' ? '#3b82f6' : '#e2e8f0'}`,
                borderRadius: 10,
                cursor: 'pointer',
                boxShadow: filterCode === 'ALL' ? '0 0 0 2px #3b82f6' : 'none',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>All Exceptions</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>{allExceptions.length}</div>
              <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>{resolvedCount} Fixed</span>
            </div>

            {Object.entries(EXCEPTION_DESCRIPTIONS).map(([code, meta]) => {
              const count = codeCounts[code] || 0
              if (count === 0) return null
              const isSelected = filterCode === code
              return (
                <div
                  key={code}
                  onClick={() => setFilterCode(isSelected ? 'ALL' : code)}
                  style={{
                    padding: '10px 14px',
                    background: isSelected ? meta.badgeColor.bg : '#fff',
                    border: `1px solid ${isSelected ? meta.badgeColor.text : '#e2e8f0'}`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    boxShadow: isSelected ? `0 0 0 2px ${meta.badgeColor.text}` : 'none',
                  }}
                >
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: meta.badgeColor.text, textTransform: 'uppercase' }}>{code}</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>{count}</div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{meta.label.split('/')[0]}</span>
                </div>
              )
            })}
          </div>

          {/* Search bar */}
          {allExceptions.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search by Record ID (e.g. B2-BNK-019), Counterparty, or Description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>
          )}

          {/* Active Exception Records Table / Empty State */}
          <div className="fin-card">
            <div className="fin-card-hd">
              <div>
                <h2 className="fin-card-title">Active Exception Records</h2>
                <p className="fin-card-desc">
                  {allExceptions.length === 0
                    ? '0 exceptions detected · Awaiting batch reconciliation'
                    : `Showing ${filtered.length} exceptions · Click ⚡ Solve on any row to apply fix, then click 💾 Save Changes above`}
                </p>
              </div>
            </div>

            {/* Zero State for New Users */}
            {allExceptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🛡️</div>
                <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>
                  No Active Exceptions Found
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: '0.86rem', maxWidth: 460, marginInline: 'auto', lineHeight: 1.6 }}>
                  You are viewing a clean slate with zero discrepancy exposure. Upload your CSV files or select a pre-loaded enterprise batch in Multi-Source Recon to start identifying and resolving exceptions.
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
              <div className="fin-rec-wrap" style={{ maxHeight: 540 }}>
                <table className="fin-tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>Status</th>
                      <th>ID</th>
                      <th>Source</th>
                      <th>Counterparty</th>
                      <th>Exception Code &amp; Status</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'right' }}>Variance (Δ)</th>
                      <th>Suggested Action / Applied Fix</th>
                      <th style={{ textAlign: 'center', width: 130 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => {
                      const resolvedInfo = resolvedMap[item.record.id]
                      const isResolved = Boolean(resolvedInfo)
                      const code = item.exceptionCode || 'AMOUNT_MISMATCH'
                      const meta = EXCEPTION_DESCRIPTIONS[code] || EXCEPTION_DESCRIPTIONS['NO_MATCH']

                      return (
                        <tr key={item.record.id} style={{ opacity: isResolved ? 0.75 : 1, transition: 'opacity 0.2s', background: isResolved ? 'rgba(240, 253, 244, 0.6)' : 'transparent' }}>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '1rem' }}>
                              {isResolved ? '✅' : '⚠️'}
                            </span>
                          </td>
                          <td className="fin-mono">
                            <a
                              href={`#/record-details?id=${item.record.id}`}
                              style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}
                              title="Inspect 3-way record details & resolution"
                            >
                              {item.record.id}
                            </a>
                            {isResolved && (
                              <span style={{
                                marginLeft: 6,
                                padding: '1px 5px',
                                borderRadius: 4,
                                fontSize: '0.66rem',
                                fontWeight: 800,
                                background: '#dcfce7',
                                color: '#15803d',
                                border: '1px solid #86efac'
                              }}>
                                (FIX)
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{
                              padding: '1px 7px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700,
                              background: item.record.source === 'BANK' ? '#dbeafe' : item.record.source === 'INVOICE' ? '#fef3c7' : '#dcfce7',
                              color: item.record.source === 'BANK' ? '#1e40af' : item.record.source === 'INVOICE' ? '#92400e' : '#166534',
                            }}>
                              {item.record.source}
                            </span>
                          </td>
                          <td style={{ color: '#0f172a', fontWeight: 600 }}>{item.record.counterparty}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                              <span style={{
                                display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                                fontSize: '0.72rem', fontWeight: 700,
                                background: meta.badgeColor.bg, color: meta.badgeColor.text,
                              }}>
                                {code}
                              </span>
                              {/* In bracket fix badge */}
                              {isResolved && (
                                <span style={{
                                  display: 'inline-block', padding: '2px 7px', borderRadius: 6,
                                  fontSize: '0.68rem', fontWeight: 700,
                                  background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0',
                                }}>
                                  [Fixed: {resolvedInfo.method}]
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="fin-mono" style={{ textAlign: 'right' }}>
                            {item.record.currency !== 'INR' ? item.record.currency + ' ' : '₹'}
                            {item.record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="fin-mono" style={{ textAlign: 'right', color: isResolved ? '#16a34a' : (item.delta > 0.01 ? '#dc2626' : '#16a34a') }}>
                            {isResolved ? (
                              <span style={{ color: '#16a34a', fontWeight: 700 }}>₹0.00</span>
                            ) : (
                              item.delta > 0.01 ? `−₹${item.delta.toFixed(2)}` : '—'
                            )}
                          </td>
                          <td style={{ fontSize: '0.78rem', color: '#475569', maxWidth: 300 }}>
                            {isResolved ? (
                              <span style={{ color: '#15803d', fontWeight: 600 }}>
                                ✓ {resolvedInfo?.note}
                              </span>
                            ) : (
                              item.suggestedAction || meta.action
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isResolved ? (
                              <button
                                type="button"
                                onClick={(e) => { e.currentTarget.blur(); handleOpenSolveModal(item) }}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  background: '#dcfce7',
                                  border: '1px solid #86efac',
                                  color: '#15803d',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Edit Fix
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => { e.currentTarget.blur(); handleOpenSolveModal(item) }}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: 6,
                                  border: '1px solid #2563eb',
                                  background: '#2563eb',
                                  color: '#ffffff',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                ⚡ Solve
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* ─── DYNAMIC 1-CLICK RESOLUTION ACTION MODAL ───────────────────────── */}
      {solvingItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 620,
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            animation: 'scaleUp 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>⚡ Solve Exception: {solvingItem.record.id}</span>
                  <span style={{ background: '#dc2626', color: '#fff', fontSize: '0.68rem', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                    {solvingItem.exceptionCode || 'AMOUNT_MISMATCH'}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  Counterparty: <strong>{solvingItem.record.counterparty}</strong> · Source: <strong>{solvingItem.record.source}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSolvingItem(null)}
                style={{ background: 'transparent', border: 0, color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px' }}>
              {/* Discrepancy KPI Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 18 }}>
                <div>
                  <small style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>Original Amount</small>
                  <strong style={{ display: 'block', fontSize: '1.1rem', color: '#0f172a' }}>₹{solvingItem.record.amount.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>Variance Delta</small>
                  <strong style={{ display: 'block', fontSize: '1.1rem', color: solvingItem.delta > 0.01 ? '#dc2626' : '#16a34a' }}>
                    {solvingItem.delta > 0.01 ? `−₹${solvingItem.delta.toFixed(2)}` : '✓ ₹0.00'}
                  </strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>Pass Tier</small>
                  <span style={{ display: 'block', fontSize: '0.82rem', color: '#2563eb', fontWeight: 700, marginTop: 2 }}>
                    Pass {solvingItem.pass ?? 3} ({solvingItem.confidence}% Conf)
                  </span>
                </div>
              </div>

              {/* Dynamic Action Tabs Based on Exception Type */}
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                Select Contextual Accounting Solution:
              </p>

              {/* 1. AMOUNT_MISMATCH / PARTIAL */}
              {(!solvingItem.exceptionCode || solvingItem.exceptionCode === 'AMOUNT_MISMATCH' || solvingItem.status === 'Partial') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div
                    onClick={() => setActiveTab('action-1')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${activeTab === 'action-1' ? '#2563eb' : '#e2e8f0'}`,
                      background: activeTab === 'action-1' ? '#eff6ff' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>📝 Option 1: Raise Debit Memo for ₹{solvingItem.delta.toFixed(2)}</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      Generates customer debit note #DM-{solvingItem.record.id.slice(-4)} and holds remaining delta until settled.
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('action-2')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${activeTab === 'action-2' ? '#2563eb' : '#e2e8f0'}`,
                      background: activeTab === 'action-2' ? '#eff6ff' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>⚖️ Option 2: Accept Payment Gateway MDR Fee Write-Off (GL 6200)</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      Recognize the ₹{solvingItem.delta.toFixed(2)} difference as payment processing fee and clear invoice in full.
                    </p>
                  </div>
                </div>
              )}

              {/* 2. MISSING_REF */}
              {solvingItem.exceptionCode === 'MISSING_REF' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div
                    onClick={() => setActiveTab('action-1')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${activeTab === 'action-1' ? '#2563eb' : '#e2e8f0'}`,
                      background: activeTab === 'action-1' ? '#eff6ff' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>🔍 Option 1: Link to Discovered Invoice Reference</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      Matches payment to counterparty invoice batch using verified amount and date window.
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('action-2')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${activeTab === 'action-2' ? '#2563eb' : '#e2e8f0'}`,
                      background: activeTab === 'action-2' ? '#eff6ff' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>🏛️ Option 2: Allocate to Unallocated Suspense Account (GL 2190)</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      Holds ₹{solvingItem.record.amount.toLocaleString('en-IN')} in suspense ledger pending customer remitter confirmation.
                    </p>
                  </div>
                </div>
              )}

              {/* 3. CURRENCY_MISMATCH */}
              {solvingItem.exceptionCode === 'CURRENCY_MISMATCH' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div
                    onClick={() => setActiveTab('action-1')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${activeTab === 'action-1' ? '#2563eb' : '#e2e8f0'}`,
                      background: activeTab === 'action-1' ? '#eff6ff' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>💱 Option 1: Apply Spot Booking FX Rate (USD/INR @ ₹83.40)</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      Converts foreign currency at official settlement date rate and books realized FX gain/loss.
                    </p>
                  </div>
                </div>
              )}

              {/* 4. DUPLICATE */}
              {solvingItem.exceptionCode === 'DUPLICATE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div
                    onClick={() => setActiveTab('action-1')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${activeTab === 'action-1' ? '#2563eb' : '#e2e8f0'}`,
                      background: activeTab === 'action-1' ? '#eff6ff' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>🚫 Option 1: Void Duplicate Invoice Entry</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      Voids duplicate billing record and releases bank settlement to primary invoice.
                    </p>
                  </div>
                </div>
              )}

              {/* 5. ORPHAN_LEDGER / NO_MATCH */}
              {(solvingItem.exceptionCode === 'ORPHAN_LEDGER' || solvingItem.exceptionCode === 'NO_MATCH') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div
                    onClick={() => setActiveTab('action-1')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${activeTab === 'action-1' ? '#2563eb' : '#e2e8f0'}`,
                      background: activeTab === 'action-1' ? '#eff6ff' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>↺ Option 1: Reverse Accrual Journal Entry</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      Reverses general ledger accrual entry since corresponding bank settlement was never deposited.
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('action-2')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${activeTab === 'action-2' ? '#2563eb' : '#e2e8f0'}`,
                      background: activeTab === 'action-2' ? '#eff6ff' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>📩 Option 2: Dispatch Customer Payment Reminder Notice</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      Flags invoice for automated dunning reminder and places account on payment follow-up.
                    </p>
                  </div>
                </div>
              )}

              {/* Optional Custom Note input */}
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Auditor Resolution Memo (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Verified with treasury desk, fee variance approved..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              {/* Assigned Controller Selector */}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b' }}>
                <span>Certified By: <strong>{analystName}</strong></span>
                <select
                  value={analystName}
                  onChange={(e) => setAnalystName(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.74rem' }}
                >
                  <option value="Sarah Chen (Lead Controller)">Sarah Chen (Lead Controller)</option>
                  <option value="Alex Morgan (Senior Auditor)">Alex Morgan (Senior Auditor)</option>
                  <option value="David Miller (Treasury Specialist)">David Miller (Treasury Specialist)</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setSolvingItem(null)}
                className="d-btn d-btn-ghost"
                style={{ fontSize: '0.84rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  const code = solvingItem.exceptionCode || 'AMOUNT_MISMATCH'
                  if (code === 'AMOUNT_MISMATCH' || solvingItem.status === 'Partial') {
                    if (activeTab === 'action-1') {
                      handleExecuteResolution('Debit Memo Raised', `Raised debit memo #DM-${solvingItem.record.id.slice(-4)} for ₹${solvingItem.delta.toFixed(2)}`)
                    } else {
                      handleExecuteResolution('Gateway Fee Accepted', `Booked ₹${solvingItem.delta.toFixed(2)} variance to Gateway MDR Expense GL 6200`)
                    }
                  } else if (code === 'MISSING_REF') {
                    if (activeTab === 'action-1') {
                      handleExecuteResolution('Invoice Linked', `Attached discovered invoice reference from counterparty remitter`)
                    } else {
                      handleExecuteResolution('Suspense Allocated', `Transferred ₹${solvingItem.record.amount.toLocaleString('en-IN')} to Suspense Account GL 2190`)
                    }
                  } else if (code === 'CURRENCY_MISMATCH') {
                    handleExecuteResolution('Spot FX Applied', `Applied spot rate USD/INR @ ₹83.40 and booked FX gain/loss`)
                  } else if (code === 'DUPLICATE') {
                    handleExecuteResolution('Duplicate Voided', `Voided duplicate invoice entry and unblocked payment`)
                  } else {
                    if (activeTab === 'action-1') {
                      handleExecuteResolution('Accrual Reversed', `Reversed uncollected accrual journal entry`)
                    } else {
                      handleExecuteResolution('Dunning Notice Sent', `Dispatched payment follow-up notice to customer`)
                    }
                  }
                }}
                className="d-btn d-btn-primary"
                style={{ fontSize: '0.84rem', padding: '8px 20px' }}
              >
                {isSubmitting ? 'Syncing...' : '✓ Confirm Fix'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
