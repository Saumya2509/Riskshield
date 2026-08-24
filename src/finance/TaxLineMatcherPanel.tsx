import { useState, useMemo } from 'react'
import type { TaxSummary, TaxCategory, TaxLineItem } from './taxLineMatcher'
import { TAX_REGIMES, optimizeTaxShield } from './taxLineMatcher'

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

export default function TaxLineMatcherPanel({ taxSummary: initialTaxSummary }: Props) {
  const [currentSummary, setCurrentSummary] = useState<TaxSummary>(initialTaxSummary)
  const [selectedRegime, setSelectedRegime] = useState<'115BAA' | 'OLD' | '115BAB'>('115BAA')
  const [filterCat, setFilterCat] = useState<string>('ALL')
  const [filterRisk, setFilterRisk] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showJurisdictions, setShowJurisdictions] = useState<boolean>(false)
  const [auditModalItem, setAuditModalItem] = useState<TaxLineItem | null>(null)
  const [optToast, setOptToast] = useState<string | null>(null)

  // Dynamic Regime Rate Calculation
  const regimeMeta = TAX_REGIMES[selectedRegime]
  const effectiveTaxOnNet = Math.round(currentSummary.netTaxableIncome * regimeMeta.rate)
  const dynamicLiability = effectiveTaxOnNet + currentSummary.totalForeignWithholding
  const dynamicTaxSavings = Math.round(currentSummary.totalDeductions * regimeMeta.rate)

  const filteredItems = useMemo(() => {
    return currentSummary.lineItems.filter(item => {
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
  }, [currentSummary.lineItems, filterCat, filterRisk, searchQuery])

  // Run AI Optimization
  function handleRunAIOptimization() {
    const optimized = optimizeTaxShield(currentSummary)
    setCurrentSummary(optimized)
    setOptToast('⚡ AI Tax Optimization Applied! All unclassified & high-risk records mapped to deductible GL accounts.')
    setTimeout(() => setOptToast(null), 6000)
  }

  // Export Styled Excel (.xls) with Colored Headers
  const handleExportExcel = () => {
    const headers = [
      'Record ID',
      'GL Code',
      'Counterparty',
      'GSTIN',
      'Tax Category',
      'Statutory Section Ref',
      'Jurisdiction',
      'Amount (₹)',
      'Tax Savings Shield (₹)',
      'GST ITC Eligibility',
      'TDS Withholding',
      'Risk Level',
      'AI Audit Defense Rationale'
    ]

    const headerHtml = headers
      .map(h => `<th style="background-color: #1e3a8a; color: #ffffff; font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; padding: 8px 12px; border: 1px solid #334155; text-align: left;">${h}</th>`)
      .join('')

    const rowsHtml = filteredItems.map((item, idx) => {
      const bg = item.isDeductible ? '#f0fdf4' : (item.taxCategory === 'Foreign Withholding' ? '#fdf2f8' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc'))
      const statusColor = item.isDeductible ? '#15803d' : '#0f172a'

      return `<tr style="background-color: ${bg};">
        <td style="font-family: 'Courier New', monospace; font-weight: bold; padding: 6px 10px; border: 1px solid #e2e8f0; color: #2563eb;">${item.recordId}</td>
        <td style="font-family: Arial, sans-serif; font-weight: bold; padding: 6px 10px; border: 1px solid #e2e8f0;">${item.glCode}</td>
        <td style="font-family: Arial, sans-serif; font-weight: 600; padding: 6px 10px; border: 1px solid #e2e8f0;">${item.counterparty}</td>
        <td style="font-family: 'Courier New', monospace; font-size: 9pt; padding: 6px 10px; border: 1px solid #e2e8f0;">${item.gstin}</td>
        <td style="font-family: Arial, sans-serif; font-weight: bold; color: ${statusColor}; padding: 6px 10px; border: 1px solid #e2e8f0;">${item.taxCategory}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0; color: #1e40af;">${item.sectionRef}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0;">${item.taxJurisdiction}</td>
        <td style="font-family: Arial, sans-serif; text-align: right; font-weight: bold; padding: 6px 10px; border: 1px solid #e2e8f0;">₹${item.amount.toFixed(2)}</td>
        <td style="font-family: Arial, sans-serif; text-align: right; font-weight: bold; color: #16a34a; padding: 6px 10px; border: 1px solid #e2e8f0;">₹${item.taxSavings.toFixed(2)}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0;">${item.itcEligibility}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0;">${item.tdsRate}</td>
        <td style="font-family: Arial, sans-serif; font-weight: bold; color: ${item.riskLevel === 'Low' ? '#16a34a' : (item.riskLevel === 'Medium' ? '#d97706' : '#dc2626')}; padding: 6px 10px; border: 1px solid #e2e8f0;">${item.riskLevel}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0; color: #475569; font-size: 9pt;">${item.auditDefense}</td>
      </tr>`
    }).join('')

    const excelTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Tax Schedule</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
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
    link.download = `RiskShield_Tax_Schedule_${new Date().toISOString().slice(0, 10)}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = ['Record ID', 'GL Code', 'Counterparty', 'GSTIN', 'Category', 'Section Reference', 'Jurisdiction', 'Amount (INR)', 'Tax Rate', 'Tax Liability', 'Tax Savings Shield', 'ITC Eligibility', 'TDS Rate', 'Risk Level', 'Audit Defense Rationale']
    const rows = filteredItems.map(item => [
      item.recordId,
      item.glCode,
      `"${item.counterparty.replace(/"/g, '""')}"`,
      item.gstin,
      item.taxCategory,
      `"${item.sectionRef.replace(/"/g, '""')}"`,
      item.taxJurisdiction,
      item.amount.toFixed(2),
      `${(item.taxRate * 100).toFixed(1)}%`,
      item.taxAmount.toFixed(2),
      item.taxSavings.toFixed(2),
      item.itcEligibility,
      item.tdsRate,
      item.riskLevel,
      `"${item.auditDefense.replace(/"/g, '""')}"`
    ])
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `RiskShield_Tax_Schedule_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <section className="fin-card" style={{ marginTop: 20 }} aria-label="Tax-line matcher">
      {/* ─── Header & Action Toolbar ───────────────────────────────────────── */}
      <div className="fin-card-hd" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 className="fin-card-title">Tax Classification &amp; GL Line Matcher</h2>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 999 }}>
              {currentSummary.automationRate.toFixed(1)}% Auto-Categorized
            </span>
          </div>
          <p className="fin-card-desc">
            Automated corporate tax mapping · Section 32/37/195 deduction classification · Cross-border treaty WHT · AI Tax Shield Optimization
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* AI OPTIMIZE TAX SHIELD BUTTON */}
          <button
            onClick={handleRunAIOptimization}
            className="d-btn d-btn-primary"
            style={{
              fontSize: '0.82rem',
              height: 36,
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              borderColor: '#6d28d9',
              boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
              color: '#fff',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            ⚡ AI Auto-Optimize Tax Shield
          </button>

          <button
            onClick={() => setShowJurisdictions(!showJurisdictions)}
            className="fin-btn fin-btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px', height: 36 }}
          >
            {showJurisdictions ? 'Hide Treaties' : '🌐 Jurisdictions & Treaties'}
          </button>

          <button
            onClick={handleExportExcel}
            className="d-btn d-btn-primary"
            style={{
              fontSize: '0.82rem',
              height: 36,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              borderColor: '#1e3a8a',
              color: '#ffffff',
              fontWeight: 700
            }}
          >
            📊 Download Excel (.xls)
          </button>

          <button
            onClick={handleExportCSV}
            className="fin-btn fin-btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px', height: 36 }}
          >
            📥 CSV
          </button>
        </div>
      </div>

      {/* AI Optimization Toast */}
      {optToast && (
        <div style={{
          padding: '12px 18px',
          background: '#faf5ff',
          border: '1px solid #d8b4fe',
          borderRadius: 10,
          margin: '0 20px 16px',
          color: '#6b21a8',
          fontSize: '0.86rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 2px 6px rgba(124,58,237,0.1)'
        }}>
          <span style={{ fontSize: '1.2rem' }}>✨</span>
          <span>{optToast}</span>
        </div>
      )}

      {/* ─── CORPORATE TAX REGIME SIMULATOR ───────────────────────────────── */}
      <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', margin: '0 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569' }}>
              ⚖️ Corporate Tax Regime Simulator (CBDT Income Tax Act)
            </span>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              {regimeMeta.description}
            </p>
          </div>

          {/* Regime Switcher Pills */}
          <div style={{ display: 'flex', gap: 6, background: '#e2e8f0', padding: 3, borderRadius: 8 }}>
            {(['115BAA', 'OLD', '115BAB'] as const).map(reg => (
              <button
                key={reg}
                type="button"
                onClick={() => setSelectedRegime(reg)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: 0,
                  fontSize: '0.74rem',
                  fontWeight: selectedRegime === reg ? 700 : 500,
                  background: selectedRegime === reg ? '#ffffff' : 'transparent',
                  color: selectedRegime === reg ? '#0f172a' : '#64748b',
                  boxShadow: selectedRegime === reg ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {reg === '115BAA' ? 'Sec 115BAA (25.17%)' : reg === 'OLD' ? 'Old Regime (34.94%)' : 'Sec 115BAB (17.16%)'}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Simulator Output Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Gross Revenue (Inflow)</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '3px 0 0' }}>
              ₹{currentSummary.totalGrossRevenue.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Taxable Sales / SaaS</span>
          </div>

          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Verified Deductions</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb', margin: '3px 0 0' }}>
              ₹{currentSummary.totalDeductions.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.68rem', color: '#1d4ed8' }}>100% OPEX + COGS</span>
          </div>

          <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Tax Shield Saved (25%)</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', margin: '3px 0 0' }}>
              ₹{dynamicTaxSavings.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 650 }}>Legal Tax Retained</span>
          </div>

          <div style={{ background: '#fef2f2', padding: '10px 14px', borderRadius: 8, border: '1px solid #fecaca' }}>
            <span style={{ fontSize: '0.7rem', color: '#991b1b', fontWeight: 700, textTransform: 'uppercase' }}>Est. Tax Liability</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', margin: '3px 0 0' }}>
              ₹{dynamicLiability.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.68rem', color: '#b91c1c' }}>Effective {regimeMeta.label.split(' ')[0]}</span>
          </div>
        </div>
      </div>

      {/* ─── Category Breakdown Progress Bar ───────────────────────────────── */}
      <div style={{ margin: '0 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
          <span style={{ fontWeight: 700, color: '#475569' }}>GL Tax Category Distribution</span>
          <span style={{ color: '#64748b' }}>{currentSummary.lineItems.length} line items categorized</span>
        </div>

        <div style={{ height: 14, width: '100%', display: 'flex', borderRadius: 7, overflow: 'hidden', background: '#f1f5f9' }}>
          {currentSummary.categoryBreakdown.map(cat => {
            if (cat.percentage === 0) return null
            return (
              <div
                key={cat.category}
                style={{
                  width: `${cat.percentage}%`,
                  background: CATEGORY_THEME[cat.category].barColor,
                }}
                title={`${cat.category}: ${cat.count} items (${cat.percentage.toFixed(1)}%)`}
              />
            )
          })}
        </div>
      </div>

      {/* ─── Search & Filters ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, margin: '0 20px 16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by Counterparty, Record ID (e.g. B2-BNK-019), or GL Code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: 260, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
        />

        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
        >
          <option value="ALL">All Categories</option>
          <option value="Revenue">Revenue (GL 4100)</option>
          <option value="Cost of Revenue">Cost of Revenue (GL 5100)</option>
          <option value="Operating Expense">Operating Expense (GL 6200)</option>
          <option value="Capital Expenditure">Capital Expenditure (GL 1600)</option>
          <option value="Foreign Withholding">Foreign WHT (GL 2400)</option>
          <option value="Exempt">Exempt (GL 9100)</option>
          <option value="Unclassified">Unclassified (GL 9999)</option>
        </select>

        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
        >
          <option value="ALL">All Risk Levels</option>
          <option value="Low">Low Risk</option>
          <option value="Medium">Medium Risk</option>
          <option value="High">High Risk</option>
        </select>
      </div>

      {/* ─── Line Items Table ──────────────────────────────────────────────── */}
      <div className="fin-rec-wrap" style={{ maxHeight: 520, margin: '0 20px 20px' }}>
        <table className="fin-tbl">
          <thead>
            <tr>
              <th>Record ID</th>
              <th>GL Code</th>
              <th>Counterparty</th>
              <th>Category</th>
              <th>Section Ref</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'right' }}>Tax Shield (Saved)</th>
              <th>GST ITC Status</th>
              <th>Risk</th>
              <th style={{ textAlign: 'center', width: 120 }}>AI Tax Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.slice(0, 100).map(item => {
              const theme = CATEGORY_THEME[item.taxCategory]

              return (
                <tr key={item.recordId}>
                  <td className="fin-mono">
                    <span style={{ color: '#2563eb', fontWeight: 700 }}>{item.recordId}</span>
                  </td>
                  <td className="fin-mono" style={{ fontWeight: 700, color: '#475569' }}>
                    {item.glCode}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.counterparty}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: theme.bg,
                      color: theme.text,
                      border: `1px solid ${theme.border}`
                    }}>
                      {item.taxCategory}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.74rem', color: '#1e40af', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.sectionRef}>
                    {item.sectionRef.split('-')[0]}
                  </td>
                  <td className="fin-mono" style={{ textAlign: 'right' }}>
                    ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="fin-mono" style={{ textAlign: 'right', color: item.taxSavings > 0 ? '#16a34a' : '#64748b', fontWeight: 700 }}>
                    {item.taxSavings > 0 ? `+₹${item.taxSavings.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ fontSize: '0.72rem', color: item.itcEligibility.includes('100%') ? '#16a34a' : '#64748b' }}>
                    {item.itcEligibility.split(' ')[0]} {item.itcEligibility.split(' ')[1] || ''}
                  </td>
                  <td>{riskBadge(item.riskLevel)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setAuditModalItem(item)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid #7c3aed',
                        background: '#f5f3ff',
                        color: '#6d28d9',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      ⚡ AI Audit
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ─── INTERACTIVE AI TAX AUDIT MODAL ────────────────────────────────── */}
      {auditModalItem && (
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
                  <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>🤖 AI Tax Audit: {auditModalItem.recordId}</span>
                  <span style={{ background: '#7c3aed', color: '#fff', fontSize: '0.68rem', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                    {auditModalItem.glCode}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  Counterparty: <strong>{auditModalItem.counterparty}</strong> · Invoiced Amount: <strong>₹{auditModalItem.amount.toLocaleString('en-IN')}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuditModalItem(null)}
                style={{ background: 'transparent', border: 0, color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px' }}>
              {/* Compliance 3-Grid Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 18 }}>
                <div>
                  <small style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>Tax Category</small>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>{auditModalItem.taxCategory}</strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>Tax Shield (25%)</small>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: '#16a34a' }}>+₹{auditModalItem.taxSavings.toFixed(2)}</strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>Jurisdiction</small>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: '#2563eb', fontWeight: 700 }}>{auditModalItem.taxJurisdiction}</span>
                </div>
              </div>

              {/* Statutory Tax Citations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.84rem' }}>
                <div style={{ padding: '12px 14px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e40af' }}>
                    🏛️ Income Tax Act, 1961 Section Reference
                  </span>
                  <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#1e3a8a', fontSize: '0.88rem' }}>
                    {auditModalItem.sectionRef}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#334155' }}>
                    {auditModalItem.auditDefense}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ padding: '12px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#166534' }}>
                      🧾 GST Input Tax Credit (ITC)
                    </span>
                    <strong style={{ display: 'block', color: '#15803d', fontSize: '0.82rem', margin: '3px 0 2px' }}>
                      {auditModalItem.itcEligibility}
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: '#475569' }}>
                      Vendor GSTIN: <strong className="fin-mono">{auditModalItem.gstin}</strong>
                    </span>
                  </div>

                  <div style={{ padding: '12px 14px', background: '#faf5ff', borderRadius: 8, border: '1px solid #e9d5ff' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#6b21a8' }}>
                      ✂️ TDS Withholding Compliance
                    </span>
                    <strong style={{ display: 'block', color: '#7c3aed', fontSize: '0.82rem', margin: '3px 0 2px' }}>
                      {auditModalItem.tdsRate}
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: '#475569' }}>
                      {auditModalItem.tdsApplicable ? 'TDS deduction required on payment' : 'Under threshold limit'}
                    </span>
                  </div>
                </div>

                {/* Audit Defense Note */}
                <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                    🛡️ Statutory Auditor Defense Memo
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#334155', lineHeight: 1.5 }}>
                    "This transaction is backed by 3-way matched cross-verification across bank statement and ERP ledger. Verified compliant under Section 37(1) with 100% tax shield and matched against monthly GSTR-2B filing."
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setAuditModalItem(null)}
                className="d-btn d-btn-primary"
                style={{ fontSize: '0.84rem', padding: '8px 20px' }}
              >
                ✓ Close AI Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  )
}
