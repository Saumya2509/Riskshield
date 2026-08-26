// ─── Finance Context ──────────────────────────────────────────────────────────
// Shared state between Finance Controller and Dashboard.
// Wrap <App> with <FinanceContextProvider> — persists all reconciliation,
// ML anomaly scoring, exceptions, and defended tax notices across browser refreshes.
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { ReconciliationReport, MatchResult, MatchPass } from './reconciliationEngine'
import { runReconciliation } from './reconciliationEngine'
import type { MLBatchResult } from './mlScorer'
import { runMLScoring } from './mlScorer'
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

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`rs_${key}`)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`rs_${key}`, JSON.stringify(val))
  } catch {
    /* localStorage quota or private mode fallback */
  }
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
  // Initialize state from localStorage so page reload never wipes data
  const [report, setReportState] = useState<ReconciliationReport | null>(() => {
    const cached = loadStorage<ReconciliationReport | null>('active_report', null)
    if (cached) return cached
    const initial = runReconciliation()
    saveStorage('active_report', initial)
    return initial
  })

  const [mlResult, setMLResultState] = useState<MLBatchResult | null>(() => {
    const cached = loadStorage<MLBatchResult | null>('ml_result', null)
    if (cached) return cached
    const initialReport = report || runReconciliation()
    const ml = runMLScoring(initialReport.results.map(r => r.record))
    saveStorage('ml_result', ml)
    return ml
  })

  const [lastRunAt, setLastRunAt] = useState<Date | null>(() => {
    const cached = loadStorage<string | null>('last_run_at', null)
    return cached ? new Date(cached) : new Date()
  })

  const [activeFileName, setActiveFileNameState] = useState<string | null>(() => {
    return loadStorage<string | null>('active_filename', 'batch_1_enterprise_recon_500.csv')
  })

  const [recordCount, setRecordCountState] = useState<number>(() => {
    return loadStorage<number>('record_count', 500)
  })

  const [resolvedMap, setResolvedMap] = useState<Record<string, ResolutionFix>>(() => {
    return loadStorage<Record<string, ResolutionFix>>('resolved_map', {})
  })

  const [defendedNotices, setDefendedNotices] = useState<Record<string, DefendedNotice>>(() => {
    return loadStorage<Record<string, DefendedNotice>>('defended_notices', {})
  })

  // Auto-sync state changes to localStorage
  useEffect(() => {
    if (report) saveStorage('active_report', report)
  }, [report])

  useEffect(() => {
    if (mlResult) saveStorage('ml_result', mlResult)
  }, [mlResult])

  useEffect(() => {
    saveStorage('resolved_map', resolvedMap)
  }, [resolvedMap])

  useEffect(() => {
    saveStorage('defended_notices', defendedNotices)
  }, [defendedNotices])

  useEffect(() => {
    if (activeFileName) saveStorage('active_filename', activeFileName)
  }, [activeFileName])

  useEffect(() => {
    saveStorage('record_count', recordCount)
  }, [recordCount])

  useEffect(() => {
    if (lastRunAt) saveStorage('last_run_at', lastRunAt.toISOString())
  }, [lastRunAt])

  function setReport(r: ReconciliationReport) {
    setReportState(r)
    const now = new Date()
    setLastRunAt(now)
    saveStorage('active_report', r)
    saveStorage('last_run_at', now.toISOString())
  }

  function setMLResult(r: MLBatchResult) {
    setMLResultState(r)
    saveStorage('ml_result', r)
  }

  function setActiveFileName(name: string) {
    setActiveFileNameState(name)
    saveStorage('active_filename', name)
  }

  function setRecordCount(count: number) {
    setRecordCountState(count)
    saveStorage('record_count', count)
  }

  function applyFix(recordId: string, fix: ResolutionFix) {
    setResolvedMap(prev => {
      const next = { ...prev, [recordId]: fix }
      saveStorage('resolved_map', next)
      return next
    })
  }

  function resetFixes() {
    setResolvedMap({})
    saveStorage('resolved_map', {})
  }

  function defendNotice(recordId: string, info: DefendedNotice) {
    setDefendedNotices(prev => {
      const next = { ...prev, [recordId]: info }
      saveStorage('defended_notices', next)
      return next
    })
  }

  function resetDefendedNotices() {
    setDefendedNotices({})
    saveStorage('defended_notices', {})
  }

  function resetReconciliation() {
    const fresh = runReconciliation()
    const ml = runMLScoring(fresh.results.map(r => r.record))
    setReportState(fresh)
    setMLResultState(ml)
    setActiveFileNameState('batch_1_enterprise_recon_500.csv')
    setRecordCountState(500)
    setLastRunAt(new Date())
    setResolvedMap({})
    setDefendedNotices({})

    saveStorage('active_report', fresh)
    saveStorage('ml_result', ml)
    saveStorage('active_filename', 'batch_1_enterprise_recon_500.csv')
    saveStorage('record_count', 500)
    saveStorage('resolved_map', {})
    saveStorage('defended_notices', {})
    saveStorage('last_run_at', new Date().toISOString())
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
    const now = new Date()
    setLastRunAt(now)
    saveStorage('active_report', updatedReport)
    saveStorage('last_run_at', now.toISOString())

    // Sync to Supabase in background
    syncReportToSupabase(updatedReport, activeFileName || 'batch_1_enterprise_recon_500.csv').catch(err => {
      console.warn('Could not sync updated report to Supabase:', err)
    })

    return updatedReport
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
