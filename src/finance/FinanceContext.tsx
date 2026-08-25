// ─── Finance Context ──────────────────────────────────────────────────────────
// Shared state between Finance Controller and Dashboard.
// Wrap <App> with <FinanceContextProvider> — any page can read/write results.
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { ReconciliationReport, MatchResult, MatchPass } from './reconciliationEngine'
import { runReconciliation } from './reconciliationEngine'
import type { MLBatchResult } from './mlScorer'
import { syncReportToSupabase } from './supabaseClient'

export interface ResolutionFix {
  method: string
  note: string
  timestamp: string
}

export interface DefendedNotice {
  method: string
  certNumber: string
  penaltyMitigated: number
  timestamp: string
}

interface FinanceContextType {
  report: ReconciliationReport | null
  mlResult: MLBatchResult | null
  lastRunAt: Date | null
  activeFileName: string | null
  recordCount: number
  resolvedMap: Record<string, ResolutionFix>
  defendedNotices: Record<string, DefendedNotice>
  setReport: (r: ReconciliationReport) => void
  setMLResult: (r: MLBatchResult) => void
  setActiveFileName: (name: string) => void
  setRecordCount: (count: number) => void
  resetReconciliation: () => void
  applyFix: (recordId: string, fix: ResolutionFix) => void
  resetFixes: () => void
  defendNotice: (recordId: string, info: DefendedNotice) => void
  resetDefendedNotices: () => void
  saveFixesToMultiSource: () => ReconciliationReport | null
}

const FinanceContext = createContext<FinanceContextType>({
  report: null,
  mlResult: null,
  lastRunAt: null,
  activeFileName: null,
  recordCount: 500,
  resolvedMap: {},
  defendedNotices: {},
  setReport: () => {},
  setMLResult: () => {},
  setActiveFileName: () => {},
  setRecordCount: () => {},
  resetReconciliation: () => {},
  applyFix: () => {},
  resetFixes: () => {},
  defendNotice: () => {},
  resetDefendedNotices: () => {},
  saveFixesToMultiSource: () => null,
})

export function FinanceContextProvider({ children }: { children: ReactNode }) {
  const [report, setReportState] = useState<ReconciliationReport | null>(null)
  const [mlResult, setMLResultState] = useState<MLBatchResult | null>(null)
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null)
  const [activeFileName, setActiveFileName] = useState<string | null>(null)
  const [recordCount, setRecordCount] = useState<number>(500)
  const [resolvedMap, setResolvedMap] = useState<Record<string, ResolutionFix>>({})
  const [defendedNotices, setDefendedNotices] = useState<Record<string, DefendedNotice>>({})

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

  function resetFixes() {
    setResolvedMap({})
  }

  function saveFixesToMultiSource(): ReconciliationReport | null {
    const base = report || runReconciliation()
    if (!base) return null

    // Update each record according to resolvedMap
    const updatedResults: MatchResult[] = base.results.map((r: MatchResult) => {
      const fix = resolvedMap[r.record.id]
      if (!fix) return r

      return {
        ...r,
        status: 'Exact' as const,
        pass: (r.pass || 1) as MatchPass,
        confidence: 100,
        delta: 0,
        deltaPct: 0,
        exceptionCode: null,
        exceptionReason: `Resolved via ${fix.method}. ${fix.note}`,
        suggestedAction: `[Fixed] ${fix.note}`,
      }
    })

    const exactCount = updatedResults.filter(r => r.status === 'Exact').length
    const fuzzyCount = updatedResults.filter(r => r.status === 'Fuzzy').length
    const partialCount = updatedResults.filter(r => r.status === 'Partial').length
    const remainingExceptions = updatedResults.filter(r => r.status === 'Exception')
    const clearedAmt = updatedResults.filter(r => r.status === 'Exact' || r.status === 'Fuzzy').reduce((s, r) => s + r.record.amount, 0)
    const openAmt = remainingExceptions.reduce((s, r) => s + r.delta, 0)
    const matchRate = base.totalAttempts > 0 ? ((base.totalAttempts - remainingExceptions.length) / base.totalAttempts) * 100 : 100

    const updatedReport: ReconciliationReport = {
      ...base,
      results: updatedResults,
      exactMatches: exactCount,
      fuzzyMatches: fuzzyCount,
      partialMatches: partialCount,
      exceptions: remainingExceptions.length,
      exceptionList: remainingExceptions,
      clearedAmount: clearedAmt,
      openAmount: openAmt,
      matchRate,
      accuracy: Math.min(100, (exactCount + fuzzyCount) / Math.max(1, base.totalAttempts) * 100),
    }

    setReportState(updatedReport)
    setLastRunAt(new Date())

    // Sync to Supabase in background
    syncReportToSupabase(updatedReport, activeFileName || 'batch_1_enterprise_recon_500.csv').catch(err => {
      console.warn('Could not sync updated report to Supabase:', err)
    })

    return updatedReport
  }

  function defendNotice(recordId: string, info: DefendedNotice) {
    setDefendedNotices(prev => ({ ...prev, [recordId]: info }))
  }

  function resetDefendedNotices() {
    setDefendedNotices({})
  }

  function resetReconciliation() {
    setReportState(null)
    setMLResultState(null)
    setActiveFileName(null)
    setLastRunAt(null)
    setResolvedMap({})
    setDefendedNotices({})
  }

  return (
    <FinanceContext.Provider value={{
      report, mlResult, lastRunAt, activeFileName, recordCount, resolvedMap, defendedNotices,
      setReport, setMLResult, setActiveFileName, setRecordCount, resetReconciliation,
      applyFix, resetFixes, defendNotice, resetDefendedNotices, saveFixesToMultiSource
    }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinanceContext() {
  return useContext(FinanceContext)
}
