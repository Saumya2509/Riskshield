import { useState, useMemo } from 'react'
import type { TaxSummary, TaxCategory, TaxLineItem } from './taxLineMatcher'
import { TAX_REGIMES } from './taxLineMatcher'
import { useFinanceContext } from './FinanceContext'

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
  return <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: '#fee2e2', color: '#991b1b' }}>High Risk</span>
}

export default function TaxLineMatcherPanel({ taxSummary: initialTaxSummary }: Props) {
  const ctx = useFinanceContext()
  const defendedNotices = ctx.defendedNotices
  const defendNotice = ctx.defendNotice

  const currentSummary = initialTaxSummary
  const [selectedRegime, setSelectedRegime] = useState<'115BAA' | 'OLD' | '115BAB'>('115BAA')
  const [filterCat, setFilterCat] = useState<string>('ALL')
  const [filterRisk, setFilterRisk] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showJurisdictions, setShowJurisdictions] = useState<boolean>(false)
  const [defenseToast, setDefenseToast] = useState<string | null>(null)

  // Active Statutory Dispute Modal State
  const [disputeItem, setDisputeItem] = useState<TaxLineItem | null>(null)
  const [selectedDefenseOption, setSelectedDefenseOption] = useState<string>('opt-1')
  const [caMembershipNo, setCaMembershipNo] = useState<string>('CA Rajesh Verma, FCA #084920 (DSC Class-3)')
  const [isExecutingDefense, setIsExecutingDefense] = useState<boolean>(false)

  // Dynamic Regime Rate Calculation
  const regimeMeta = TAX_REGIMES[selectedRegime]
  const effectiveTaxOnNet = Math.round(currentSummary.netTaxableIncome * regimeMeta.rate)
  const dynamicLiability = effectiveTaxOnNet + currentSummary.totalForeignWithholding
  const dynamicTaxSavings = Math.round(currentSummary.totalDeductions * regimeMeta.rate)

  const totalPenaltyMitigated = useMemo(() => {
    return currentSummary.lineItems.reduce((acc, item) => {
      return acc + (defendedNotices[item.recordId] ? item.potentialPenaltyExposure : 0)
    }, 0)
  }, [currentSummary.lineItems, defendedNotices])

  const totalDefendedCount = Object.keys(defendedNotices).length

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

  // Execute Statutory Dispute Resolution
  function handleConfirmDefense() {
    if (!disputeItem) return
    setIsExecutingDefense(true)

    setTimeout(() => {
      let methodTitle = 'Section 144B Response Filed with 3-Way Audit Trail'
      if (selectedDefenseOption === 'opt-2') {
        methodTitle = 'Form 26A / CA Certificate under Sec 201(1) Uploaded'
      } else if (selectedDefenseOption === 'opt-3') {
        methodTitle = 'Form 15CB Certified & TRC DTAA Treaty Rate Cleared'
      } else if (selectedDefenseOption === 'opt-4') {
        methodTitle = 'Rule 88C DRC-01 Reconciliation Schedule Submitted'
      }

      defendNotice(disputeItem.recordId, {
        method: methodTitle,
        certNumber: `ACK-${Math.floor(100000000 + Math.random() * 900000000)}`,
        penaltyMitigated: disputeItem.potentialPenaltyExposure,
        timestamp: new Date().toLocaleTimeString(),
      })

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
      setIsExecutingDefense(false)
      setDisputeItem(null)
      setDefenseToast(`✓ Statutory Dispute Solved for ${disputeItem.recordId}! Penalty risk of ₹${disputeItem.potentialPenaltyExposure.toLocaleString('en-IN')} mitigated.`)
      
      // Enforce scroll to top across window and main containers
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      const mainEl = document.querySelector('.d-main')
      if (mainEl) {
        mainEl.scrollTop = 0
      }

      // Re-assert top position after React layout completes
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      }, 50)

      setTimeout(() => setDefenseToast(null), 6000)
    }, 600)
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
      'Notice Reference (DIN)',
      'Statutory Notice / Audit Scope',
      'Assessing Authority',
      'Amount (₹)',
      'Tax Savings Shield (₹)',
      'Penalty Exposure Mitigated (₹)',
      'Statutory Defense Status',
      'Legal Defense Rationale'
    ]

    const headerHtml = headers
      .map(h => `<th style="background-color: #1e3a8a; color: #ffffff; font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; padding: 8px 12px; border: 1px solid #334155; text-align: left;">${h}</th>`)
      .join('')

    const rowsHtml = filteredItems.map((item, idx) => {
      const defended = defendedNotices[item.recordId]
      const bg = defended ? '#f0fdf4' : (item.isDeductible ? '#f8fafc' : (item.taxCategory === 'Foreign Withholding' ? '#fdf2f8' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc')))
      const statusFormatted = defended ? `✓ Defended (${defended.method})` : item.statutoryNoticeType

      return `<tr style="background-color: ${bg};">
        <td style="font-family: 'Courier New', monospace; font-weight: bold; padding: 6px 10px; border: 1px solid #e2e8f0; color: #2563eb;">${item.recordId}</td>
        <td style="font-family: Arial, sans-serif; font-weight: bold; padding: 6px 10px; border: 1px solid #e2e8f0;">${item.glCode}</td>
        <td style="font-family: Arial, sans-serif; font-weight: 600; padding: 6px 10px; border: 1px solid #e2e8f0;">${item.counterparty}</td>
        <td style="font-family: 'Courier New', monospace; font-size: 9pt; padding: 6px 10px; border: 1px solid #e2e8f0;">${item.gstin}</td>
        <td style="font-family: Arial, sans-serif; font-weight: bold; padding: 6px 10px; border: 1px solid #e2e8f0;">${item.taxCategory}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0; color: #1e40af;">${item.sectionRef}</td>
        <td style="font-family: 'Courier New', monospace; padding: 6px 10px; border: 1px solid #e2e8f0; font-size: 9pt;">${item.noticeRef}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: bold; color: ${defended ? '#15803d' : '#991b1b'};">${statusFormatted}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0; font-size: 9pt;">${item.assessingOfficer}</td>
        <td style="font-family: Arial, sans-serif; text-align: right; font-weight: bold; padding: 6px 10px; border: 1px solid #e2e8f0;">₹${item.amount.toFixed(2)}</td>
        <td style="font-family: Arial, sans-serif; text-align: right; font-weight: bold; color: #16a34a; padding: 6px 10px; border: 1px solid #e2e8f0;">₹${item.taxSavings.toFixed(2)}</td>
        <td style="font-family: Arial, sans-serif; text-align: right; font-weight: bold; color: #dc2626; padding: 6px 10px; border: 1px solid #e2e8f0;">₹${(defended ? item.potentialPenaltyExposure : 0).toFixed(2)}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0; color: #15803d; font-weight: bold;">${defended ? 'DEFENDED & CERTIFIED' : 'PENDING ACTION'}</td>
        <td style="font-family: Arial, sans-serif; padding: 6px 10px; border: 1px solid #e2e8f0; color: #475569; font-size: 9pt;">${item.legalDefenseRationale}</td>
      </tr>`
    }).join('')

    const excelTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Statutory Tax Schedule</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
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
    link.download = `RiskShield_Statutory_Tax_Defense_${new Date().toISOString().slice(0, 10)}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = ['Record ID', 'GL Code', 'Counterparty', 'GSTIN', 'Category', 'Section Reference', 'Notice Reference (DIN)', 'Statutory Scope', 'Assessing Officer', 'Amount (INR)', 'Tax Rate', 'Tax Liability', 'Tax Savings Shield', 'Penalty Mitigated', 'Defense Status', 'Legal Defense Rationale']
    const rows = filteredItems.map(item => {
      const defended = defendedNotices[item.recordId]
      return [
        item.recordId,
        item.glCode,
        `"${item.counterparty.replace(/"/g, '""')}"`,
        item.gstin,
        item.taxCategory,
        `"${item.sectionRef.replace(/"/g, '""')}"`,
        item.noticeRef,
        `"${item.statutoryNoticeType}"`,
        `"${item.assessingOfficer.replace(/"/g, '""')}"`,
        item.amount.toFixed(2),
        `${(item.taxRate * 100).toFixed(1)}%`,
        item.taxAmount.toFixed(2),
        item.taxSavings.toFixed(2),
        (defended ? item.potentialPenaltyExposure : 0).toFixed(2),
        defended ? 'DEFENDED' : 'OPEN',
        `"${item.legalDefenseRationale.replace(/"/g, '""')}"`
      ]
    })
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `RiskShield_Statutory_Tax_Defense_${new Date().toISOString().slice(0, 10)}.csv`)
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
            <h2 className="fin-card-title">Tax Classification &amp; Statutory Notice Defense</h2>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 999 }}>
              {currentSummary.automationRate.toFixed(1)}% Auto-Categorized
            </span>
          </div>
          <p className="fin-card-desc">
            Automated corporate tax mapping · Section 148 / 143(2) scrutiny defense · Cross-border Form 15CB clearance · GST Rule 88C DRC-01 audit solver
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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

      {/* Defense Success Toast Notification */}
      {defenseToast && (
        <div style={{
          padding: '12px 18px',
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: 10,
          margin: '0 20px 16px',
          color: '#166534',
          fontSize: '0.86rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 2px 6px rgba(22,163,74,0.1)'
        }}>
          <span style={{ fontSize: '1.2rem' }}>🏛️</span>
          <span>{defenseToast}</span>
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
          <div style={{ display: 'flex', gap: 6, background: '#e2e8f0', padding: 3, borderRadius: 8, flexWrap: 'wrap' }}>
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
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {reg === '115BAA' ? 'Sec 115BAA (25.17%)' : reg === 'OLD' ? 'Old Regime (34.94%)' : 'Sec 115BAB (17.16%)'}
              </button>
            ))}
          </div>
        </div>

        {/* 5 Simulator Output Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
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

          <div style={{ background: '#faf5ff', padding: '10px 14px', borderRadius: 8, border: '1px solid #e9d5ff' }}>
            <span style={{ fontSize: '0.7rem', color: '#6b21a8', fontWeight: 700, textTransform: 'uppercase' }}>Penalty Mitigated (₹)</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c3aed', margin: '3px 0 0' }}>
              ₹{totalPenaltyMitigated.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.68rem', color: '#9333ea', fontWeight: 650 }}>
              {totalDefendedCount} Notice{totalDefendedCount === 1 ? '' : 's'} Defended
            </span>
          </div>
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

      {/* ─── Line Items Table / Zero State ───────────────────────────────── */}
      {currentSummary.lineItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b', margin: '0 20px 20px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📑</div>
          <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>
            No Active Tax Records Found
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '0.86rem', maxWidth: 460, marginInline: 'auto', lineHeight: 1.6 }}>
            Awaiting batch reconciliation. Ingest your CSV files or select a pre-loaded enterprise batch in Multi-Source Recon to generate corporate tax and GST classification line items.
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
        <div className="fin-rec-wrap" style={{ maxHeight: 540, margin: '0 20px 20px' }}>
          <table className="fin-tbl" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th>Record ID</th>
                <th>GL Code</th>
                <th>Counterparty</th>
                <th>Category</th>
                <th>Notice Ref (DIN)</th>
                <th>Statutory Scope</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Tax Shield (₹)</th>
                <th>Risk</th>
                <th style={{ textAlign: 'center', width: 170 }}>Statutory Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.slice(0, 100).map(item => {
                const theme = CATEGORY_THEME[item.taxCategory]
                const defended = defendedNotices[item.recordId]

                return (
                  <tr key={item.recordId} style={{ background: defended ? 'rgba(240, 253, 244, 0.7)' : 'transparent' }}>
                    <td className="fin-mono">
                      <span style={{ color: '#2563eb', fontWeight: 700 }}>{item.recordId}</span>
                      {defended && (
                        <span style={{ marginLeft: 6, padding: '1px 5px', borderRadius: 4, fontSize: '0.66rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                          (DEFENDED)
                        </span>
                      )}
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
                    <td className="fin-mono" style={{ fontSize: '0.74rem', color: '#1e40af' }}>
                      {item.noticeRef}
                    </td>
                    <td style={{ fontSize: '0.74rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.statutoryNoticeType}>
                      {defended ? (
                        <span style={{ color: '#15803d', fontWeight: 700 }}>✓ {defended.method.split(' ')[0]} {defended.method.split(' ')[1]}</span>
                      ) : (
                        <span style={{ color: item.riskLevel === 'High' ? '#dc2626' : (item.taxCategory === 'Foreign Withholding' ? '#7c3aed' : '#334155'), fontWeight: 600 }}>
                          {item.statutoryNoticeType}
                        </span>
                      )}
                    </td>
                    <td className="fin-mono" style={{ textAlign: 'right' }}>
                      ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="fin-mono" style={{ textAlign: 'right', color: item.taxSavings > 0 ? '#16a34a' : '#64748b', fontWeight: 700 }}>
                      {item.taxSavings > 0 ? `+₹${item.taxSavings.toFixed(2)}` : '—'}
                    </td>
                    <td>{riskBadge(defended ? 'Low' : item.riskLevel)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {defended ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.currentTarget.blur()
                            setDisputeItem(item)
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: '1px solid #86efac',
                            background: '#dcfce7',
                            color: '#15803d',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          View Certificate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.currentTarget.blur()
                            setDisputeItem(item)
                            setSelectedDefenseOption(item.taxCategory === 'Foreign Withholding' ? 'opt-3' : (item.tdsApplicable ? 'opt-2' : 'opt-1'))
                          }}
                          style={{
                            padding: '5px 12px',
                            borderRadius: 6,
                            border: item.riskLevel === 'High' ? '1px solid #dc2626' : (item.taxCategory === 'Foreign Withholding' ? '1px solid #7c3aed' : '1px solid #2563eb'),
                            background: item.riskLevel === 'High' ? '#dc2626' : (item.taxCategory === 'Foreign Withholding' ? '#7c3aed' : '#2563eb'),
                            color: '#ffffff',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          {item.taxCategory === 'Foreign Withholding' ? '🌐 Clear Form 15CB' : (item.riskLevel === 'High' ? '⚖️ Defend Sec 148' : '🛡️ Solve Tax Notice')}
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

      {/* ─── HIGH-STAKES STATUTORY TAX DEFENSE & DISPUTE TERMINAL ─────────── */}
      {disputeItem && (() => {
        const defendedData = defendedNotices[disputeItem.recordId]
        const isDefended = !!defendedData

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
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
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.6)',
              border: '1px solid #cbd5e1',
              overflow: 'hidden',
              animation: 'scaleUp 0.2s ease-out'
            }}>
              {/* Terminal Header */}
              <div style={{ padding: '18px 24px', background: isDefended ? '#064e3b' : '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                      {isDefended ? '📜 Certified Statutory Tax Defense Record' : '⚖️ Statutory Tax Notice Defense Terminal'}
                    </span>
                    <span style={{
                      background: isDefended ? '#10b981' : '#dc2626',
                      color: '#fff',
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontWeight: 700
                    }}>
                      {isDefended ? '✓ DEFENSE CERTIFIED' : disputeItem.statutoryNoticeType}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: isDefended ? '#a7f3d0' : '#94a3b8' }}>
                    DIN: <strong className="fin-mono" style={{ color: isDefended ? '#6ee7b7' : '#60a5fa' }}>{disputeItem.noticeRef}</strong> · Jurisdiction: <strong>{disputeItem.assessingOfficer}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
                    setDisputeItem(null)
                  }}
                  style={{ background: 'transparent', border: 0, color: isDefended ? '#a7f3d0' : '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Terminal Body */}
              <div style={{ padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
                {/* Defended Banner */}
                {isDefended && (
                  <div style={{
                    padding: '14px 18px',
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: 10,
                    marginBottom: 18,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: '0 2px 6px rgba(22,163,74,0.08)'
                  }}>
                    <span style={{ fontSize: '1.8rem' }}>🏛️</span>
                    <div>
                      <strong style={{ color: '#166534', fontSize: '0.9rem', display: 'block', marginBottom: 2 }}>
                        {defendedData.method}
                      </strong>
                      <span style={{ color: '#15803d', fontSize: '0.78rem', lineHeight: 1.5, display: 'block' }}>
                        Ack Cert No: <strong className="fin-mono" style={{ color: '#14532d' }}>{defendedData.certNumber}</strong> · 
                        Mitigated Penalty: <strong>₹{defendedData.penaltyMitigated.toLocaleString('en-IN')}</strong> · 
                        Filed At: <strong>{defendedData.timestamp}</strong> · 
                        Status: <strong style={{ color: '#15803d' }}>DSC Class-3 Signed &amp; Accepted</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Financial Exposure Risk Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 18 }}>
                  <div>
                    <small style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>Transaction Value</small>
                    <strong style={{ display: 'block', fontSize: '1.1rem', color: '#0f172a' }}>₹{disputeItem.amount.toLocaleString('en-IN')}</strong>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Counterparty: {disputeItem.counterparty.split(' ')[0]}</span>
                  </div>
                  <div>
                    <small style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>Disallowance Exposure</small>
                    <strong style={{ display: 'block', fontSize: '1.1rem', color: isDefended ? '#16a34a' : '#dc2626' }}>
                      {isDefended ? '₹0 (Mitigated)' : `₹${disputeItem.taxAmount.toLocaleString('en-IN')}`}
                    </strong>
                    <span style={{ fontSize: '0.68rem', color: isDefended ? '#15803d' : '#991b1b' }}>@ 25.17% Corporate Tax</span>
                  </div>
                  <div>
                    <small style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>Sec 270A Penalty Risk</small>
                    <strong style={{ display: 'block', fontSize: '1.1rem', color: isDefended ? '#16a34a' : '#b91c1c' }}>
                      {isDefended ? '₹0 (Protected)' : `₹${disputeItem.potentialPenaltyExposure.toLocaleString('en-IN')}`}
                    </strong>
                    <span style={{ fontSize: '0.68rem', color: isDefended ? '#15803d' : '#7f1d1d' }}>200% Misreporting Scale</span>
                  </div>
                </div>

                {/* Allegation & Statutory Issue Details */}
                <div style={{ padding: '12px 14px', background: isDefended ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isDefended ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, marginBottom: 18 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: isDefended ? '#166534' : '#991b1b' }}>
                    🏛️ Assessing Officer Audit Finding &amp; Challenge
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: isDefended ? '#14532d' : '#7f1d1d', lineHeight: 1.5 }}>
                    {disputeItem.legalDefenseRationale}
                  </p>
                </div>

                {/* Hard Defense Options */}
                <p style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                  {isDefended ? 'Applied Legal &amp; CA Defense Mechanism:' : 'Select Expert Legal &amp; CA Defense Mechanism:'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: isDefended ? 'none' : 'auto', opacity: isDefended ? 0.85 : 1 }}>
                  <div
                    onClick={() => setSelectedDefenseOption('opt-1')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${selectedDefenseOption === 'opt-1' ? '#2563eb' : '#e2e8f0'}`,
                      background: selectedDefenseOption === 'opt-1' ? '#eff6ff' : '#fff',
                      cursor: isDefended ? 'default' : 'pointer'
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>
                      📑 Option 1: File Section 144B Electronic Written Submission with 3-Way Reconciled ERP Trail
                    </strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#475569' }}>
                      Uploads verified cross-matching bank UTR voucher, invoice E-way QR code, and ledger entry to prove bona fide trade expenditure under Section 37(1).
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedDefenseOption('opt-2')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${selectedDefenseOption === 'opt-2' ? '#2563eb' : '#e2e8f0'}`,
                      background: selectedDefenseOption === 'opt-2' ? '#eff6ff' : '#fff',
                      cursor: isDefended ? 'default' : 'pointer'
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>
                      📜 Option 2: Upload Form 26A / Chartered Accountant Certificate under 1st Proviso to Sec 201(1)
                    </strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#475569' }}>
                      Certifies payee counterparty furnished ITR and paid taxes, eliminating the 30% statutory disallowance under Section 40(a)(ia).
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedDefenseOption('opt-3')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${selectedDefenseOption === 'opt-3' ? '#2563eb' : '#e2e8f0'}`,
                      background: selectedDefenseOption === 'opt-3' ? '#eff6ff' : '#fff',
                      cursor: isDefended ? 'default' : 'pointer'
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>
                      🌐 Option 3: Form 15CB Certification &amp; DTAA Article 12 Beneficial Rate Clearance
                    </strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#475569' }}>
                      Validates Tax Residency Certificate (TRC), Form 10F, and No-PE affidavit for Authorized Dealer Bank remittance clearance.
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedDefenseOption('opt-4')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${selectedDefenseOption === 'opt-4' ? '#2563eb' : '#e2e8f0'}`,
                      background: selectedDefenseOption === 'opt-4' ? '#eff6ff' : '#fff',
                      cursor: isDefended ? 'default' : 'pointer'
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>
                      ⚖️ Option 4: File GST DRC-01 Rule 88C Turnover Reconciliation with Bank MDR Deduction Schedule
                    </strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#475569' }}>
                      Reconciles outward turnover difference between GSTR-1 vs GSTR-3B, proving difference is gateway fees and protecting input tax credit (ITC).
                    </p>
                  </div>
                </div>

                {/* Auditor Sign-Off & DSC Authorization */}
                <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Authorized Signatory &amp; Digital Signature Certificate (DSC)
                  </label>
                  <input
                    type="text"
                    value={caMembershipNo}
                    readOnly={isDefended}
                    onChange={(e) => setCaMembershipNo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: isDefended ? '#475569' : '#0f172a',
                      background: isDefended ? '#f1f5f9' : '#fff'
                    }}
                  />
                </div>
              </div>

              {/* Terminal Footer */}
              <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                {isDefended ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
                      setDisputeItem(null)
                    }}
                    className="d-btn d-btn-primary"
                    style={{
                      fontSize: '0.84rem',
                      padding: '8px 22px',
                      background: '#15803d',
                      borderColor: '#15803d',
                      color: '#ffffff',
                      fontWeight: 700
                    }}
                  >
                    ✓ Close Certified View
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
                        setDisputeItem(null)
                      }}
                      className="d-btn d-btn-ghost"
                      style={{ fontSize: '0.84rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isExecutingDefense}
                      onClick={handleConfirmDefense}
                      className="d-btn d-btn-primary"
                      style={{
                        fontSize: '0.84rem',
                        padding: '8px 22px',
                        background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
                        borderColor: '#15803d',
                        color: '#ffffff',
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(22,163,74,0.3)'
                      }}
                    >
                      {isExecutingDefense ? 'Submitting to Portal...' : '🏛️ File Statutory Defense & Mitigate Exposure'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })()}

    </section>
  )
}
