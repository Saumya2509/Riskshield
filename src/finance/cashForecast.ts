// ─── Cash Forecast Engine v2 ──────────────────────────────────────────────────
// Realistic T+1/T+2/T+3 settlement schedule derived from reconciliation output.
//
// Settlement model:
//   - Cleared inflows arrive over 5 banking days (front-loaded: 35/28/18/12/7%)
//   - Open AR exceptions: 50% recovery, spread over days 3–7
//   - Open AP (debit exceptions): paid out over days 1–4
//   - Routine daily flows: derived from batch size and record amounts
//   - Weekend multiplier: Sat=15%, Sun=10% of weekday volume
//   - Confidence degrades 10 pts/day from 95 (epistemic uncertainty)
//
// This produces a rising settlement curve (T+1 spike, T+2 plateau) then
// tapering as open items resolve — the realistic shape for a reconciliation period.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReconciliationReport } from './reconciliationEngine'
import { openingBalance } from './financeData'

export interface ForecastDay {
  date:             string   // YYYY-MM-DD
  label:            string   // 'Mon, Aug 25'
  shortLabel:       string   // 'Aug 25'
  dayOfWeek:        number   // 0=Sun … 6=Sat
  openingBalance:   number
  projectedInflow:  number
  projectedOutflow: number
  netFlow:          number
  closingBalance:   number
  settledAmount:    number   // cleared $ settling this day
  confidence:       number   // 0–100
  isWeekend:        boolean
}

export interface CashForecast {
  openingBalance:  number
  forecastDays:    ForecastDay[]
  peakBalance:     number
  troughBalance:   number
  peakDay:         string
  troughDay:       string
  expectedClosing: number
  openARValue:     number
  openAPValue:     number
  totalSettling:   number   // total cleared $ settling over the window
  coverageRatio:   number
  netChangeValue:  number
  netChangePct:    number
}

// T+n settlement weights — sum to 1.0
// Heavy T+1 / T+2 (ACH and wire norms), tail off by T+5
const SETTLE_WEIGHTS = [0.35, 0.28, 0.18, 0.12, 0.07]

// Day-of-week volume multiplier (index = JS getDay(): 0=Sun)
const DOW_MULT = [0.10, 1.00, 1.05, 0.95, 1.00, 0.80, 0.15]

function addDays(base: string, n: number): string {
  const d = new Date(base + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function labels(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00Z')
  return {
    label:      d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    shortLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    dow:        d.getUTCDay(),
  }
}

export function buildForecast(report: ReconciliationReport, numDays: number = 7): CashForecast {
  // ── Inputs from reconciliation ───────────────────────────────────────────
  const cleared = report.clearedAmount

  // Open AR: partial short-pays + 50% recovery on credit exceptions
  const openARItems  = report.exceptionList.filter(
    e => e.record.type === 'CREDIT' && e.exceptionCode !== 'ORPHAN_LEDGER',
  )
  const partialItems = report.exceptionList.filter(
    e => e.status === 'Partial' && e.record.type === 'CREDIT',
  )
  const openARValue =
    partialItems.reduce((s, e) => s + e.delta, 0) +
    openARItems.reduce((s, e) => s + e.record.amount * 0.5, 0)

  // Open AP: debit exceptions = scheduled outflows
  const openAPItems = report.exceptionList.filter(e => e.record.type === 'DEBIT')
  const openAPValue = openAPItems.reduce((s, e) => s + e.record.amount, 0)

  // Routine daily flows (from the batch average — gives realistic base activity)
  const avgTxAmount = report.clearedAmount / Math.max(report.exactMatches + report.fuzzyMatches, 1)
  const routineInflow  = avgTxAmount * 1.8   // routine receivables per day
  const routineOutflow = avgTxAmount * 1.4   // routine payables per day

  // ── Build multi-day schedule (7, 14, or 30 days) ───────────────────────────
  const BASE = '2026-08-21'   // Thursday (day before reconciliation closes)
  let running = openingBalance  // start from actual opening, NOT post-cleared

  const forecastDays: ForecastDay[] = []
  const daysToGenerate = Math.max(7, Math.min(30, numDays))

  for (let i = 0; i < daysToGenerate; i++) {
    const date = addDays(BASE, i + 1)
    const { label, shortLabel, dow } = labels(date)
    const isWeekend = dow === 0 || dow === 6
    const mult = DOW_MULT[dow]

    // Settlement inflow: cleared funds arriving T+1 … T+5, plus recurring batch cycles for weeks 2-4
    let settledAmount = 0
    if (i < SETTLE_WEIGHTS.length) {
      settledAmount = cleared * SETTLE_WEIGHTS[i]
    } else if (!isWeekend) {
      // Periodic rolling invoice collections in extended forecast
      const cycleMultiplier = (i % 7 === 1 || i % 7 === 3) ? 0.16 : 0.08
      settledAmount = (cleared * cycleMultiplier) * (1 + Math.sin(i * 0.5) * 0.15)
    }

    // AR recovery: days 3–7 (after settlement clears the backlog), with steady collection tail
    let arDay = 0
    if (i >= 2 && i < 7) {
      arDay = openARValue * [0.25, 0.30, 0.25, 0.15, 0.05][i - 2]
    } else if (i >= 7 && !isWeekend) {
      arDay = (openARValue * 0.04) * (1 + (i % 5 === 0 ? 0.3 : 0))
    }

    // AP outflows: days 1–4, plus mid-month and month-end payroll/vendor cycles
    let apDay = 0
    if (i < 4) {
      apDay = openAPValue * [0.40, 0.30, 0.20, 0.10][i]
    } else if (i === 14 || i === 28) {
      // Bi-weekly vendor batch payment run
      apDay = openAPValue * 0.35
    }

    // Routine flows, scaled by day-of-week activity
    const routeIn  = routineInflow  * mult
    const routeOut = routineOutflow * mult

    const projectedInflow  = Math.round(settledAmount + arDay + routeIn)
    const projectedOutflow = Math.round(apDay + routeOut)
    const netFlow          = projectedInflow - projectedOutflow
    const opening          = running
    running += netFlow

    // Epistemic confidence degrades smoothly across the forecast window
    const confidencePct = Math.max(35, Math.round(95 - (i / (daysToGenerate - 1 || 1)) * 48))

    forecastDays.push({
      date, label, shortLabel,
      dayOfWeek: dow,
      openingBalance:   Math.round(opening),
      projectedInflow,
      projectedOutflow,
      netFlow,
      closingBalance:  Math.round(running),
      settledAmount:   Math.round(settledAmount),
      confidence:      confidencePct,
      isWeekend,
    })
  }

  const balances = forecastDays.map(d => d.closingBalance)
  const peakIdx    = balances.indexOf(Math.max(...balances))
  const troughIdx  = balances.indexOf(Math.min(...balances))
  const expectedClosing = forecastDays[forecastDays.length - 1].closingBalance

  return {
    openingBalance,
    forecastDays,
    peakBalance:    balances[peakIdx],
    troughBalance:  balances[troughIdx],
    peakDay:        forecastDays[peakIdx].label,
    troughDay:      forecastDays[troughIdx].label,
    expectedClosing,
    openARValue:    Math.round(openARValue),
    openAPValue:    Math.round(openAPValue),
    totalSettling:  Math.round(cleared),
    coverageRatio:  balances[troughIdx] / (balances[peakIdx] || 1),
    netChangeValue: Math.round(expectedClosing - openingBalance),
    netChangePct:   ((expectedClosing - openingBalance) / (openingBalance || 1)) * 100,
  }
}
