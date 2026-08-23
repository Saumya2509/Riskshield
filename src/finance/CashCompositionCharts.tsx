import { useState } from 'react'
import type { CashForecast } from './cashForecast'

interface Props {
  forecast: CashForecast
}

export default function CashCompositionCharts({ forecast }: Props) {
  const [scenario, setScenario] = useState<'standard' | 'conservative' | 'accelerated'>('standard')
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

  const mult = scenario === 'accelerated' ? 1.15 : scenario === 'conservative' ? 0.85 : 1.0
  const adjustedSettling = Math.round(forecast.totalSettling * mult)
  const adjustedAR = Math.round(forecast.openARValue * mult)
  const routineInflowEst = Math.round(adjustedSettling * 0.42)
  const vendorAP = Math.max(forecast.openAPValue, Math.round(adjustedSettling * 0.28))
  const taxReserve = Math.round(adjustedSettling * 0.08)

  const totalInflows = adjustedSettling + adjustedAR + routineInflowEst
  const totalOutflows = vendorAP + taxReserve
  const netRetained = totalInflows - totalOutflows

  // Donut slices
  const segments = [
    { id: 'cleared',   label: 'Cleared Settlement (T+1…T+5)', amount: adjustedSettling, color: '#16a34a', bg: '#dcfce7', desc: 'Verified 3-way matches' },
    { id: 'ar',        label: 'AR Exception Recovery',       amount: adjustedAR,       color: '#2563eb', bg: '#dbeafe', desc: 'Short-pay recoveries' },
    { id: 'routine',   label: 'Routine Banking Inflows',     amount: routineInflowEst, color: '#7c3aed', bg: '#f3e8ff', desc: 'Recurring receivables' },
    { id: 'ap',        label: 'Vendor AP Disbursements',     amount: vendorAP,         color: '#ef4444', bg: '#fee2e2', desc: 'Accounts payable' },
    { id: 'tax',       label: 'Tax & Withholding Reserve',   amount: taxReserve,       color: '#f59e0b', bg: '#fef3c7', desc: 'Estimated liabilities' },
  ]

  const totalSegmentSum = segments.reduce((s, x) => s + x.amount, 0)

  // Donut SVG parameters
  const R = 80
  const C = 2 * Math.PI * R
  let accumulatedDash = 0

  // Histogram parameters for 7 days
  const days = forecast.forecastDays
  const maxAbsFlow = Math.max(...days.map(d => Math.abs(d.netFlow * mult)), 1)
  const HISTO_MID = 65

  return (
    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── 1. SCENARIO STRESS-TEST TOOLBAR ────────────────────────────────────── */}
      <div className="fin-card" style={{ padding: '14px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <div>
            <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>Realization Scenario &amp; Stress Testing</strong>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Simulate cash realization speeds and collection delinquency buffers</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, background: '#e2e8f0', padding: 4, borderRadius: 8 }}>
          <button
            type="button"
            onClick={() => setScenario('conservative')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.76rem',
              fontWeight: 700,
              background: scenario === 'conservative' ? '#dc2626' : 'transparent',
              color: scenario === 'conservative' ? '#fff' : '#475569',
              transition: 'all 0.15s'
            }}
          >
            🛡️ Conservative (-15% Lag)
          </button>
          <button
            type="button"
            onClick={() => setScenario('standard')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.76rem',
              fontWeight: 700,
              background: scenario === 'standard' ? '#2563eb' : 'transparent',
              color: scenario === 'standard' ? '#fff' : '#475569',
              transition: 'all 0.15s'
            }}
          >
            ⚡ Standard Base (100%)
          </button>
          <button
            type="button"
            onClick={() => setScenario('accelerated')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.76rem',
              fontWeight: 700,
              background: scenario === 'accelerated' ? '#16a34a' : 'transparent',
              color: scenario === 'accelerated' ? '#fff' : '#475569',
              transition: 'all 0.15s'
            }}
          >
            🚀 Accelerated (+15% Early)
          </button>
        </div>
      </div>

      {/* ── 2. TWO-COLUMN: DONUT PIE CHART + NET FLOW HISTOGRAM ──────────────── */}
      <div className="fin-two-col">

        {/* ── VISUAL A: DONUT PIE CHART ── */}
        <div className="fin-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h3 className="fin-card-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                🍩 Cash Inflow &amp; Allocation Donut
              </h3>
              <p className="fin-card-desc" style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                Proportional distribution of incoming settlements vs outgoing commitments
              </p>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#dcfce7', color: '#15803d' }}>
              {scenario.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 16, flexWrap: 'wrap' }}>
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: 190, height: 190, display: 'grid', placeItems: 'center' }}>
              <svg width="190" height="190" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
                {segments.map(seg => {
                  const pct = seg.amount / totalSegmentSum
                  const dashLength = pct * C
                  const dashOffset = -accumulatedDash
                  accumulatedDash += dashLength

                  const isHovered = hoveredSegment === seg.id

                  return (
                    <circle
                      key={seg.id}
                      cx="100" cy="100" r={R}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={isHovered ? 28 : 22}
                      strokeDasharray={`${dashLength} ${C - dashLength}`}
                      strokeDashoffset={dashOffset}
                      style={{
                        cursor: 'pointer',
                        transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                        opacity: hoveredSegment && !isHovered ? 0.45 : 1,
                      }}
                      onMouseEnter={() => setHoveredSegment(seg.id)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                  )
                })}
              </svg>

              {/* Center Donut Label */}
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none'
              }}>
                <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Net Retained
                </span>
                <strong style={{ fontSize: '1.1rem', fontWeight: 800, color: netRetained >= 0 ? '#16a34a' : '#dc2626' }}>
                  {netRetained >= 0 ? '+' : ''}₹{Math.round(netRetained / 1000)}k
                </strong>
                <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                  {Math.round((netRetained / Math.max(1, totalInflows)) * 100)}% margin
                </span>
              </div>
            </div>

            {/* Legend & Breakdown List */}
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {segments.map(seg => {
                const pct = ((seg.amount / totalSegmentSum) * 100).toFixed(1)
                const isHovered = hoveredSegment === seg.id

                return (
                  <div
                    key={seg.id}
                    onMouseEnter={() => setHoveredSegment(seg.id)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 6,
                      background: isHovered ? seg.bg : 'transparent',
                      border: isHovered ? `1px solid ${seg.color}` : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.76rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: seg.color, display: 'inline-block' }} />
                      <span style={{ fontWeight: 650, color: '#334155' }}>{seg.label}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ color: '#0f172a' }}>₹{Math.round(seg.amount).toLocaleString('en-IN')}</strong>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', marginLeft: 4 }}>({pct}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── VISUAL B: DAILY NET FLOW DELTA HISTOGRAM ── */}
        <div className="fin-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h3 className="fin-card-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                📊 Daily Net Cash Flow Delta Histogram
              </h3>
              <p className="fin-card-desc" style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                Net liquidity delta per day (+₹ Green Cash Expansion / −₹ Red Outflow Drain)
              </p>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
              Zero-Baseline
            </span>
          </div>

          {/* Histogram SVG */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg width="100%" height="160" viewBox="0 0 380 160" style={{ minWidth: 320 }}>
              {/* Zero baseline */}
              <line x1="20" y1={HISTO_MID} x2="360" y2={HISTO_MID} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" />
              <text x="14" y={HISTO_MID + 3} fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="700">₹0</text>

              {days.map((d, i) => {
                const x = 35 + i * 46
                const net = d.netFlow * mult
                const isPos = net >= 0
                const barHeight = Math.max(4, (Math.abs(net) / maxAbsFlow) * 50)
                const y = isPos ? HISTO_MID - barHeight : HISTO_MID

                return (
                  <g key={d.date}>
                    {/* Bar */}
                    <rect
                      x={x}
                      y={y}
                      width="28"
                      height={barHeight}
                      fill={isPos ? '#16a34a' : '#ef4444'}
                      rx="3"
                      opacity="0.9"
                    />

                    {/* Value label */}
                    <text
                      x={x + 14}
                      y={isPos ? y - 4 : y + barHeight + 10}
                      fontSize="8.5"
                      fontWeight="700"
                      textAnchor="middle"
                      fill={isPos ? '#15803d' : '#b91c1c'}
                    >
                      {isPos ? '+' : ''}₹{Math.round(net / 1000)}k
                    </text>

                    {/* Day label */}
                    <text
                      x={x + 14}
                      y="142"
                      fontSize="9.5"
                      fontWeight="650"
                      textAnchor="middle"
                      fill={d.isWeekend ? '#94a3b8' : '#334155'}
                    >
                      {d.shortLabel}
                    </text>

                    {/* Confidence tag */}
                    <text
                      x={x + 14}
                      y="154"
                      fontSize="7.5"
                      textAnchor="middle"
                      fill="#94a3b8"
                    >
                      {d.confidence}%
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
            <span>🟢 <strong>Positive Days:</strong> Front-loaded T+1/T+2 inflows</span>
            <span>🔴 <strong>Disbursement Days:</strong> AP supplier settlement cutoffs</span>
          </div>
        </div>

      </div>

    </div>
  )
}
