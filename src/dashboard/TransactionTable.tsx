import { useState } from 'react'
import { useFinanceContext } from '../finance/FinanceContext'

function reconBadgeStyle(status: string): { bg: string; color: string } {
  if (status === 'Exact')   return { bg: '#dcfce7', color: '#15803d' }
  if (status === 'Fuzzy')   return { bg: '#e0f2fe', color: '#075985' }
  if (status === 'Partial') return { bg: '#ede9fe', color: '#6d28d9' }
  return { bg: '#fee2e2', color: '#b91c1c' }
}

export default function TransactionTable() {
  const { report, mlResult } = useFinanceContext()
  const showFinance = !!(report && mlResult)
  const [actionedIds, setActionedIds] = useState<Set<string>>(new Set())

  function handleRowAction(id: string) {
    setActionedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Top 15 records sorted by ML anomaly score descending
  const financeRows = showFinance && report
    ? [...report.results]
        .sort((a, b) => {
          const sa = mlResult?.scoreMap.get(a.record.id)?.anomalyScore ?? 0
          const sb = mlResult?.scoreMap.get(b.record.id)?.anomalyScore ?? 0
          return sb - sa
        })
        .slice(0, 15)
    : []

  return (
    <section className="d-card d-table-card" id="transactions" aria-label="Transactions">
      <div className="d-card-head">
        <div>
          <h2>Multi-Source Reconciled Records</h2>
          <p>
            {showFinance
              ? `Reconciled entries across Bank statements, Invoices, and General Ledger · ${report?.batchId ?? 'Live'}`
              : 'No reconciled records ingested yet — 0 active'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a
            href="#/reconciliation"
            className="d-btn d-btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            {showFinance ? 'Full Ingestion →' : '📁 Upload CSV & Reconcile'}
          </a>
        </div>
      </div>

      <div className="d-table-wrap">
        {/* ── Finance mode table ──────────────────────────────────────────── */}
        {showFinance ? (
          <table className="d-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Bank Source</th>
                <th>Customer/Vendor</th>
                <th style={{ textAlign: 'right' }}>Invoice Amount</th>
                <th style={{ textAlign: 'right' }}>Bank Amount</th>
                <th style={{ textAlign: 'right' }}>Ledger Amount</th>
                <th>Ledger Entry ID</th>
                <th style={{ textAlign: 'right' }}>Difference</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>AI Confidence (%)</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {financeRows.map((row) => {
                const rStyle = reconBadgeStyle(row.status)
                const isActioned = actionedIds.has(row.record.id)

                const bankAmount = row.record.source === 'BANK'
                  ? row.record.amount
                  : row.status === 'Exact'
                  ? row.record.amount
                  : row.status === 'Fuzzy' || row.status === 'Partial'
                  ? Math.max(0, row.record.amount - row.delta)
                  : null

                const ledgerAmount = row.matchedLedger
                  ? row.matchedLedger.amount
                  : row.record.source === 'LEDGER'
                  ? row.record.amount
                  : null

                return (
                  <tr
                    key={row.record.id}
                    onClick={() => { window.location.hash = `#/record-details?id=${row.record.id}` }}
                    style={{ opacity: isActioned ? 0.6 : 1, cursor: 'pointer' }}
                    title="Click to view 3-way Record Details"
                  >
                    {/* 1. Invoice ID */}
                    <td className="mono">
                      <span
                        style={{ color: '#2563eb', fontWeight: 700 }}
                      >
                        {row.record.id}
                      </span>
                    </td>

                    {/* 2. Bank Source */}
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '1px 7px', borderRadius: 6,
                        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em',
                        background: row.record.source === 'BANK' ? '#dbeafe' : row.record.source === 'LEDGER' ? '#dcfce7' : '#fef3c7',
                        color: row.record.source === 'BANK' ? '#1e40af' : row.record.source === 'LEDGER' ? '#166534' : '#92400e',
                      }}>
                        {row.record.source}
                      </span>
                    </td>

                    {/* 3. Customer/Vendor */}
                    <td style={{ fontWeight: 600, color: '#1e293b', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.record.counterparty}>
                      {row.record.counterparty}
                    </td>

                    {/* 4. Invoice Amount */}
                    <td className="mono" style={{ textAlign: 'right' }}>
                      {row.record.currency !== 'INR' ? row.record.currency + ' ' : '₹'}
                      {row.record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* 5. Bank Amount */}
                    <td className="mono" style={{ textAlign: 'right', color: bankAmount !== null ? '#0f172a' : '#94a3b8' }}>
                      {bankAmount !== null
                        ? `₹${bankAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '—'}
                    </td>

                    {/* 6. Ledger Amount */}
                    <td className="mono" style={{ textAlign: 'right', color: ledgerAmount !== null ? '#0f172a' : '#94a3b8' }}>
                      {ledgerAmount !== null
                        ? `₹${ledgerAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '—'}
                    </td>

                    {/* 7. Ledger Entry ID */}
                    <td className="mono muted">
                      {row.matchedLedgerId ?? (row.record.source === 'LEDGER' ? row.record.id : '—')}
                    </td>

                    {/* 8. Difference */}
                    <td style={{ textAlign: 'right' }}>
                      {row.delta > 0.01 ? (
                        <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '2px 7px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700 }}>
                          −₹{row.delta.toFixed(2)}
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.74rem' }}>
                          ✓ ₹0.00
                        </span>
                      )}
                    </td>

                    {/* 9. Status */}
                    <td>
                      <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 650, background: rStyle.bg, color: rStyle.color }}>
                        {row.status}
                      </span>
                    </td>

                    {/* 10. AI Confidence (%) */}
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: '0.74rem', fontWeight: 700,
                        background: row.confidence >= 90 ? '#dcfce7' : row.confidence >= 60 ? '#fef3c7' : '#fee2e2',
                        color: row.confidence >= 90 ? '#15803d' : row.confidence >= 60 ? '#92400e' : '#991b1b',
                      }}>
                        {row.confidence}%
                      </span>
                    </td>

                    {/* 11. Action */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRowAction(row.record.id)
                        }}
                        style={{
                          padding: '3px 9px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 650,
                          cursor: 'pointer',
                          border: '1px solid #cbd5e1',
                          background: isActioned ? '#dcfce7' : row.status === 'Exact' ? '#f8fafc' : '#eff6ff',
                          color: isActioned ? '#15803d' : row.status === 'Exact' ? '#64748b' : '#1d4ed8',
                          transition: 'all 0.15s',
                        }}
                      >
                        {isActioned
                          ? '✓ Done'
                          : row.status === 'Exact'
                          ? 'Auto-Cleared'
                          : row.status === 'Fuzzy'
                          ? 'Review Fee'
                          : row.status === 'Partial'
                          ? 'Debit Memo'
                          : 'Investigate'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          /* ── Zero state when no records have been ingested ─────────────────── */
          <table className="d-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Bank Source</th>
                <th>Customer/Vendor</th>
                <th style={{ textAlign: 'right' }}>Invoice Amount</th>
                <th style={{ textAlign: 'right' }}>Bank Amount</th>
                <th style={{ textAlign: 'right' }}>Ledger Amount</th>
                <th>Ledger Entry ID</th>
                <th style={{ textAlign: 'right' }}>Difference</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>AI Confidence (%)</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>📁</div>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                    No Reconciled Records Ingested Yet (0 Active)
                  </p>
                  <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#94a3b8' }}>
                    All metrics and transaction tables are at zero baseline. Upload a CSV batch to populate live entries.
                  </p>
                  <a href="#/reconciliation" className="d-btn d-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.82rem', height: 36 }}>
                    📁 Upload CSV &amp; Reconcile
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
