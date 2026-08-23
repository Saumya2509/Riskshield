// ─── Finance Context ──────────────────────────────────────────────────────────
// Shared state between Finance Controller and Dashboard.
// Wrap <App> with <FinanceContextProvider> — any page can read/write results.
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { ReconciliationReport } from './reconciliationEngine'
import type { MLBatchResult } from './mlScorer'

export interface ResolutionFix {
  method: string
  note: string
  timestamp: string
}

interface FinanceContextType {
  report: ReconciliationReport | null
  mlResult: MLBatchResult | null
  lastRunAt: Date | null
  activeFileName: string | null
  recordCount: number
  resolvedMap: Record<string, ResolutionFix>
  setReport: (r: ReconciliationReport) => void
  setMLResult: (r: MLBatchResult) => void
  setActiveFileName: (name: string) => void
  setRecordCount: (count: number) => void
  resetReconciliation: () => void
  applyFix: (recordId: string, fix: ResolutionFix) => void
  autoFixAll: () => void
  resetFixes: () => void
}

const FinanceContext = createContext<FinanceContextType>({
  report: null,
  mlResult: null,
  lastRunAt: null,
  activeFileName: null,
  recordCount: 500,
  resolvedMap: {},
  setReport: () => {},
  setMLResult: () => {},
  setActiveFileName: () => {},
  setRecordCount: () => {},
  resetReconciliation: () => {},
  applyFix: () => {},
  autoFixAll: () => {},
  resetFixes: () => {},
})

export function FinanceContextProvider({ children }: { children: ReactNode }) {
  const [report, setReportState] = useState<ReconciliationReport | null>(null)
  const [mlResult, setMLResultState] = useState<MLBatchResult | null>(null)
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null)
  const [activeFileName, setActiveFileName] = useState<string | null>(null)
  const [recordCount, setRecordCount] = useState<number>(500)
  const [resolvedMap, setResolvedMap] = useState<Record<string, ResolutionFix>>({})

  function setReport(r: ReconciliationReport) {
    setReportState(r)
    setLastRunAt(new Date())
  }

  function setMLResult(r: MLBatchResult) {
    setMLResultState(r)
  }

  function applyFix(recordId: string, fix: ResolutionFix) {
    setResolvedMap(prev => ({ ...prev, [recordId]: fix }))
  }

  function autoFixAll() {
    if (!report) return
    const newFixes: Record<string, ResolutionFix> = {}
    const now = new Date().toLocaleTimeString()

    for (const item of report.exceptionList) {
      const code = item.exceptionCode || 'AMOUNT_MISMATCH'
      let method = 'Debit Memo Raised'
      let note = `Raised Debit Memo #DM-${item.record.id.slice(-3)} for ₹${item.delta.toFixed(2)}`

      if (code === 'MISSING_REF') {
        method = 'Suspense Allocated'
        note = `Posted ₹${item.record.amount.toLocaleString('en-IN')} to Suspense GL 2190`
      } else if (code === 'CURRENCY_MISMATCH') {
        method = 'Spot FX Converted'
        note = 'Applied booking spot FX rate @ ₹83.40; realized gain/loss booked'
      } else if (code === 'DUPLICATE') {
        method = 'Duplicate Voided'
        note = 'Voided duplicate billing entry #2; primary charge cleared'
      } else if (code === 'ORPHAN_LEDGER' || code === 'NO_MATCH') {
        method = 'Accrual Reversed'
        note = 'Reversed uncollected accrual journal entry for period close'
      }

      newFixes[item.record.id] = { method, note, timestamp: now }
    }

    setResolvedMap(newFixes)
  }

  function resetFixes() {
    setResolvedMap({})
  }

  function resetReconciliation() {
    setReportState(null)
    setMLResultState(null)
    setActiveFileName(null)
    setLastRunAt(null)
    setResolvedMap({})
  }

  return (
    <FinanceContext.Provider value={{
      report, mlResult, lastRunAt, activeFileName, recordCount, resolvedMap,
      setReport, setMLResult, setActiveFileName, setRecordCount, resetReconciliation,
      applyFix, autoFixAll, resetFixes
    }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinanceContext() {
  return useContext(FinanceContext)
}
