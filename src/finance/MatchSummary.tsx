import type { ReconciliationReport } from './reconciliationEngine'

interface Props { report: ReconciliationReport }

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export default function MatchSummary({ report }: Props) {
  const matched = report.exactMatches + report.fuzzyMatches

  return (
    <section className="fin-summary">
      {/* 3 hero metrics — the only numbers that matter at a glance */}
      <div className="fin-hero-row">
        <div className="fin-hero-card">
          <p className="fin-hero-label">Match Rate</p>
          <p className="fin-hero-value" style={{ color: '#16a34a' }}>
            {report.matchRate.toFixed(1)}%
          </p>
          <p className="fin-hero-sub">{matched} of {report.totalAttempts} records matched</p>
        </div>

        <div className="fin-hero-card fin-hero-card--mid">
          <p className="fin-hero-label">Cleared Value</p>
          <p className="fin-hero-value" style={{ color: '#2563eb' }}>
            {fmt(report.clearedAmount)}
          </p>
          <p className="fin-hero-sub">Ready to post to ledger</p>
        </div>

        <div className="fin-hero-card">
          <p className="fin-hero-label">Exceptions</p>
          <p className="fin-hero-value" style={{ color: '#dc2626' }}>
            {report.exceptionList.length}
          </p>
          <p className="fin-hero-sub">{fmt(report.openAmount)} open value</p>
        </div>
      </div>

      {/* Secondary stats — one quiet line */}
      <div className="fin-stat-bar">
        <span>Exact <strong>{report.exactMatches}</strong></span>
        <span className="fin-stat-dot" />
        <span>Fuzzy <strong>{report.fuzzyMatches}</strong></span>
        <span className="fin-stat-dot" />
        <span>Partial <strong>{report.partialMatches}</strong></span>
        <span className="fin-stat-dot" />
        <span>3-way <strong>{report.threeWayMatches}</strong></span>
        <span className="fin-stat-dot" />
        <span>
          Precision <strong style={{ color: '#16a34a' }}>{report.precision != null ? `${report.precision.toFixed(1)}%` : 'N/A'}</strong>
        </span>
        <span className="fin-stat-dot" />
        <span>
          Recall <strong style={{ color: '#2563eb' }}>{report.recall != null ? `${report.recall.toFixed(1)}%` : 'N/A'}</strong>
        </span>
        <span className="fin-stat-dot" />
        <span>
          Accuracy <strong style={{ color: '#059669' }}>{report.accuracy != null ? `${report.accuracy.toFixed(1)}%` : 'N/A'}</strong>
          {report.accuracy != null ? ` (${report.correctMatches}/${report.groundTruthChecked})` : ' (Unlabeled Ingest)'}
        </span>
        <span className="fin-stat-dot" />
        <span>Engine: <strong>{report.runTimeMs}ms</strong></span>
      </div>
    </section>
  )
}
