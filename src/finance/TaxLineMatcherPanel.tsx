import { useState, useMemo } from 'react'
import type { TaxSummary, TaxCategory } from './taxLineMatcher'

interface Props {
  taxSummary: TaxSummary
}

const CATEGORY_THEME: Record<TaxCategory, { bg: string; text: string; border: string; barColor: string }> = {
  'Revenue':             { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', barColor: '#10b981' },
  'Cost of Revenue':     { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', barColor: '#3b82f6' },
  'Operating Expense':   { bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe', barColor: '#8b5cf6' },
  'Capital Expenditure': { bg: '#fffbeb', text: '#92400e', border: '#fde68a', barColor: '#f59e0b' },
  'Foreign Withholding': { bg: '#fdf2f8', text: '#9d174d', border: '#fbcfe8', barColor: '#ec4899' },
  'Exempt':              { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', barColor: '#94a3b8' },
  'Unclassified':        { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', barColor: '#ef4444' },
}

function riskBadge(level: 'Low' | 'Medium' | 'High') {
  if (level === 'Low') {
    return <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 650, background: '#dcfce7', color: '#15803d' }}>Low Risk</span>
  }
  if (level === 'Medium') {
    return <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 650, background: '#fef3c7', color: '#92400e' }}>Medium</span>
  }
  return <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 650, background: '#fee2e2', color: '#991b1b' }}>High Risk</span>
}

export default function TaxLineMatcherPanel({ taxSummary }: Props) {
  const [filterCat, setFilterCat] = useState<string>('ALL')
  const [filterRisk, setFilterRisk] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showJurisdictions, setShowJurisdictions] = useState<boolean>(false)

  const filteredItems = useMemo(() => {
    return taxSummary.lineItems.filter(item => {
      if (filterCat !== 'ALL' && item.taxCategory !== filterCat) return false
      if (filterRisk !== 'ALL' && item.riskLevel !== filterRisk) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesId = item.recordId.toLowerCase().includes(q)
        const matchesCp = item.counterparty.toLowerCase().includes(q)
        const matchesGl = item.glCode.toLowerCase().includes(q)
        if (!matchesId && !matchesCp && !matchesGl) return false
      }
      return true
    })
  }, [taxSummary.lineItems, filterCat, filterRisk, searchQuery])

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Record ID', 'GL Code', 'Counterparty', 'Category', 'Jurisdiction', 'Amount (INR)', 'Tax Rate', 'Tax Obligation', 'Tax Savings', 'Risk Level', 'Risk Reason']
    const rows = filteredItems.map(item => [
      item.recordId,
      item.glCode,
      `"${item.counterparty.replace(/"/g, '""')}"`,
      item.taxCategory,
      item.taxJurisdiction,
      item.amount.toFixed(2),
      `${(item.taxRate * 100).toFixed(1)}%`,
      item.taxAmount.toFixed(2),
      item.taxSavings.toFixed(2),
      item.riskLevel,
      `"${item.riskReason.replace(/"/g, '""')}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `tax_classification_schedule_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <section className="fin-card" style={{ marginTop: 24 }} aria-label="Tax-line matcher">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="fin-card-hd" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 className="fin-card-title">Tax Classification &amp; GL Line Matcher</h2>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 999 }}>
              {taxSummary.automationRate.toFixed(1)}% Auto-Categorized
            </span>
          </div>
          <p className="fin-card-desc">
            Automated corporate tax mapping · Section 32/195 deduction classification · Cross-border treaty WHT · Chart of Accounts sync
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowJurisdictions(!showJurisdictions)}
            className="fin-btn fin-btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            {showJurisdictions ? 'Hide Jurisdictions' : '🌐 Jurisdictions & Treaties'}
          </button>
          <button
            onClick={handleExportCSV}
            className="fin-btn fin-btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            📥 Export Tax CSV
          </button>
        </div>
      </div>

      {/* ─── Executive KPI Cards ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Gross Revenue</span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
            ₹{taxSummary.totalGrossRevenue.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>Standard 25% Tax Base</span>
        </div>

        <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Allowable Deductions</span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2563eb', marginTop: 2 }}>
            ₹{taxSummary.totalDeductions.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.68rem', color: '#3b82f6', fontWeight: 600 }}>COGS + Operating Expenses</span>
        </div>

        <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tax Shield Savings</span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16a34a', marginTop: 2 }}>
            ₹{taxSummary.totalTaxSavings.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600 }}>25% Tax Saved via OPEX</span>
        </div>

        <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Net Tax Provision</span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#d97706', marginTop: 2 }}>
            ₹{taxSummary.estimatedTaxLiability.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 600 }}>Effective: {taxSummary.effectiveTaxRate.toFixed(1)}%</span>
        </div>

        <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Foreign Treaty WHT</span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#9333ea', marginTop: 2 }}>
            ₹{taxSummary.totalForeignWithholding.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.68rem', color: '#9333ea', fontWeight: 600 }}>15% Cross-Border Sec. 195</span>
        </div>
      </div>

      {/* ─── Segmented Horizontal Distribution Bar ─────────────────────────── */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tax Allocation Distribution ({taxSummary.lineItems.length} Total Records)
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Processed in <strong>{taxSummary.processingTimeMs}ms</strong>
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: '#e2e8f0', gap: 1 }}>
          {taxSummary.categoryBreakdown.filter(c => c.count > 0).map(cat => {
            const theme = CATEGORY_THEME[cat.category] || CATEGORY_THEME['Unclassified']
            return (
              <div
                key={cat.category}
                title={`${cat.category}: ${cat.percentage.toFixed(1)}% (${cat.count} records)`}
                style={{
                  width: `${cat.percentage}%`,
                  background: theme.barColor,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onClick={() => setFilterCat(filterCat === cat.category ? 'ALL' : cat.category)}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10, fontSize: '0.72rem' }}>
          {taxSummary.categoryBreakdown.filter(c => c.count > 0).map(cat => {
            const theme = CATEGORY_THEME[cat.category] || CATEGORY_THEME['Unclassified']
            return (
              <div
                key={cat.category}
                onClick={() => setFilterCat(filterCat === cat.category ? 'ALL' : cat.category)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', opacity: filterCat === 'ALL' || filterCat === cat.category ? 1 : 0.4 }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 2, background: theme.barColor, display: 'inline-block' }} />
                <span style={{ color: '#334155', fontWeight: 600 }}>{cat.category}</span>
                <span style={{ color: '#64748b' }}>({cat.percentage.toFixed(1)}%)</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Jurisdictions Breakdown Drawer (Optional Expand) ──────────────── */}
      {showJurisdictions && (
        <div style={{ padding: '16px 24px', background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            🌐 Tax Jurisdictions &amp; Cross-Border Treaty Mapping
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {taxSummary.jurisdictionBreakdown.map(jur => (
              <div key={jur.jurisdiction} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.76rem' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{jur.jurisdiction}</div>
                <div style={{ color: '#64748b', marginTop: 2 }}>
                  {jur.count} records · Total: ₹{Math.round(jur.totalAmount).toLocaleString('en-IN')}
                </div>
                <div style={{ color: '#2563eb', fontWeight: 600, marginTop: 2 }}>
                  {jur.whtRate > 0 ? `WHT Due (15%): ₹${Math.round(jur.taxAmount).toLocaleString('en-IN')}` : 'Domestic Direct Tax'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Category Filter Cards ─────────────────────────────────────────── */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#fafbfc' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Interactive Category Cards (Click to Filter)
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search record, counterparty, GL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.76rem', width: 220 }}
            />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#fff', color: '#334155' }}
            >
              <option value="ALL">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk ({taxSummary.highRiskCount})</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
          {taxSummary.categoryBreakdown.map(cat => {
            const colors = CATEGORY_THEME[cat.category] || CATEGORY_THEME['Unclassified']
            const isSelected = filterCat === cat.category
            return (
              <div
                key={cat.category}
                onClick={() => setFilterCat(isSelected ? 'ALL' : cat.category)}
                style={{
                  padding: '10px 12px',
                  background: colors.bg,
                  border: `1px solid ${isSelected ? '#2563eb' : colors.border}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 0 2px #2563eb' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: colors.text }}>
                    {cat.category}
                  </span>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#64748b' }}>
                    {cat.glCode.split('-')[0]}
                  </span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  ₹{Math.round(cat.totalAmount / 1000).toLocaleString('en-IN')}k
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>
                  {cat.count} txns · {cat.taxSavings > 0 ? `₹${(cat.taxSavings / 1000).toFixed(0)}k saved` : `₹${(cat.taxAmount / 1000).toFixed(0)}k tax`}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Tax Line Items Table ──────────────────────────────────────────── */}
      <div className="fin-rec-wrap" style={{ maxHeight: 420, overflowY: 'auto' }}>
        <table className="fin-tbl">
          <thead>
            <tr>
              <th>Record ID</th>
              <th>GL Account</th>
              <th>Counterparty</th>
              <th>Tax Category</th>
              <th>Jurisdiction</th>
              <th style={{ textAlign: 'right' }}>Amount (INR)</th>
              <th style={{ textAlign: 'right' }}>Tax Rate</th>
              <th style={{ textAlign: 'right' }}>Tax Due / Shield</th>
              <th>Compliance Risk</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.slice(0, 100).map(item => {
              const c = CATEGORY_THEME[item.taxCategory] || CATEGORY_THEME['Unclassified']
              return (
                <tr key={item.recordId}>
                  <td className="fin-mono">{item.recordId}</td>
                  <td>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700, background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, color: '#475569' }}>
                      {item.glCode}
                    </span>
                  </td>
                  <td style={{ color: '#334155', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.counterparty}
                  </td>
                  <td>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                      {item.taxCategory}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {item.taxJurisdiction}
                  </td>
                  <td className="fin-mono" style={{ textAlign: 'right' }}>
                    ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="fin-mono" style={{ textAlign: 'right', color: '#64748b' }}>
                    {item.isDeductible ? 'Deductible' : `${(item.taxRate * 100).toFixed(0)}%`}
                  </td>
                  <td className="fin-mono" style={{ textAlign: 'right', fontWeight: 700, color: item.isDeductible ? '#16a34a' : (item.taxAmount > 0 ? '#b45309' : '#64748b') }}>
                    {item.isDeductible ? `−₹${item.taxSavings.toFixed(0)} (Shield)` : `+₹${item.taxAmount.toFixed(0)}`}
                  </td>
                  <td>
                    <div title={item.riskReason}>
                      {riskBadge(item.riskLevel)}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '0.76rem', color: '#64748b' }}>
        <span>Showing {Math.min(100, filteredItems.length)} of {filteredItems.length} filtered items ({taxSummary.lineItems.length} total batch records)</span>
        <span>Corporate Tax Standard: <strong>CBDT Section 28 / DTAA 195 (25.0% Baseline)</strong></span>
      </div>
    </section>
  )
}
