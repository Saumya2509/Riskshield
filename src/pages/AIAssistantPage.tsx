import { useState, useRef, useEffect } from 'react'
import TopNav from '../dashboard/TopNav'
import Sidebar from '../dashboard/Sidebar'
import { useFinanceContext } from '../finance/FinanceContext'
import { runReconciliation } from '../finance/reconciliationEngine'
import { askAgent } from '../finance/settlementQA'
import type { QAAnswer } from '../finance/settlementQA'
import '../dashboard/dashboard.css'
import '../finance/finance.css'

interface MessageItem {
  id: string
  query: string
  status: 'thinking' | 'streaming' | 'done'
  thinkingDurationSec?: number
  thinkingSteps: string[]
  currentThoughtStep: number
  streamedText: string
  fullAnswer?: QAAnswer
  timestamp: string
}

const CATEGORY_PROMPTS = [
  { label: '🔍 Match Rate & Passes', query: 'What is our match rate and 3-pass breakdown?' },
  { label: '💰 Net Open Position', query: 'What is our net open position and cleared amount?' },
  { label: '📈 7-Day Cash Forecast', query: 'Show 7-day forward cash forecast and peak liquidity' },
  { label: '📑 Corporate Tax Liability', query: 'What is our estimated corporate tax liability?' },
  { label: '⚠️ Short-Pay Exceptions', query: 'List all AMOUNT_MISMATCH and short-pay exceptions' },
  { label: '🤖 ML Anomaly Score', query: 'What is our ML Isolation Forest anomaly score?' },
  { label: '🔍 Duplicate Invoice Scan', query: 'Are there any duplicate invoices detected?' },
]

export default function AIAssistantPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const ctx = useFinanceContext()
  const report = ctx.report || runReconciliation()

  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  // Clean initial state: no answers directly displayed!
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [collapsedThoughts, setCollapsedThoughts] = useState<Record<string, boolean>>({})
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current)
    }
  }, [])

  function toggleThought(msgId: string) {
    setCollapsedThoughts(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }))
  }

  function handleSend(queryText?: string) {
    const q = (queryText || input).trim()
    if (!q || isProcessing) return

    const msgId = 'msg-' + Date.now()
    const rawResult = askAgent(q, report)
    const thinkingSteps = rawResult.thinkingProcess || [
      'Parsing query intent and parameters...',
      `Scanning multi-source records for batch ${report.batchId}...`,
      'Evaluating variance delta and pass tolerances...',
      'Synthesizing final response...',
    ]

    const newMsg: MessageItem = {
      id: msgId,
      query: q,
      status: 'thinking',
      thinkingDurationSec: 0,
      thinkingSteps,
      currentThoughtStep: 0,
      streamedText: '',
      fullAnswer: rawResult,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [newMsg, ...prev])
    if (!queryText) setInput('')
    setIsProcessing(true)

    const startTime = Date.now()
    let stepIndex = 0

    // Progressive thinking interval (advances thoughts sequentially)
    const thinkingTimer = setInterval(() => {
      stepIndex++
      if (stepIndex < thinkingSteps.length) {
        setMessages(prev => prev.map(m => m.id === msgId ? {
          ...m,
          currentThoughtStep: stepIndex
        } : m))
      } else {
        clearInterval(thinkingTimer)
        const durationSec = Math.max(1, Math.round((Date.now() - startTime) / 100) / 10)

        // Switch from Thinking to Streaming Answer word-by-word
        const words = rawResult.answer.split(' ')
        let wordIndex = 0

        setMessages(prev => prev.map(m => m.id === msgId ? {
          ...m,
          status: 'streaming',
          thinkingDurationSec: durationSec,
          streamedText: words[0] || ''
        } : m))

        streamIntervalRef.current = setInterval(() => {
          wordIndex += 2
          if (wordIndex < words.length) {
            const partial = words.slice(0, wordIndex).join(' ')
            setMessages(prev => prev.map(m => m.id === msgId ? {
              ...m,
              streamedText: partial
            } : m))
          } else {
            if (streamIntervalRef.current) clearInterval(streamIntervalRef.current)
            setMessages(prev => prev.map(m => m.id === msgId ? {
              ...m,
              status: 'done',
              streamedText: rawResult.answer
            } : m))
            setIsProcessing(false)
          }
        }, 35)
      }
    }, 450)
  }

  return (
    <div className="dash-app fin-page">
      <TopNav onMenu={() => setMenuOpen(true)} />
      <div className="d-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} activeId="ai-assistant" />
        <main className="d-main">

          {/* Header */}
          <header className="d-pagehead">
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                RiskShield AI Settlement &amp; Anomaly Copilot
                <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '2px 9px', background: '#f5f3ff', color: '#7c3aed', borderRadius: 999 }}>
                  Reasoning AI Agent
                </span>
              </h1>
              <p>
                Asks question → Evaluates multi-source ledger → Shows thinking trace → Streams structured answer
              </p>
            </div>
            <div className="d-page-actions">
              {!ctx.report ? (
                <button
                  type="button"
                  onClick={() => {
                    const newReport = runReconciliation()
                    ctx.setReport(newReport)
                  }}
                  className="d-btn d-btn-primary"
                  style={{ fontSize: '0.82rem', height: 34 }}
                >
                  ⚡ Load Demo Batch (500 Recs)
                </button>
              ) : (
                <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                  Batch: <strong style={{ marginLeft: 4, color: '#0f172a' }}>{report.batchId}</strong> ({report.totalRecords} records)
                </span>
              )}
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, maxWidth: 960 }}>
            {/* Input & Prompt Bar */}
            <div className="fin-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <input
                  type="text"
                  placeholder="Ask any reconciliation question (e.g. 'What is our tax liability?', 'Lookup B1-BNK-001', 'Show cash forecast')..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
                  disabled={isProcessing}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                    background: '#fff',
                  }}
                />
                <button
                  className="d-btn d-btn-primary"
                  onClick={() => handleSend()}
                  disabled={isProcessing || !input.trim()}
                  type="button"
                  style={{ padding: '0 24px', height: 46, fontSize: '0.92rem' }}
                >
                  {isProcessing ? 'Thinking…' : 'Ask Copilot →'}
                </button>
              </div>

              {/* Quick Prompt Category Chips */}
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 8 }}>
                  Suggested Queries:
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {CATEGORY_PROMPTS.map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSend(p.query)}
                      disabled={isProcessing}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#334155',
                        fontSize: '0.78rem',
                        fontWeight: 550,
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversation Stream */}
            {messages.length === 0 ? (
              /* Clean Welcome State before any query is submitted */
              <div className="fin-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🤖</div>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  RiskShield AI Copilot is Ready
                </h3>
                <p style={{ margin: '0 auto 20px', maxWidth: 520, fontSize: '0.86rem', color: '#64748b', lineHeight: 1.6 }}>
                  Type a question above or click one of the suggested query chips. The AI will evaluate the active dataset ({report.totalRecords} records), analyze variance deltas, and stream its reasoned response.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="d-btn d-btn-ghost"
                    onClick={() => handleSend('What is our match rate and 3-pass breakdown?')}
                    style={{ fontSize: '0.8rem', height: 34 }}
                  >
                    ⚡ Check Match Rate
                  </button>
                  <button
                    type="button"
                    className="d-btn d-btn-ghost"
                    onClick={() => handleSend('What is our net open position and cleared amount?')}
                    style={{ fontSize: '0.8rem', height: 34 }}
                  >
                    💰 Calculate Net Open Position
                  </button>
                  <button
                    type="button"
                    className="d-btn d-btn-ghost"
                    onClick={() => handleSend('What is our estimated corporate tax liability?')}
                    style={{ fontSize: '0.8rem', height: 34 }}
                  >
                    📑 Estimate Tax Liability
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {messages.map((item) => {
                  const isCollapsed = collapsedThoughts[item.id] ?? false
                  const isThinking = item.status === 'thinking'

                  return (
                    <div key={item.id} className="fin-card" style={{ padding: '22px 24px', borderLeft: '4px solid #7c3aed' }}>
                      {/* User Question Row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '1.2rem' }}>👤</span>
                          <strong style={{ fontSize: '0.96rem', color: '#0f172a' }}>
                            {item.query}
                          </strong>
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                          {item.timestamp}
                        </span>
                      </div>

                      {/* 1. THINKING STATE (Active while thinking) */}
                      {isThinking && (
                        <div style={{ padding: '16px 20px', background: '#faf5ff', borderRadius: 10, border: '1px solid #e9d5ff', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <span style={{ display: 'inline-block', animation: 'spin 1.2s linear infinite', fontSize: '1.1rem' }}>🧠</span>
                            <strong style={{ fontSize: '0.86rem', color: '#7c3aed' }}>
                              Thinking &amp; analyzing 3-way reconciliation ledger…
                            </strong>
                          </div>

                          {/* Progressive Thought Step Animation */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem', color: '#6b21a8' }}>
                            {item.thinkingSteps.slice(0, item.currentThoughtStep + 1).map((stepText, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.3s ease' }}>
                                <span style={{ color: idx === item.currentThoughtStep ? '#7c3aed' : '#16a34a', fontWeight: 700 }}>
                                  {idx === item.currentThoughtStep ? '●' : '✓'}
                                </span>
                                <span style={{ fontWeight: idx === item.currentThoughtStep ? 650 : 400 }}>
                                  {stepText}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Shimmer Bar */}
                          <div style={{ height: 3, width: '100%', background: '#f3e8ff', borderRadius: 2, overflow: 'hidden', marginTop: 12 }}>
                            <div style={{ height: '100%', width: '50%', background: '#7c3aed', animation: 'shimmer 1.2s ease infinite', borderRadius: 2 }} />
                          </div>
                        </div>
                      )}

                      {/* 2. COMPLETED THOUGHT BOX (Collapsible after thinking finishes) */}
                      {!isThinking && item.thinkingSteps && (
                        <div style={{ marginBottom: 14 }}>
                          <button
                            type="button"
                            onClick={() => toggleThought(item.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '5px 12px',
                              borderRadius: 6,
                              border: '1px solid #e9d5ff',
                              background: '#faf5ff',
                              color: '#7c3aed',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              marginBottom: isCollapsed ? 0 : 8,
                            }}
                          >
                            <span>🧠 Thought for {item.thinkingDurationSec ?? 1.8} seconds ({item.thinkingSteps.length} reasoning steps)</span>
                            <span style={{ fontSize: '0.7rem' }}>{isCollapsed ? '▼ Show' : '▲ Hide'}</span>
                          </button>

                          {!isCollapsed && (
                            <div style={{
                              padding: '12px 16px',
                              background: '#faf5ff',
                              borderRadius: 8,
                              border: '1px solid #f3e8ff',
                              fontSize: '0.78rem',
                              color: '#6b21a8',
                              lineHeight: 1.5,
                            }}>
                              <ol style={{ margin: 0, paddingLeft: 18 }}>
                                {item.thinkingSteps.map((step, sIdx) => (
                                  <li key={sIdx} style={{ marginBottom: 4 }}>
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. STREAMED / FINAL ANSWER */}
                      {!isThinking && (
                        <>
                          <div style={{
                            padding: '16px 20px',
                            background: '#ffffff',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                            fontSize: '0.88rem',
                            color: '#1e293b',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-line',
                          }}>
                            {item.streamedText}
                            {item.status === 'streaming' && (
                              <span style={{ display: 'inline-block', width: 6, height: 14, background: '#7c3aed', marginLeft: 4, verticalAlign: 'middle', animation: 'blink 0.8s infinite' }} />
                            )}
                          </div>

                          {/* Recommendation Callout (Shown when answer completes) */}
                          {item.status === 'done' && item.fullAnswer?.recommendation && (
                            <div style={{
                              marginTop: 12,
                              padding: '12px 16px',
                              background: '#eff6ff',
                              borderRadius: 8,
                              border: '1px solid #bfdbfe',
                              fontSize: '0.82rem',
                              color: '#1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              animation: 'fadeIn 0.4s ease',
                            }}>
                              <span style={{ fontSize: '1rem' }}>💡</span>
                              <span><strong>Recommended Action: </strong>{item.fullAnswer.recommendation}</span>
                            </div>
                          )}

                          {/* Related Data Drill-Down Table (Shown when answer completes) */}
                          {item.status === 'done' && item.fullAnswer?.data && item.fullAnswer.data.length > 0 && (
                            <div style={{ marginTop: 14, animation: 'fadeIn 0.4s ease' }}>
                              <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                                Relevant Matching Records ({item.fullAnswer.data.length}):
                              </span>
                              <div className="fin-rec-wrap" style={{ maxHeight: 200, marginTop: 6 }}>
                                <table className="fin-tbl">
                                  <thead>
                                    <tr>
                                      <th>Invoice ID</th>
                                      <th>Source</th>
                                      <th>Customer/Vendor</th>
                                      <th style={{ textAlign: 'right' }}>Amount</th>
                                      <th>Status</th>
                                      <th style={{ textAlign: 'right' }}>Difference</th>
                                      <th style={{ textAlign: 'center' }}>Details</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.fullAnswer.data.slice(0, 5).map(row => (
                                      <tr key={row.record.id}>
                                        <td className="fin-mono" style={{ fontWeight: 700 }}>
                                          <a href={`#/record-details?id=${row.record.id}`} style={{ color: '#2563eb' }}>
                                            {row.record.id}
                                          </a>
                                        </td>
                                        <td>{row.record.source}</td>
                                        <td>{row.record.counterparty}</td>
                                        <td className="fin-mono" style={{ textAlign: 'right' }}>₹{row.record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td><span className="fin-tag fin-tag--safe">{row.status}</span></td>
                                        <td className="fin-mono" style={{ textAlign: 'right', color: row.delta > 0 ? '#dc2626' : '#16a34a' }}>
                                          {row.delta > 0 ? `−₹${row.delta.toFixed(2)}` : '✓ ₹0.00'}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                          <a
                                            href={`#/record-details?id=${row.record.id}`}
                                            style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}
                                          >
                                            Inspect →
                                          </a>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </main>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>
    </div>
  )
}
