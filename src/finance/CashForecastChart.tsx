import { useState, useMemo } from 'react'
import type { CashForecast } from './cashForecast'

interface Props {
  forecast: CashForecast
  simDays?: number
  onSimDaysChange?: (days: number) => void
}

type ViewMode = 'combined' | 'trajectory' | 'flows'

// Layout constants
const W = 840
const PAD_L = 75, PAD_R = 60, PAD_TOP = 25
const BAL_H = 180
const BAL_Y0 = PAD_TOP
const BAL_Y1 = BAL_Y0 + BAL_H

const BAR_H = 80
const BAR_Y0 = BAL_Y1 + 35
const BAR_Y1 = BAR_Y0 + BAR_H
const LABEL_Y = BAR_Y1 + 22
const TOTAL_H = LABEL_Y + 12
const CHART_W = W - PAD_L - PAD_R

// Formatters
const $k = (n: number) =>
  n >= 10_000_000 ? `₹${(n / 10_000_000).toFixed(2)}Cr`
  : n >= 100_000  ? `₹${(n / 100_000).toFixed(1)}L`
  : n >= 1_000    ? `₹${(n / 1_000).toFixed(0)}K`
  : `₹${n.toFixed(0)}`

const $full = (n: number) =>
  '₹' + Math.round(n).toLocaleString('en-IN')

// Catmull-Rom smooth spline through SVG points
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  const segs: string[] = [`M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)
    const cp1y = (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)
    const cp2x = (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)
    const cp2y = (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)
    segs.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`)
  }
  return segs.join(' ')
}

export default function CashForecastChart({ forecast, simDays = 7, onSimDaysChange }: Props) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0)
  const [viewMode, setViewMode] = useState<ViewMode>('combined')

  const {
    forecastDays, openingBalance, peakBalance, troughBalance, expectedClosing,
    openARValue, openAPValue, totalSettling, netChangeValue, netChangePct
  } = forecast

  const days = forecastDays
  const totalDays = days.length
  const activeDay = days[Math.min(selectedDayIdx, days.length - 1)] || days[0]

  // Balance scale (top panel)
  const allBal = useMemo(() => [openingBalance, ...days.map(d => d.closingBalance)], [openingBalance, days])
  const minBal = Math.min(...allBal) * 0.96
  const maxBal = Math.max(...allBal) * 1.04
  const balRange = maxBal - minBal || 1

  const xOf = (i: number) => PAD_L + (i / Math.max(1, totalDays - 1)) * CHART_W
  const yBal = (v: number) => BAL_Y1 - ((v - minBal) / balRange) * BAL_H

  const dayPts: [number, number][] = useMemo(
    () => days.map((d, i) => [xOf(i), yBal(d.closingBalance)]),
    [days, minBal, balRange, totalDays]
  )

  const linePath = smoothPath(dayPts)
  const areaPath = `${linePath} L ${xOf(totalDays - 1)},${BAL_Y1} L ${xOf(0)},${BAL_Y1} Z`

  // Confidence corridor upper/lower bounds
  const upperPts: [number, number][] = useMemo(
    () => days.map((d, i) => {
      const margin = (100 - d.confidence) * 0.0015 * balRange
      return [xOf(i), Math.max(BAL_Y0 + 4, yBal(d.closingBalance + margin))]
    }),
    [days, minBal, balRange, totalDays]
  )
  const lowerPts: [number, number][] = useMemo(
    () => days.map((d, i) => {
      const margin = (100 - d.confidence) * 0.0015 * balRange
      return [xOf(i), Math.min(BAL_Y1 - 4, yBal(d.closingBalance - margin))]
    }),
    [days, minBal, balRange, totalDays]
  )

  const upperPath = smoothPath(upperPts)
  const lowerReversePath = smoothPath(lowerPts.slice().reverse())
  const confidenceBandPath = upperPts.length > 1
    ? `${upperPath} L ${lowerPts[lowerPts.length - 1][0]},${lowerPts[lowerPts.length - 1][1]} ${lowerReversePath.replace(/^M/, 'L')} Z`
    : ''

  // Y-axis ticks (5 reference levels)
  const balTicks = [0, 1, 2, 3, 4].map(i => minBal + (balRange / 4) * i)

  // Bar scale (bottom panel)
  const maxFlow = Math.max(...days.map(d => Math.max(d.projectedInflow, d.projectedOutflow)), 1)
  const barW = Math.max(4, Math.min(18, (CHART_W / totalDays) * 0.32))

  // Label step calculation to prevent collision on 14/30 days
  const labelStep = totalDays <= 7 ? 1 : totalDays <= 14 ? 2 : 5

  const isUp = netChangeValue >= 0

  return (
    <section
      className="fin-forecast-card"
      aria-label="Cash forecast visualization"
      style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px -4px rgba(15,23,42,0.06)',
        overflow: 'hidden',
        marginBottom: 24
      }}
    >
      {/* ── 1. HEADER & CONTROLS TOOLBAR ────────────────────────────────────── */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                📈 Forward Liquidity Trajectory (T+1 … T+{totalDays} Days)
              </h2>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 750,
                padding: '3px 10px',
                borderRadius: 999,
                background: isUp ? '#dcfce7' : '#fee2e2',
                color: isUp ? '#15803d' : '#b91c1c'
              }}>
                {isUp ? '▲ Projected Surplus' : '▼ Projected Deficit'} ({netChangePct >= 0 ? '+' : ''}{netChangePct.toFixed(1)}%)
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
              Spline liquidity model with epistemic uncertainty corridors, daily settlement schedules, and interactive day inspection
            </p>
          </div>

          {/* Controls: Horizon Switcher & View Mode */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Horizon Selector */}
            {onSimDaysChange && (
              <div style={{ display: 'flex', background: '#e2e8f0', padding: 3, borderRadius: 8, gap: 2 }}>
                {[7, 14, 30].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onSimDaysChange(d)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      fontWeight: simDays === d ? 750 : 600,
                      borderRadius: 6,
                      border: 'none',
                      background: simDays === d ? '#ffffff' : 'transparent',
                      color: simDays === d ? '#1e40af' : '#475569',
                      boxShadow: simDays === d ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            )}

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 8, gap: 2 }}>
              {[
                { id: 'combined', label: 'Combined View' },
                { id: 'trajectory', label: 'Balance Only' },
                { id: 'flows', label: 'Flows Only' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setViewMode(m.id as ViewMode)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.76rem',
                    fontWeight: viewMode === m.id ? 700 : 500,
                    borderRadius: 6,
                    border: 'none',
                    background: viewMode === m.id ? '#1e293b' : 'transparent',
                    color: viewMode === m.id ? '#ffffff' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. EXECUTIVE 4-KPI SCORECARD ────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        padding: '16px 24px',
        background: '#ffffff',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 750, textTransform: 'uppercase', color: '#64748b' }}>T+0 Opening Baseline</div>
          <div style={{ fontSize: '1.28rem', fontWeight: 850, color: '#0f172a', margin: '2px 0' }}>{$full(openingBalance)}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Verified GL cash ledger</div>
        </div>

        <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 750, textTransform: 'uppercase', color: '#166534' }}>Peak Liquidity Balance</div>
          <div style={{ fontSize: '1.28rem', fontWeight: 850, color: '#16a34a', margin: '2px 0' }}>{$full(peakBalance)}</div>
          <div style={{ fontSize: '0.7rem', color: '#15803d' }}>Projected peak on {days.find(d => d.closingBalance === peakBalance)?.label || 'Peak Day'}</div>
        </div>

        <div style={{ padding: '10px 14px', background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 750, textTransform: 'uppercase', color: '#9a3412' }}>Minimum Buffer (Trough)</div>
          <div style={{ fontSize: '1.28rem', fontWeight: 850, color: '#c2410c', margin: '2px 0' }}>{$full(troughBalance)}</div>
          <div style={{ fontSize: '0.7rem', color: '#ea580c' }}>Safe liquidity floor</div>
        </div>

        <div style={{ padding: '10px 14px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 750, textTransform: 'uppercase', color: '#1e40af' }}>Projected Close (T+{totalDays})</div>
          <div style={{ fontSize: '1.28rem', fontWeight: 850, color: '#2563eb', margin: '2px 0' }}>{$full(expectedClosing)}</div>
          <div style={{ fontSize: '0.7rem', color: '#1d4ed8' }}>{netChangePct >= 0 ? '+' : ''}{$full(netChangeValue)} expected net change</div>
        </div>
      </div>

      {/* ── 3. INTERACTIVE DAY INSPECTOR HUD ─────────────────────────────────── */}
      <div style={{
        margin: '14px 24px 0',
        padding: '12px 18px',
        background: '#f8fafc',
        borderRadius: 10,
        border: '1px solid #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.2rem' }}>🔍</span>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Day Inspector (Click any day to examine)
            </span>
            <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>
              Day {selectedDayIdx + 1}: {activeDay.label} {activeDay.isWeekend ? '(Weekend)' : '(Banking Day)'}
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Opening</span>
            <strong style={{ fontSize: '0.86rem', color: '#334155' }}>{$full(activeDay.openingBalance)}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.68rem', color: '#166534', display: 'block' }}>Inflow</span>
            <strong style={{ fontSize: '0.86rem', color: '#16a34a' }}>+{$full(activeDay.projectedInflow)}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.68rem', color: '#991b1b', display: 'block' }}>Outflow</span>
            <strong style={{ fontSize: '0.86rem', color: '#dc2626' }}>−{$full(activeDay.projectedOutflow)}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.68rem', color: '#1e40af', display: 'block' }}>Projected Close</span>
            <strong style={{ fontSize: '0.95rem', color: '#2563eb' }}>{$full(activeDay.closingBalance)}</strong>
          </div>
          <div style={{
            padding: '3px 8px',
            borderRadius: 6,
            background: activeDay.confidence >= 80 ? '#dcfce7' : '#fef3c7',
            color: activeDay.confidence >= 80 ? '#15803d' : '#92400e',
            fontSize: '0.74rem',
            fontWeight: 750
          }}>
            {activeDay.confidence}% Confidence
          </div>
        </div>
      </div>

      {/* ── 4. MAIN SVG GRAPH ────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 18px 12px', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${W} ${viewMode === 'trajectory' ? BAL_Y1 + 35 : viewMode === 'flows' ? BAR_H + 80 : TOTAL_H}`}
          style={{ width: '100%', height: 'auto', display: 'block', minWidth: 580 }}
          aria-hidden="true"
        >
          <defs>
            {/* Smooth blue gradient for cash balance curve */}
            <linearGradient id="fcBalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00" />
            </linearGradient>

            {/* Inflow gradient (Emerald) */}
            <linearGradient id="fcInGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.65" />
            </linearGradient>

            {/* Outflow gradient (Rose/Red) */}
            <linearGradient id="fcOutGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.90" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.60" />
            </linearGradient>
          </defs>

          {/* ── TOP PANEL: BALANCE TRAJECTORY ── */}
          {viewMode !== 'flows' && (
            <g>
              {/* Background plot canvas */}
              <rect x={PAD_L} y={BAL_Y0} width={CHART_W} height={BAL_H} fill="#f8fafc" rx="6" />

              {/* Gridlines & Y labels */}
              {balTicks.map((t, i) => (
                <g key={i}>
                  <line
                    x1={PAD_L} y1={yBal(t)} x2={PAD_L + CHART_W} y2={yBal(t)}
                    stroke="#e2e8f0" strokeWidth="1"
                    strokeDasharray={i === 0 ? '0' : '4,4'}
                  />
                  <text
                    x={PAD_L - 10} y={yBal(t) + 4}
                    textAnchor="end" fontSize="10.5" fill="#64748b" fontFamily="inherit" fontWeight="600"
                  >
                    {$k(t)}
                  </text>
                </g>
              ))}

              {/* Weekend shading */}
              {days.map((d, i) => d.isWeekend ? (
                <rect
                  key={'ws' + i}
                  x={xOf(i) - (CHART_W / totalDays) / 2}
                  y={BAL_Y0}
                  width={CHART_W / totalDays}
                  height={BAL_H}
                  fill="#f1f5f9"
                  opacity="0.75"
                />
              ) : null)}

              {/* 95% Confidence Corridor Area */}
              {confidenceBandPath && (
                <path d={confidenceBandPath} fill="#e0e7ff" opacity="0.45" />
              )}

              {/* Area Fill under balance curve */}
              <path d={areaPath} fill="url(#fcBalGrad)" />

              {/* Main Balance Spline Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Day Points & Interactivity */}
              {dayPts.map(([x, y], i) => {
                const d = days[i]
                const isSelected = selectedDayIdx === i
                const isPeak = d.closingBalance === peakBalance
                const isTrough = d.closingBalance === troughBalance
                const isLast = i === totalDays - 1

                return (
                  <g
                    key={'dp' + i}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedDayIdx(i)}
                  >
                    {/* Pulsing ring on selected item */}
                    {isSelected && (
                      <circle cx={x} cy={y} r={12} fill="#3b82f6" opacity="0.3" />
                    )}

                    <circle
                      cx={x} cy={y}
                      r={isSelected ? 6.5 : (isPeak || isTrough || isLast ? 5 : 3.5)}
                      fill={isSelected ? '#1d4ed8' : (isPeak ? '#16a34a' : isTrough ? '#dc2626' : '#2563eb')}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 2.5 : 2}
                    />

                    {/* Value label on selected or peak/trough points */}
                    {(isSelected || (totalDays <= 14 && (isPeak || isTrough || isLast))) && (
                      <text
                        x={x}
                        y={y - (isSelected ? 16 : 11)}
                        textAnchor={i === 0 ? 'start' : isLast ? 'end' : 'middle'}
                        fontSize={isSelected ? '11.5' : '9.5'}
                        fontWeight={isSelected ? '850' : '700'}
                        fill={isSelected ? '#1d4ed8' : '#0f172a'}
                        fontFamily="inherit"
                      >
                        {$k(d.closingBalance)}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          )}

          {/* ── BOTTOM PANEL: INFLOW & OUTFLOW BARS ── */}
          {viewMode !== 'trajectory' && (
            <g transform={viewMode === 'flows' ? `translate(0, -${BAL_H - 10})` : ''}>
              {/* Separator Line */}
              {viewMode === 'combined' && (
                <g>
                  <line x1={PAD_L} y1={BAL_Y1 + 18} x2={PAD_L + CHART_W} y2={BAL_Y1 + 18} stroke="#e2e8f0" strokeWidth="1" />
                  <text x={PAD_L} y={BAL_Y1 + 30} fontSize="9" fill="#64748b" fontWeight="800" letterSpacing="0.08em" fontFamily="inherit">
                    DAILY CASH INFLOWS (+) VS OUTFLOWS (−)
                  </text>
                  <text x={PAD_L + CHART_W} y={BAL_Y1 + 30} fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="inherit">
                    Scale: max {$k(maxFlow)} / day
                  </text>
                </g>
              )}

              {/* Bar Canvas */}
              <rect x={PAD_L} y={BAR_Y0} width={CHART_W} height={BAR_H} fill="#f8fafc" rx="4" />
              <line x1={PAD_L} y1={BAR_Y1} x2={PAD_L + CHART_W} y2={BAR_Y1} stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Daily Inflow & Outflow Bars */}
              {days.map((d, i) => {
                const cx = xOf(i)
                const inH = (d.projectedInflow / maxFlow) * (BAR_H - 10)
                const outH = (d.projectedOutflow / maxFlow) * (BAR_H - 10)
                const isSelected = selectedDayIdx === i

                return (
                  <g
                    key={'bar' + i}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedDayIdx(i)}
                  >
                    {/* Selected column highlight */}
                    {isSelected && (
                      <rect
                        x={cx - barW - 4} y={BAR_Y0}
                        width={barW * 2 + 8} height={BAR_H}
                        fill="#dbeafe" opacity="0.5" rx="3"
                      />
                    )}

                    {/* Inflow bar (Green) */}
                    <rect
                      x={cx - barW - 1} y={BAR_Y1 - inH}
                      width={barW} height={Math.max(inH, 2)}
                      fill="url(#fcInGrad)" rx="2"
                    />

                    {/* Outflow bar (Red) */}
                    <rect
                      x={cx + 1} y={BAR_Y1 - outH}
                      width={barW} height={Math.max(outH, 2)}
                      fill="url(#fcOutGrad)" rx="2"
                    />
                  </g>
                )
              })}
            </g>
          )}

          {/* ── X-AXIS LABELS (NON-OVERLAPPING STEPPED LABELS) ── */}
          {days.map((d, i) => {
            const isSelected = selectedDayIdx === i
            const isLabeled = i % labelStep === 0 || i === totalDays - 1 || isSelected

            if (!isLabeled) return null

            return (
              <text
                key={'xl' + i}
                x={xOf(i)}
                y={viewMode === 'trajectory' ? BAL_Y1 + 22 : LABEL_Y}
                textAnchor="middle"
                fontSize={isSelected ? '10.5' : '9.5'}
                fontWeight={isSelected ? '850' : '600'}
                fill={isSelected ? '#1d4ed8' : (d.isWeekend ? '#94a3b8' : '#475569')}
                fontFamily="inherit"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedDayIdx(i)}
              >
                {d.shortLabel}
              </text>
            )
          })}
        </svg>
      </div>

      {/* ── 5. INTERACTIVE DAY CARDS STRIP ──────────────────────────────────── */}
      <div style={{ padding: '0 20px 16px', background: '#ffffff' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${totalDays <= 7 ? 7 : totalDays <= 14 ? 7 : 10}, 1fr)`,
          gap: 6,
          maxHeight: totalDays > 14 ? 180 : 'auto',
          overflowY: totalDays > 14 ? 'auto' : 'visible',
          paddingRight: totalDays > 14 ? 4 : 0
        }}>
          {days.map((d, idx) => {
            const isSelected = selectedDayIdx === idx

            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelectedDayIdx(idx)}
                style={{
                  padding: '7px 4px',
                  borderRadius: 8,
                  border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  background: isSelected ? '#eff6ff' : (d.isWeekend ? '#f8fafc' : '#ffffff'),
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: isSelected ? '#1e40af' : '#64748b' }}>
                  {totalDays <= 7 ? d.label.split(',')[0] : `D${idx + 1}`}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                  {d.shortLabel}
                </div>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                  {$k(d.closingBalance)}
                </div>
                <div style={{ fontSize: '0.64rem', fontWeight: 700, color: d.netFlow >= 0 ? '#16a34a' : '#dc2626' }}>
                  {d.netFlow >= 0 ? '+' : ''}{$k(d.netFlow)}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 6. BOTTOM SUMMARY METRICS ────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        borderTop: '1px solid #e2e8f0',
        fontSize: '0.78rem',
        color: '#64748b',
        background: '#fafbfc'
      }}>
        {[
          { label: 'Starting Baseline', value: $full(openingBalance) },
          { label: 'Cleared Inflows', value: $full(totalSettling) },
          { label: 'AR Recoveries', value: $full(openARValue) },
          { label: 'AP Disbursements', value: openAPValue > 0 ? $full(openAPValue) : '—' },
          { label: `Projected T+${totalDays} Close`, value: $full(expectedClosing) },
        ].map((s, i) => (
          <div key={s.label} style={{
            flex: 1,
            padding: '12px 14px',
            textAlign: 'center',
            borderRight: i < 4 ? '1px solid #e2e8f0' : 'none'
          }}>
            <div style={{ fontWeight: 850, color: '#0f172a', fontSize: '0.92rem' }}>{s.value}</div>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2, color: '#64748b' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

