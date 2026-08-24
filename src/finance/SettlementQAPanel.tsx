import { useState, useRef, useEffect } from 'react'
import type { ReconciliationReport } from './reconciliationEngine'
import { askAgent, SAMPLE_QUESTIONS, type QAAnswer } from './settlementQA'

interface Props { report: ReconciliationReport }
interface Message {
  role: 'user' | 'agent'
  text: string
  thinkingSteps?: string[]
  recommendation?: string
  timeMs?: number
}

function renderText(t: string) {
  return t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
}

export default function SettlementQAPanel({ report }: Props) {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'agent',
    text: `Finance Copilot active. Analyzed **${report.totalRecords} records** across Bank, Ledger, and Invoices. Match rate: **${report.matchRate.toFixed(1)}%** · ${report.exceptionList.length} exceptions. Ask anything about balances, variances, or tax obligations.`,
  }])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [showThoughts, setShowThoughts] = useState<Record<number, boolean>>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const isFirstMount = useRef(true)

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    if (bottomRef.current?.parentElement) {
      bottomRef.current.parentElement.scrollTop = bottomRef.current.parentElement.scrollHeight
    }
  }, [messages, thinking])

  function send(q: string) {
    if (!q.trim() || thinking) return
    setMessages(m => [...m, { role: 'user', text: q }])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      const ans: QAAnswer = askAgent(q, report)
      setMessages(m => [...m, {
        role: 'agent',
        text: ans.answer,
        thinkingSteps: ans.thinkingProcess,
        recommendation: ans.recommendation,
        timeMs: ans.responseTimeMs,
      }])
      setThinking(false)
    }, 600)
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  function toggleThought(idx: number) {
    setShowThoughts(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

  return (
    <section className="fin-qa-card" aria-label="Settlement Q&A">
      <div className="fin-card-hd" style={{ paddingBottom: 10 }}>
        <div>
          <h2 className="fin-card-title">Settlement AI Copilot</h2>
          <p className="fin-card-desc">Reasoning agent answering reconciliation &amp; variance queries</p>
        </div>
        <span className="fin-tag fin-tag--safe" title={`${report.accuracy.toFixed(1)}% accuracy vs ground truth`}>
          {report.accuracy.toFixed(0)}% accuracy
        </span>
      </div>

      <div className="fin-qa-chips">
        {SAMPLE_QUESTIONS.slice(0, 5).map(q => (
          <button key={q} className="fin-chip" onClick={() => send(q)} disabled={thinking}>
            {q}
          </button>
        ))}
      </div>

      <div className="fin-qa-msgs" aria-live="polite">
        {messages.map((msg, i) => (
          <div key={i} className={`fin-msg is-${msg.role}`}>
            {msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <button
                  type="button"
                  onClick={() => toggleThought(i)}
                  style={{
                    background: '#f5f3ff', border: '1px solid #e9d5ff', borderRadius: 4,
                    padding: '2px 7px', fontSize: '0.68rem', color: '#7c3aed', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  🧠 {showThoughts[i] ? 'Hide Reasoning' : `View Reasoning (${msg.thinkingSteps.length} steps)`}
                </button>
                {showThoughts[i] && (
                  <div style={{ background: '#faf5ff', border: '1px solid #f3e8ff', borderRadius: 6, padding: '6px 10px', fontSize: '0.72rem', color: '#6b21a8', marginTop: 4 }}>
                    {msg.thinkingSteps.map((s, idx) => (
                      <div key={idx} style={{ marginBottom: 2 }}>• {s}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="fin-bubble" dangerouslySetInnerHTML={{ __html: renderText(msg.text) }} />
            {msg.recommendation && (
              <div style={{ marginTop: 6, padding: '6px 10px', background: '#eff6ff', borderRadius: 6, border: '1px solid #bfdbfe', fontSize: '0.76rem', color: '#1e40af' }}>
                💡 <strong>Action: </strong>{msg.recommendation}
              </div>
            )}
            {msg.timeMs !== undefined && (
              <span className="fin-msg-time">Copilot · {msg.timeMs}ms</span>
            )}
          </div>
        ))}
        {thinking && (
          <div className="fin-msg is-agent">
            <div className="fin-bubble" style={{ color: '#7c3aed', background: '#faf5ff', border: '1px solid #e9d5ff' }}>
              <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'fin-spin 0.65s linear infinite', verticalAlign: 'middle', marginRight: 6 }} />
              🧠 Thinking &amp; cross-verifying records…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="fin-qa-input">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask anything (e.g. 'What is our tax liability?', 'Lookup B1-BNK-001')..."
          disabled={thinking}
          aria-label="Ask the finance agent"
        />
        <button onClick={() => send(input)} disabled={thinking || !input.trim()}>
          {thinking ? '…' : 'Ask'}
        </button>
      </div>
    </section>
  )
}
