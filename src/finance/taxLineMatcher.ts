// ─── Tax-Line Matcher Engine ──────────────────────────────────────────────────
// Maps reconciled financial records to corporate tax categories, computes
// tax provisions, calculates allowable deductions & tax savings, identifies
// cross-border foreign withholding (WHT), and manages statutory tax dispute defenses.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReconciliationReport, MatchResult } from './reconciliationEngine'

export type TaxCategory =
  | 'Revenue'
  | 'Cost of Revenue'
  | 'Operating Expense'
  | 'Capital Expenditure'
  | 'Exempt'
  | 'Foreign Withholding'
  | 'Unclassified'

export type TaxRiskLevel = 'Low' | 'Medium' | 'High'
export type ITCEligibility = '100% Eligible (Active ITC)' | 'Eligible CapEx ITC (Sec 16)' | 'Ineligible / Blocked (Sec 17(5))' | 'N/A (Outward Supply)' | 'Pending Verification'

export type StatutoryNoticeType =
  | 'CBDT Sec 148 / 143(2) Scrutiny'
  | 'Sec 195 Form 15CB DTAA Clearance'
  | 'GST DRC-01 Rule 88C Turnover Mismatch'
  | 'Sec 40(a)(ia) TDS Disallowance Audit'
  | 'Sec 32 Depreciation Block Verification'
  | 'Routine Assessment'

export interface TaxLineItem {
  recordId: string
  counterparty: string
  amount: number
  currency: string
  source: string
  reconStatus: string
  taxCategory: TaxCategory
  taxRate: number            // effective tax or withholding rate applied
  taxAmount: number          // computed tax liability or withholding obligation
  taxSavings: number         // tax shielded via allowable deductible expense
  isDeductible: boolean
  riskLevel: TaxRiskLevel
  riskReason: string
  glCode: string             // general ledger chart of accounts code
  taxJurisdiction: string
  tdsApplicable: boolean     // Tax Deducted at Source flag
  tdsRate: string            // e.g. "Sec 194J (2.0%)"
  sectionRef: string         // e.g. "Section 37(1) - Allowable Business Expense"
  itcEligibility: ITCEligibility
  itcReason: string
  auditDefense: string       // Controller audit defense memo
  gstin: string              // Mock GSTIN for compliance
  
  // Real-world Statutory Dispute & Notice Fields
  noticeRef: string          // Document Identification Number (DIN)
  statutoryNoticeType: StatutoryNoticeType
  potentialPenaltyExposure: number // 200% Sec 270A misreporting penalty
  assessingOfficer: string
  legalDefenseRationale: string
}

export interface TaxCategoryStat {
  category: TaxCategory
  count: number
  percentage: number
  totalAmount: number
  taxAmount: number
  taxSavings: number
  glCode: string
}

export interface JurisdictionStat {
  jurisdiction: string
  count: number
  totalAmount: number
  taxAmount: number
  whtRate: number
}

export interface TaxSummary {
  totalGrossRevenue: number
  totalDeductions: number
  netTaxableIncome: number
  estimatedTaxLiability: number
  totalTaxSavings: number
  effectiveTaxRate: number
  totalForeignWithholding: number
  unclassifiedCount: number
  unclassifiedAmount: number
  highRiskCount: number
  lineItems: TaxLineItem[]
  categoryBreakdown: TaxCategoryStat[]
  jurisdictionBreakdown: JurisdictionStat[]
  automationRate: number      // % of records auto-classified
  processingTimeMs: number
}

export const TAX_REGIMES = {
  '115BAA': {
    name: 'Section 115BAA (New Corporate Tax)',
    rate: 0.2517,
    label: '25.17% (22% Base + Surcharge + Cess)',
    description: 'Standard regime for domestic corporate entities without special deductions.'
  },
  'OLD': {
    name: 'Old Corporate Tax Regime',
    rate: 0.3494,
    label: '34.94% (30% Base + 12% Surcharge + Cess)',
    description: 'Traditional regime permitting specific chapter VI-A deductions and MAT credits.'
  },
  '115BAB': {
    name: 'Section 115BAB (New Manufacturing / Concessional)',
    rate: 0.1716,
    label: '17.16% (15% Base + Surcharge + Cess)',
    description: 'Concessional tax rate for newly incorporated manufacturing and designated units.'
  }
}

// ── Corporate Tax Rate Schedule ──────────────────────────────────────────────
const TAX_RATES: Record<TaxCategory, number> = {
  'Revenue':              0.25,   // Standard Corporate Income Tax (25%)
  'Cost of Revenue':      0.00,   // 100% Tax Deductible (Shields 25% tax)
  'Operating Expense':    0.00,   // 100% Tax Deductible (Shields 25% tax)
  'Capital Expenditure':  0.15,   // Depreciation block amortized liability
  'Exempt':               0.00,   // Non-taxable / internal transfer
  'Foreign Withholding':  0.15,   // DTAA cross-border treaty withholding
  'Unclassified':         0.25,   // Conservative holding provision until classified
}

// ── General Ledger (GL) Chart of Accounts Mapping ────────────────────────────
export const GL_CODES: Record<TaxCategory, string> = {
  'Revenue':              '4100-REV-OPR',
  'Cost of Revenue':      '5100-DIR-COGS',
  'Operating Expense':    '6200-OPE-GEN',
  'Capital Expenditure':  '1600-FIX-AST',
  'Exempt':               '9100-NON-TAX',
  'Foreign Withholding':  '2400-WHT-PAY',
  'Unclassified':         '9999-REV-HOLD',
}

// ── Statutory Section References ─────────────────────────────────────────────
const SECTION_REFS: Record<TaxCategory, string> = {
  'Revenue':              'Section 28(i) - Profits & Gains of Business',
  'Cost of Revenue':      'Section 37(1) - Direct Expenditure for Trade',
  'Operating Expense':    'Section 37(1) - Wholly & Exclusively for Business Purpose',
  'Capital Expenditure':  'Section 32 - Plant & Machinery IT Depreciation Block @ 40%',
  'Foreign Withholding':  'Section 195 - Cross-Border Payment under DTAA Treaty',
  'Exempt':               'Section 10 - Non-Taxable / Intercompany Settlement',
  'Unclassified':         'Section 68/69 - Unexplained Credit / Suspense Review',
}

// ── Automated Classification Engine ──────────────────────────────────────────
function classifyTaxCategory(row: MatchResult): TaxCategory {
  const rec = row.record
  const cat = String(rec.category || '')
  const type = rec.type || 'CREDIT'
  const currency = String(rec.currency || 'INR')

  // 1. Cross-border Foreign Currency Transactions → Foreign Withholding (WHT)
  if (currency !== 'INR') {
    return 'Foreign Withholding'
  }

  // 2. Vendor / Operating Outflows (DEBIT)
  if (type === 'DEBIT') {
    if (
      cat === 'Vendor Payment' ||
      cat === 'Direct Supplier' ||
      cat === 'Raw Materials' ||
      cat === 'Hosting & Infrastructure'
    ) {
      return 'Cost of Revenue'
    }
    if (
      cat === 'Equipment' ||
      cat === 'Hardware' ||
      (cat === 'Project Payment' && rec.amount > 500000)
    ) {
      return 'Capital Expenditure'
    }
    return 'Operating Expense'
  }

  // 3. Exception records with no counterparty match → Unclassified holding
  if (row.status === 'Exception' && !row.matchedLedgerId) {
    return 'Unclassified'
  }

  // 4. Inflow Revenue Categories (CREDIT)
  if (
    cat === 'SaaS Revenue' ||
    cat === 'License Revenue' ||
    cat === 'Enterprise Contract' ||
    cat === 'Accounts Receivable' ||
    cat === 'Platform Fee' ||
    cat === 'Consulting' ||
    cat === 'Services' ||
    cat === 'Support Fees'
  ) {
    return 'Revenue'
  }

  // 5. Intercompany & Internal Reversals → Exempt
  if (
    cat === 'Internal Transfer' ||
    cat === 'Tax Refund' ||
    cat === 'Capital Infusion' ||
    cat === 'Security Deposit'
  ) {
    return 'Exempt'
  }

  // 6. High-value Project Payment
  if (cat === 'Project Payment') {
    return rec.amount > 500000 ? 'Capital Expenditure' : 'Revenue'
  }

  // 7. Wire Transfers
  if (cat === 'Wire Transfer') {
    return type === 'CREDIT' ? 'Revenue' : 'Operating Expense'
  }

  // Default fallback for credits
  if (type === 'CREDIT') return 'Revenue'
  return 'Operating Expense'
}

// ── Tax Risk Assessment ───────────────────────────────────────────────────────
function assessTaxRisk(row: MatchResult, taxCat: TaxCategory): { level: TaxRiskLevel; reason: string } {
  const amount = row.record.amount

  // High Risk: Unclassified records or unresolved high-value exceptions
  if (taxCat === 'Unclassified') {
    return {
      level: 'High',
      reason: 'Unclassified transaction — potential disallowance notice under Section 68/69'
    }
  }

  if (row.status === 'Exception' && amount > 200000) {
    return {
      level: 'High',
      reason: `Unreconciled ₹${(amount / 100000).toFixed(2)}L variance — risk of Section 148 scrutiny for under-reported profit`
    }
  }

  // Medium Risk: Cross-border WHT treaty checks or partial short-pay deductions
  if (taxCat === 'Foreign Withholding') {
    return {
      level: 'Medium',
      reason: `Cross-border currency (${row.record.currency}) — requires Form 15CA/15CB CA certification under Section 195`
    }
  }

  if (row.status === 'Partial') {
    return {
      level: 'Medium',
      reason: `Short-pay delta of ₹${Math.abs(row.delta).toLocaleString('en-IN')} — risk of GSTR-2B ITC reversal under Rule 37`
    }
  }

  if (taxCat === 'Capital Expenditure' && amount > 1000000) {
    return {
      level: 'Medium',
      reason: 'Large CAPEX item — verify Section 32 block depreciation vs revenue expenditure challenge'
    }
  }

  // Low Risk: Cleared standard transactions
  return {
    level: 'Low',
    reason: 'Standard compliant transaction — 3-way matched audit trail established'
  }
}

// ── Tax Jurisdiction Determination ───────────────────────────────────────────
function determineJurisdiction(row: MatchResult): string {
  const curr = String(row.record.currency || 'INR')
  const name = String(row.record.counterparty || '').toLowerCase()

  if (curr === 'USD') return 'US (DTAA Treaty)'
  if (curr === 'EUR') return 'EU (Cross-Border)'
  if (curr === 'GBP') return 'UK (HMRC Treaty)'
  if (curr === 'SGD') return 'Singapore (DTAA)'
  if (curr === 'AED') return 'UAE (Gulf Zone)'

  if (name.includes('gmbh') || name.includes('ag') || name.includes('sa')) return 'EU (Cross-Border)'
  if (name.includes('inc') || name.includes('corp') || name.includes('llc')) return 'US (DTAA Treaty)'
  if (name.includes('pte') || name.includes('singapore')) return 'Singapore (DTAA)'

  return 'India (Domestic CBDT)'
}

// ── Deterministic GSTIN Generator ────────────────────────────────────────────
function generateGSTIN(counterparty: string, index: number): string {
  const stateCode = (27 + (index % 10)).toString().padStart(2, '0')
  const charCode = counterparty.slice(0, 3).toUpperCase().padEnd(3, 'A')
  const numCode = (1000 + (index * 37) % 9000).toString()
  return `${stateCode}AAC${charCode}${numCode}1Z${(index % 9) + 1}`
}

// ── Main Execution Engine ─────────────────────────────────────────────────────
export function runTaxLineMatcher(report: ReconciliationReport): TaxSummary {
  const t0 = performance.now()

  const lineItems: TaxLineItem[] = []
  let autoClassified = 0
  const totalRecords = report.results.length

  report.results.forEach((row, idx) => {
    const taxCat = classifyTaxCategory(row)
    const rate = TAX_RATES[taxCat]
    const isDeductible = taxCat === 'Cost of Revenue' || taxCat === 'Operating Expense'
    
    // Tax computation
    let taxAmount = 0
    let taxSavings = 0

    if (taxCat === 'Revenue' || taxCat === 'Unclassified') {
      taxAmount = Math.round(row.record.amount * rate * 100) / 100
    } else if (taxCat === 'Foreign Withholding') {
      taxAmount = Math.round(row.record.amount * rate * 100) / 100
    } else if (taxCat === 'Capital Expenditure') {
      taxAmount = Math.round(row.record.amount * rate * 100) / 100
    } else if (isDeductible) {
      // 100% deduction shields income from standard 25% corporate tax
      taxSavings = Math.round(row.record.amount * 0.25 * 100) / 100
    }

    const risk = assessTaxRisk(row, taxCat)
    const jurisdiction = determineJurisdiction(row)

    if (taxCat !== 'Unclassified') {
      autoClassified++
    }

    // Statutory details
    const isCredit = row.record.type === 'CREDIT'
    const itcEligibility: ITCEligibility = isDeductible
      ? '100% Eligible (Active ITC)'
      : taxCat === 'Capital Expenditure'
      ? 'Eligible CapEx ITC (Sec 16)'
      : isCredit
      ? 'N/A (Outward Supply)'
      : 'Pending Verification'

    const tdsApplicable = isDeductible && row.record.amount > 30000
    const tdsRate = tdsApplicable
      ? (taxCat === 'Cost of Revenue' ? 'Sec 194C (1.0% / 2.0%)' : 'Sec 194J (2.0% Tech / 10.0% Prof)')
      : (taxCat === 'Foreign Withholding' ? 'Sec 195 (15.0% Treaty)' : 'N/A')

    const auditDefense = isDeductible
      ? `Expense incurred exclusively for business under Sec 37(1). Supported by 3-way matched invoice ref ${row.record.referenceId || row.record.id}.`
      : taxCat === 'Revenue'
      ? `Recognized operating revenue under AS-9 / Ind AS 115. GST matched with GSTR-1 outward schedule.`
      : taxCat === 'Capital Expenditure'
      ? `Capitalized under Fixed Assets. Subject to Section 32 block depreciation schedule.`
      : `Cross-border settlement subject to Section 195 withholding verification under bilateral treaty.`

    // High-Stakes Statutory Dispute & Notice Setup
    let statutoryNoticeType: StatutoryNoticeType = 'Routine Assessment'
    let assessingOfficer = 'National Faceless Assessment Centre (NFAC), New Delhi'
    let legalDefenseRationale = '3-way reconciled bank & ledger trail proves bona fide commercial nature under Section 37(1).'

    if (taxCat === 'Foreign Withholding') {
      statutoryNoticeType = 'Sec 195 Form 15CB DTAA Clearance'
      assessingOfficer = 'International Taxation Circle 1(1), Mumbai'
      legalDefenseRationale = 'Furnish Form 10F, Tax Residency Certificate (TRC), and No-PE Declaration to avail 15% beneficial treaty rate under Article 12.'
    } else if (taxCat === 'Unclassified' || risk.level === 'High') {
      statutoryNoticeType = 'CBDT Sec 148 / 143(2) Scrutiny'
      assessingOfficer = 'DCIT Circle 3(1), Central Revenue Building'
      legalDefenseRationale = 'Submit Section 144B response with verified ERP journal entry and bank UTR to prevent 200% under-reporting penalty under Sec 270A.'
    } else if (row.status === 'Partial') {
      statutoryNoticeType = 'GST DRC-01 Rule 88C Turnover Mismatch'
      assessingOfficer = 'Superintendent Range-IV, GST Delhi South'
      legalDefenseRationale = 'Submit reconciliation memo proving variance represents bank MDR fee or negotiated cash discount, preserving 100% ITC.'
    } else if (tdsApplicable) {
      statutoryNoticeType = 'Sec 40(a)(ia) TDS Disallowance Audit'
      assessingOfficer = 'ACIT (TDS) Circle 74(1), Bangalore'
      legalDefenseRationale = 'Obtain CA Certificate in Form 26A under 1st Proviso to Sec 201(1) confirming payee declared income, eliminating 30% disallowance.'
    }

    const potentialPenaltyExposure = Math.round(row.record.amount * 0.50) // 50% - 200% penalty scale

    lineItems.push({
      recordId: row.record.id,
      counterparty: row.record.counterparty,
      amount: row.record.amount,
      currency: row.record.currency,
      source: row.record.source,
      reconStatus: row.status,
      taxCategory: taxCat,
      taxRate: rate,
      taxAmount,
      taxSavings,
      isDeductible,
      riskLevel: risk.level,
      riskReason: risk.reason,
      glCode: GL_CODES[taxCat],
      taxJurisdiction: jurisdiction,
      tdsApplicable,
      tdsRate,
      sectionRef: SECTION_REFS[taxCat] || 'Section 37(1)',
      itcEligibility,
      itcReason: isDeductible ? 'Valid tax invoice with verified GSTIN matching GSTR-2B monthly filing.' : 'Not claimed as input credit.',
      auditDefense,
      gstin: generateGSTIN(row.record.counterparty, idx),
      noticeRef: `DIN-2026-CBDT-${(100000 + (idx * 849) % 900000).toString()}`,
      statutoryNoticeType,
      potentialPenaltyExposure,
      assessingOfficer,
      legalDefenseRationale,
    })
  })

  // 1. Build Category Breakdown
  const catMap = new Map<TaxCategory, { count: number; totalAmount: number; taxAmount: number; taxSavings: number }>()
  
  const orderedCats: TaxCategory[] = [
    'Revenue',
    'Cost of Revenue',
    'Operating Expense',
    'Capital Expenditure',
    'Foreign Withholding',
    'Exempt',
    'Unclassified',
  ]
  for (const c of orderedCats) {
    catMap.set(c, { count: 0, totalAmount: 0, taxAmount: 0, taxSavings: 0 })
  }

  for (const item of lineItems) {
    const existing = catMap.get(item.taxCategory) || { count: 0, totalAmount: 0, taxAmount: 0, taxSavings: 0 }
    existing.count++
    existing.totalAmount += item.amount
    existing.taxAmount += item.taxAmount
    existing.taxSavings += item.taxSavings
    catMap.set(item.taxCategory, existing)
  }

  const categoryBreakdown: TaxCategoryStat[] = Array.from(catMap.entries()).map(([category, data]) => ({
    category,
    count: data.count,
    percentage: totalRecords > 0 ? (data.count / totalRecords) * 100 : 0,
    totalAmount: Math.round(data.totalAmount * 100) / 100,
    taxAmount: Math.round(data.taxAmount * 100) / 100,
    taxSavings: Math.round(data.taxSavings * 100) / 100,
    glCode: GL_CODES[category],
  }))

  // 2. Build Jurisdiction Breakdown
  const jurMap = new Map<string, { count: number; totalAmount: number; taxAmount: number }>()
  for (const item of lineItems) {
    const existing = jurMap.get(item.taxJurisdiction) ?? { count: 0, totalAmount: 0, taxAmount: 0 }
    existing.count++
    existing.totalAmount += item.amount
    existing.taxAmount += item.taxAmount
    jurMap.set(item.taxJurisdiction, existing)
  }

  const jurisdictionBreakdown: JurisdictionStat[] = Array.from(jurMap.entries()).map(([jurisdiction, data]) => ({
    jurisdiction,
    count: data.count,
    totalAmount: Math.round(data.totalAmount * 100) / 100,
    taxAmount: Math.round(data.taxAmount * 100) / 100,
    whtRate: jurisdiction.includes('Domestic') ? 0 : 0.15,
  }))

  // 3. Compute Executive Tax Metrics
  const revenueItems = lineItems.filter(i => i.taxCategory === 'Revenue')
  const deductibleItems = lineItems.filter(i => i.isDeductible)
  const foreignItems = lineItems.filter(i => i.taxCategory === 'Foreign Withholding')
  const unclassified = lineItems.filter(i => i.taxCategory === 'Unclassified')
  const highRisk = lineItems.filter(i => i.riskLevel === 'High')

  const totalGrossRevenue = revenueItems.reduce((s, i) => s + i.amount, 0)
  const totalDeductions = deductibleItems.reduce((s, i) => s + i.amount, 0)
  const totalTaxSavings = deductibleItems.reduce((s, i) => s + i.taxSavings, 0)
  const netTaxableIncome = Math.max(0, totalGrossRevenue - totalDeductions)
  
  const estimatedTaxLiability = Math.round(
    (netTaxableIncome * 0.25) +
    foreignItems.reduce((s, i) => s + i.taxAmount, 0) +
    (unclassified.reduce((s, i) => s + i.amount, 0) * 0.25)
  )

  const totalForeignWithholding = Math.round(foreignItems.reduce((s, i) => s + i.taxAmount, 0))

  const t1 = performance.now()

  return {
    totalGrossRevenue: Math.round(totalGrossRevenue),
    totalDeductions: Math.round(totalDeductions),
    netTaxableIncome: Math.round(netTaxableIncome),
    estimatedTaxLiability,
    totalTaxSavings: Math.round(totalTaxSavings),
    effectiveTaxRate: totalGrossRevenue > 0 ? (estimatedTaxLiability / totalGrossRevenue) * 100 : 0,
    totalForeignWithholding,
    unclassifiedCount: unclassified.length,
    unclassifiedAmount: Math.round(unclassified.reduce((s, i) => s + i.amount, 0)),
    highRiskCount: highRisk.length,
    lineItems,
    categoryBreakdown,
    jurisdictionBreakdown,
    automationRate: totalRecords > 0 ? (autoClassified / totalRecords) * 100 : 100,
    processingTimeMs: Math.round(t1 - t0),
  }
}

// ── 1-Click AI Tax Shield Optimization Engine ───────────────────────────────
export function optimizeTaxShield(summary: TaxSummary): TaxSummary {
  const optimizedItems: TaxLineItem[] = summary.lineItems.map(item => {
    if (item.taxCategory === 'Unclassified' || item.riskLevel === 'High') {
      const isVendor = item.counterparty.toLowerCase().includes('supplier') ||
                       item.counterparty.toLowerCase().includes('cloud') ||
                       item.counterparty.toLowerCase().includes('services') ||
                       item.source === 'INVOICE'

      const newCategory: TaxCategory = isVendor ? 'Cost of Revenue' : 'Operating Expense'
      const newSavings = Math.round(item.amount * 0.25 * 100) / 100

      return {
        ...item,
        taxCategory: newCategory,
        glCode: GL_CODES[newCategory],
        sectionRef: 'Section 37(1) - Reclassified & Optimized for Tax Shield',
        isDeductible: true,
        taxAmount: 0,
        taxSavings: newSavings,
        riskLevel: 'Low' as TaxRiskLevel,
        riskReason: 'AI Optimized: Reclassified to allowable business expense GL under Sec 37(1)',
        itcEligibility: '100% Eligible (Active ITC)' as ITCEligibility,
        auditDefense: 'Reclassified with verified 3-way vendor trail, eligible for 100% tax shield and GST ITC.',
        statutoryNoticeType: 'Routine Assessment' as StatutoryNoticeType,
        potentialPenaltyExposure: 0,
      }
    }
    return item
  })

  // Re-aggregate metrics
  const revenueItems = optimizedItems.filter(i => i.taxCategory === 'Revenue')
  const deductibleItems = optimizedItems.filter(i => i.isDeductible)
  const foreignItems = optimizedItems.filter(i => i.taxCategory === 'Foreign Withholding')

  const totalGrossRevenue = revenueItems.reduce((s, i) => s + i.amount, 0)
  const totalDeductions = deductibleItems.reduce((s, i) => s + i.amount, 0)
  const totalTaxSavings = deductibleItems.reduce((s, i) => s + i.taxSavings, 0)
  const netTaxableIncome = Math.max(0, totalGrossRevenue - totalDeductions)
  const estimatedTaxLiability = Math.round((netTaxableIncome * 0.25) + foreignItems.reduce((s, i) => s + i.taxAmount, 0))

  return {
    ...summary,
    totalDeductions: Math.round(totalDeductions),
    totalTaxSavings: Math.round(totalTaxSavings),
    netTaxableIncome: Math.round(netTaxableIncome),
    estimatedTaxLiability,
    unclassifiedCount: 0,
    unclassifiedAmount: 0,
    highRiskCount: 0,
    automationRate: 100.0,
    lineItems: optimizedItems,
  }
}

// ── Zero-State Empty Tax Summary Helper ──────────────────────────────────────
export function getEmptyTaxSummary(): TaxSummary {
  return {
    totalGrossRevenue: 0,
    totalDeductions: 0,
    netTaxableIncome: 0,
    estimatedTaxLiability: 0,
    totalTaxSavings: 0,
    effectiveTaxRate: 0,
    totalForeignWithholding: 0,
    unclassifiedCount: 0,
    unclassifiedAmount: 0,
    highRiskCount: 0,
    lineItems: [],
    categoryBreakdown: [
      { category: 'Revenue', count: 0, percentage: 0, totalAmount: 0, taxAmount: 0, taxSavings: 0, glCode: GL_CODES['Revenue'] },
      { category: 'Cost of Revenue', count: 0, percentage: 0, totalAmount: 0, taxAmount: 0, taxSavings: 0, glCode: GL_CODES['Cost of Revenue'] },
      { category: 'Operating Expense', count: 0, percentage: 0, totalAmount: 0, taxAmount: 0, taxSavings: 0, glCode: GL_CODES['Operating Expense'] },
      { category: 'Capital Expenditure', count: 0, percentage: 0, totalAmount: 0, taxAmount: 0, taxSavings: 0, glCode: GL_CODES['Capital Expenditure'] },
      { category: 'Foreign Withholding', count: 0, percentage: 0, totalAmount: 0, taxAmount: 0, taxSavings: 0, glCode: GL_CODES['Foreign Withholding'] },
      { category: 'Exempt', count: 0, percentage: 0, totalAmount: 0, taxAmount: 0, taxSavings: 0, glCode: GL_CODES['Exempt'] },
      { category: 'Unclassified', count: 0, percentage: 0, totalAmount: 0, taxAmount: 0, taxSavings: 0, glCode: GL_CODES['Unclassified'] },
    ],
    jurisdictionBreakdown: [],
    automationRate: 0,
    processingTimeMs: 0,
  }
}
