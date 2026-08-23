import type { MLBatchResult, MLScore } from './mlScorer'

interface Props { mlResult: MLBatchResult }

const RISK_COLOR: Record<string, string> = {
  Normal:   '#16a34a',
  Elevated: '#d97706',
  High:     '#ea580c',
  Critical: '#dc2626',
}

function Bar({ score }: { score: number }) {
  const color = score < 21 ? '#16a34a' : score < 46 ? '#d97706' : score < 71 ? '#ea580c' : '#dc2626'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
      <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 3 }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color, width: 24, textAlign: 'right' }}>
        {score}
      </span>
    </div>
  )
}

export default function MLAnomalyPanel({ mlResult }: Props) {
  const { scores, topAnomalies, batchStats, highRiskCount, criticalCount, anomalyRate, averageScore, modelVersion, runTimeMs } = mlResult

  return (
    <section className="fin-card" aria-label="ML anomaly analysis">
      <div className="fin-card-hd">
        <div>
          <h2 className="fin-card-title">ML Anomaly Scoring</h2>
          <p className="fin-card-desc">{modelVersion} · {scores.length} records · {runTimeMs}ms</p>
        </div>
        <span className="fin-tag fin-tag--info">AI Scored</span>
      </div>

      {/* 4 inline stats */}
      <div className="fin-ml-stats">
        {[
          { label: 'Avg Score', value: String(averageScore), sub: '/ 100' },
          { label: 'Elevated+', value: String(highRiskCount), sub: 'score > 45' },
          { label: 'Critical',  value: String(criticalCount), sub: 'score > 70' },
          { label: 'Anomaly Rate', value: (anomalyRate * 100).toFixed(0) + '%', sub: 'of batch' },
        ].map(s => (
          <div key={s.label} className="fin-ml-stat">
            <span className="fin-ml-stat-val">{s.value}</span>
            <span className="fin-ml-stat-lbl">{s.label}</span>
            <span className="fin-ml-stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Top anomalies — clean list */}
      <div style={{ padding: '0 0 4px' }}>
        <p className="fin-section-label" style={{ padding: '0 24px', marginBottom: 6 }}>Top Anomalies</p>
        {topAnomalies.map((s: MLScore) => (
          <div key={s.recordId} className="fin-ml-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
              <span className="fin-mono" style={{ fontSize: '0.82rem', fontWeight: 700 }}>{s.recordId}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: RISK_COLOR[s.riskLevel] }}>
                {s.riskLevel}
              </span>
            </div>
            <span style={{ flex: 1, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.3 }}>
              {s.explanation[0]}
            </span>
            <Bar score={s.anomalyScore} />
          </div>
        ))}
      </div>

      {/* Batch stats footer */}
      <div className="fin-ml-footer">
        <span>Batch mean: <strong>${Math.round(batchStats.meanAmount).toLocaleString()}</strong></span>
        <span>σ: <strong>${Math.round(batchStats.stdAmount).toLocaleString()}</strong></span>
        <span>P10: <strong>${Math.round(batchStats.p10Amount).toLocaleString()}</strong></span>
        <span>P90: <strong>${Math.round(batchStats.p90Amount).toLocaleString()}</strong></span>
      </div>
    </section>
  )
}
