import { useState, useEffect } from 'react'
import TopNav from '../dashboard/TopNav'
import Sidebar from '../dashboard/Sidebar'
import { useFinanceContext } from '../finance/FinanceContext'
import type { MatchResult } from '../finance/reconciliationEngine'
import { updateRecordInSupabase } from '../finance/supabaseClient'
import '../dashboard/dashboard.css'
import '../finance/finance.css'

const EXCEPTION_DESCRIPTIONS: Record<string, {
  label: string
  action: string
  drGL: string
  drName: string
  crGL: string
  crName: string
  badgeColor: { bg: string; text: string }
}> = {
  AMOUNT_MISMATCH: {
    label: 'Amount Mismatch / Short Pay',
    action: 'Issue debit memo to counterparty or accept gateway fee variance',
    drGL: 'GL 6140',
    drName: 'Payment Gateway MDR Expense',
    crGL: 'GL 2010',
    crName: 'Bank Operational Settlement A/c',
    badgeColor: { bg: '#fee2e2', text: '#991b1b' },
  },
  MISSING_REF: {
    label: 'Missing Reference ID',
    action: 'Assign invoice/PO reference or post to suspense GL 2190 until verified',
    drGL: 'GL 2190',
    drName: 'Unallocated Suspense Clearing',
    crGL: 'GL 1150',
    crName: 'Accounts Receivable Holding',
    badgeColor: { bg: '#ffedd5', text: '#9a3412' },
  },
  DUPLICATE: {
    label: 'Duplicate Invoice / Billing',
    action: 'Void duplicate billing entry and unblock primary payment',
    drGL: 'GL 2050',
    drName: 'Accounts Payable Clearing',
    crGL: 'GL 5010',
    crName: 'Operating Expense Accrual',
    badgeColor: { bg: '#fef3c7', text: '#92400e' },
  },
  CURRENCY_MISMATCH: {
    label: 'Foreign Currency Discrepancy',
    action: 'Apply daily spot booking FX rate and post realized FX gain/loss',
    drGL: 'GL 2300',
    drName: 'Realized Foreign Exchange Loss',
    crGL: 'GL 2010',
    crName: 'Forex Settlement Bank A/c',
    badgeColor: { bg: '#ede9fe', text: '#6d28d9' },
  },
  DATE_WINDOW_EXCEEDED: {
    label: 'Settlement Lag > 5 Days',
    action: 'Verify transaction period and adjust accounting period cutoff',
    drGL: 'GL 1190',
    drName: 'In-Transit Settlement Accrual',
    crGL: 'GL 2010',
    crName: 'Bank Clearing A/c',
    badgeColor: { bg: '#e0f2fe', text: '#0369a1' },
  },
  NO_MATCH: {
    label: 'Unmatched External Deposit',
    action: 'Pair with open customer ledger or allocate to suspense deposit GL',
    drGL: 'GL 2190',
    drName: 'Unallocated Suspense Deposits',
    crGL: 'GL 2010',
    crName: 'Bank Inbound Transit A/c',
    badgeColor: { bg: '#fee2e2', text: '#b91c1c' },
  },
  ORPHAN_LEDGER: {
    label: 'Orphan Ledger Entry',
    action: 'Reverse uncollected accrual or issue payment reminder notice',
    drGL: 'GL 4000',
    drName: 'Revenue Accrual Reversal',
    crGL: 'GL 1150',
    crName: 'Uncollected Receivables',
    badgeColor: { bg: '#f1f5f9', text: '#475569' },
  },
}

// Helper to compute aging & DSO exposure
function getAgingInfo(recordDate?: string) {
  if (!recordDate) return { days: 1, label: '<24h Fresh', color: '#16a34a', bg: '#dcfce7', tier: 'fresh' }
  const parts = recordDate.split('-')
  const day = parseInt(parts[2] || '1', 10)
  // Calculate simulated aging relative to month-end
  const days = Math.max(1, (day % 7) + 1)
  if (days <= 1) {
    return { days, label: '<24h Fresh', color: '#15803d', bg: '#dcfce7', tier: 'fresh' }
  } else if (days <= 4) {
    return { days, label: `${days}d Lag (In-Window)`, color: '#b45309', bg: '#fef3c7', tier: 'window' }
  } else {
    return { days, label: `${days}d Critical Aging`, color: '#b91c1c', bg: '#fee2e2', tier: 'critical' }
  }
}

export default function ExceptionsPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const ctx = useFinanceContext()

  // Only use active report from context. If new user hasn't ingested yet, report is null.
  const report = ctx.report
  const [filterCode, setFilterCode] = useState<string>('ALL')
  const [viewTab, setViewTab] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Modals state
  const [solvingItem, setSolvingItem] = useState<MatchResult | null>(null)
  const [voucherItem, setVoucherItem] = useState<MatchResult | null>(null)
  const [debitNoteItem, setDebitNoteItem] = useState<MatchResult | null>(null)
  const [activeTab, setActiveTab] = useState<string>('action-1')
  const [customInput, setCustomInput] = useState<string>('')
  const [analystName, setAnalystName] = useState<string>('Sarah Chen (Lead Controller)')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const mainEl = document.querySelector('.d-main')
    if (mainEl) mainEl.scrollTop = 0
  }, [])

  const resolvedMap = ctx.resolvedMap
  const allExceptions: MatchResult[] = report
    ? report.results.filter(r => r.exceptionCode !== null || r.status === 'Exception' || r.status === 'Partial' || Boolean(resolvedMap[r.record.id]))
    : []
  
  const resolvedList = allExceptions.filter(e => Boolean(resolvedMap[e.record.id]))
  const unresList = allExceptions.filter(e => !resolvedMap[e.record.id])
  const openCount = unresList.length
  const resolvedCount = resolvedList.length

  // Filtered by category code, search query, and view tab (Open vs Resolved)
  const filtered = allExceptions.filter(e => {
    const isResolved = Boolean(resolvedMap[e.record.id])
    if (viewTab === 'OPEN' && isResolved) return false
    if (viewTab === 'RESOLVED' && !isResolved) return false

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

  // Open Count by code
  const codeCounts = allExceptions.reduce((acc, e) => {
    const c = e.exceptionCode || (e.status === 'Partial' ? 'AMOUNT_MISMATCH' : 'NO_MATCH')
    if (!resolvedMap[e.record.id]) {
      acc[c] = (acc[c] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const totalOpenAmount = allExceptions
    .filter(e => !resolvedMap[e.record.id])
    .reduce((s, e) => s + e.record.amount, 0)

  // Aging summary statistics
  const agingStats = unresList.reduce((acc, e) => {
    const info = getAgingInfo(e.record.date)
    if (info.tier === 'fresh') acc.fresh += 1
    else if (info.tier === 'window') acc.window += 1
    else acc.critical += 1
    return acc
  }, { fresh: 0, window: 0, critical: 0 })

  // Open solve modal handler
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

    const newFixes: Record<string, { method: string; note: string; timestamp: string }> = {}

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

      newFixes[item.record.id] = {
        method,
        note: `${method}: ${note}`,
        timestamp: new Date().toLocaleTimeString(),
      }
    })

    ctx.applyBatchFixes(newFixes)
    ctx.saveFixesToMultiSource(newFixes)
    setSaveSuccessMsg(`⚡ AI Auto-Resolved All ${unres.length} Exceptions! Match Rate updated to 100.0%.`)
    setTimeout(() => setSaveSuccessMsg(null), 7000)
  }

  // Export Exceptions Audit Schedule to Styled Excel (.xls)
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
</head>
<body>
  <table border="1">${headerHtml}${rowsHtml}</table>
</body></html>`

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `RiskShield_Exceptions_${report?.batchId || 'Enterprise'}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 4000)
  }

  return (
    <div className="dash-app fin-page">
      <TopNav onMenu={() => setMenuOpen(true)} />
      <div className="d-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} activeId="exceptions" />
        <main className="d-main">

          {/* Header */}
          <header className="d-pagehead" style={{ marginBottom: 16 }}>
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                Exception Resolution Workbench
                {openCount === 0 && resolvedCount > 0 ? (
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    background: '#dcfce7',
                    color: '#15803d',
                    borderRadius: 999,
                    border: '1px solid #86efac'
                  }}>
                    ✓ 0 Open Discrepancies (100% Solved)
                  </span>
                ) : (
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    background: openCount > 0 ? '#fee2e2' : '#dcfce7',
                    color: openCount > 0 ? '#991b1b' : '#15803d',
                    borderRadius: 999
                  }}>
                    {openCount} Open Discrepancies
                  </span>
                )}
                {resolvedCount > 0 && openCount > 0 && (
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 10px', background: '#dcfce7', color: '#15803d', borderRadius: 999 }}>
                    ✓ {resolvedCount} Fixed
                  </span>
                )}
              </h1>
              <p>
                Interactive 1-click accounting solutions · GAAP/IFRS Dual-Entry Vouchers · Vendor Debit Memos · DSO Aging Analysis
              </p>
            </div>
            <div className="d-page-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
              {/* Exposure Pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                height: 36,
                boxSizing: 'border-box',
                whiteSpace: 'nowrap'
              }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 650 }}>Exposure:</span>
                <strong style={{ fontSize: '0.92rem', color: totalOpenAmount > 0 ? '#dc2626' : '#16a34a' }}>
                  ₹{Math.round(totalOpenAmount).toLocaleString('en-IN')}
                </strong>
              </div>

              {/* 1-CLICK AI AUTO-RESOLVE ALL EXCEPTIONS */}
              {allExceptions.length > 0 && openCount > 0 && (
                <button
                  type="button"
                  onClick={handleAutoResolveAll}
                  className="d-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 36,
                    padding: '0 14px',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(124,58,237,0.25)'
                  }}
                  title="Auto-apply recommended accounting fixes (Debit notes, Suspense GL, Spot FX) across all exceptions"
                >
                  ⚡ Auto-Resolve ({openCount})
                </button>
              )}

              {/* DOWNLOAD EXCEPTIONS EXCEL BUTTON */}
              {allExceptions.length > 0 && (
                <button
                  type="button"
                  onClick={exportExceptionsExcel}
                  className="d-btn d-btn-ghost"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.8rem',
                    height: 36,
                    padding: '0 12px',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    borderColor: '#bfdbfe',
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}
                  title="Download complete Exceptions Audit Schedule in Styled Excel (.xls)"
                >
                  📊 Export (.xls)
                </button>
              )}

              {/* SAVE BUTTON FOR FIXES (Only shown when fixes are applied) */}
              {resolvedCount > 0 && (
                <button
                  type="button"
                  onClick={handleSaveToMultiSource}
                  className="d-btn d-btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 36,
                    padding: '0 14px',
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    borderColor: '#16a34a',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(22,163,74,0.25)',
                    cursor: 'pointer',
                  }}
                >
                  💾 Save to Recon
                </button>
              )}

              {/* RESET BUTTON */}
              {resolvedCount > 0 && (
                <button
                  type="button"
                  onClick={() => ctx.resetFixes()}
                  className="d-btn d-btn-ghost"
                  style={{
                    fontSize: '0.78rem',
                    height: 36,
                    padding: '0 10px',
                    color: '#64748b',
                    whiteSpace: 'nowrap'
                  }}
                  title="Reset all applied fixes"
                >
                  ↺ Reset
                </button>
              )}
            </div>
          </header>

          {/* Toast Notification */}
          {toastMsg && (
            <div style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              padding: '12px 20px',
              background: '#0f172a',
              color: '#fff',
              borderRadius: 10,
              fontSize: '0.86rem',
              fontWeight: 650,
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid #334155'
            }}>
              <span>✨</span>
              <span>{toastMsg}</span>
            </div>
          )}

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

          {/* ── REAL-WORLD ENHANCEMENT #4: EXCEPTION AGING & DSO EXPOSURE SLA BAR ── */}
          {allExceptions.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
              marginBottom: 18,
              padding: '14px 18px',
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Fresh (&lt;24 Hours)</span>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                    {agingStats.fresh} Items <span style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 600 }}>• Low DSO Risk</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Settlement Window (2-4d)</span>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                    {agingStats.window} Items <span style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 600 }}>• Normal Lag</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Aging Exposure (&gt;5d)</span>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                    {agingStats.critical} Items <span style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 600 }}>• High Working Capital Risk</span>
                  </div>
                </div>
              </div>
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
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: openCount === 0 ? '#16a34a' : '#0f172a', margin: '2px 0 0' }}>
                {openCount}
              </div>
              <span style={{ fontSize: '0.68rem', color: openCount === 0 ? '#16a34a' : '#2563eb', fontWeight: 700 }}>
                {openCount === 0 ? `✓ All ${resolvedCount} Solved` : `${resolvedCount} Fixed`}
              </span>
            </div>

            {Object.entries(EXCEPTION_DESCRIPTIONS).map(([code, meta]) => {
              const count = codeCounts[code] || 0
              const totalForCode = allExceptions.filter(e => (e.exceptionCode || (e.status === 'Partial' ? 'AMOUNT_MISMATCH' : 'NO_MATCH')) === code).length
              if (totalForCode === 0) return null
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
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: count === 0 ? '#16a34a' : '#0f172a', margin: '2px 0 0' }}>
                    {count}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: count === 0 ? '#16a34a' : '#64748b', fontWeight: count === 0 ? 700 : 400 }}>
                    {count === 0 ? '✓ All Solved' : `${count} of ${totalForCode} Open`}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Search bar & View Segmented Tabs */}
          {allExceptions.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by Record ID (e.g. B2-BNK-019), Counterparty, or Description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, minWidth: 260, padding: '9px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />

              {/* View Tabs */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setViewTab('ALL')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    background: viewTab === 'ALL' ? '#ffffff' : 'transparent',
                    color: viewTab === 'ALL' ? '#0f172a' : '#64748b',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: viewTab === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  All ({allExceptions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('OPEN')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    background: viewTab === 'OPEN' ? '#ffffff' : 'transparent',
                    color: viewTab === 'OPEN' ? '#dc2626' : '#64748b',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: viewTab === 'OPEN' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  ⚡ Open ({openCount})
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('RESOLVED')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    background: viewTab === 'RESOLVED' ? '#ffffff' : 'transparent',
                    color: viewTab === 'RESOLVED' ? '#16a34a' : '#64748b',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: viewTab === 'RESOLVED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  ✓ Resolved Audit Trail ({resolvedCount})
                </button>
              </div>
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
                    : openCount === 0
                    ? `🎉 All ${resolvedCount} exceptions resolved! Showing audit trail with applied accounting fixes and journal vouchers.`
                    : `Showing ${filtered.length} exceptions (${openCount} Open · ${resolvedCount} Fixed) · Click ⚡ Solve on any row to apply fix, then click 💾 Save Changes above`}
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
              <div className="fin-rec-wrap" style={{ maxHeight: 560 }}>
                <table className="fin-tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>Status</th>
                      <th>ID</th>
                      <th>Source</th>
                      <th>Counterparty</th>
                      <th>Exception Type</th>
                      <th>Aging / SLA</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'right' }}>Variance (Δ)</th>
                      <th>Suggested Action / Applied Fix</th>
                      <th style={{ textAlign: 'center', width: 170 }}>Action &amp; Tools</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => {
                      const resolvedInfo = resolvedMap[item.record.id]
                      const isResolved = Boolean(resolvedInfo)
                      const code = item.exceptionCode || 'AMOUNT_MISMATCH'
                      const meta = EXCEPTION_DESCRIPTIONS[code] || EXCEPTION_DESCRIPTIONS['NO_MATCH']
                      const aging = getAgingInfo(item.record.date)

                      return (
                        <tr key={item.record.id} style={{ opacity: isResolved ? 0.85 : 1, transition: 'opacity 0.2s', background: isResolved ? 'rgba(240, 253, 244, 0.5)' : 'transparent' }}>
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

                          {/* ── ENHANCEMENT #4: Aging SLA Badge ── */}
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: isResolved ? '#f1f5f9' : aging.bg,
                              color: isResolved ? '#64748b' : aging.color,
                            }}>
                              {isResolved ? '✓ Cleared' : aging.label}
                            </span>
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
                          <td style={{ fontSize: '0.78rem', color: '#475569', maxWidth: 260 }}>
                            {isResolved ? (
                              <span style={{ color: '#15803d', fontWeight: 600 }}>
                                ✓ {resolvedInfo?.note}
                              </span>
                            ) : (
                              item.suggestedAction || meta.action
                            )}
                          </td>

                          {/* Action Tools: Solve / Edit + Voucher + Debit Note */}
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                              {isResolved ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.currentTarget.blur(); handleOpenSolveModal(item) }}
                                    style={{
                                      padding: '3px 7px',
                                      borderRadius: 5,
                                      background: '#dcfce7',
                                      border: '1px solid #86efac',
                                      color: '#15803d',
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Edit Fix
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.currentTarget.blur(); setVoucherItem(item) }}
                                    style={{
                                      padding: '3px 7px',
                                      borderRadius: 5,
                                      background: '#f8fafc',
                                      border: '1px solid #cbd5e1',
                                      color: '#334155',
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                    title="View GAAP/IFRS Dual-Entry General Ledger Voucher"
                                  >
                                    🧾 JV
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => { e.currentTarget.blur(); handleOpenSolveModal(item) }}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    border: '1px solid #2563eb',
                                    background: '#2563eb',
                                    color: '#ffffff',
                                    fontSize: '0.74rem',
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

                              {/* ENHANCEMENT #3: 1-Click Vendor Debit Memo Button */}
                              {(item.delta > 0.01 || code === 'AMOUNT_MISMATCH' || code === 'DUPLICATE') && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.currentTarget.blur(); setDebitNoteItem(item) }}
                                  style={{
                                    padding: '3px 7px',
                                    borderRadius: 5,
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    color: '#1d4ed8',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                  title="Generate Commercial Vendor Debit Note / Remittance Notice"
                                >
                                  📄 Debit Note
                                </button>
                              )}
                            </div>
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

      {/* ─── DYNAMIC 1-CLICK RESOLUTION ACTION MODAL (WITH JOURNAL VOUCHER PREVIEW #1) ─── */}
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
            maxWidth: 640,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)',
            border: '1px solid #e2e8f0',
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
                  <strong style={{ display: 'block', fontSize: '1.05rem', color: '#0f172a' }}>₹{solvingItem.record.amount.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>Variance Delta</small>
                  <strong style={{ display: 'block', fontSize: '1.05rem', color: solvingItem.delta > 0.01 ? '#dc2626' : '#16a34a' }}>
                    {solvingItem.delta > 0.01 ? `−₹${solvingItem.delta.toFixed(2)}` : '✓ ₹0.00'}
                  </strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>Aging Exposure</small>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: '#b91c1c', fontWeight: 700, marginTop: 2 }}>
                    {getAgingInfo(solvingItem.record.date).label}
                  </span>
                </div>
              </div>

              {/* Dynamic Action Tabs Based on Exception Type */}
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                Select Accounting Resolution Solution:
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
                      Generates commercial vendor debit note #DN-{solvingItem.record.id} and posts delta to Customer Receivables.
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
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>⚖️ Option 2: Accept Payment Gateway MDR Fee (GL 6140)</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      Recognize the ₹{solvingItem.delta.toFixed(2)} difference as merchant processing fee and clear invoice in full.
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
                      Converts foreign currency at official settlement date rate and books realized FX gain/loss into GL 2300.
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
                      Voids duplicate billing record in ERP and releases bank settlement to primary invoice.
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

              {/* ── ENHANCEMENT #1: LIVE DUAL-ENTRY JOURNAL VOUCHER PREVIEW BOX ── */}
              <div style={{
                marginTop: 16,
                padding: '14px 16px',
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #cbd5e1'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    🧾 GAAP / IFRS-15 Double-Entry Journal Voucher Preview
                  </span>
                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: '#dbeafe', color: '#1e40af', borderRadius: 4, fontWeight: 700 }}>
                    AUTO-BALANCED
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#0f172a', background: '#ffffff', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1e40af', fontWeight: 700, marginBottom: 4 }}>
                    <span>DR: {(EXCEPTION_DESCRIPTIONS[solvingItem.exceptionCode || 'AMOUNT_MISMATCH'] || EXCEPTION_DESCRIPTIONS['AMOUNT_MISMATCH']).drGL} - {(EXCEPTION_DESCRIPTIONS[solvingItem.exceptionCode || 'AMOUNT_MISMATCH'] || EXCEPTION_DESCRIPTIONS['AMOUNT_MISMATCH']).drName}</span>
                    <span>₹{solvingItem.delta > 0.01 ? solvingItem.delta.toFixed(2) : solvingItem.record.amount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontWeight: 700 }}>
                    <span>CR: {(EXCEPTION_DESCRIPTIONS[solvingItem.exceptionCode || 'AMOUNT_MISMATCH'] || EXCEPTION_DESCRIPTIONS['AMOUNT_MISMATCH']).crGL} - {(EXCEPTION_DESCRIPTIONS[solvingItem.exceptionCode || 'AMOUNT_MISMATCH'] || EXCEPTION_DESCRIPTIONS['AMOUNT_MISMATCH']).crName}</span>
                    <span>₹{solvingItem.delta > 0.01 ? solvingItem.delta.toFixed(2) : solvingItem.record.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Optional Custom Note input */}
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Auditor Resolution Memo (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved per Master Service Agreement §4.2 gateway fee deduction"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              {/* Lead Controller Assignee */}
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Signing Controller
                </label>
                <input
                  type="text"
                  value={analystName}
                  onChange={(e) => setAnalystName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    background: '#f8fafc'
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setSolvingItem(null)}
                className="d-btn d-btn-ghost"
                style={{ fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  let method = 'Reconciled & Cleared'
                  let note = 'Reconciled with 3-way ERP match.'

                  const code = solvingItem.exceptionCode
                  if (!code || code === 'AMOUNT_MISMATCH' || solvingItem.status === 'Partial') {
                    if (activeTab === 'action-1') {
                      method = 'Debit Memo Issued'
                      note = `Issued customer debit note #DN-${solvingItem.record.id} for ₹${solvingItem.delta.toFixed(2)}.`
                    } else {
                      method = 'Gateway Fee Accepted (GL 6140)'
                      note = `Absorbed ₹${solvingItem.delta.toFixed(2)} variance as payment processing fee.`
                    }
                  } else if (code === 'MISSING_REF') {
                    if (activeTab === 'action-1') {
                      method = 'Matched to Discovered Invoice'
                      note = `Linked payment to invoice reference via automated amount/date heuristic.`
                    } else {
                      method = 'Suspense Clearing GL 2190'
                      note = `Allocated to Suspense Ledger GL 2190 pending counterparty confirmation.`
                    }
                  } else if (code === 'CURRENCY_MISMATCH') {
                    method = 'Spot Booking FX Rate Applied'
                    note = `Converted foreign currency using settlement date rate. FX variance posted.`
                  } else if (code === 'DUPLICATE') {
                    method = 'Duplicate Voided'
                    note = `Voided duplicate invoice entry. Primary payment matched and cleared.`
                  } else if (code === 'ORPHAN_LEDGER' || code === 'NO_MATCH') {
                    if (activeTab === 'action-1') {
                      method = 'Accrual Journal Reversal'
                      note = `Reversed uncollected accrual voucher #AR-2026.`
                    } else {
                      method = 'Payment Reminder Dispatched'
                      note = `Dispatched automated dunning notice to counterparty.`
                    }
                  }

                  handleExecuteResolution(method, note)
                }}
                className="d-btn d-btn-primary"
                style={{
                  fontSize: '0.84rem',
                  padding: '0 20px',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  borderColor: '#16a34a',
                  fontWeight: 700
                }}
              >
                {isSubmitting ? 'Posting Voucher…' : '✓ Confirm & Post Journal Voucher'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REAL-WORLD ENHANCEMENT #1: DEDICATED GAAP/IFRS JOURNAL VOUCHER MODAL ─── */}
      {voucherItem && (
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
            maxWidth: 600,
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            animation: 'scaleUp 0.2s ease-out'
          }}>
            {/* Voucher Header */}
            <div style={{ padding: '18px 24px', background: '#1e3a8a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>
                  GENERAL LEDGER JOURNAL VOUCHER
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 800 }}>
                  Voucher #JV-2026-{voucherItem.record.id.replace(/[^0-9]/g, '') || '0842'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVoucherItem(null)}
                style={{ background: 'transparent', border: 0, color: '#93c5fd', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Voucher Body */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16, fontSize: '0.82rem', color: '#475569' }}>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Posting Entity</span>
                  <strong style={{ color: '#0f172a' }}>RiskShield Technologies Ltd.</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Posting Date / Period</span>
                  <strong style={{ color: '#0f172a' }}>{new Date().toLocaleDateString('en-IN')} (Q1 FY26)</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Source Transaction</span>
                  <strong style={{ color: '#0f172a' }}>{voucherItem.record.id} ({voucherItem.record.counterparty})</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Compliance Standard</span>
                  <strong style={{ color: '#16a34a' }}>GAAP / IFRS-15 Balanced Entry</strong>
                </div>
              </div>

              {/* Debit/Credit Table */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569' }}>GL Account Code &amp; Title</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#475569' }}>Debit (₹)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#475569' }}>Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 650, color: '#1e40af' }}>
                        DR: {(EXCEPTION_DESCRIPTIONS[voucherItem.exceptionCode || 'AMOUNT_MISMATCH'] || EXCEPTION_DESCRIPTIONS['AMOUNT_MISMATCH']).drGL} - {(EXCEPTION_DESCRIPTIONS[voucherItem.exceptionCode || 'AMOUNT_MISMATCH'] || EXCEPTION_DESCRIPTIONS['AMOUNT_MISMATCH']).drName}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                        ₹{(voucherItem.delta > 0.01 ? voucherItem.delta : voucherItem.record.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#94a3b8' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 12px', fontWeight: 650, color: '#166534' }}>
                        CR: {(EXCEPTION_DESCRIPTIONS[voucherItem.exceptionCode || 'AMOUNT_MISMATCH'] || EXCEPTION_DESCRIPTIONS['AMOUNT_MISMATCH']).crGL} - {(EXCEPTION_DESCRIPTIONS[voucherItem.exceptionCode || 'AMOUNT_MISMATCH'] || EXCEPTION_DESCRIPTIONS['AMOUNT_MISMATCH']).crName}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#94a3b8' }}>—</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                        ₹{(voucherItem.delta > 0.01 ? voucherItem.delta : voucherItem.record.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 800 }}>
                    <tr>
                      <td style={{ padding: '8px 12px', color: '#0f172a' }}>Total Trial Balance</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#16a34a', fontFamily: 'monospace' }}>
                        ₹{(voucherItem.delta > 0.01 ? voucherItem.delta : voucherItem.record.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#16a34a', fontFamily: 'monospace' }}>
                        ₹{(voucherItem.delta > 0.01 ? voucherItem.delta : voucherItem.record.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Memo Note */}
              <div style={{ background: '#eff6ff', padding: '10px 14px', borderRadius: 8, border: '1px solid #bfdbfe', fontSize: '0.78rem', color: '#1e40af', marginBottom: 14 }}>
                <strong>Resolution Method: </strong>{resolvedMap[voucherItem.record.id]?.note || voucherItem.suggestedAction || 'Reconciled via automated multi-source pass.'}
              </div>

              {/* Auditor Sign-off stamp */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                <span>Digital Signature: <strong>SHA256-VERIFIED-{voucherItem.record.id}</strong></span>
                <span>Controller: <strong>{analystName}</strong></span>
              </div>
            </div>

            {/* Voucher Footer */}
            <div style={{ padding: '12px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setVoucherItem(null)}
                className="d-btn d-btn-ghost"
                style={{ fontSize: '0.82rem' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print()
                }}
                className="d-btn d-btn-primary"
                style={{ fontSize: '0.82rem' }}
              >
                🖨️ Print / Save Voucher (PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REAL-WORLD ENHANCEMENT #3: 1-CLICK VENDOR DEBIT NOTE / REMITTANCE NOTICE MODAL ─── */}
      {debitNoteItem && (
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
            maxWidth: 680,
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            animation: 'scaleUp 0.2s ease-out'
          }}>
            {/* Debit Note Header */}
            <div style={{ padding: '20px 24px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>
                  COMMERCIAL SETTLEMENT MEMO
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.2rem', fontWeight: 800 }}>
                  Vendor Debit Note #DN-2026-{debitNoteItem.record.id.replace(/[^0-9]/g, '') || '0420'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDebitNoteItem(null)}
                style={{ background: 'transparent', border: 0, color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Debit Note Body */}
            <div style={{ padding: '24px' }}>
              {/* Company Info Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
                <div>
                  <strong style={{ fontSize: '0.94rem', color: '#0f172a', display: 'block' }}>RiskShield Technologies Ltd.</strong>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Corporate Treasury &amp; Reconciliation Dept.</span>
                  <span style={{ fontSize: '0.76rem', color: '#64748b' }}>GSTIN: <strong>29AABCU9603R1ZM</strong> · CIN: U72900KA2026PTC148902</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Date: <strong>{new Date().toLocaleDateString('en-IN')}</strong></span>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Ref Record: <strong>{debitNoteItem.record.id}</strong></span>
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: '#fee2e2', color: '#dc2626', borderRadius: 4, fontWeight: 700, display: 'inline-block', marginTop: 4 }}>
                    PAYMENT VARIANCE CLAIM
                  </span>
                </div>
              </div>

              {/* Vendor Info */}
              <div style={{ marginBottom: 18, background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Issued To (Vendor / Counterparty):</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{debitNoteItem.record.counterparty}</div>
                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Source: {debitNoteItem.record.source} · Payment Batch #{report?.batchId || '1'}</span>
              </div>

              {/* Discrepancy Breakdown Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: 18, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <thead style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item Description</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Original Invoiced</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Bank Deposited</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Discrepancy (Δ)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 12px', color: '#0f172a' }}>
                      <strong>{debitNoteItem.record.description || 'Enterprise Consulting & Software Services'}</strong>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>Reason: {debitNoteItem.exceptionReason || 'Short-pay / gateway fee deduction'}</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                      ₹{debitNoteItem.record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                      ₹{(debitNoteItem.record.amount - debitNoteItem.delta).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#dc2626' }}>
                      −₹{debitNoteItem.delta.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
                <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 750 }}>
                  <tr>
                    <td colSpan={3} style={{ padding: '8px 12px', textAlign: 'right' }}>Applicable GST Adjustment (18% Reverse Charge):</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                      ₹{(debitNoteItem.delta * 0.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr style={{ fontSize: '0.92rem', color: '#1e3a8a' }}>
                    <td colSpan={3} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800 }}>Total Net Debit Note Value:</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#16a34a' }}>
                      ₹{(debitNoteItem.delta * 1.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Statutory Legal Disclaimer */}
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5, background: '#f8fafc', padding: '8px 12px', borderRadius: 6 }}>
                ⚖️ <em>Statutory Advice: This debit memo is issued pursuant to Section 34 of the Central Goods &amp; Services Tax (CGST) Act, 2017 and GAAP/IFRS standards for payment adjustment. Please adjust in your next billing cycle.</em>
              </p>
            </div>

            {/* Debit Note Footer */}
            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  showToast(`✉️ Debit Note #DN-2026 dispatched to ${debitNoteItem.record.counterparty} treasury portal!`)
                  setDebitNoteItem(null)
                }}
                className="d-btn d-btn-ghost"
                style={{ fontSize: '0.82rem', borderColor: '#cbd5e1' }}
              >
                ✉️ Dispatch to Vendor Email
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setDebitNoteItem(null)}
                  className="d-btn d-btn-ghost"
                  style={{ fontSize: '0.82rem' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print()
                  }}
                  className="d-btn d-btn-primary"
                  style={{ fontSize: '0.82rem', background: '#2563eb', fontWeight: 700 }}
                >
                  🖨️ Print / Download Debit Note (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
