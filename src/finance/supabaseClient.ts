import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { ReconciliationReport, MatchResult } from './reconciliationEngine'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let cachedClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null

  if (!cachedClient) {
    try {
      cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: true },
      })
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err)
      return null
    }
  }
  return cachedClient
}

/** Sync entire reconciliation report and matches to Supabase */
export async function syncReportToSupabase(
  report: ReconciliationReport,
  fileName: string = 'batch_1_enterprise_recon_500.csv'
): Promise<{ success: boolean; insertedCount: number; error?: string }> {
  const client = getSupabaseClient()
  if (!client) {
    return { success: false, insertedCount: 0, error: 'Supabase is not configured in .env.local' }
  }

  try {
    // 1. Record Reconciliation Run Metadata
    const runPayload = {
      file_name: fileName,
      total_records: report.totalRecords,
      exact_matches: report.exactMatches,
      fuzzy_matches: report.fuzzyMatches,
      partial_matches: report.partialMatches,
      exceptions_count: report.exceptions,
      match_rate: report.matchRate,
      cleared_amount: report.clearedAmount,
      open_exception_amount: report.openAmount,
      run_time_ms: report.runTimeMs,
      status: 'COMPLETED',
    }

    await client
      .from('reconciliation_runs')
      .insert(runPayload)

    // 2. Insert/Upsert Match Rows (in chunks of 100)
    const rows = report.results.map((r: MatchResult) => ({
      record_id: r.record.id,
      source: r.record.source,
      counterparty: r.record.counterparty,
      currency: r.record.currency,
      invoice_amount: r.record.amount,
      matched_ledger_id: r.matchedLedgerId,
      delta: r.delta,
      match_pass: r.pass,
      status: r.status,
      confidence: r.confidence,
      exception_code: r.exceptionCode,
      explanation: r.exceptionReason || r.suggestedAction,
      created_at: new Date().toISOString(),
    }))

    const CHUNK_SIZE = 100
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE)
      const { error } = await client
        .from('reconciliation_matches')
        .upsert(chunk, { onConflict: 'record_id' })

      if (error && error.code !== '42P01') {
        console.warn('Chunk upload warning:', error)
      }
    }

    return { success: true, insertedCount: rows.length }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, insertedCount: 0, error: msg }
  }
}

/** Update individual record resolution or analyst assignment in Supabase */
export async function updateRecordInSupabase(
  recordId: string,
  updates: { is_resolved?: boolean; assigned_analyst?: string; resolution_notes?: string }
): Promise<boolean> {
  const client = getSupabaseClient()
  if (!client) return false

  try {
    const { error } = await client
      .from('reconciliation_matches')
      .update(updates)
      .eq('record_id', recordId)

    return !error
  } catch {
    return false
  }
}
