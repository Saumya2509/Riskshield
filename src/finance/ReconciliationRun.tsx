import { useState, useEffect, useRef } from 'react'
import type { ReconciliationReport, MatchResult } from './reconciliationEngine'
import { runReconciliation } from './reconciliationEngine'
import { runMLScoring } from './mlScorer'
import { useFinanceContext } from './FinanceContext'
import { parseCSV, generateBatchSet, BATCH_INFO } from './csvService'
import { syncReportToSupabase } from './supabaseClient'
import type { FinanceRecord } from './financeData'
import MultiSourceDropZone from './MultiSourceDropZone'

interface Props {
  onComplete: (report: ReconciliationReport) => void
}

type Phase = 'idle' | 'loading' | 'pass1' | 'pass2' | 'pass3' | 'ml' | 'exceptions' | 'done'

function srcStyle(s: string) {
  if (s === 'BANK')   return 'fin-src fin-src--bank'
  if (s === 'LEDGER') return 'fin-src fin-src--ledger'
  return 'fin-src fin-src--inv'
}

function reconTag(status: string) {
  if (status === 'Exact')     return <span className="fin-tag fin-tag--safe">Exact</span>
  if (status === 'Fuzzy')     return <span className="fin-tag fin-tag--fuzzy">Fuzzy</span>
  if (status === 'Partial')   return <span className="fin-tag fin-tag--partial">Partial</span>
  if (status === 'Exception') return <span className="fin-tag fin-tag--critical">Exception</span>
  return null
}

export default function ReconciliationRun({ onComplete }: Props) {
  const ctx = useFinanceContext()
  const [phase, setPhase]         = useState<Phase>(ctx.report ? 'done' : 'idle')
  const [activeIdx, setActiveIdx] = useState(ctx.report ? 5 : -1)
  const [rows, setRows]           = useState<MatchResult[]>(ctx.report ? ctx.report.results : [])
  const [report, setReport]       = useState<ReconciliationReport | null>(ctx.report)
  const [activeFileName, setActiveFileName] = useState<string>(ctx.activeFileName || 'batch_1_enterprise_recon_500.csv')
  const [recordCount, setRecordCount] = useState<number>(ctx.recordCount || (ctx.report ? ctx.report.totalRecords : 500))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [actionedIds, setActionedIds] = useState<Set<string>>(new Set())

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const reportRef = useRef<ReconciliationReport | null>(ctx.report)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (ctx.report && phase === 'idle') {
      setPhase('done')
      setActiveIdx(5)
      setRows(ctx.report.results)
      setReport(ctx.report)
      reportRef.current = ctx.report
      if (ctx.activeFileName) setActiveFileName(ctx.activeFileName)
      if (ctx.recordCount) setRecordCount(ctx.recordCount)
    }
  }, [ctx.report, ctx.activeFileName, ctx.recordCount, phase])

  const STEPS = [
    { phase: 'loading'    as Phase, label: 'Ingest',        sub: `Ingesting ${recordCount} records across BANK, LEDGER & INVOICE…`, ms: 400  },
    { phase: 'pass1'      as Phase, label: 'Pass 1 Exact',  sub: 'Matching exact reference ID + currency + amount…',            ms: 600  },
    { phase: 'pass2'      as Phase, label: 'Pass 2 Fuzzy',  sub: 'Tolerating ±1% fee delta and ±2 day settlement windows…',    ms: 500  },
    { phase: 'pass3'      as Phase, label: 'Pass 3 Partial', sub: 'Scanning short pays, delta discrepancies and disputes…',      ms: 400  },
    { phase: 'ml'         as Phase, label: 'ML Scoring',    sub: 'Evaluating 6-feature Isolation Forest anomaly weights…',       ms: 500  },
    { phase: 'exceptions' as Phase, label: 'Classify',      sub: 'Categorizing exception codes and detecting orphan records…',   ms: 350 },
  ]

  function handleRowAction(id: string) {
    setActionedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleReset() {
    setPhase('idle')
    setActiveIdx(-1)
    setRows([])
    setReport(null)
    reportRef.current = null
    ctx.resetReconciliation()
  }

  function executeReconciliation(
    bank: FinanceRecord[],
    ledger: FinanceRecord[],
    invoices: FinanceRecord[],
    allRecords: FinanceRecord[],
    fileName: string
  ) {
    if (phase !== 'idle' && phase !== 'done') return

    setErrorMessage(null)
    setActiveFileName(fileName)
    setRecordCount(allRecords.length)
    ctx.setActiveFileName(fileName)
    ctx.setRecordCount(allRecords.length)

    setPhase('loading')
    setActiveIdx(0)
    setRows([])
    setReport(null)

    const result = runReconciliation({
      bankStatements: bank,
      ledgerEntries: ledger,
      invoices: invoices,
    })
    reportRef.current = result

    let idx = 0
    function next() {
      const step = STEPS[idx]
      setActiveIdx(idx)
      setPhase(step.phase)

      timer.current = setTimeout(() => {
        idx++
        if (idx < STEPS.length) {
          // Reveal rows progressively per pass
          setRows(prev => {
            const seen = new Set(prev.map(r => r.record.id))
            const add = result.results.filter(r => {
              if (idx === 1) return r.pass === 1
              if (idx === 2) return r.pass === 2
              if (idx === 3) return r.pass === 3
              return true
            })
            return [...prev, ...add.filter(r => !seen.has(r.record.id))]
          })
          next()
        } else {
          const ml = runMLScoring(allRecords)
          setRows(result.results)
          setPhase('done')
          setReport(result)
          ctx.setReport(result)
          ctx.setMLResult(ml)
          onComplete(result)
          // Asynchronously sync to Supabase if configured
          syncReportToSupabase(result, fileName).catch(() => {})
        }
      }, step.ms)
    }
    next()
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = parseCSV(text)
        if (parsed.records.length === 0) {
          setErrorMessage('The selected CSV has no valid transaction rows.')
          return
        }
        executeReconciliation(parsed.bank, parsed.ledger, parsed.invoices, parsed.records, file.name)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid CSV file format'
        setErrorMessage(`CSV Parsing Error: ${msg}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleLoadBatch(batchId: number) {
    const data = generateBatchSet(batchId)
    executeReconciliation(data.bank, data.ledger, data.invoices, data.all, data.filename)
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const running = phase !== 'idle' && phase !== 'done'
  const ml = ctx.mlResult

  return (
    <section className="fin-run-panel">
      {/* Hidden file input for uploading CSV directly */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Header */}
      <div className="fin-run-hd">
        <div>
          <p className="fin-run-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Reconciliation Engine
            {phase === 'done' && (
              <span className="fin-upload-badge">
                📄 {activeFileName} ({recordCount} records)
              </span>
            )}
          </p>
          <p className="fin-run-desc">
            Multi-Source Batch Ingestion · 3-Pass Rule Engine · ML Anomaly Scoring · <strong>BANK · LEDGER · INVOICE</strong>
          </p>
          {phase !== 'idle' && (
            <div className="fin-status-line">
              <span className={`fin-status-dot${running ? ' is-running' : ''}`} />
              <span>
                {phase === 'done'
                  ? `Completed — ${reportRef.current?.results.length} records processed · ${reportRef.current?.runTimeMs}ms run time · ML ${ml?.runTimeMs}ms`
                  : STEPS[activeIdx]?.sub}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {report && (
            <span style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 700 }}>
              ✓ {report.matchRate.toFixed(1)}% Matched ({report.totalRecords} recs)
            </span>
          )}

          {phase === 'done' && (
            <button
              className="fin-run-btn fin-run-btn--secondary"
              onClick={handleReset}
              disabled={running}
              type="button"
              style={{ height: 34, fontSize: '0.78rem' }}
            >
              ↺ Reset &amp; Choose Batch
            </button>
          )}

          {/* Upload CSV Primary Action Button */}
          <button
            className="fin-run-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={running}
            type="button"
            style={{ height: 34, fontSize: '0.8rem' }}
          >
            {running ? (
              <><span className="fin-spinner" />Processing CSV…</>
            ) : (
              '📁 Upload New CSV'
            )}
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div style={{ padding: '12px 24px', background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#991b1b', fontSize: '0.84rem', fontWeight: 600 }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Pipeline steps */}
      {phase !== 'idle' && (
        <div className="fin-pipe">
          {STEPS.map((step, i) => {
            const done   = activeIdx > i || phase === 'done'
            const active = activeIdx === i && !done
            return (
              <div key={step.phase} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div className={`fin-pipe-step${done ? ' is-done' : active ? ' is-active' : ''}`}>
                  <span className="fin-pipe-num">{done ? '✓' : i + 1}</span>
                  <span>{step.label}</span>
                </div>
                {i < STEPS.length - 1 && <span className="fin-pipe-arrow">›</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* Results table / Idle Upload State */}
      {phase === 'idle' ? (
        <div style={{ padding: '24px 20px', color: '#64748b' }}>
          {/* Multi-Source 3-Feed Visual Drop Zone */}
          <div style={{ maxWidth: 840, margin: '0 auto 24px' }}>
            <MultiSourceDropZone
              disabled={running}
              onReconcile={(b, l, inv, all, name) => executeReconciliation(b, l, inv, all, name)}
            />
          </div>

          {/* Pre-Generated 500-record Enterprise Datasets */}
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: '0 0 12px', textAlign: 'center' }}>
              Pre-Configured Enterprise Reconciliation Batches
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
              {BATCH_INFO.map((b) => (
                <div
                  key={b.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 10,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 7px', borderRadius: 4 }}>
                        Batch #{b.id}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>500 recs</span>
                    </div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>
                      {b.name.split('—')[1]?.trim() || b.name}
                    </div>
                    {/* <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.4 }}>
                     <code>public/{b.filename}</code>
                    </div> */}
                  </div>
                  <button
                    className="fin-run-btn fin-run-btn--secondary"
                    onClick={() => handleLoadBatch(b.id)}
                    type="button"
                    style={{ width: '100%', height: '32px', fontSize: '0.78rem', justifyContent: 'center' }}
                  >
                    ⚡ Reconcile This Batch
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="fin-rec-wrap">
          <table className="fin-tbl">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Bank Source</th>
                <th>Customer/Vendor</th>
                <th style={{ textAlign: 'right' }}>Invoice Amount</th>
                <th style={{ textAlign: 'right' }}>Bank Amount</th>
                <th style={{ textAlign: 'right' }}>Ledger Amount</th>
                <th>Ledger Entry ID</th>
                <th style={{ textAlign: 'right' }}>Difference</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>AI Confidence (%)</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map(row => {
                const isActioned = actionedIds.has(row.record.id)

                // Computed Bank and Ledger amounts
                const bankAmount = row.record.source === 'BANK'
                  ? row.record.amount
                  : row.status === 'Exact'
                  ? row.record.amount
                  : row.status === 'Fuzzy' || row.status === 'Partial'
                  ? Math.max(0, row.record.amount - row.delta)
                  : null

                const ledgerAmount = row.matchedLedger
                  ? row.matchedLedger.amount
                  : row.record.source === 'LEDGER'
                  ? row.record.amount
                  : null

                return (
                  <tr
                    key={row.record.id}
                    onClick={() => { window.location.hash = `#/record-details?id=${row.record.id}` }}
                    style={{ opacity: isActioned ? 0.6 : 1, cursor: 'pointer', transition: 'background 0.15s' }}
                    className="fin-clickable-row"
                    title="Click row to open 3-way Record Details"
                  >
                    {/* 1. Invoice ID */}
                    <td className="fin-mono">
                      <span
                        style={{ color: '#2563eb', fontWeight: 700 }}
                      >
                        {row.record.id}
                      </span>
                      {ctx.resolvedMap[row.record.id] && (
                        <span style={{
                          marginLeft: 6,
                          padding: '1px 5px',
                          borderRadius: 4,
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          background: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #86efac'
                        }}>
                          (FIX)
                        </span>
                      )}
                    </td>

                    {/* 2. Bank Source */}
                    <td><span className={srcStyle(row.record.source)}>{row.record.source}</span></td>

                    {/* 3. Customer/Vendor */}
                    <td style={{ color: '#1e293b', fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.record.counterparty}>
                      {row.record.counterparty}
                    </td>

                    {/* 4. Invoice Amount */}
                    <td className="fin-mono" style={{ textAlign: 'right' }}>
                      {row.record.currency !== 'INR' && <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginRight: 3 }}>{row.record.currency}</span>}
                      ₹{row.record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* 5. Bank Amount */}
                    <td className="fin-mono" style={{ textAlign: 'right', color: bankAmount !== null ? '#0f172a' : '#94a3b8' }}>
                      {bankAmount !== null
                        ? `₹${bankAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '—'}
                    </td>

                    {/* 6. Ledger Amount */}
                    <td className="fin-mono" style={{ textAlign: 'right', color: ledgerAmount !== null ? '#0f172a' : '#94a3b8' }}>
                      {ledgerAmount !== null
                        ? `₹${ledgerAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '—'}
                    </td>

                    {/* 7. Ledger Entry ID */}
                    <td className="fin-mono" style={{ color: '#64748b' }}>
                      {row.matchedLedgerId ?? (row.record.source === 'LEDGER' ? row.record.id : '—')}
                    </td>

                    {/* 8. Difference */}
                    <td style={{ textAlign: 'right' }}>
                      {row.delta > 0.01
                        ? <span className="fin-delta-neg">−₹{row.delta.toFixed(2)}</span>
                        : <span className="fin-delta-ok">✓ ₹0.00</span>}
                    </td>

                    {/* 9. Status */}
                    <td>{reconTag(row.status)}</td>

                    {/* 10. AI Confidence (%) */}
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: '0.74rem', fontWeight: 700,
                        background: row.confidence >= 90 ? '#dcfce7' : row.confidence >= 60 ? '#fef3c7' : '#fee2e2',
                        color: row.confidence >= 90 ? '#15803d' : row.confidence >= 60 ? '#92400e' : '#991b1b',
                      }}>
                        {row.confidence}%
                      </span>
                    </td>

                    {/* 11. Action */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRowAction(row.record.id)
                        }}
                        style={{
                          padding: '3px 9px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 650,
                          cursor: 'pointer',
                          border: '1px solid #cbd5e1',
                          background: isActioned ? '#dcfce7' : row.status === 'Exact' ? '#f8fafc' : '#eff6ff',
                          color: isActioned ? '#15803d' : row.status === 'Exact' ? '#64748b' : '#1d4ed8',
                          transition: 'all 0.15s',
                        }}
                      >
                        {isActioned
                          ? '✓ Done'
                          : row.status === 'Exact'
                          ? 'Auto-Cleared'
                          : row.status === 'Fuzzy'
                          ? 'Review Fee'
                          : row.status === 'Partial'
                          ? 'Debit Memo'
                          : 'Investigate'}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {rows.length > 100 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', color: '#64748b', fontSize: '0.82rem', padding: '14px' }}>
                    Showing top 100 of {rows.length} records · Full dataset active in analytics below
                  </td>
                </tr>
              )}
              {running && Array.from({ length: 2 }).map((_, i) => (
                <tr key={'sk' + i}>
                  <td colSpan={11}>
                    <div style={{ height: 28, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite', borderRadius: 4 }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </section>
  )
}
