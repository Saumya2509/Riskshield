// ─── Tax-Line Matcher Engine ──────────────────────────────────────────────────
// Maps reconciled financial records to corporate tax categories, computes
// tax provisions, calculates allowable deductions & tax savings, identifies
// cross-border foreign withholding (WHT), and flags tax compliance risks.
//
// Tax Categories:
//   - Revenue (Taxable Corporate Income)
//   - Cost of Revenue (100% Allowable Deduction)
//   - Operating Expense (100% Allowable Deduction)
//   - Capital Expenditure (Section 32 / Depreciation Block)
//   - Exempt / Intercompany (0% Non-Taxable)
//   - Foreign Withholding (Cross-Border Treaty WHT)
//   - Unclassified (Held at Conservative Reserve Rate)
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

// ── Corporate Tax Rate Schedule ──────────────────────────────────────────────
// Baseline domestic corporate income tax rate: 25.0%
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
const GL_CODES: Record<TaxCategory, string> = {
  'Revenue':              '4100-REV-OPR',
  'Cost of Revenue':      '5100-DIR-COGS',
  'Operating Expense':    '6200-OPE-GEN',
  'Capital Expenditure':  '1600-FIX-AST',
  'Exempt':               '9100-NON-TAX',
  'Foreign Withholding':  '2400-WHT-PAY',
  'Unclassified':         '9999-REV-HOLD',
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
      reason: 'Unclassified transaction — audit documentation required before income tax filing'
    }
  }

  if (row.status === 'Exception' && amount > 200000) {
    return {
      level: 'High',
      reason: `Unreconciled ₹${(amount / 100000).toFixed(2)}L variance — potential taxable income audit exposure`
    }
  }

  // Medium Risk: Cross-border WHT treaty checks or partial short-pay deductions
  if (taxCat === 'Foreign Withholding') {
    return {
      level: 'Medium',
      reason: `Cross-border currency (${row.record.currency}) — verify DTAA Form 10F and 15CA/CB treaty rate`
    }
  }

  if (row.status === 'Partial') {
    return {
      level: 'Medium',
      reason: `Partial ledger delta of ₹${Math.abs(row.delta).toLocaleString('en-IN')} impacts net allowable deduction`
    }
  }

  if (taxCat === 'Capital Expenditure' && amount > 1000000) {
    return {
      level: 'Medium',
      reason: 'Large CAPEX item — verify Section 32 block depreciation schedule vs immediate OPEX expensing'
    }
  }

  // Low Risk: Cleared standard transactions
  return {
    level: 'Low',
    reason: 'Standard compliant transaction — automated tax code assigned'
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

// ── Main Execution Engine ─────────────────────────────────────────────────────
export function runTaxLineMatcher(report: ReconciliationReport): TaxSummary {
  const t0 = performance.now()

  const lineItems: TaxLineItem[] = []
  let autoClassified = 0
  const totalRecords = report.results.length

  for (const row of report.results) {
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
      tdsApplicable: isDeductible && row.record.amount > 30000,
    })
  }

  // 1. Build Category Breakdown
  const catMap = new Map<TaxCategory, { count: number; totalAmount: number; taxAmount: number; taxSavings: number }>()
  
  // Initialize map in clean logical order
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
  
  // Net estimated tax liability = (Net Taxable Income * 25%) + Foreign WHT + CAPEX amortized provision
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
