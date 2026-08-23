import { useState } from 'react'
import TopNav from '../dashboard/TopNav'
import Sidebar from '../dashboard/Sidebar'
import { useFinanceContext } from '../finance/FinanceContext'
import { runReconciliation, type MatchResult } from '../finance/reconciliationEngine'
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

  // Ensure there's a baseline report available
  const report = ctx.report || runReconciliation()
  const [filterCode, setFilterCode] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Active modal state
  const [solvingItem, setSolvingItem] = useState<MatchResult | null>(null)
  const [activeTab, setActiveTab] = useState<string>('action-1')
  const [customInput, setCustomInput] = useState<string>('')
  const [analystName, setAnalystName] = useState<string>('Sarah Chen (Lead Controller)')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  const allExceptions = report.exceptionList
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
  }

  // Save changes and update Multi-Source Reconciliation
  function handleSaveToMultiSource() {
    ctx.saveFixesToMultiSource()
    setSaveSuccessMsg(`Saved! ${resolvedCount} resolved record(s) applied to Multi-Source Reconciliation.`)
    setTimeout(() => setSaveSuccessMsg(null), 6000)
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
                <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '2px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: 999 }}>
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
                  style={{ fontSize: '0.78rem' }}
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
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Search by Record ID (e.g. B2-BNK-019), Counterparty, or Description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>

          {/* Active Exception Records Table */}
          <div className="fin-card">
            <div className="fin-card-hd">
              <div>
                <h2 className="fin-card-title">Active Exception Records</h2>
                <p className="fin-card-desc">
                  Showing {filtered.length} exceptions · Click <strong>⚡ Solve</strong> on any row to apply fix, then click <strong>💾 Save Changes</strong> above
                </p>
              </div>
            </div>

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
                              onClick={() => handleOpenSolveModal(item)}
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
                              onClick={() => handleOpenSolveModal(item)}
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
                                boxShadow: '0 1px 3px rgba(37,99,235,0.3)',
                                transition: 'all 0.15s ease'
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
          </div>

        </main>
      </div>

      {/* ─── INTERACTIVE RESOLUTION ACTION MODAL ──────────────────────────────── */}
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
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            animation: 'scaleUp 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800 }}>⚡ Solve Exception: {solvingItem.record.id}</span>
                  <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.68rem', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
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
                  <small style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>Record Amount</small>
                  <strong style={{ display: 'block', fontSize: '1.1rem', color: '#0f172a' }}>₹{solvingItem.record.amount.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>Variance Delta</small>
                  <strong style={{ display: 'block', fontSize: '1.1rem', color: solvingItem.delta > 0 ? '#dc2626' : '#16a34a' }}>
                    {solvingItem.delta > 0 ? `−₹${solvingItem.delta.toFixed(2)}` : '₹0.00'}
                  </strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>Suggested Remedy</small>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#2563eb', fontWeight: 600, marginTop: 2 }}>
                    {solvingItem.exceptionCode === 'MISSING_REF' ? 'Assign Ref / Suspense' : (solvingItem.exceptionCode === 'CURRENCY_MISMATCH' ? 'Spot FX Booking' : 'Post Debit/Fee Memo')}
                  </span>
                </div>
              </div>

              {/* Action Selection Tabs based on Exception Code */}
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                Select Accounting Resolution Action:
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
                      Generates customer debit note and holds remaining balance until settled.
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
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>⚖️ Option 2: Accept Gateway Fee Write-Off (GL 6200)</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      Recognizes the ₹{solvingItem.delta.toFixed(2)} discrepancy as payment processing / bank MDR fee.
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
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>🔍 Option 1: Link to Discovered Invoice Ref</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      Attach matching invoice/PO number retrieved from customer remitter.
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
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>🏛️ Option 2: Post to Unallocated Suspense Account (GL 2190)</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      Transfers ₹{solvingItem.record.amount.toLocaleString('en-IN')} to suspense ledger pending customer confirmation.
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
                      Converts foreign currency and posts realized FX variance to GL 7100.
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
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>🚫 Option 1: Void Duplicate Billing Entry</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      Marks the duplicate as cancelled and unblocks the primary cleared transaction.
                    </p>
                  </div>
                </div>
              )}

              {/* 5. ORPHAN_LEDGER / NO_MATCH */}
              {(solvingItem.exceptionCode === 'ORPHAN_LEDGER' || solvingItem.exceptionCode === 'NO_MATCH' || solvingItem.exceptionCode === 'DATE_WINDOW_EXCEEDED') && (
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
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>↺ Option 1: Reverse Accrual / Post Journal Entry</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      Reverses uncollected ledger accrual entry for month-end compliance.
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
                  placeholder="e.g., Counterparty confirmed via email ticket #8492..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              {/* Analyst Assignee */}
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Assigned Certifier
                </label>
                <select
                  value={analystName}
                  onChange={(e) => setAnalystName(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#fff' }}
                >
                  <option value="Sarah Chen (Lead Controller)">Sarah Chen (Lead Controller)</option>
                  <option value="Priya Sharma (Senior Auditor)">Priya Sharma (Senior Auditor)</option>
                  <option value="Alex Morgan (Treasury Ops)">Alex Morgan (Treasury Ops)</option>
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
                  if (code === 'MISSING_REF') {
                    if (activeTab === 'action-1') handleExecuteResolution('Ref Linked', 'Attached discovered invoice ref from counterparty remitter')
                    else handleExecuteResolution('Suspense Posted', 'Transferred unallocated funds to Suspense Account GL 2190')
                  } else if (code === 'CURRENCY_MISMATCH') {
                    handleExecuteResolution('FX Spot Converted', 'Applied booking spot FX rate @ ₹83.40; realized FX gain/loss booked')
                  } else if (code === 'DUPLICATE') {
                    handleExecuteResolution('Duplicate Voided', 'Voided duplicate invoice entry #2; primary charge cleared')
                  } else if (code === 'ORPHAN_LEDGER' || code === 'NO_MATCH') {
                    handleExecuteResolution('Accrual Reversed', 'Reversed uncollected accrual journal entry for period close')
                  } else {
                    if (activeTab === 'action-1') handleExecuteResolution('Debit Memo Raised', `Raised debit memo #DM-${solvingItem.record.id.slice(-3)} for ₹${solvingItem.delta.toFixed(2)}`)
                    else handleExecuteResolution('Gateway Fee Accepted', `Booked ₹${solvingItem.delta.toFixed(2)} variance to Gateway MDR Expense GL 6200`)
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
