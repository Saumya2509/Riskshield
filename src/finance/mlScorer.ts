// ─── RiskShield ML Anomaly Scorer v1.2 ───────────────────────────────────────
// Weighted Feature Isolation Score — no external libraries.
// 6 statistical features, per-record scoring, batch-level analytics.
//
// Features:
//   F1. Amount z-score      — deviation from batch mean/std
//   F2. Reference quality   — missing / duplicate ref
//   F3. Currency risk       — non-USD denomination
//   F4. Counterparty rarity — how often this vendor/customer appears
//   F5. Date concentration  — batch clustering on same date
//   F6. Amount extremity    — top/bottom 10th percentile
//
// Score weights (sum to 100):
//   F1 → max 35  |  F2 → max 30  |  F3 → max 20
//   F4 → max 10  |  F5 → max 5   |  F6 → up to additional 10 (capped)
// ─────────────────────────────────────────────────────────────────────────────

import type { FinanceRecord } from './financeData'
import { financeRecords } from './financeData'

export type RiskLevel = 'Normal' | 'Elevated' | 'High' | 'Critical'

export interface MLFeatures {
  amountZScore: number        // (amount − μ) / σ across batch
  counterpartyRisk: number    // 0–1: rare counterparty = high risk
  referenceQuality: number    // 0–1: 0=missing, 0.3=duplicate, 1=good
  dateConcentration: number   // fraction of batch on same date
  currencyRisk: number        // 0=USD, 1=foreign
  amountExtremity: number     // distance beyond 10th/90th percentile
}

export interface FeatureContributions {
  amountDev: number
  refQuality: number
  currency: number
  counterparty: number
  dateClustering: number
  extremity: number
}

export interface MLScore {
  recordId: string
  anomalyScore: number        // 0–100
  riskLevel: RiskLevel
  modelConfidence: number     // 0–100
  features: MLFeatures
  contributions: FeatureContributions
  explanation: string[]
}

export interface MLBatchStats {
  meanAmount: number
  stdAmount: number
  medianAmount: number
  p10Amount: number
  p90Amount: number
  counterpartyFreq: Record<string, number>
  dateFreq: Record<string, number>
  refFreq: Record<string, number>
  recordCount: number
}

export interface MLBatchResult {
  scores: MLScore[]
  scoreMap: Map<string, MLScore>
  batchStats: MLBatchStats
  highRiskCount: number     // score > 45
  criticalCount: number     // score > 70
  anomalyRate: number       // fraction with score > 45
  averageScore: number
  topAnomalies: MLScore[]   // top 5 by score
  modelVersion: string
  algorithm: string
  runTimeMs: number
}

// ─── Batch statistics ─────────────────────────────────────────────────────────

function buildBatchStats(records: FinanceRecord[]): MLBatchStats {
  const amounts = records.map((r) => r.amount).sort((a, b) => a - b)
  const n = amounts.length
  const sum = amounts.reduce((s, a) => s + a, 0)
  const mean = sum / n
  const variance = amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / n
  const std = Math.sqrt(variance) || 1 // guard against zero-std

  const mid = Math.floor(n / 2)
  const median = n % 2 === 0 ? (amounts[mid - 1] + amounts[mid]) / 2 : amounts[mid]

  const counterpartyFreq: Record<string, number> = {}
  const dateFreq: Record<string, number> = {}
  const refFreq: Record<string, number> = {}

  for (const r of records) {
    counterpartyFreq[r.counterparty] = (counterpartyFreq[r.counterparty] ?? 0) + 1
    dateFreq[r.date] = (dateFreq[r.date] ?? 0) + 1
    if (r.referenceId.trim()) {
      refFreq[r.referenceId] = (refFreq[r.referenceId] ?? 0) + 1
    }
  }

  return {
    meanAmount: mean,
    stdAmount: std,
    medianAmount: median,
    p10Amount: amounts[Math.floor(n * 0.1)] ?? amounts[0],
    p90Amount: amounts[Math.floor(n * 0.9)] ?? amounts[n - 1],
    counterpartyFreq,
    dateFreq,
    refFreq,
    recordCount: n,
  }
}

// ─── Per-record scorer ────────────────────────────────────────────────────────

function scoreRecord(record: FinanceRecord, stats: MLBatchStats): MLScore {
  const { meanAmount, stdAmount, p10Amount, p90Amount, counterpartyFreq, dateFreq, refFreq, recordCount } = stats

  // F1: Amount z-score (up to 35 pts)
  const zScore = (record.amount - meanAmount) / stdAmount
  const amountDev = Math.min(35, Math.abs(zScore) * 12)

  // F2: Reference quality (up to 30 pts)
  const hasRef = record.referenceId.trim().length > 0
  const isDupRef = hasRef && (refFreq[record.referenceId] ?? 0) > 1
  const referenceQuality = hasRef ? (isDupRef ? 0.3 : 1.0) : 0.0
  const refContrib = (1 - referenceQuality) * 30

  // F3: Currency risk (0 or 20 pts)
  const isForeign = record.currency !== 'USD'
  const currency = isForeign ? 20 : 0

  // F4: Counterparty rarity (up to 10 pts)
  const cpCount = counterpartyFreq[record.counterparty] ?? 0
  const counterpartyRisk = cpCount <= 1 ? 1.0 : cpCount <= 2 ? 0.7 : cpCount <= 4 ? 0.3 : 0.0
  const cpContrib = counterpartyRisk * 10

  // F5: Date clustering (up to 5 pts)
  const dateShare = (dateFreq[record.date] ?? 0) / recordCount
  const dateContrib = Math.min(5, dateShare * 50)

  // F6: Amount extremity (up to 10 bonus pts)
  const extremity =
    record.amount > p90Amount
      ? Math.min(1, (record.amount / p90Amount - 1) * 3)
      : record.amount < p10Amount
      ? Math.min(1, (1 - record.amount / p10Amount) * 3)
      : 0
  const extremityContrib = extremity * 10

  const rawScore = amountDev + refContrib + currency + cpContrib + dateContrib + extremityContrib
  const anomalyScore = Math.round(Math.min(100, rawScore))

  const riskLevel: RiskLevel =
    anomalyScore < 21 ? 'Normal' :
    anomalyScore < 46 ? 'Elevated' :
    anomalyScore < 71 ? 'High' : 'Critical'

  // Model confidence: more active features → higher confidence
  const activeFeatures = [
    Math.abs(zScore) > 1, !hasRef || isDupRef,
    isForeign, counterpartyRisk > 0.5,
    dateShare > 0.12, extremity > 0.2,
  ].filter(Boolean).length
  const modelConfidence = Math.min(95, 60 + activeFeatures * 6)

  // Explanation
  const explanation: string[] = []
  if (Math.abs(zScore) > 1.5) explanation.push(`Amount ${zScore > 0 ? '+' : ''}${zScore.toFixed(1)}σ from batch mean ($${Math.round(meanAmount).toLocaleString()})`)
  if (!hasRef) explanation.push('Missing reference ID — record unidentifiable')
  if (isDupRef) explanation.push(`Ref "${record.referenceId}" appears ${refFreq[record.referenceId]}× in batch`)
  if (isForeign) explanation.push(`Non-USD currency: ${record.currency}`)
  if (counterpartyRisk > 0.5) explanation.push(`Low-frequency counterparty (${cpCount} occurrence${cpCount !== 1 ? 's' : ''})`)
  if (dateShare > 0.15) explanation.push(`${dateFreq[record.date]} records share date ${record.date}`)
  if (extremity > 0.3) explanation.push(`Amount in ${record.amount > p90Amount ? 'top' : 'bottom'} 10th percentile`)
  if (explanation.length === 0) explanation.push('No anomalous features — record appears normal')

  return {
    recordId: record.id,
    anomalyScore,
    riskLevel,
    modelConfidence,
    features: {
      amountZScore: parseFloat(zScore.toFixed(3)),
      counterpartyRisk: parseFloat(counterpartyRisk.toFixed(3)),
      referenceQuality: parseFloat(referenceQuality.toFixed(3)),
      dateConcentration: parseFloat(dateShare.toFixed(3)),
      currencyRisk: isForeign ? 1 : 0,
      amountExtremity: parseFloat(extremity.toFixed(3)),
    },
    contributions: {
      amountDev: parseFloat(amountDev.toFixed(1)),
      refQuality: parseFloat(refContrib.toFixed(1)),
      currency,
      counterparty: parseFloat(cpContrib.toFixed(1)),
      dateClustering: parseFloat(dateContrib.toFixed(1)),
      extremity: parseFloat(extremityContrib.toFixed(1)),
    },
    explanation,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function runMLScoring(records: FinanceRecord[] = financeRecords): MLBatchResult {
  const t0 = performance.now()
  const stats = buildBatchStats(records)
  const scores = records.map((r) => scoreRecord(r, stats))
  const scoreMap = new Map(scores.map((s) => [s.recordId, s]))

  const highRiskCount = scores.filter((s) => s.anomalyScore > 45).length
  const criticalCount = scores.filter((s) => s.riskLevel === 'Critical').length
  const anomalyRate = highRiskCount / scores.length
  const averageScore = parseFloat((scores.reduce((s, r) => s + r.anomalyScore, 0) / scores.length).toFixed(1))
  const topAnomalies = [...scores].sort((a, b) => b.anomalyScore - a.anomalyScore).slice(0, 5)

  return {
    scores,
    scoreMap,
    batchStats: stats,
    highRiskCount,
    criticalCount,
    anomalyRate,
    averageScore,
    topAnomalies,
    modelVersion: 'RiskShield-ML v1.2',
    algorithm: 'Weighted Feature Isolation Score',
    runTimeMs: Math.round(performance.now() - t0),
  }
}
