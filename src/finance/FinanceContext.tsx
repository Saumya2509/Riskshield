// ─── Finance Context ──────────────────────────────────────────────────────────
// Shared state between Finance Controller and Dashboard.
// Uses sessionStorage so data persists across browser refreshes (F5),
// but automatically resets to clean state when the browser tab/window is closed.
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect } from 'react'
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
  applyBatchFixes: (fixes: Record<string, ResolutionFix>) => void
  resetFixes: () => void
  defendNotice: (recordId: string, info: DefendedNotice) => void
  resetDefendedNotices: () => void
  saveFixesToMultiSource: (overrideFixes?: Record<string, ResolutionFix>) => ReconciliationReport | null
}

function loadSession<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(`rs_${key}`)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveSession<T>(key: string, val: T): void {
  try {
    sessionStorage.setItem(`rs_${key}`, JSON.stringify(val))
  } catch {
    /* sessionStorage quota or private mode fallback */
  }
}

// ── MLBatchResult has a Map (scoreMap) which JSON.stringify drops.
// We serialize it as an array of entries and reconstruct on load.
function saveMLResult(val: MLBatchResult): void {
  try {
    const serializable = {
      ...val,
      scoreMap: val.scoreMap instanceof Map ? Array.from(val.scoreMap.entries()) : [],
    }
    sessionStorage.setItem('rs_ml_result', JSON.stringify(serializable))
  } catch { /* quota */ }
}

function loadMLResult(): MLBatchResult | null {
  try {
    const raw = sessionStorage.getItem('rs_ml_result')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Reconstruct scoreMap as a real Map
    if (parsed && parsed.scoreMap) {
      if (Array.isArray(parsed.scoreMap)) {
        parsed.scoreMap = new Map(parsed.scoreMap)
      } else if (parsed.scores && Array.isArray(parsed.scores)) {
        // Fallback: rebuild from scores array
        parsed.scoreMap = new Map(parsed.scores.map((s: { recordId: string }) => [s.recordId, s]))
      } else {
        parsed.scoreMap = new Map()
      }
    } else if (parsed && parsed.scores) {
      parsed.scoreMap = new Map(parsed.scores.map((s: { recordId: string }) => [s.recordId, s]))
    }
    return parsed as MLBatchResult
  } catch {
    return null
  }
}

const FinanceContext = createContext<FinanceContextType>({
  report: null,
  mlResult: null,
  lastRunAt: null,
  activeFileName: null,
  recordCount: 0,
  resolvedMap: {},
  defendedNotices: {},
  setReport: () => {},
  setMLResult: () => {},
  setActiveFileName: () => {},
  setRecordCount: () => {},
  resetReconciliation: () => {},
  applyFix: () => {},
  applyBatchFixes: () => {},
  resetFixes: () => {},
  defendNotice: () => {},
  resetDefendedNotices: () => {},
  saveFixesToMultiSource: () => null,
})

export function FinanceContextProvider({ children }: { children: ReactNode }) {
  // Initialize state from sessionStorage (persists across page reload/F5, wipes on close)
  const [report, setReportState] = useState<ReconciliationReport | null>(() => {
    return loadSession<ReconciliationReport | null>('active_report', null)
  })

  const [mlResult, setMLResultState] = useState<MLBatchResult | null>(() => {
    return loadMLResult()
  })

  const [lastRunAt, setLastRunAt] = useState<Date | null>(() => {
    const cached = loadSession<string | null>('last_run_at', null)
    return cached ? new Date(cached) : null
  })

  const [activeFileName, setActiveFileNameState] = useState<string | null>(() => {
    return loadSession<string | null>('active_filename', null)
  })

  const [recordCount, setRecordCountState] = useState<number>(() => {
    return loadSession<number>('record_count', 0)
  })

  const [resolvedMap, setResolvedMap] = useState<Record<string, ResolutionFix>>(() => {
    return loadSession<Record<string, ResolutionFix>>('resolved_map', {})
  })

  const [defendedNotices, setDefendedNotices] = useState<Record<string, DefendedNotice>>(() => {
    return loadSession<Record<string, DefendedNotice>>('defended_notices', {})
  })

  // Auto-sync state changes to sessionStorage
  useEffect(() => {
    if (report) saveSession('active_report', report)
    else sessionStorage.removeItem('rs_active_report')
  }, [report])

  useEffect(() => {
    if (mlResult) saveMLResult(mlResult)
    else sessionStorage.removeItem('rs_ml_result')
  }, [mlResult])

  useEffect(() => {
    saveSession('resolved_map', resolvedMap)
  }, [resolvedMap])

  useEffect(() => {
    saveSession('defended_notices', defendedNotices)
  }, [defendedNotices])

  useEffect(() => {
    if (activeFileName) saveSession('active_filename', activeFileName)
    else sessionStorage.removeItem('rs_active_filename')
  }, [activeFileName])

  useEffect(() => {
    saveSession('record_count', recordCount)
  }, [recordCount])

  useEffect(() => {
    if (lastRunAt) saveSession('last_run_at', lastRunAt.toISOString())
    else sessionStorage.removeItem('rs_last_run_at')
  }, [lastRunAt])

  function setReport(r: ReconciliationReport) {
    // If switching to a different batch, reset resolved map so old batch fixes don't linger
    if (report && report.batchId !== r.batchId) {
      setResolvedMap({})
      saveSession('resolved_map', {})
    }
    setReportState(r)
    const now = new Date()
    setLastRunAt(now)
    saveSession('active_report', r)
    saveSession('last_run_at', now.toISOString())
  }

  function setMLResult(r: MLBatchResult) {
    setMLResultState(r)
    saveMLResult(r)
  }

  function setActiveFileName(name: string) {
    setActiveFileNameState(name)
    saveSession('active_filename', name)
  }

  function setRecordCount(count: number) {
    setRecordCountState(count)
    saveSession('record_count', count)
  }

  function applyFix(recordId: string, fix: ResolutionFix) {
    setResolvedMap(prev => {
      const next = { ...prev, [recordId]: fix }
      saveSession('resolved_map', next)
      return next
    })
  }

  function applyBatchFixes(newFixes: Record<string, ResolutionFix>) {
    setResolvedMap(prev => {
      const next = { ...prev, ...newFixes }
      saveSession('resolved_map', next)
      return next
    })
  }

  function resetFixes() {
    setResolvedMap({})
    saveSession('resolved_map', {})
  }

  function defendNotice(recordId: string, info: DefendedNotice) {
    setDefendedNotices(prev => {
      const next = { ...prev, [recordId]: info }
      saveSession('defended_notices', next)
      return next
    })
  }

  function resetDefendedNotices() {
    setDefendedNotices({})
    saveSession('defended_notices', {})
  }

  function resetReconciliation() {
    setReportState(null)
    setMLResultState(null)
    setActiveFileNameState(null)
    setRecordCountState(0)
    setLastRunAt(null)
    setResolvedMap({})
    setDefendedNotices({})

    sessionStorage.clear()
  }

  function saveFixesToMultiSource(overrideFixes?: Record<string, ResolutionFix>): ReconciliationReport | null {
    const base = report || runReconciliation()
    if (!base) return null

    const effectiveFixes = overrideFixes ? { ...resolvedMap, ...overrideFixes } : resolvedMap

    // Update each record according to effectiveFixes
    const updatedResults: MatchResult[] = base.results.map((r: MatchResult) => {
      const fix = effectiveFixes[r.record.id]
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
    saveSession('active_report', updatedReport)
    saveSession('last_run_at', now.toISOString())

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
      applyFix, applyBatchFixes, resetFixes, defendNotice, resetDefendedNotices, saveFixesToMultiSource
    }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinanceContext() {
  return useContext(FinanceContext)
}
