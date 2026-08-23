import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const publicDir = path.resolve(process.cwd(), 'public')

const COMPANIES_SETS = [
  ['Acme Corp', 'TechStart Inc', 'GlobalTrade Ltd', 'DataPipe Corp', 'QuantumLeap Systems', 'NexGen Solutions', 'ClearPath AG', 'BlueSky Tech', 'Meridian Corp', 'ZenFlow Inc'],
  ['Lumina Analytics', 'Beacon Ventures', 'Strata Peak', 'Prism Logic', 'OmniScale Inc', 'Vortex Digital', 'Atlas Cloud', 'Helix Software', 'Sierra Financial', 'Synthetix AI'],
  ['ApexData', 'StreamLine Global', 'PinnacleSoft', 'CloudVertex', 'IronGate GmbH', 'AeroDynamic Labs', 'Hyperion Dynamics', 'PulsePoint Media', 'NovaBridge', 'AlphaStream AI'],
  ['Vanguard Data', 'Summit Edge', 'Titan Logistics', 'Solstice Networks', 'CyberCore Security', 'SkyBridge Co', 'Orbital Ltd', 'HorizonNet', 'Nexus Corp', 'Vertex Labs'],
  ['ApexFintech Corp', 'StripePay Ltd', 'Adyen Global', 'Oracle NetSuite', 'SAP Cloud AG', 'Square Point', 'Klarna Bank AB', 'PayPal Merchant', 'Plaid Services', 'Brex Enterprise']
]

const CATEGORIES = [
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

function generateBatch(batchNum, batchName, month) {
  const companies = COMPANIES_SETS[batchNum - 1]
  const ledger = []
  const bank = []
  const invoices = []

  // 170 Ledger Entries
  for (let i = 1; i <= 170; i++) {
    const padded = String(i).padStart(3, '0')
    const ref = `SET${batchNum}-PAY-2026-${String(Math.floor((i - 1) / 5) + 801).padStart(4, '0')}-${String((i % 5) + 1)}`
    const company = companies[(i - 1) % companies.length]
    const day = String(((i * 3) % 27) + 1).padStart(2, '0')
    const date = `2026-${month}-${day}`
    const baseAmount = Math.round((1500 + ((i * 419 + batchNum * 123) % 55000) + ((i % 7) * 51.5)) * 100) / 100
    const cat = CATEGORIES[(i - 1) % CATEGORIES.length]
    const type = i % 18 === 0 ? 'DEBIT' : 'CREDIT'

    ledger.push({
      id: `B${batchNum}-LDG-${padded}`,
      source: 'LEDGER',
      referenceId: i === 170 ? 'ORPHAN-REF-999' : ref,
      counterparty: company,
      amount: baseAmount,
      currency: 'USD',
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
      ref = `B${batchNum}-BNK-UNMATCHED-${padded}`
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
      id: `B${batchNum}-BNK-${padded}`,
      source: 'BANK',
      referenceId: ref,
      counterparty: cp,
      amount: amt,
      currency: 'USD',
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
    let currency = 'USD'
    let cp = ldg.counterparty
    let desc = `INV-B${batchNum}-${padded} ${ldg.category}`

    if (i % 33 === 0) {
      ref = ''
      desc = `INV-B${batchNum}-${padded} missing reference`
    } else if (i % 27 === 0) {
      currency = i % 2 === 0 ? 'EUR' : 'GBP'
      desc = `INV-B${batchNum}-${padded} foreign bill (${currency})`
    } else if (i % 22 === 0) {
      amt = Math.round(ldg.amount * 1.12 * 100) / 100
      desc = `INV-B${batchNum}-${padded} amended amount`
    } else if (i % 40 === 0) {
      const nextMonth = String(Math.min(12, parseInt(month, 10) + 1)).padStart(2, '0')
      date = `2026-${nextMonth}-15`
      desc = `INV-B${batchNum}-${padded} future dated invoice`
    } else if (i % 14 === 0) {
      const adjustedDay = Math.max(1, dayNum - 3)
      date = `2026-${month}-${String(Math.min(28, adjustedDay)).padStart(2, '0')}`
    }

    invoices.push({
      id: `B${batchNum}-INV-${padded}`,
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

  const all = [...ledger, ...bank, ...invoices]
  const headers = ['id', 'source', 'referenceId', 'counterparty', 'amount', 'currency', 'date', 'description', 'type', 'category']
  const rows = all.map((r) => [
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
  ].join(','))

  const csvContent = [headers.join(','), ...rows].join('\r\n')
  const filename = `batch_${batchNum}_${batchName}_500.csv`
  fs.writeFileSync(path.join(publicDir, filename), csvContent, 'utf8')
  console.log(`Generated ${filename} with ${all.length} records.`)
}

generateBatch(1, 'enterprise_recon', '03')
generateBatch(2, 'global_multicurrency', '06')
generateBatch(3, 'ecommerce_highvolume', '08')
generateBatch(4, 'saas_subscription', '09')
generateBatch(5, 'yearend_audit', '11')
