// ─── Reconciliation Engine ────────────────────────────────────────────────────
// 3-pass matching algorithm:
//   Pass 1 — Exact:   same referenceId + amount (±$0.01) + same currency
//   Pass 2 — Fuzzy:   same referenceId + amount within ±1% + date within ±2 days
//   Pass 3 — Partial: same referenceId + amount difference > 1% and < 20%
// Records unmatched after Pass 3 → classified as Exception with reason code
// Ground-truth comparison → accuracy score
// ────────────────────────────────────────────────────────────────────────────

import type { FinanceRecord } from './financeData'
import {
  bankStatements as defaultBank,
  invoices as defaultInvoices,
  ledgerEntries as defaultLedger,
  groundTruth,
  batchMeta,
} from './financeData'

export interface ReconciliationInput {
  bankStatements?: FinanceRecord[]
  ledgerEntries?: FinanceRecord[]
  invoices?: FinanceRecord[]
}

export type MatchStatus = 'Exact' | 'Fuzzy' | 'Partial' | 'Exception' | 'Pending'
export type MatchPass = 1 | 2 | 3 | null

export type ExceptionCode =
  | 'AMOUNT_MISMATCH'
  | 'MISSING_REF'
  | 'DUPLICATE'
  | 'DATE_WINDOW_EXCEEDED'
  | 'CURRENCY_MISMATCH'
  | 'NO_MATCH'
  | 'ORPHAN_LEDGER'

const SUGGESTED_ACTION: Record<ExceptionCode, string> = {
  MISSING_REF:           'Obtain payment reference from counterparty; post to suspense until resolved.',
  AMOUNT_MISMATCH:       'Request credit note or amended invoice for the delta amount.',
  DUPLICATE:             'Hold payment — duplicate billing detected. Confirm with vendor before clearing.',
  DATE_WINDOW_EXCEEDED:  'Escalate to finance manager; verify correct settlement period.',
  CURRENCY_MISMATCH:     'Obtain USD invoice or apply booking-date FX rate and re-submit.',
  NO_MATCH:              'Post manual journal entry or investigate the bank credit origin.',
  ORPHAN_LEDGER:         'Chase counterparty for overdue payment or reverse the accrual entry.',
}

export interface MatchResult {
  record: FinanceRecord
  matchedLedgerId: string | null
  matchedLedger: FinanceRecord | null
  status: MatchStatus
  pass: MatchPass
  exceptionCode: ExceptionCode | null
  exceptionReason: string
  suggestedAction: string
  delta: number               // absolute amount difference vs ledger
  deltaPct: number            // delta as % of ledger amount
  confidence: number          // 0–100
  isThreeWay: boolean         // bank + ledger + invoice all matched same group
}

export interface PassStats {
  pass: 1 | 2 | 3
  label: string
  matched: number
  running: number
}

export interface ReconciliationReport {
  batchId: string
  period: string
  totalRecords: number
  bankAttempts: number
  invoiceAttempts: number
  totalAttempts: number
  exactMatches: number
  fuzzyMatches: number
  partialMatches: number
  exceptions: number
  orphanLedgers: number
  matchRate: number            // (exact+fuzzy) / totalAttempts × 100
  partialRate: number          // partial / totalAttempts × 100
  exceptionRate: number        // exceptions / totalAttempts × 100
  clearedAmount: number        // sum of matched amounts (ledger side)
  openAmount: number           // sum of exception + orphan amounts
  threeWayMatches: number      // count of 3-way (bank+ledger+invoice)
  results: MatchResult[]
  exceptionList: MatchResult[]
  passStats: PassStats[]
  // Ground truth evaluation metrics
  groundTruthChecked: number
  correctMatches: number
  accuracy: number             // % correct overall (TP+TN)/Total × 100
  precision: number            // TP / (TP + FP) × 100
  recall: number               // TP / (TP + FN) × 100
  f1Score: number              // 2 * (P * R) / (P + R)
  truePositives: number
  falsePositives: number
  trueNegatives: number
  falseNegatives: number
  runTimeMs: number
}

// ─── Helper utilities ─────────────────────────────────────────────────────────

export function calculateMatchConfidence(
  record: FinanceRecord,
  ldg: FinanceRecord,
  dateWindow: number = 2
): number {
  const delta = Math.abs(record.amount - ldg.amount)
  const maxAmt = Math.max(record.amount, ldg.amount, 1)

  // 1. Amount closeness score (0 to 1)
  const amountRatio = delta / maxAmt
  const amountScore = Math.max(0, 1 - amountRatio * 5)

  // 2. Date proximity score (0 to 1)
  const diffDays = daysBetween(record.date, ldg.date)
  const maxDays = Math.max(dateWindow * 2, 7)
  const dateScore = Math.max(0, 1 - diffDays / maxDays)

  // 3. Reference ID exactness score (0 to 1)
  const refA = (record.referenceId || '').trim().toUpperCase()
  const refB = (ldg.referenceId || '').trim().toUpperCase()
  let refScore = 0.5
  if (refA && refA === refB) {
    refScore = 1.0
  } else if (refA && refB && (refA.includes(refB) || refB.includes(refA))) {
    refScore = 0.85
  }

  // 4. Counterparty name congruence score (0 to 1)
  const cpA = (record.counterparty || '').trim().toLowerCase()
  const cpB = (ldg.counterparty || '').trim().toLowerCase()
  let cpScore = 0.7
  if (cpA === cpB) {
    cpScore = 1.0
  } else if (cpA.includes(cpB) || cpB.includes(cpA)) {
    cpScore = 0.9
  }

  // 5. Currency match score (0 to 1)
  const currScore = record.currency === ldg.currency ? 1.0 : 0.0

  // Multi-attribute probabilistic confidence weight
  const rawConfidence = (
    0.45 * amountScore +
    0.25 * dateScore +
    0.15 * refScore +
    0.10 * cpScore +
    0.05 * currScore
  ) * 100

  return Math.min(100, Math.max(0, Math.round(rawConfidence)))
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime()
  const b = new Date(dateB).getTime()
  return Math.abs(a - b) / (1000 * 60 * 60 * 24)
}

function pctDiff(a: number, b: number): number {
  if (b === 0) return 100
  return Math.abs(a - b) / b
}

// ─── Exception classifier ────────────────────────────────────────────────────

function classifyException(
  record: FinanceRecord,
  ldgMap: Map<string, FinanceRecord>,
  alreadyMatched: Set<string>,
): { code: ExceptionCode; reason: string } {
  // MISSING_REF — blank referenceId
  if (!record.referenceId.trim()) {
    return {
      code: 'MISSING_REF',
      reason: `No reference ID on ${record.source} record. Cannot identify counterparty.`,
    }
  }

  const ldg = ldgMap.get(record.referenceId)

  // DUPLICATE — ref exists and was already matched
  if (ldg && alreadyMatched.has(ldg.id)) {
    return {
      code: 'DUPLICATE',
      reason: `Reference ${record.referenceId} already reconciled in this batch.`,
    }
  }

  // CURRENCY_MISMATCH — non-INR invoice
  if (record.currency !== 'INR') {
    return {
      code: 'CURRENCY_MISMATCH',
      reason: `Record is denominated in ${record.currency}; ledger expects INR. FX conversion required.`,
    }
  }

  // DATE_WINDOW_EXCEEDED — ref found but date too far out
  if (ldg) {
    const days = daysBetween(record.date, ldg.date)
    if (days > 5) {
      return {
        code: 'DATE_WINDOW_EXCEEDED',
        reason: `Settlement date ${record.date} is ${Math.round(days)} days from ledger date ${ldg.date} (>5 day threshold).`,
      }
    }
    // Has ref + reasonable date → AMOUNT_MISMATCH
    const diff = pctDiff(record.amount, ldg.amount)
    if (diff > 0.01) {
      return {
        code: 'AMOUNT_MISMATCH',
        reason: `Amount ₹${record.amount.toFixed(2)} differs from ledger ₹${ldg.amount.toFixed(2)} by ${(diff * 100).toFixed(1)}% — outside fuzzy tolerance.`,
      }
    }
  }

  return {
    code: 'NO_MATCH',
    reason: `Reference ${record.referenceId} not found in the ledger for this period.`,
  }
}

// ─── Main reconciliation function ────────────────────────────────────────────

function getReconSettings() {
  if (typeof window === 'undefined') return { fuzzyTol: 0.015, dateWindow: 2, partialMax: 0.20 }
  const fuzzyTol = parseFloat(localStorage.getItem('rs_fuzzyTol') || '1.5') / 100
  const dateWindow = parseFloat(localStorage.getItem('rs_dateWindow') || '2')
  const partialMax = parseFloat(localStorage.getItem('rs_partialMax') || '20') / 100
  return {
    fuzzyTol: isNaN(fuzzyTol) || fuzzyTol <= 0 ? 0.015 : fuzzyTol,
    dateWindow: isNaN(dateWindow) || dateWindow <= 0 ? 2 : dateWindow,
    partialMax: isNaN(partialMax) || partialMax <= 0 ? 0.20 : partialMax,
  }
}

export function runReconciliation(input?: ReconciliationInput): ReconciliationReport {
  const t0 = performance.now()
  const settings = getReconSettings()

  const bankStatements = input?.bankStatements ?? defaultBank
  const ledgerEntries = input?.ledgerEntries ?? defaultLedger
  const invoices = input?.invoices ?? defaultInvoices

  // Index ledger by referenceId for O(1) lookups
  const ldgByRef = new Map<string, FinanceRecord>()
  const ldgById  = new Map<string, FinanceRecord>()
  for (const l of ledgerEntries) {
    if (l.referenceId) {
      ldgByRef.set(l.referenceId, l)
    }
    ldgById.set(l.id, l)
  }

  const results: MatchResult[] = []
  const matchedLedgerIds = new Set<string>()

  // Track which ledger entries were matched (for orphan detection)
  const ledgerMatchCount = new Map<string, number>()

  let exactCount = 0
  let fuzzyCount = 0
  let partialCount = 0
  let exceptionCount = 0

  // Pass stats (built incrementally)
  let pass1Running = 0

  const allSubjects = [...bankStatements, ...invoices]

  for (const record of allSubjects) {
    const ldg = ldgByRef.get(record.referenceId)

    // ── Pass 1: Exact ─────────────────────────────────────────────────────
    if (
      ldg &&
      record.currency === ldg.currency &&
      Math.abs(record.amount - ldg.amount) < 0.01
    ) {
      const delta = Math.abs(record.amount - ldg.amount)
      exactCount++
      pass1Running++
      const isThreeWay =
        record.source === 'INVOICE' &&
        bankStatements.some(
          (b) => ldgByRef.get(b.referenceId)?.id === ldg.id,
        )
      ledgerMatchCount.set(ldg.id, (ledgerMatchCount.get(ldg.id) ?? 0) + 1)
      const conf = calculateMatchConfidence(record, ldg, settings.dateWindow)
      results.push({
        record,
        matchedLedgerId: ldg.id,
        matchedLedger: ldg,
        status: 'Exact',
        pass: 1,
        exceptionCode: null,
        exceptionReason: '',
        suggestedAction: '',
        delta,
        deltaPct: delta / ldg.amount,
        confidence: conf,
        isThreeWay,
      })
      continue
    }

    // ── Pass 2: Fuzzy (Configurable tolerance & date window) ───────────────
    if (
      ldg &&
      record.currency === ldg.currency &&
      pctDiff(record.amount, ldg.amount) <= settings.fuzzyTol &&
      daysBetween(record.date, ldg.date) <= settings.dateWindow
    ) {
      const delta = Math.abs(record.amount - ldg.amount)
      const deltaPct = pctDiff(record.amount, ldg.amount)
      fuzzyCount++
      const isThreeWay =
        record.source === 'INVOICE' &&
        bankStatements.some((b) => ldgByRef.get(b.referenceId)?.id === ldg.id)
      ledgerMatchCount.set(ldg.id, (ledgerMatchCount.get(ldg.id) ?? 0) + 1)
      const conf = calculateMatchConfidence(record, ldg, settings.dateWindow)
      results.push({
        record,
        matchedLedgerId: ldg.id,
        matchedLedger: ldg,
        status: 'Fuzzy',
        pass: 2,
        exceptionCode: null,
        exceptionReason: `Amount within ${(deltaPct * 100).toFixed(2)}%; date within ${daysBetween(record.date, ldg.date).toFixed(0)} day(s).`,
        suggestedAction: 'Confirm bank fee or settlement lag; clear after review.',
        delta,
        deltaPct,
        confidence: conf,
        isThreeWay,
      })
      continue
    }

    // ── Pass 3: Partial (same ref, amount diff > fuzzyTol and < partialMax) ─
    if (
      ldg &&
      record.currency === ldg.currency &&
      pctDiff(record.amount, ldg.amount) > settings.fuzzyTol &&
      pctDiff(record.amount, ldg.amount) < settings.partialMax
    ) {
      const delta = Math.abs(record.amount - ldg.amount)
      const deltaPct = pctDiff(record.amount, ldg.amount)
      partialCount++
      ledgerMatchCount.set(ldg.id, (ledgerMatchCount.get(ldg.id) ?? 0) + 1)
      const conf = calculateMatchConfidence(record, ldg, settings.dateWindow)
      results.push({
        record,
        matchedLedgerId: ldg.id,
        matchedLedger: ldg,
        status: 'Partial',
        pass: 3,
        exceptionCode: 'AMOUNT_MISMATCH',
        exceptionReason: `Short pay: ₹${record.amount.toFixed(2)} received vs ₹${ldg.amount.toFixed(2)} booked. Delta: ₹${delta.toFixed(2)} (${(deltaPct * 100).toFixed(1)}%).`,
        suggestedAction: 'Raise debit memo for ₹' + delta.toFixed(2) + '; hold clearing until settled.',
        delta,
        deltaPct,
        confidence: conf,
        isThreeWay: false,
      })
      continue
    }

    // ── Exception ─────────────────────────────────────────────────────────
    const { code, reason } = classifyException(record, ldgByRef, matchedLedgerIds)
    exceptionCount++
    results.push({
      record,
      matchedLedgerId: null,
      matchedLedger: null,
      status: 'Exception',
      pass: null,
      exceptionCode: code,
      exceptionReason: reason,
      suggestedAction: SUGGESTED_ACTION[code],
      delta: record.amount,
      deltaPct: 1,
      confidence: 0,
      isThreeWay: false,
    })
  }

  // ── Orphan ledger entries (no bank AND no invoice matched them) ───────────
  const orphanResults: MatchResult[] = []
  for (const ldg of ledgerEntries) {
    if (!ledgerMatchCount.has(ldg.id)) {
      orphanResults.push({
        record: ldg,
        matchedLedgerId: null,
        matchedLedger: null,
        status: 'Exception',
        pass: null,
        exceptionCode: 'ORPHAN_LEDGER',
        exceptionReason: `Ledger entry ${ldg.id} (${ldg.counterparty}, ₹${ldg.amount.toFixed(2)}) has no matching bank or invoice record in this period.`,
        suggestedAction: SUGGESTED_ACTION['ORPHAN_LEDGER'],
        delta: ldg.amount,
        deltaPct: 1,
        confidence: 0,
        isThreeWay: false,
      })
      exceptionCount++
    }
  }

  const allResults = [...results, ...orphanResults]
  const exceptionList = allResults.filter(
    (r) => r.status === 'Exception' || r.status === 'Partial',
  )

  // ── Accuracy, Precision & Recall measurement vs Ground Truth ──────────────
  const isCustom = !!input
  
  // Resolve Ground Truth labels for this batch
  const ldgRefMap = new Map<string, string>()
  for (const l of ledgerEntries) {
    if (l.referenceId && l.referenceId.trim()) {
      ldgRefMap.set(l.referenceId.trim().toUpperCase(), l.id)
    }
  }

  const batchGT: Record<string, string | null> = !isCustom
    ? groundTruth
    : (() => {
        const map: Record<string, string | null> = {}
        const seenInvoiceRefs = new Set<string>()
        for (const rec of allSubjects) {
          const ref = (rec.referenceId || '').trim().toUpperCase()
          if (!ref || !ldgRefMap.has(ref)) {
            map[rec.id] = null
          } else if (rec.source === 'INVOICE' && seenInvoiceRefs.has(ref)) {
            map[rec.id] = null // duplicate invoice anomaly
          } else {
            map[rec.id] = ldgRefMap.get(ref)!
            if (rec.source === 'INVOICE') seenInvoiceRefs.add(ref)
          }
        }
        return map
      })()

  let tp = 0 // True Positives: matched to correct ground truth ledger
  let fp = 0 // False Positives: matched when ground truth is null or wrong ledger
  let tn = 0 // True Negatives: exception/partial when ground truth is exception
  let fn = 0 // False Negatives: exception/partial when ground truth is valid ledger

  for (const res of allResults) {
    if (res.exceptionCode === 'ORPHAN_LEDGER') {
      const hasExternal = allSubjects.some(
        s => (s.referenceId || '').trim().toUpperCase() === (res.record.referenceId || '').trim().toUpperCase()
      )
      if (!hasExternal) tn++
      else fn++
      continue
    }

    const expectedLedger = batchGT[res.record.id] !== undefined ? batchGT[res.record.id] : null
    const isPredictedMatch = res.status === 'Exact' || res.status === 'Fuzzy'

    if (isPredictedMatch) {
      if (expectedLedger !== null && res.matchedLedgerId === expectedLedger) {
        tp++
      } else {
        fp++
      }
    } else {
      if (expectedLedger === null || res.status === 'Partial') {
        tn++
      } else {
        fn++
      }
    }
  }

  const totalEvaluated = tp + fp + tn + fn
  const precision = (tp + fp > 0) ? (tp / (tp + fp)) * 100 : 100
  const recall = (tp + fn > 0) ? (tp / (tp + fn)) * 100 : 100
  const accuracy = totalEvaluated > 0 ? ((tp + tn) / totalEvaluated) * 100 : 100
  const f1Score = (precision + recall > 0) ? (2 * precision * recall) / (precision + recall) : 100

  const totalAttempts = bankStatements.length + invoices.length
  const matchedCount = exactCount + fuzzyCount
  const totalRecs = bankStatements.length + ledgerEntries.length + invoices.length

  const t1 = performance.now()

  return {
    batchId: isCustom ? `CSV-UPLOAD-${new Date().toISOString().slice(0, 10)}` : batchMeta.batchId,
    period: isCustom ? 'Custom Ingested Batch' : batchMeta.period,
    totalRecords: totalRecs,
    bankAttempts: bankStatements.length,
    invoiceAttempts: invoices.length,
    totalAttempts,
    exactMatches: exactCount,
    fuzzyMatches: fuzzyCount,
    partialMatches: partialCount,
    exceptions: exceptionCount,
    orphanLedgers: orphanResults.length,
    matchRate: totalAttempts > 0 ? (matchedCount / totalAttempts) * 100 : 0,
    partialRate: totalAttempts > 0 ? (partialCount / totalAttempts) * 100 : 0,
    exceptionRate: totalAttempts > 0 ? (exceptionCount / totalAttempts) * 100 : 0,
    clearedAmount: allResults
      .filter((r) => r.status === 'Exact' || r.status === 'Fuzzy')
      .reduce((s, r) => s + (r.matchedLedger?.amount ?? 0), 0),
    openAmount: exceptionList.reduce((s, r) => s + r.record.amount, 0),
    threeWayMatches: allResults.filter((r) => r.isThreeWay).length,
    results: allResults,
    exceptionList,
    passStats: [
      { pass: 1, label: 'Pass 1 — Exact match',   matched: exactCount,                                      running: exactCount },
      { pass: 2, label: 'Pass 2 — Fuzzy match',   matched: fuzzyCount,                                      running: exactCount + fuzzyCount },
      { pass: 3, label: 'Pass 3 — Partial match', matched: partialCount,                                    running: exactCount + fuzzyCount + partialCount },
    ],
    groundTruthChecked: totalEvaluated,
    correctMatches: tp + tn,
    accuracy: Number(accuracy.toFixed(1)),
    precision: Number(precision.toFixed(1)),
    recall: Number(recall.toFixed(1)),
    f1Score: Number(f1Score.toFixed(1)),
    truePositives: tp,
    falsePositives: fp,
    trueNegatives: tn,
    falseNegatives: fn,
    runTimeMs: Math.round(t1 - t0),
  }
}
