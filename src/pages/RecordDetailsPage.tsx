import { useState } from 'react'
import TopNav from '../dashboard/TopNav'
import Sidebar from '../dashboard/Sidebar'
import { useFinanceContext } from '../finance/FinanceContext'
import { runReconciliation } from '../finance/reconciliationEngine'
import { runMLScoring } from '../finance/mlScorer'
import { runTaxLineMatcher } from '../finance/taxLineMatcher'
import { updateRecordInSupabase } from '../finance/supabaseClient'
import type { MatchResult } from '../finance/reconciliationEngine'
import '../dashboard/dashboard.css'
import '../finance/finance.css'

const ANALYSTS = [
  'Alex Morgan (Lead Controller)',
  'Sarah Chen (Risk & Fraud Specialist)',
  'David Miller (Treasury & Settlement)',
  'Elena Rostova (Tax Compliance Analyst)',
  'Marcus Vance (Senior Auditor)',
]

export default function RecordDetailsPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const ctx = useFinanceContext()
  const report = ctx.report || runReconciliation()
  const mlResult = ctx.mlResult || runMLScoring(report.results.map(r => r.record))
  const taxSummary = runTaxLineMatcher(report)

  // Get selected ID from hash params if available (e.g. #/record-details?id=B1-BNK-016)
  const hash = window.location.hash
  const paramId = hash.includes('id=') ? decodeURIComponent(hash.split('id=')[1].split('&')[0]) : null

  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    paramId && report.results.some(r => r.record.id === paramId)
      ? paramId
      : report.results[0]?.record.id || 'B1-BNK-001'
  )

  // Local state for actions
  const [resolvedStatus, setResolvedStatus] = useState<Record<string, boolean>>({})
  const [assignedAnalyst, setAssignedAnalyst] = useState<Record<string, string>>({})
  const [auditNotes, setAuditNotes] = useState<Record<string, string>>({})
  const [newNote, setNewNote] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedAnalyst, setSelectedAnalyst] = useState(ANALYSTS[0])

  const selectedRow: MatchResult | undefined = report.results.find(
    r => r.record.id === selectedRecordId
  ) || report.results[0]

  if (!selectedRow) {
    return (
      <div className="dash-app fin-page">
        <TopNav onMenu={() => setMenuOpen(true)} />
        <div className="d-shell">
          <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} activeId="record-details" />
          <main className="d-main" style={{ padding: 40, textAlign: 'center' }}>
            <h2>No Records Available</h2>
            <p>Please ingest a CSV batch first.</p>
            <a href="#/reconciliation" className="d-btn d-btn-primary">Go to Reconciliation</a>
          </main>
        </div>
      </div>
    )
  }

  const rec = selectedRow.record
  const ldg = selectedRow.matchedLedger
  const ml = mlResult.scoreMap.get(rec.id)
  const taxItem = taxSummary.lineItems.find(t => t.recordId === rec.id)

  const isResolved = resolvedStatus[rec.id] ?? (selectedRow.status === 'Exact')
  const currentAssignee = assignedAnalyst[rec.id] ?? (selectedRow.status === 'Exception' ? 'Unassigned (Needs Review)' : 'Auto-Assigned (System)')
  const currentNotes = auditNotes[rec.id] || ''

  // Derived 3-way data points
  const invoiceAmount = rec.source === 'INVOICE' ? rec.amount : (ldg ? ldg.amount : rec.amount)
  const bankAmount = rec.source === 'BANK'
    ? rec.amount
    : selectedRow.status === 'Exact'
    ? rec.amount
    : selectedRow.status === 'Fuzzy' || selectedRow.status === 'Partial'
    ? Math.max(0, rec.amount - selectedRow.delta)
    : null

  const ledgerAmount = ldg ? ldg.amount : (rec.source === 'LEDGER' ? rec.amount : null)

  function handleResolveToggle() {
    const nextVal = !isResolved
    setResolvedStatus(prev => ({
      ...prev,
      [rec.id]: nextVal
    }))
    updateRecordInSupabase(rec.id, { is_resolved: nextVal })
  }

  function handleSaveAssignment() {
    setAssignedAnalyst(prev => ({
      ...prev,
      [rec.id]: selectedAnalyst
    }))
    setShowAssignModal(false)
    updateRecordInSupabase(rec.id, { assigned_analyst: selectedAnalyst })
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!newNote.trim()) return
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const formatted = currentNotes
      ? `${currentNotes}\n[${timestamp}] ${newNote.trim()}`
      : `[${timestamp}] ${newNote.trim()}`
    setAuditNotes(prev => ({
      ...prev,
      [rec.id]: formatted
    }))
    setNewNote('')
    updateRecordInSupabase(rec.id, { resolution_notes: formatted })
  }

  return (
    <div className="dash-app fin-page">
      <TopNav onMenu={() => setMenuOpen(true)} />
      <div className="d-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} activeId="reconciliation" />
        <main className="d-main">

          {/* Header */}
          <header className="d-pagehead" style={{ flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ marginBottom: 6 }}>
                <a
                  href="#/reconciliation"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#2563eb',
                    textDecoration: 'none',
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: '#eff6ff',
                    border: '1px solid #dbeafe',
                    transition: 'all 0.15s',
                  }}
                >
                  ← Back to Reconciliation
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0 }}>Record Details: {rec.id}</h1>
                <span style={{
                  fontSize: '0.74rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                  background: selectedRow.status === 'Exact' ? '#dcfce7' : selectedRow.status === 'Fuzzy' ? '#e0f2fe' : selectedRow.status === 'Partial' ? '#fef3c7' : '#fee2e2',
                  color: selectedRow.status === 'Exact' ? '#15803d' : selectedRow.status === 'Fuzzy' ? '#075985' : selectedRow.status === 'Partial' ? '#92400e' : '#991b1b',
                }}>
                  {selectedRow.status} Match
                </span>
                {isResolved ? (
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#dcfce7', color: '#15803d' }}>
                    ✓ Resolved &amp; Cleared
                  </span>
                ) : (
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#fef2f2', color: '#991b1b' }}>
                    ● Open Action Required
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0' }}>
                3-Way Cross-Verification: Invoice · Bank Statement · General Ledger · AI Anomaly Explanation
              </p>
            </div>

            {/* Quick Record Selector Dropdown */}
            <div className="d-page-actions" style={{ alignItems: 'center', gap: 10 }}>
              <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Select Record:</label>
              <select
                value={selectedRecordId}
                onChange={(e) => {
                  setSelectedRecordId(e.target.value)
                  window.location.hash = `#/record-details?id=${e.target.value}`
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  maxWidth: 240,
                }}
              >
                {report.results.slice(0, 100).map(r => (
                  <option key={r.record.id} value={r.record.id}>
                    {r.record.id} - {r.record.counterparty} (₹{Math.round(r.record.amount).toLocaleString('en-IN')}) [{r.status}]
                  </option>
                ))}
              </select>
            </div>
          </header>

          {/* Action Toolbar */}
          <div className="fin-card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: '#fafbfc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: '#64748b' }}>Assigned Analyst: </span>
                <strong style={{ color: '#0f172a' }}>{currentAssignee}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Variance Delta: </span>
                <strong style={{ color: selectedRow.delta > 0.01 ? '#dc2626' : '#16a34a' }}>
                  {selectedRow.delta > 0.01 ? `−₹${selectedRow.delta.toFixed(2)}` : '✓ ₹0.00'}
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Tax Liability: </span>
                <strong style={{ color: '#2563eb' }}>
                  ₹{(taxItem?.taxAmount || 0).toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Resolve and Assign Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="d-btn d-btn-ghost"
                onClick={() => setShowAssignModal(true)}
                style={{ fontSize: '0.82rem', height: 36 }}
              >
                👤 Assign Analyst
              </button>
              <button
                type="button"
                className="d-btn d-btn-primary"
                onClick={handleResolveToggle}
                style={{ fontSize: '0.82rem', height: 36, background: isResolved ? '#dcfce7' : undefined, color: isResolved ? '#15803d' : undefined, borderColor: isResolved ? '#86efac' : undefined }}
              >
                {isResolved ? '✓ Marked as Resolved' : '⚡ Resolve & Clear Record'}
              </button>
            </div>
          </div>

          {/* 3-WAY COMPARISON CARDS: INVOICE | BANK STATEMENT | LEDGER */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
            {/* 1. INVOICE CARD */}
            <div className="fin-card" style={{ borderTop: '4px solid #f59e0b', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#b45309' }}>
                  📄 1. Invoice Document
                </span>
                <span style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                  Billing Source
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>
                ₹{invoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Reference / PO:</span>
                  <strong className="fin-mono">{rec.referenceId || 'MISSING'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Customer / Vendor:</span>
                  <strong>{rec.counterparty}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Billing Date:</span>
                  <span className="fin-mono">{rec.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Category:</span>
                  <span>{rec.category}</span>
                </div>
              </div>
            </div>

            {/* 2. BANK STATEMENT CARD */}
            <div className="fin-card" style={{ borderTop: '4px solid #2563eb', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1d4ed8' }}>
                  🏦 2. Bank Statement
                </span>
                <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                  Cash Settlement
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: bankAmount !== null ? '#0f172a' : '#94a3b8', marginBottom: 14 }}>
                {bankAmount !== null ? `₹${bankAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Not Deposited'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Settlement Origin:</span>
                  <strong className="fin-mono">{rec.source === 'BANK' ? rec.id : 'NEFT / RTGS / UPI'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Cleared Currency:</span>
                  <strong>{rec.currency}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Settlement Date:</span>
                  <span className="fin-mono">{rec.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Description:</span>
                  <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rec.description}>{rec.description}</span>
                </div>
              </div>
            </div>

            {/* 3. GENERAL LEDGER CARD */}
            <div className="fin-card" style={{ borderTop: '4px solid #16a34a', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#15803d' }}>
                  📑 3. General Ledger (ERP)
                </span>
                <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                  Golden Truth
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: ledgerAmount !== null ? '#0f172a' : '#94a3b8', marginBottom: 14 }}>
                {ledgerAmount !== null ? `₹${ledgerAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Unbooked Accrual'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Ledger Entry ID:</span>
                  <strong className="fin-mono">{selectedRow.matchedLedgerId || (rec.source === 'LEDGER' ? rec.id : 'NONE')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>GL Account:</span>
                  <strong>{taxItem?.glCode || '4000-REV'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Entry Type:</span>
                  <span style={{ fontWeight: 700, color: rec.type === 'CREDIT' ? '#16a34a' : '#dc2626' }}>{rec.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Posting Date:</span>
                  <span className="fin-mono">{ldg ? ldg.date : rec.date}</span>
                </div>
              </div>
            </div>
          </div>

          {/* DIFFERENCE HIGHLIGHT BOX */}
          <div className="fin-card" style={{ padding: '20px 24px', marginBottom: 20, background: selectedRow.delta > 0.01 ? '#fff7ed' : '#f0fdf4', border: selectedRow.delta > 0.01 ? '1px solid #fed7aa' : '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.6rem' }}>{selectedRow.delta > 0.01 ? '⚠️' : '✅'}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: selectedRow.delta > 0.01 ? '#9a3412' : '#15803d', fontWeight: 800 }}>
                    Difference Highlight: {selectedRow.delta > 0.01 ? `Variance of −₹${selectedRow.delta.toFixed(2)} (${(selectedRow.deltaPct * 100).toFixed(1)}%)` : 'Exact Balance Match (₹0.00 Variance)'}
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: selectedRow.delta > 0.01 ? '#c2410c' : '#166534' }}>
                    {selectedRow.delta > 0.01
                      ? `Invoice (₹${invoiceAmount.toFixed(2)}) differs from Bank Settlement (₹${(bankAmount || 0).toFixed(2)}) by ₹${selectedRow.delta.toFixed(2)}`
                      : 'All three sources (Invoice, Bank Statement, General Ledger) agree 100% on currency, amount, and reference.'}
                  </p>
                </div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: selectedRow.delta > 0.01 ? '#dc2626' : '#16a34a' }}>
                {selectedRow.delta > 0.01 ? `−₹${selectedRow.delta.toFixed(2)}` : '✓ ₹0.00'}
              </div>
            </div>
          </div>

          {/* EXPLANATION & SUGGESTED RESOLUTION (2-COL) */}
          <div className="fin-two-col" style={{ marginBottom: 20 }}>
            {/* 1. EXPLANATION */}
            <div className="fin-card" style={{ padding: '22px' }}>
              <h3 className="fin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span>🔍</span> AI Root-Cause Explanation
              </h3>
              <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.6, background: '#f8fafc', padding: '14px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#0f172a' }}>
                  {selectedRow.exceptionReason || 'Standard transaction matching Pass 1 Exact verification rules with zero discrepancy.'}
                </p>
                {ml && ml.explanation.length > 0 && (
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#475569', fontSize: '0.8rem' }}>
                    {ml.explanation.map((exp, i) => (
                      <li key={i}>{exp}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 10, fontSize: '0.76rem', color: '#64748b' }}>
                <span>Recon Pass: <strong>Pass {selectedRow.pass ?? 'None'}</strong></span>
                <span>•</span>
                <span>ML Anomaly Score: <strong>{ml?.anomalyScore ?? 0}/100</strong></span>
                <span>•</span>
                <span>Tax Risk: <strong>{taxItem?.riskLevel ?? 'Low'}</strong></span>
              </div>
            </div>

            {/* 2. SUGGESTED RESOLUTION */}
            <div className="fin-card" style={{ padding: '22px' }}>
              <h3 className="fin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span>💡</span> Suggested Resolution Workflow
              </h3>
              <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.6, background: '#eff6ff', padding: '14px 16px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#1e40af' }}>
                  Recommended Action:
                </p>
                <p style={{ margin: '6px 0 0', color: '#1e3a8a', fontSize: '0.84rem' }}>
                  {selectedRow.suggestedAction || 'Post cleared transaction to general ledger and mark invoice as fully paid.'}
                </p>
              </div>

              <div style={{ marginTop: 16 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Resolution Steps:</span>
                <ol style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                  <li>Verify counterparty agreement and fee deduction schedule.</li>
                  <li>Record debit/credit adjustment memo for variance delta.</li>
                  <li>Click <strong>Resolve &amp; Clear Record</strong> to update executive KPI ledger.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* AUDIT NOTES & ACTIVITY TRAIL */}
          <div className="fin-card" style={{ padding: '22px' }}>
            <h3 className="fin-card-title" style={{ marginBottom: 14 }}>
              📝 Controller Audit Notes &amp; Activity Log
            </h3>
            {currentNotes ? (
              <pre style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: 8, fontSize: '0.82rem', fontFamily: 'inherit', whiteSpace: 'pre-wrap', color: '#334155', marginBottom: 14 }}>
                {currentNotes}
              </pre>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 14px' }}>
                No custom audit notes recorded for this item yet.
              </p>
            )}

            <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                placeholder="Add audit note (e.g. 'Spoke with vendor, agreed on 0.9% wire fee deduction')..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
              <button type="submit" className="d-btn d-btn-ghost" style={{ fontSize: '0.82rem' }}>
                + Add Note
              </button>
            </form>
          </div>

        </main>
      </div>

      {/* ASSIGN ANALYST MODAL */}
      {showAssignModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
          display: 'grid', placeItems: 'center', zIndex: 9999, padding: 20,
        }}>
          <div className="fin-card" style={{ width: '100%', maxWidth: 460, padding: 24, background: '#fff' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 800 }}>Assign Case to Analyst</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: '#64748b' }}>
              Assign record <strong>{rec.id}</strong> ({rec.counterparty}) for exception review and dispute resolution.
            </p>

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Select Team Member:
            </label>
            <select
              value={selectedAnalyst}
              onChange={(e) => setSelectedAnalyst(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.86rem', marginBottom: 20 }}
            >
              {ANALYSTS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="d-btn d-btn-ghost"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="d-btn d-btn-primary"
                onClick={handleSaveAssignment}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
