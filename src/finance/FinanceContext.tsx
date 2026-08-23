// ─── Finance Context ──────────────────────────────────────────────────────────
// Shared state between Finance Controller and Dashboard.
// Wrap <App> with <FinanceContextProvider> — any page can read/write results.
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { ReconciliationReport } from './reconciliationEngine'
import type { MLBatchResult } from './mlScorer'

interface FinanceContextType {
  report: ReconciliationReport | null
  mlResult: MLBatchResult | null
  lastRunAt: Date | null
  activeFileName: string | null
  recordCount: number
  setReport: (r: ReconciliationReport) => void
  setMLResult: (r: MLBatchResult) => void
  setActiveFileName: (name: string) => void
  setRecordCount: (count: number) => void
  resetReconciliation: () => void
}

const FinanceContext = createContext<FinanceContextType>({
  report: null,
  mlResult: null,
  lastRunAt: null,
  activeFileName: null,
  recordCount: 500,
  setReport: () => {},
  setMLResult: () => {},
  setActiveFileName: () => {},
  setRecordCount: () => {},
  resetReconciliation: () => {},
})

export function FinanceContextProvider({ children }: { children: ReactNode }) {
  const [report, setReportState] = useState<ReconciliationReport | null>(null)
  const [mlResult, setMLResultState] = useState<MLBatchResult | null>(null)
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null)
  const [activeFileName, setActiveFileName] = useState<string | null>(null)
  const [recordCount, setRecordCount] = useState<number>(500)

  function setReport(r: ReconciliationReport) {
    setReportState(r)
    setLastRunAt(new Date())
  }

  function setMLResult(r: MLBatchResult) {
    setMLResultState(r)
  }

  function resetReconciliation() {
    setReportState(null)
    setMLResultState(null)
    setActiveFileName(null)
    setLastRunAt(null)
  }

  return (
    <FinanceContext.Provider value={{
      report, mlResult, lastRunAt, activeFileName, recordCount,
      setReport, setMLResult, setActiveFileName, setRecordCount, resetReconciliation
    }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinanceContext() {
  return useContext(FinanceContext)
}
