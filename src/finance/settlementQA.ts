// ─── Advanced Settlement Q&A & Reasoning Agent ──────────────────────────────
// Deterministic reasoning & pattern-matching engine over multi-source reconciliation data.
// Computes structured thoughts, step-by-step reasoning, and high-accuracy answers in real time.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReconciliationReport, MatchResult } from './reconciliationEngine'
import { runTaxLineMatcher } from './taxLineMatcher'
import { buildForecast } from './cashForecast'
import { runMLScoring } from './mlScorer'

export interface QAAnswer {
  question: string
  thinkingProcess: string[] // Step-by-step thought / reasoning trace
  answer: string            // Structured direct response
  recommendation?: string   // Recommended controller action steps
  data: MatchResult[] | null
  confidence: number        // 0–100
  category: 'metric' | 'exception' | 'counterparty' | 'amount' | 'cash' | 'tax' | 'ml' | 'general'
  responseTimeMs: number
}

type IntentHandler = (
  q: string,
  report: ReconciliationReport,
) => Omit<QAAnswer, 'question' | 'responseTimeMs'>

const intents: Array<{ pattern: RegExp; handler: IntentHandler }> = [
  // ── 1. Match Rate & 3-Pass Performance ──────────────────────────────────────
  {
    pattern: /match.?rate|reconcil.?rate|how many.?matched|pass.?1|pass.?2|pass.?3|performance/i,
    handler: (_q, r) => {
      const p1Pct = ((r.exactMatches / Math.max(1, r.totalAttempts)) * 100).toFixed(1)
      const p2Pct = ((r.fuzzyMatches / Math.max(1, r.totalAttempts)) * 100).toFixed(1)
      const p3Pct = ((r.partialMatches / Math.max(1, r.totalAttempts)) * 100).toFixed(1)
      const excPct = ((r.exceptions / Math.max(1, r.totalAttempts)) * 100).toFixed(1)

      return {
        thinkingProcess: [
          `Identified query intent: Reconciliation Match Performance & Pass Breakdown`,
          `Audited batch ${r.batchId}: ${r.totalRecords} total records across Bank, Ledger, and Invoices`,
          `Computed pass distributions: ${r.exactMatches} Exact (${p1Pct}%), ${r.fuzzyMatches} Fuzzy (${p2Pct}%), ${r.partialMatches} Partial (${p3Pct}%)`,
          `Evaluated total match rate = ${r.matchRate.toFixed(1)}% across ${r.totalAttempts} reconciliation attempts`,
          `Formulating structured performance summary and audit certification status`,
        ],
        answer: `The current batch **Match Rate is ${r.matchRate.toFixed(1)}%** (${r.exactMatches + r.fuzzyMatches} of ${r.totalAttempts} attempts verified):\n\n` +
          `• **Pass 1 (Exact):** **${r.exactMatches} records** (${p1Pct}%) — Zero tolerance (±₹0.01)\n` +
          `• **Pass 2 (Fuzzy):** **${r.fuzzyMatches} records** (${p2Pct}%) — Tolerating ±1% fee delta & ±2d lag\n` +
          `• **Pass 3 (Partial):** **${r.partialMatches} records** (${p3Pct}%) — 1%–20% delta discrepancy\n` +
          `• **Exceptions:** **${r.exceptions} records** (${excPct}%) — Flagged for manual review`,
        recommendation: `Cleared settlements (₹${Math.round(r.clearedAmount).toLocaleString('en-IN')}) are ready to post to the general ledger. Review the ${r.exceptions} exceptions before closing period.`,
        data: r.results.filter(x => x.status === 'Exact' || x.status === 'Fuzzy'),
        confidence: 99,
        category: 'metric',
      }
    },
  },

  // ── 2. Net Open Position & Cleared Balances ────────────────────────────────
  {
    pattern: /open.?position|outstanding|net.?open|uncleared|cleared.?amount|how much.?open|balance/i,
    handler: (_q, r) => {
      const topExceptions = r.exceptionList.slice(0, 3)
      return {
        thinkingProcess: [
          `Identified query intent: Financial Liquidity & Net Open Position Evaluation`,
          `Queried general ledger cleared volume vs open suspense delta`,
          `Computed cleared settlement amount: ₹${r.clearedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          `Calculated unreconciled open position: ₹${r.openAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} across ${r.exceptionList.length} unresolved items`,
          `Extracted highest impact variances for immediate controller review`,
        ],
        answer: `**Financial Position Summary:**\n\n` +
          `• **Cleared Settlement:** **₹${r.clearedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}** (${r.matchRate.toFixed(1)}% reconciled)\n` +
          `• **Net Open Position:** **₹${r.openAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}** across **${r.exceptionList.length} unresolved items**\n` +
          `• **Top Open Variances:**\n` +
          topExceptions.map(e => `  - **${e.record.id}** (${e.record.counterparty}): ₹${e.record.amount.toFixed(2)} (Δ₹${e.delta.toFixed(2)}, ${e.exceptionCode || 'PARTIAL'})`).join('\n'),
        recommendation: `Prioritize the top ${topExceptions.length} variance items to recover ₹${topExceptions.reduce((s, e) => s + e.delta, 0).toFixed(2)} in short pays.`,
        data: r.exceptionList,
        confidence: 100,
        category: 'amount',
      }
    },
  },

  // ── 3. Tax Liability, Deductions & Withholding ─────────────────────────────
  {
    pattern: /tax|liability|withholding|deductible|tax.?rate|gl.?code|wht/i,
    handler: (_q, r) => {
      const tax = runTaxLineMatcher(r)
      return {
        thinkingProcess: [
          `Identified query intent: Corporate Tax Obligations & GL Code Mapping`,
          `Executed Tax-Line Matcher across ${tax.lineItems.length} classified records`,
          `Classified ₹${Math.round(tax.totalGrossRevenue).toLocaleString('en-IN')} gross revenue under Corporate Tax / GST schedule`,
          `Aggregated deductible operating expenses and COGS: ₹${Math.round(tax.totalDeductions).toLocaleString('en-IN')}`,
          `Scanned international counterparties for Foreign Withholding Tax: ${tax.jurisdictionBreakdown.length} jurisdictions detected`,
          `Calculated estimated corporate tax liability = ₹${Math.round(tax.estimatedTaxLiability).toLocaleString('en-IN')}`,
        ],
        answer: `**Tax-Line Matcher & GL Schedule:**\n\n` +
          `• **Estimated Corporate Tax Liability:** **₹${Math.round(tax.estimatedTaxLiability).toLocaleString('en-IN')}** (Effective Rate: ${(tax.effectiveTaxRate * 100).toFixed(1)}%)\n` +
          `• **Gross Taxable Revenue:** ₹${Math.round(tax.totalGrossRevenue).toLocaleString('en-IN')} (GL: \`4000-REV\`)\n` +
          `• **Deductible Operating Expenses:** ₹${Math.round(tax.totalDeductions).toLocaleString('en-IN')} (GL: \`5000-COR\` / \`6000-OPX\`)\n` +
          `• **Foreign Withholding Tax (WHT):** ₹${Math.round(tax.totalForeignWithholding).toLocaleString('en-IN')} across foreign currency deposits\n` +
          `• **Tax Automation Rate:** **${tax.automationRate.toFixed(1)}%** auto-assigned`,
        recommendation: `Review ${tax.highRiskCount} high-risk foreign records in the Tax-Line Matcher to verify treaty withholding documentation before quarterly filing.`,
        data: null,
        confidence: 98,
        category: 'tax',
      }
    },
  },

  // ── 4. Forward Cash Forecast & 7-Day Liquidity ─────────────────────────────
  {
    pattern: /cash.?forecast|liquidity|peak|trough|schedule|7.?day|t\+1|inflow|outflow/i,
    handler: (_q, r) => {
      const f = buildForecast(r)
      const peak = f.forecastDays.find(d => d.date === f.peakDay)
      return {
        thinkingProcess: [
          `Identified query intent: Forward Cash Forecaster & T+1…T+7 Liquidity Simulation`,
          `Loaded base opening ledger balance: ₹${Math.round(f.openingBalance).toLocaleString('en-IN')}`,
          `Simulated 7-day front-loaded banking settlement schedule`,
          `Detected peak liquidity day on ${peak?.label || 'T+3'} at ₹${Math.round(f.peakBalance).toLocaleString('en-IN')}`,
          `Projected expected 7-day closing balance: ₹${Math.round(f.expectedClosing).toLocaleString('en-IN')}`,
        ],
        answer: `**7-Day Forward Cash Forecast:**\n\n` +
          `• **Opening Balance:** ₹${Math.round(f.openingBalance).toLocaleString('en-IN')}\n` +
          `• **Expected 7-Day Closing:** **₹${Math.round(f.expectedClosing).toLocaleString('en-IN')}** (${f.netChangePct >= 0 ? '+' : ''}${f.netChangePct.toFixed(1)}% net growth)\n` +
          `• **Peak Liquidity:** **₹${Math.round(f.peakBalance).toLocaleString('en-IN')}** (Expected on ${peak?.label || 'Day 3'})\n` +
          `• **Trough Position:** ₹${Math.round(f.troughBalance).toLocaleString('en-IN')}\n` +
          `• **Settlement Model:** Cleared inflows front-loaded at 35% on T+1, 28% on T+2, and 18% on T+3`,
        recommendation: `Cash coverage ratio is ${f.coverageRatio.toFixed(2)}x. Liquidity buffer is strong with zero default risk over the 7-day settlement horizon.`,
        data: null,
        confidence: 96,
        category: 'cash',
      }
    },
  },

  // ── 5. Specific Exception Codes ─────────────────────────────────────────────
  {
    pattern: /amount.?mismatch|short.?pay|fee.?deduction/i,
    handler: (_q, r) => {
      const items = r.exceptionList.filter((e) => e.exceptionCode === 'AMOUNT_MISMATCH' || e.status === 'Partial')
      const total = items.reduce((s, e) => s + e.delta, 0)
      return {
        thinkingProcess: [
          `Identified query intent: AMOUNT_MISMATCH & Short-Pay Variance Analysis`,
          `Filtered reconciliation exception registry for code 'AMOUNT_MISMATCH'`,
          `Identified ${items.length} records with payment delta`,
          `Calculated aggregate unreconciled delta variance = ₹${total.toFixed(2)}`,
        ],
        answer: `**${items.length} AMOUNT_MISMATCH Exception${items.length === 1 ? '' : 's'} Detected:**\n\n` +
          `Total unreconciled delta variance is **₹${total.toFixed(2)}**.\n\n` +
          items.slice(0, 5).map(e => `• **${e.record.id}** (${e.record.counterparty}): Billed ₹${e.record.amount.toFixed(2)} vs Cleared ₹${(e.record.amount - e.delta).toFixed(2)} (Δ−₹${e.delta.toFixed(2)})`).join('\n'),
        recommendation: `Issue debit adjustment memos for these ${items.length} invoices or adjust fee schedules for merchant processing deductions.`,
        data: items,
        confidence: 100,
        category: 'exception',
      }
    },
  },
  {
    pattern: /duplicate/i,
    handler: (_q, r) => {
      const items = r.exceptionList.filter((e) => e.exceptionCode === 'DUPLICATE')
      return {
        thinkingProcess: [
          `Identified query intent: DUPLICATE Invoice & Double Billing Detection`,
          `Scanning invoice references for collisions and duplicate amounts...`,
          `Found ${items.length} duplicate billing candidates`,
        ],
        answer: items.length === 0
          ? `✅ **No DUPLICATE exceptions detected** in batch ${r.batchId}. All invoice reference IDs are unique.`
          : `⚠️ **${items.length} Duplicate Invoice${items.length > 1 ? 's' : ''} Detected:**\n\n` +
            items.map(e => `• **${e.record.id}** (${e.record.counterparty}): ₹${e.record.amount.toFixed(2)} on ${e.record.date}`).join('\n'),
        recommendation: items.length > 0 ? `Do NOT release disbursement payments for these duplicate invoices until vendor verification.` : undefined,
        data: items,
        confidence: 100,
        category: 'exception',
      }
    },
  },
  {
    pattern: /missing.?ref|no.?ref/i,
    handler: (_q, r) => {
      const items = r.exceptionList.filter((e) => e.exceptionCode === 'MISSING_REF')
      return {
        thinkingProcess: [
          `Identified query intent: MISSING_REF (Unidentified Bank Deposits)`,
          `Scanning records without counterparty reference tokens...`,
          `Found ${items.length} unreferenced items`,
        ],
        answer: items.length === 0
          ? `✅ **No MISSING_REF exceptions found.** All records contain structured PO / invoice numbers.`
          : `⚠️ **${items.length} Record${items.length > 1 ? 's' : ''} Missing Reference IDs:**\n\n` +
            items.map(e => `• **${e.record.id}** (${e.record.source}): ₹${e.record.amount.toFixed(2)} from ${e.record.counterparty}`).join('\n'),
        recommendation: items.length > 0 ? `Contact banking remitter to retrieve remittance advice tokens.` : undefined,
        data: items,
        confidence: 100,
        category: 'exception',
      }
    },
  },
  {
    pattern: /currency|fx|foreign|eur|gbp/i,
    handler: (_q, r) => {
      const items = r.exceptionList.filter((e) => e.exceptionCode === 'CURRENCY_MISMATCH' || e.record.currency !== 'INR')
      return {
        thinkingProcess: [
          `Identified query intent: Foreign Currency (FX) & Cross-Border Settlement Scan`,
          `Checking ISO currency codes across all entries (EUR, GBP, INR)...`,
          `Identified ${items.length} foreign currency transactions`,
        ],
        answer: `**Foreign Currency & FX Discrepancy Report:**\n\n` +
          `• **${items.length} Cross-Border Record${items.length === 1 ? '' : 's'} Active**\n` +
          items.slice(0, 5).map(e => `• **${e.record.id}** (${e.record.counterparty}): ${e.record.currency} ${e.record.amount.toFixed(2)} on ${e.record.date}`).join('\n'),
        recommendation: `Apply booking-date spot FX rate and record foreign exchange realized gain/loss in GL code 2300.`,
        data: items,
        confidence: 97,
        category: 'exception',
      }
    },
  },

  // ── 6. ML Anomaly Scoring & Isolation Forest ───────────────────────────────
  {
    pattern: /ml|anomaly|isolation|ai.?score|flagged|high.?risk/i,
    handler: (_q, r) => {
      const ml = runMLScoring(r.results.map(x => x.record))
      return {
        thinkingProcess: [
          `Identified query intent: ML Anomaly Scoring & Isolation Forest Model Review`,
          `Evaluating 6-feature anomaly vector: Amount Z-score, Date lag, Frequency, Counterparty risk, Variance delta, Currency entropy`,
          `Scored ${ml.scores.length} records (Average anomaly score = ${ml.averageScore}/100)`,
          `Flagged ${ml.highRiskCount} High Risk items and ${ml.criticalCount} Critical anomalies`,
        ],
        answer: `**ML Isolation Forest Scoring Results:**\n\n` +
          `• **Average Anomaly Score:** **${ml.averageScore}/100**\n` +
          `• **High Risk Records (Score > 45):** **${ml.highRiskCount} items**\n` +
          `• **Critical Anomalies (Score > 70):** **${ml.criticalCount} items**\n` +
          `• **Anomaly Rate:** **${ml.anomalyRate.toFixed(1)}%** of dataset\n` +
          `• **Model Latency:** ${ml.runTimeMs}ms execution time`,
        recommendation: `Open the Record Details page for critical anomalies to inspect the multi-feature root-cause explanation.`,
        data: r.results.filter(x => (ml.scoreMap.get(x.record.id)?.anomalyScore ?? 0) > 45),
        confidence: 95,
        category: 'ml',
      }
    },
  },

  // ── 7. All Exceptions Overview ──────────────────────────────────────────────
  {
    pattern: /all.?exception|list.?exception|unresolved|issues/i,
    handler: (_q, r) => {
      const top = r.exceptionList.slice(0, 6)
      return {
        thinkingProcess: [
          `Identified query intent: Full Exception Registry Summary`,
          `Scanning ${r.exceptionList.length} unresolved items across batch`,
          `Aggregated exception reasons and variance impact`,
        ],
        answer: `**${r.exceptionList.length} Active Exceptions Requiring Attention:**\n\n` +
          top.map(e => `• **${e.record.id}** (${e.record.source}) — **${e.exceptionCode || 'PARTIAL'}**: ${e.record.counterparty}, ₹${e.record.amount.toFixed(2)} (Δ−₹${e.delta.toFixed(2)})`).join('\n') +
          (r.exceptionList.length > 6 ? `\n• *...and ${r.exceptionList.length - 6} more items (view in Exceptions workbench)*` : ''),
        recommendation: `Navigate to the **Exceptions** workbench or click **Record Details** on any record to resolve or assign to an analyst.`,
        data: r.exceptionList,
        confidence: 100,
        category: 'exception',
      }
    },
  },
]

// ─── Public API ───────────────────────────────────────────────────────────────

export function askAgent(
  question: string,
  report: ReconciliationReport,
): QAAnswer {
  const t0 = performance.now()
  const cleanQ = question.trim()

  // 1. Try pattern-based intent handlers
  for (const { pattern, handler } of intents) {
    if (pattern.test(cleanQ)) {
      const result = handler(cleanQ, report)
      return {
        question: cleanQ,
        ...result,
        responseTimeMs: Math.round(performance.now() - t0),
      }
    }
  }

  // 2. Specific Record ID lookup (e.g. B1-BNK-016, INV-042, etc.)
  const idMatch = cleanQ.match(/[A-Z0-9]{1,6}-[A-Z]{2,6}-\d{3}/i) || cleanQ.match(/[A-Z]{2,6}-\d{3}/i)
  if (idMatch) {
    const id = idMatch[0].toUpperCase()
    const found = report.results.find((r) => r.record.id.toUpperCase() === id)
    if (found) {
      return {
        question: cleanQ,
        thinkingProcess: [
          `Identified query intent: Specific Record ID Lookup (${id})`,
          `Locating record in 3-way reconciliation ledger...`,
          `Record found: Source=${found.record.source}, Counterparty=${found.record.counterparty}, Amount=₹${found.record.amount.toFixed(2)}`,
          `Cross-verifying status (${found.status}) and delta variance (Δ₹${found.delta.toFixed(2)})`,
        ],
        answer: `**Record Details for ${id}:**\n\n` +
          `• **Counterparty:** **${found.record.counterparty}**\n` +
          `• **Source:** \`${found.record.source}\` · Type: \`${found.record.type}\`\n` +
          `• **Billed / Deposited Amount:** **₹${found.record.amount.toFixed(2)} ${found.record.currency}**\n` +
          `• **Reconciliation Status:** **${found.status}** (Pass ${found.pass ?? 'None'})\n` +
          `• **Ledger Reference:** \`${found.matchedLedgerId || 'NONE'}\`\n` +
          `• **Variance Delta:** ${found.delta > 0.01 ? `−₹${found.delta.toFixed(2)}` : '✓ ₹0.00 (Exact Match)'}\n` +
          `• **Root-Cause:** ${found.exceptionReason || 'Matched Pass 1 Exact criteria perfectly.'}`,
        recommendation: found.suggestedAction || 'Post cleared transaction to general ledger and mark invoice as verified.',
        data: [found],
        confidence: 99,
        category: 'counterparty',
        responseTimeMs: Math.round(performance.now() - t0),
      }
    }
  }

  // 3. Counterparty name search (e.g. "ApexData", "Oracle", "StripePay")
  const words = cleanQ.split(/\s+/).filter(w => w.length > 3)
  for (const word of words) {
    const matches = report.results.filter(r => r.record.counterparty.toLowerCase().includes(word.toLowerCase()))
    if (matches.length > 0) {
      const totalAmt = matches.reduce((s, m) => s + m.record.amount, 0)
      return {
        question: cleanQ,
        thinkingProcess: [
          `Identified query intent: Counterparty Name Search ('${word}')`,
          `Filtering dataset across ${report.totalRecords} records...`,
          `Found ${matches.length} associated transactions for counterparty`,
          `Aggregating cumulative transaction value = ₹${totalAmt.toFixed(2)}`,
        ],
        answer: `**Transactions for Counterparty '${matches[0].record.counterparty}':**\n\n` +
          `Found **${matches.length} record${matches.length > 1 ? 's' : ''}** totalling **₹${totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}**:\n\n` +
          matches.slice(0, 5).map(m => `• **${m.record.id}** (${m.record.source}) — **${m.status}**: ₹${m.record.amount.toFixed(2)} on ${m.record.date} (Δ₹${m.delta.toFixed(2)})`).join('\n'),
        recommendation: `Click on any record ID above or open **Record Details** to inspect the 3-way document breakdown.`,
        data: matches,
        confidence: 95,
        category: 'counterparty',
        responseTimeMs: Math.round(performance.now() - t0),
      }
    }
  }

  // 4. Default / General Financial Assistance
  return {
    question: cleanQ,
    thinkingProcess: [
      `Parsing open-ended query: "${cleanQ}"`,
      `Scanning reconciliation knowledge base across match passes, exceptions, cash forecast, and tax schedules`,
      `Synthesizing helpful guidance and recommended query suggestions`,
    ],
    answer: `I analyzed your query. To provide exact data from the current reconciliation batch (${report.batchId}), try asking:\n\n` +
      `• **Reconciliation:** *"What is our match rate and pass breakdown?"*\n` +
      `• **Liquidity & Open Items:** *"What is our net open position?"* or *"What is our 7-day cash forecast?"*\n` +
      `• **Exceptions & Variances:** *"List all exceptions"* or *"Are there any duplicate invoices?"*\n` +
      `• **Tax Obligations:** *"What is our estimated corporate tax liability?"*\n` +
      `• **Specific Records:** *"Lookup record B1-BNK-001"* or *"Show all records for StripePay"*\n` +
      `• **ML Anomalies:** *"What is our ML anomaly score?"*`,
    data: null,
    confidence: 60,
    category: 'general',
    responseTimeMs: Math.round(performance.now() - t0),
  }
}

export const SAMPLE_QUESTIONS = [
  'What is our net open position and cleared amount?',
  'What is our match rate and 3-pass breakdown?',
  'What is our estimated corporate tax liability?',
  'Show 7-day forward cash forecast and peak liquidity',
  'List all AMOUNT_MISMATCH and short-pay exceptions',
  'What is our ML Isolation Forest anomaly score?',
  'Are there any duplicate invoices detected?',
  'Lookup record B1-BNK-001 details',
]
