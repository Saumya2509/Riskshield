import { useState } from 'react'
import TopNav from '../dashboard/TopNav'
import Sidebar from '../dashboard/Sidebar'
import { useFinanceContext } from '../finance/FinanceContext'
import { runReconciliation } from '../finance/reconciliationEngine'
import '../dashboard/dashboard.css'
import '../finance/finance.css'

const EXCEPTION_DESCRIPTIONS: Record<string, { label: string; action: string; badgeColor: { bg: string; text: string } }> = {
  AMOUNT_MISMATCH: {
    label: 'Amount Mismatch / Short Pay',
    action: 'Issue debit memo to counterparty or request credit note for variance',
    badgeColor: { bg: '#fee2e2', text: '#991b1b' },
  },
  MISSING_REF: {
    label: 'Missing Reference ID',
    action: 'Contact remitter / bank to retrieve invoice or PO reference number',
    badgeColor: { bg: '#ffedd5', text: '#9a3412' },
  },
  DUPLICATE: {
    label: 'Duplicate Invoice / Billing',
    action: 'Hold payment and verify duplicate bill against previously cleared entries',
    badgeColor: { bg: '#fef3c7', text: '#92400e' },
  },
  CURRENCY_MISMATCH: {
    label: 'Foreign Currency Discrepancy',
    action: 'Apply daily spot booking FX rate or request USD denominated invoice',
    badgeColor: { bg: '#ede9fe', text: '#6d28d9' },
  },
  DATE_WINDOW_EXCEEDED: {
    label: 'Settlement Lag > 5 Days',
    action: 'Verify transaction period and adjust accounting period cutoff',
    badgeColor: { bg: '#e0f2fe', text: '#0369a1' },
  },
  NO_MATCH: {
    label: 'Unmatched External Deposit',
    action: 'Investigate remitter origin or post to suspense ledger account',
    badgeColor: { bg: '#fee2e2', text: '#b91c1c' },
  },
  ORPHAN_LEDGER: {
    label: 'Orphan Ledger Entry',
    action: 'Chase counterparty for payment receipt or reverse accrual',
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
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())

  const allExceptions = report.exceptionList

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

  function toggleResolved(id: string) {
    setResolvedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Count by code
  const codeCounts = allExceptions.reduce((acc, e) => {
    const c = e.exceptionCode || 'AMOUNT_MISMATCH'
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalOpenAmount = allExceptions
    .filter(e => !resolvedIds.has(e.record.id))
    .reduce((s, e) => s + e.record.amount, 0)

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
                Exceptions Management
                <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '2px 9px', background: '#fee2e2', color: '#991b1b', borderRadius: 999 }}>
                  {allExceptions.length - resolvedIds.size} Open Issues
                </span>
              </h1>
              <p>
                Unreconciled items · Variance analysis · Dispute resolution workflows · Root-cause classification
              </p>
            </div>
            <div className="d-page-actions">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                  Total Open: <strong style={{ color: '#dc2626' }}>₹{Math.round(totalOpenAmount).toLocaleString('en-IN')}</strong>
                </span>
                <button
                  className="d-btn d-btn-ghost"
                  onClick={() => {
                    const allIds = new Set(allExceptions.map(e => e.record.id))
                    setResolvedIds(allIds)
                  }}
                  type="button"
                >
                  ✓ Mark All Reviewed
                </button>
              </div>
            </div>
          </header>

          {/* Exception Filter Chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => setFilterCode('ALL')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 650,
                background: filterCode === 'ALL' ? '#2563eb' : '#fff',
                color: filterCode === 'ALL' ? '#fff' : '#64748b',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                whiteSpace: 'nowrap',
              }}
            >
              All Exceptions ({allExceptions.length})
            </button>
            {Object.keys(EXCEPTION_DESCRIPTIONS).map((code) => {
              const count = codeCounts[code] || 0
              if (count === 0) return null
              const isSelected = filterCode === code
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setFilterCode(code)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 650,
                    background: isSelected ? '#0f172a' : '#fff',
                    color: isSelected ? '#fff' : '#334155',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {code} ({count})
                </button>
              )
            })}
          </div>

          {/* Search bar */}
          <div style={{ marginBottom: 18 }}>
            <input
              type="search"
              placeholder="Search exceptions by ID, counterparty, or memo…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                maxWidth: 420,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                background: '#fff',
              }}
            />
          </div>

          {/* Exceptions Table */}
          <div className="fin-card">
            <div className="fin-card-hd">
              <div>
                <h2 className="fin-card-title">Active Exception Records</h2>
                <p className="fin-card-desc">
                  Showing {filtered.length} exceptions matching filter
                </p>
              </div>
            </div>

            <div className="fin-rec-wrap" style={{ maxHeight: 520 }}>
              <table className="fin-tbl">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>Status</th>
                    <th>ID</th>
                    <th>Source</th>
                    <th>Counterparty</th>
                    <th>Exception Code</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Variance (Δ)</th>
                    <th>Suggested Action</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => {
                    const isResolved = resolvedIds.has(item.record.id)
                    const code = item.exceptionCode || 'AMOUNT_MISMATCH'
                    const meta = EXCEPTION_DESCRIPTIONS[code] || EXCEPTION_DESCRIPTIONS['NO_MATCH']

                    return (
                      <tr key={item.record.id} style={{ opacity: isResolved ? 0.45 : 1, transition: 'opacity 0.2s' }}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isResolved}
                            onChange={() => toggleResolved(item.record.id)}
                            title="Mark as resolved / cleared"
                          />
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
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                            fontSize: '0.72rem', fontWeight: 700,
                            background: meta.badgeColor.bg, color: meta.badgeColor.text,
                          }}>
                            {code}
                          </span>
                        </td>
                        <td className="fin-mono" style={{ textAlign: 'right' }}>
                          {item.record.currency !== 'INR' ? item.record.currency + ' ' : '₹'}
                          {item.record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="fin-mono" style={{ textAlign: 'right', color: item.delta > 0.01 ? '#dc2626' : '#16a34a' }}>
                          {item.delta > 0.01 ? `−₹${item.delta.toFixed(2)}` : '—'}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: '#475569', maxWidth: 300 }}>
                          {item.suggestedAction || meta.action}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => toggleResolved(item.record.id)}
                            style={{
                              padding: '3px 10px',
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              background: isResolved ? '#dcfce7' : '#fff',
                              color: isResolved ? '#15803d' : '#334155',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {isResolved ? '✓ Resolved' : 'Clear'}
                          </button>
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
    </div>
  )
}
