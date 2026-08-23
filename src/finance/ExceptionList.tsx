import type { ReconciliationReport, MatchResult, ExceptionCode } from './reconciliationEngine'
import { useFinanceContext } from './FinanceContext'

interface Props { report: ReconciliationReport }

// Only 3 visual tiers — not a rainbow
function excTier(code: ExceptionCode): 'critical' | 'warning' | 'partial' {
  if (['MISSING_REF', 'NO_MATCH', 'CURRENCY_MISMATCH', 'ORPHAN_LEDGER'].includes(code)) return 'critical'
  if (['AMOUNT_MISMATCH', 'DATE_WINDOW_EXCEEDED', 'DUPLICATE'].includes(code)) return 'warning'
  return 'partial'
}

function ExcCode({ code, isPartial }: { code: ExceptionCode | null; isPartial: boolean }) {
  if (isPartial) return <span className="fin-tag fin-tag--partial">Partial</span>
  if (!code) return null
  const tier = excTier(code)
  return (
    <span className={`fin-tag fin-tag--${tier}`}>
      {code.replace('_', ' ')}
    </span>
  )
}

function SourceTag({ source }: { source: string }) {
  const cls = source === 'BANK' ? 'fin-src--bank' : source === 'LEDGER' ? 'fin-src--ledger' : 'fin-src--inv'
  return <span className={`fin-src ${cls}`}>{source}</span>
}

export default function ExceptionList({ report }: Props) {
  const { resolvedMap } = useFinanceContext()
  const openValue = report.exceptionList.reduce((s, e) => s + e.record.amount, 0)

  return (
    <section className="fin-card" aria-label="Exception list">
      {/* Header */}
      <div className="fin-card-hd">
        <div>
          <h2 className="fin-card-title">Exception List</h2>
          <p className="fin-card-desc">
            {report.exceptionList.length} records the agent could not reconcile ·
            Open value: <strong>₹{openValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Accuracy indicator */}
          <div className="fin-acc-pill">
            <span className="fin-acc-dot" />
            {report.accuracy.toFixed(1)}% accuracy vs ground truth
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="fin-tbl-wrap">
        <table className="fin-tbl">
          <thead>
            <tr>
              <th style={{ width: 90 }}>ID</th>
              <th style={{ width: 80 }}>Source</th>
              <th>Counterparty</th>
              <th style={{ width: 120, textAlign: 'right' }}>Amount</th>
              <th style={{ width: 100 }}>Date</th>
              <th style={{ width: 160 }}>Exception</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {report.exceptionList.map((item: MatchResult) => (
              <tr key={item.record.id}>
                <td className="fin-mono">
                  <span>{item.record.id}</span>
                  {resolvedMap[item.record.id] && (
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
                <td><SourceTag source={item.record.source} /></td>
                <td>{item.record.counterparty}</td>
                <td className="fin-mono" style={{ textAlign: 'right' }}>
                  {item.record.currency !== 'INR' && (
                    <span style={{ fontSize: '0.7rem', color: '#64748b', marginRight: 3 }}>
                      {item.record.currency}
                    </span>
                  )}
                  ₹{item.record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ color: '#64748b', fontSize: '0.84rem' }}>{item.record.date}</td>
                <td>
                  <ExcCode code={item.exceptionCode} isPartial={item.status === 'Partial'} />
                </td>
                <td style={{ color: '#374151', fontSize: '0.83rem', lineHeight: 1.45 }}>
                  {item.exceptionReason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
