// ─── CSV Service for RiskShield Finance Controller ─────────────────────────
// Generates 5 distinct 500-record sets of realistic multi-source reconciliation data,
// parses uploaded CSVs, and provides batch loading.
// ─────────────────────────────────────────────────────────────────────────────

import type { FinanceRecord, LedgerSource, Currency, EntryType, Category } from './financeData'

export const BATCH_INFO = [
  { id: 1, name: 'Batch 1 — Enterprise Q1 Reconciliation', filename: 'batch_1_enterprise_recon_500.csv', month: '03', desc: 'Enterprise contracts, consulting & license revenue (500 records)' },
  { id: 2, name: 'Batch 2 — Global Multi-Currency Q2', filename: 'batch_2_global_multicurrency_500.csv', month: '06', desc: 'Multi-currency (USD, EUR, GBP) with FX variance & wire fees (500 records)' },
  { id: 3, name: 'Batch 3 — High-Volume E-Commerce Q3', filename: 'batch_3_ecommerce_highvolume_500.csv', month: '08', desc: 'High-frequency transactions, gateway fees & refund disputes (500 records)' },
  { id: 4, name: 'Batch 4 — SaaS Subscription & Cloud Q3', filename: 'batch_4_saas_subscription_500.csv', month: '09', desc: 'Recurring subscription billing, seat expansions & add-ons (500 records)' },
  { id: 5, name: 'Batch 5 — Year-End Audit & Exceptions Q4', filename: 'batch_5_yearend_audit_500.csv', month: '11', desc: 'Year-end close with edge cases, orphan detection & delta audit (500 records)' },
]

const COMPANIES_SETS = [
  ['Acme Corp', 'TechStart Inc', 'GlobalTrade Ltd', 'DataPipe Corp', 'QuantumLeap Systems', 'NexGen Solutions', 'ClearPath AG', 'BlueSky Tech', 'Meridian Corp', 'ZenFlow Inc'],
  ['Lumina Analytics', 'Beacon Ventures', 'Strata Peak', 'Prism Logic', 'OmniScale Inc', 'Vortex Digital', 'Atlas Cloud', 'Helix Software', 'Sierra Financial', 'Synthetix AI'],
  ['ApexData', 'StreamLine Global', 'PinnacleSoft', 'CloudVertex', 'IronGate GmbH', 'AeroDynamic Labs', 'Hyperion Dynamics', 'PulsePoint Media', 'NovaBridge', 'AlphaStream AI'],
  ['Vanguard Data', 'Summit Edge', 'Titan Logistics', 'Solstice Networks', 'CyberCore Security', 'SkyBridge Co', 'Orbital Ltd', 'HorizonNet', 'Nexus Corp', 'Vertex Labs'],
  ['ApexFintech Corp', 'StripePay Ltd', 'Adyen Global', 'Oracle NetSuite', 'SAP Cloud AG', 'Square Point', 'Klarna Bank AB', 'PayPal Merchant', 'Plaid Services', 'Brex Enterprise']
]

const CATEGORIES: Category[] = [
  'Accounts Receivable',
  'SaaS Revenue',
  'Consulting',
  'License Revenue',
  'Enterprise Contract',
  'Support Fees',
  'Project Payment',
  'Wire Transfer',
  'Vendor Payment',
  'Services'
]

/**
 * Generate 500 realistic financial records (BANK, LEDGER, INVOICE) for a given batch number (1..5)
 */
export function generateBatchSet(batchNum: number = 1): {
  all: FinanceRecord[]
  bank: FinanceRecord[]
  ledger: FinanceRecord[]
  invoices: FinanceRecord[]
  filename: string
  name: string
} {
  const safeBatch = Math.min(5, Math.max(1, batchNum))
  const info = BATCH_INFO[safeBatch - 1]
  const companies = COMPANIES_SETS[safeBatch - 1]
  const month = info.month

  const ledger: FinanceRecord[] = []
  const bank: FinanceRecord[] = []
  const invoices: FinanceRecord[] = []

  // 170 Ledger Entries (base truth)
  for (let i = 1; i <= 170; i++) {
    const padded = String(i).padStart(3, '0')
    const ref = `SET${safeBatch}-PAY-2026-${String(Math.floor((i - 1) / 5) + 801).padStart(4, '0')}-${String((i % 5) + 1)}`
    const company = companies[(i - 1) % companies.length]
    const day = String(((i * 3) % 27) + 1).padStart(2, '0')
    const date = `2026-${month}-${day}`
    const baseAmount = Math.round((1500 + ((i * 419 + safeBatch * 123) % 55000) + ((i % 7) * 51.5)) * 100) / 100
    const cat = CATEGORIES[(i - 1) % CATEGORIES.length]
    const type: EntryType = i % 18 === 0 ? 'DEBIT' : 'CREDIT'

    ledger.push({
      id: `B${safeBatch}-LDG-${padded}`,
      source: 'LEDGER',
      referenceId: i === 170 ? 'ORPHAN-REF-999' : ref,
      counterparty: company,
      amount: baseAmount,
      currency: 'INR',
      date,
      description: `${cat} settlement - ${company}`,
      type,
      category: cat,
    })
  }

  // 165 Bank Statements
  for (let i = 1; i <= 165; i++) {
    const padded = String(i).padStart(3, '0')
    const ldg = ledger[i - 1]
    const dayNum = parseInt(ldg.date.split('-')[2], 10)
    let ref = ldg.referenceId
    let amt = ldg.amount
    let date = ldg.date
    let cp = ldg.counterparty
    let desc = `Wire/ACH deposit - ${ldg.counterparty}`

    if (i % 25 === 0) {
      ref = ''
      cp = 'Unknown Remitter'
      desc = 'Unidentified incoming wire'
    } else if (i % 30 === 0) {
      ref = `B${safeBatch}-BNK-UNMATCHED-${padded}`
      desc = 'Deposit with no ledger reference'
    } else if (i % 12 === 0) {
      amt = Math.round(ldg.amount * 0.991 * 100) / 100
      desc = 'Net incoming wire (0.9% fee deducted)'
    } else if (i % 15 === 0) {
      const adjustedDay = Math.min(28, Math.max(1, dayNum + (i % 2 === 0 ? 1 : -2)))
      date = `2026-${month}-${String(adjustedDay).padStart(2, '0')}`
      desc = 'Settlement lag (±1-2 days)'
    } else if (i % 19 === 0) {
      amt = Math.round(ldg.amount * 0.95 * 100) / 100
      desc = 'Short payment under dispute'
    }

    bank.push({
      id: `B${safeBatch}-BNK-${padded}`,
      source: 'BANK',
      referenceId: ref,
      counterparty: cp,
      amount: amt,
      currency: 'INR',
      date,
      description: desc,
      type: ldg.type,
      category: ldg.category,
    })
  }

  // 165 Invoices
  for (let i = 1; i <= 165; i++) {
    const padded = String(i).padStart(3, '0')
    const ldg = ledger[i - 1]
    const dayNum = parseInt(ldg.date.split('-')[2], 10)
    let ref = ldg.referenceId
    let amt = ldg.amount
    let date = ldg.date
    let currency: Currency = 'INR'
    let cp = ldg.counterparty
    let desc = `INV-B${safeBatch}-${padded} ${ldg.category}`

    if (i % 33 === 0) {
      ref = ''
      desc = `INV-B${safeBatch}-${padded} missing reference`
    } else if (i % 27 === 0) {
      currency = i % 2 === 0 ? 'EUR' : 'GBP'
      desc = `INV-B${safeBatch}-${padded} foreign bill (${currency})`
    } else if (i % 22 === 0) {
      amt = Math.round(ldg.amount * 1.12 * 100) / 100
      desc = `INV-B${safeBatch}-${padded} amended amount`
    } else if (i % 40 === 0) {
      const nextMonth = String(Math.min(12, parseInt(month, 10) + 1)).padStart(2, '0')
      date = `2026-${nextMonth}-15`
      desc = `INV-B${safeBatch}-${padded} future dated invoice`
    } else if (i % 14 === 0) {
      const adjustedDay = Math.max(1, dayNum - 3)
      date = `2026-${month}-${String(Math.min(28, adjustedDay)).padStart(2, '0')}`
    }

    invoices.push({
      id: `B${safeBatch}-INV-${padded}`,
      source: 'INVOICE',
      referenceId: ref,
      counterparty: cp,
      amount: amt,
      currency,
      date,
      description: desc,
      type: ldg.type,
      category: ldg.category,
    })
  }

  return {
    all: [...ledger, ...bank, ...invoices],
    ledger,
    bank,
    invoices,
    filename: info.filename,
    name: info.name,
  }
}

/**
 * Generate default 500 records (alias for Batch 1)
 */
export function generate500Records() {
  return generateBatchSet(1)
}

/**
 * Serializes records into a CSV formatted string
 */
export function recordsToCSV(records: FinanceRecord[]): string {
  const headers = ['id', 'source', 'referenceId', 'counterparty', 'amount', 'currency', 'date', 'description', 'type', 'category']
  const rows = records.map((r) => {
    return [
      r.id,
      r.source,
      `"${(r.referenceId || '').replace(/"/g, '""')}"`,
      `"${(r.counterparty || '').replace(/"/g, '""')}"`,
      r.amount.toFixed(2),
      r.currency,
      r.date,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      r.type,
      `"${(r.category || '').replace(/"/g, '""')}"`,
    ].join(',')
  })

  return [headers.join(','), ...rows].join('\r\n')
}

/**
 * Parses raw CSV string back into FinanceRecord collections
 */
export function parseCSV(csvText: string): {
  records: FinanceRecord[]
  bank: FinanceRecord[]
  ledger: FinanceRecord[]
  invoices: FinanceRecord[]
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length <= 1) {
    throw new Error('CSV is empty or missing data rows')
  }

  // Parse header
  const headerLine = lines[0]
  const rawHeaders = splitCSVLine(headerLine).map((h) => h.toLowerCase().trim())
  
  const colIdx = {
    id: rawHeaders.findIndex((h) => h === 'id' || h === 'recordid' || h === 'record_id'),
    source: rawHeaders.findIndex((h) => h === 'source' || h === 'type_source' || h === 'origin'),
    referenceId: rawHeaders.findIndex((h) => h === 'referenceid' || h === 'reference_id' || h === 'ref' || h === 'ref_id'),
    counterparty: rawHeaders.findIndex((h) => h === 'counterparty' || h === 'vendor' || h === 'customer' || h === 'party'),
    amount: rawHeaders.findIndex((h) => h === 'amount' || h === 'total' || h === 'val' || h === 'value'),
    currency: rawHeaders.findIndex((h) => h === 'currency' || h === 'curr'),
    date: rawHeaders.findIndex((h) => h === 'date' || h === 'timestamp' || h === 'settledate'),
    description: rawHeaders.findIndex((h) => h === 'description' || h === 'desc' || h === 'memo'),
    type: rawHeaders.findIndex((h) => h === 'type' || h === 'entrytype' || h === 'entry_type'),
    category: rawHeaders.findIndex((h) => h === 'category' || h === 'cat'),
  }

  const records: FinanceRecord[] = []
  const bank: FinanceRecord[] = []
  const ledger: FinanceRecord[] = []
  const invoices: FinanceRecord[] = []

  for (let i = 1; i < lines.length; i++) {
    const fields = splitCSVLine(lines[i])
    if (fields.length < 3) continue

    const getVal = (idx: number, fallback = '') => (idx >= 0 && idx < fields.length ? fields[idx].trim() : fallback)

    const id = getVal(colIdx.id, `REC-${String(i).padStart(4, '0')}`)
    const rawSource = getVal(colIdx.source, '').toUpperCase()
    const source: LedgerSource =
      rawSource === 'BANK' || rawSource.includes('BANK')
        ? 'BANK'
        : rawSource === 'INVOICE' || rawSource.includes('INV')
        ? 'INVOICE'
        : 'LEDGER'

    const referenceId = getVal(colIdx.referenceId, '')
    const counterparty = getVal(colIdx.counterparty, 'Unknown Counterparty')
    const rawAmt = getVal(colIdx.amount, '0').replace(/[^0-9.-]/g, '')
    const amount = parseFloat(rawAmt) || 0
    const rawCurr = getVal(colIdx.currency, 'USD').toUpperCase()
    const currency: Currency = rawCurr === 'EUR' ? 'EUR' : rawCurr === 'GBP' ? 'GBP' : 'USD'
    const date = getVal(colIdx.date, new Date().toISOString().slice(0, 10))
    const description = getVal(colIdx.description, `${source} Record`)
    const rawType = getVal(colIdx.type, 'CREDIT').toUpperCase()
    const type: EntryType = rawType === 'DEBIT' ? 'DEBIT' : 'CREDIT'
    const category = (getVal(colIdx.category, 'Services') || 'Services') as Category

    const rec: FinanceRecord = {
      id,
      source,
      referenceId,
      counterparty,
      amount,
      currency,
      date,
      description,
      type,
      category,
    }

    records.push(rec)
    if (source === 'BANK') bank.push(rec)
    else if (source === 'INVOICE') invoices.push(rec)
    else ledger.push(rec)
  }

  return { records, bank, ledger, invoices }
}

/**
 * Handles CSV quote escaping during row parsing
 */
function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur)
      cur = ''
    } else {
      cur += c
    }
  }
  result.push(cur)
  return result
}
