import { useFinanceContext } from '../finance/FinanceContext'

const W = 720, H = 220
const PAD = { top: 16, right: 20, bottom: 32, left: 48 }
const IW = W - PAD.left - PAD.right
const IH = H - PAD.top - PAD.bottom

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  const segs = [`M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i], p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)
    const cp1y = (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)
    const cp2x = (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)
    const cp2y = (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)
    segs.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`)
  }
  return segs.join(' ')
}

// ── Finance mode: reconciliation pass breakdown ───────────────────────────────
function FinanceChart() {
  const { report, mlResult } = useFinanceContext()
  if (!report) return null

  const categories = [
    { label: 'Exact match',  value: report.exactMatches,   color: '#16a34a' },
    { label: 'Fuzzy match',  value: report.fuzzyMatches,   color: '#2563eb' },
    { label: 'Partial',      value: report.partialMatches, color: '#7c3aed' },
    { label: 'Exception',    value: report.exceptions,     color: '#dc2626' },
    { label: 'Orphan ledger',value: report.orphanLedgers,  color: '#d97706' },
  ]
  const total  = report.totalAttempts
  const maxVal = Math.max(...categories.map(c => c.value))
  const barW   = IW / categories.length * 0.45
  const xOf    = (i: number) => PAD.left + (i + 0.5) * (IW / categories.length)
  const yOf    = (v: number) => PAD.top + IH - (v / (maxVal * 1.15)) * IH

  // ML anomaly distribution for secondary line
  const mlScores = mlResult?.scores.map(s => s.anomalyScore) ?? []
  const mlBuckets = [0, 1, 2, 3, 4].map(b => {
    const lo = b * 20, hi = lo + 20
    return mlScores.filter(s => s >= lo && s < hi).length
  })
  const mlMax = Math.max(...mlBuckets, 1)
  const mlPts: [number, number][] = mlBuckets.map((v, i) => [
    PAD.left + (i / (mlBuckets.length - 1)) * IW,
    PAD.top + IH - (v / mlMax) * IH * 0.55,
  ])

  return (
    <section className="d-card d-chart" aria-label="Reconciliation breakdown">
      <div className="d-card-head">
        <div>
          <h2>Reconciliation Breakdown</h2>
          <p>
            {total} records · {report.matchRate.toFixed(1)}% match rate ·{' '}
            {report.accuracy != null ? (
              <>accuracy <strong style={{ color: '#16a34a' }}>{report.accuracy.toFixed(1)}%</strong> vs ground truth</>
            ) : (
              <span style={{ color: '#6b7280' }}>accuracy: <strong>N/A</strong> (unlabeled dataset)</span>
            )}
          </p>
        </div>
        <div className="d-legend" style={{ flexWrap: 'wrap', gap: 8 }}>
          {categories.map(c => (
            <span key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#374151' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: 'inline-block' }} />
              {c.label}
            </span>
          ))}
          {mlResult && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#374151' }}>
              <span style={{ width: 8, height: 2, background: '#7c3aed', display: 'inline-block' }} />
              ML anomaly dist.
            </span>
          )}
        </div>
      </div>

      <div className="d-chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
          <defs>
            {categories.map(c => (
              <linearGradient key={c.label} id={`bg-${c.label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={c.color} stopOpacity="0.85" />
                <stop offset="100%" stopColor={c.color} stopOpacity="0.55" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
            const v = Math.round(maxVal * 1.15 * f)
            const y = PAD.top + IH - f * IH
            return (
              <g key={i}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '4,3'} />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="inherit">{v}</text>
              </g>
            )
          })}

          {/* Bars */}
          {categories.map((c, i) => {
            const x  = xOf(i)
            const bH = (c.value / (maxVal * 1.15)) * IH
            return (
              <g key={c.label}>
                <rect
                  x={x - barW / 2} y={yOf(c.value)}
                  width={barW} height={Math.max(bH, 2)}
                  fill={`url(#bg-${c.label.replace(/\s/g, '')})`} rx="4"
                />
                {/* Value label */}
                <text x={x} y={yOf(c.value) - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill={c.color} fontFamily="inherit">
                  {c.value}
                </text>
                {/* % of total */}
                <text x={x} y={yOf(c.value) - 18} textAnchor="middle" fontSize="9.5" fill="#94a3b8" fontFamily="inherit">
                  {((c.value / total) * 100).toFixed(0)}%
                </text>
                {/* X label */}
                <text x={x} y={H - 8} textAnchor="middle" fontSize="10.5" fill="#64748b" fontFamily="inherit">
                  {c.label}
                </text>
              </g>
            )
          })}

          {/* ML anomaly distribution line overlay */}
          {mlResult && mlPts.length > 1 && (
            <path d={smoothPath(mlPts)} fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeDasharray="5,3" opacity="0.65" />
          )}
        </svg>
      </div>

      {/* Pass stats row */}
      <div style={{ display: 'flex', borderTop: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#64748b' }}>
        {report.passStats.map((ps, i) => (
          <div key={i} style={{ flex: 1, padding: '10px 16px', borderRight: i < 2 ? '1px solid #e2e8f0' : 'none' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{ps.matched}</div>
            <div style={{ textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em', marginTop: 1 }}>
              Pass {ps.pass} — {ps.label}
            </div>
          </div>
        ))}
        <div style={{ flex: 1, padding: '10px 16px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#dc2626' }}>{report.exceptions}</div>
          <div style={{ textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em', marginTop: 1 }}>Exceptions</div>
        </div>
        {mlResult && (
          <div style={{ flex: 1, padding: '10px 16px', borderLeft: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#7c3aed' }}>{mlResult.criticalCount}</div>
            <div style={{ textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em', marginTop: 1 }}>ML Critical</div>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Empty / Zero state when no batch has been ingested ────────────────────────
function ZeroStateChart() {
  return (
    <section className="d-card d-chart" aria-label="Reconciliation trend">
      <div className="d-card-head">
        <div>
          <h2>Reconciliation &amp; Risk Trajectory</h2>
          <p>Multi-source matching distribution — 0 records active</p>
        </div>
        <div className="d-legend">
          {[['#16a34a','Exact (0)'],['#2563eb','Fuzzy (0)'],['#dc2626','Exceptions (0)']].map(([c,l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#94a3b8' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c, opacity: 0.4, display: 'inline-block' }} />
              {l}
            </span>
          ))}
        </div>
      </div>
      <div className="d-chart-wrap" style={{ position: 'relative', minHeight: 200, display: 'grid', placeItems: 'center' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', opacity: 0.35 }}>
          {[0, 100, 200, 300, 400].map(v => {
            const y = PAD.top + IH - (v / 400) * IH
            return (
              <g key={v}>
                <line x1={PAD.left} x2={W-PAD.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={v===0?'0':'4,3'} />
                <text x={PAD.left-6} y={y+4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="inherit">{v}</text>
              </g>
            )
          })}
          {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map((day, i) => (
            <text key={day} x={PAD.left + (i / 6) * IW} y={H-8} textAnchor="middle" fontSize="10.5" fill="#94a3b8" fontFamily="inherit">{day}</text>
          ))}
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center', background: 'rgba(255,255,255,0.92)', padding: '16px 24px', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
            No Data Loaded Yet
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            Upload a CSV batch or load a dataset to view real-time reconciliation distributions.
          </p>
        </div>
      </div>
    </section>
  )
}

export default function RiskTrendChart() {
  const { report } = useFinanceContext()
  return report ? <FinanceChart /> : <ZeroStateChart />
}
