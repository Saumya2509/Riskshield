import { useState } from 'react'
import type { CashForecast } from './cashForecast'

interface Props { forecast: CashForecast }

// ─── Layout constants ─────────────────────────────────────────────────────────
const W = 820
const PAD_L = 75, PAD_R = 65, PAD_TOP = 20, AXIS_H = 32

// Top panel: balance area chart
const BAL_H  = 200
const BAL_Y0 = PAD_TOP
const BAL_Y1 = BAL_Y0 + BAL_H

// Separator + label row
const SEP_Y = BAL_Y1 + 14
const SEP_LABEL_Y = SEP_Y + 18

// Bottom panel: inflow / outflow bars
const BAR_H  = 90
const BAR_Y0 = SEP_LABEL_Y + 6
const BAR_Y1 = BAR_Y0 + BAR_H

// Shared X axis labels
const LABEL_Y = BAR_Y1 + AXIS_H - 4

const CHART_W = W - PAD_L - PAD_R
const TOTAL_H = LABEL_Y + 12

// ─── Helpers ──────────────────────────────────────────────────────────────────
const $k = (n: number) =>
  n >= 10_000_000 ? `₹${(n / 10_000_000).toFixed(1)}Cr`
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

export default function CashForecastChart({ forecast }: Props) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0)

  const { forecastDays, openingBalance, peakBalance, troughBalance, expectedClosing,
          openARValue, openAPValue, totalSettling, netChangeValue, netChangePct } = forecast
  const days = forecastDays
  const activeDay = days[selectedDayIdx] || days[0]

  // ── Balance scale (top panel) ───────────────────────────────────────────────
  const allBal = [openingBalance, ...days.map(d => d.closingBalance)]
  const minBal = Math.min(...allBal) * 0.94
  const maxBal = Math.max(...allBal) * 1.06
  const balRange = maxBal - minBal || 1

  const xOf = (i: number) => PAD_L + (i / (days.length - 1)) * CHART_W
  const yBal = (v: number) => BAL_Y1 - ((v - minBal) / balRange) * BAL_H

  // X positions are spaced 0..6 for 7 days
  const dayPts: [number, number][] = days.map((d, i) => [xOf(i), yBal(d.closingBalance)])

  const linePath = smoothPath(dayPts)
  const areaPath = `${linePath} L ${xOf(days.length - 1)},${BAL_Y1} L ${xOf(0)},${BAL_Y1} Z`

  // Y-axis ticks (4 levels)
  const balTicks = [0, 1, 2, 3].map(i => minBal + (balRange / 3) * i)

  // ── Bar scale (bottom panel) ────────────────────────────────────────────────
  const maxFlow = Math.max(...days.map(d => Math.max(d.projectedInflow, d.projectedOutflow)), 1)
  const barW = Math.max(10, CHART_W / days.length * 0.26)

  // ── Net change badge ─────────────────────────────────────────────────────────
  const isUp = netChangeValue >= 0

  return (
    <section className="fin-forecast-card" aria-label="7-day cash forecast" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      {/* Card header */}
      <div className="fin-card-hd" style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 className="fin-card-title" style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              📈 7-Day Liquidity &amp; Cash Flow Trajectory
            </h2>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: isUp ? '#dcfce7' : '#fee2e2', color: isUp ? '#15803d' : '#b91c1c' }}>
              {isUp ? '▲ Net Growth' : '▼ Net Outflow'} ({netChangePct >= 0 ? '+' : ''}{netChangePct.toFixed(1)}%)
            </span>
          </div>
          <p className="fin-card-desc" style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
            Interactive timeline: Hover or click any day node below to inspect daily inflows, outflows, and cash balances
          </p>
        </div>

        {/* Selected Day Quick Inspector Badge */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ padding: '6px 14px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', fontSize: '0.82rem' }}>
            <span style={{ color: '#1e40af', fontWeight: 600 }}>Selected ({activeDay.shortLabel}): </span>
            <strong style={{ color: '#1e3a8a' }}>{$full(activeDay.closingBalance)}</strong>
            <span style={{ color: activeDay.netFlow >= 0 ? '#16a34a' : '#dc2626', marginLeft: 6, fontWeight: 700 }}>
              ({activeDay.netFlow >= 0 ? '+' : ''}{$full(activeDay.netFlow)})
            </span>
          </div>
        </div>
      </div>

      {/* Hero 4 KPI Mini-Scorecards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: '16px 24px', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Opening Balance</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>{$full(openingBalance)}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>T+0 baseline ledger</div>
        </div>

        <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#166534' }}>Peak Liquidity</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', margin: '2px 0' }}>{$full(peakBalance)}</div>
          <div style={{ fontSize: '0.7rem', color: '#15803d' }}>Expected on {days.find(d => d.closingBalance === peakBalance)?.label || 'Peak Day'}</div>
        </div>

        <div style={{ padding: '10px 14px', background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#9a3412' }}>Trough Liquidity Buffer</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c2410c', margin: '2px 0' }}>{$full(troughBalance)}</div>
          <div style={{ fontSize: '0.7rem', color: '#ea580c' }}>Minimum threshold</div>
        </div>

        <div style={{ padding: '10px 14px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#1e40af' }}>Projected 7-Day Close</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb', margin: '2px 0' }}>{$full(expectedClosing)}</div>
          <div style={{ fontSize: '0.7rem', color: '#1d4ed8' }}>{netChangePct >= 0 ? '+' : ''}{$full(netChangeValue)} net change</div>
        </div>
      </div>

      {/* Legend & Controls */}
      <div style={{
        display: 'flex', gap: 20, padding: '12px 24px 6px',
        fontSize: '0.78rem', color: '#64748b', alignItems: 'center', flexWrap: 'wrap',
      }}>
        {[
          { color: '#2563eb', label: 'Cash Balance Trajectory (₹)' },
          { color: '#16a34a', label: 'Daily Inflow Settlements (+₹)' },
          { color: '#ef4444', label: 'Daily Outflows / AP (-₹)' },
        ].map(l => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: l.color, display: 'inline-block' }} />
            {l.label}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.76rem', background: '#f8fafc', padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
          💡 Click any circle or bar to lock inspection
        </span>
      </div>

      {/* SVG chart */}
      <div style={{ padding: '0 16px 20px', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${W} ${TOTAL_H}`}
          style={{ width: '100%', height: 'auto', display: 'block', minWidth: 520 }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="fcBalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#2563eb" stopOpacity="0.20" />
              <stop offset="80%"  stopColor="#2563eb" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="fcInGrad"  x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="fcOutGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.80" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.50" />
            </linearGradient>
          </defs>

          {/* ── Balance panel ── */}

          {/* Background panel */}
          <rect x={PAD_L} y={BAL_Y0} width={CHART_W} height={BAL_H} fill="#fafbff" rx="4" />

          {/* Grid lines + Y labels */}
          {balTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={PAD_L} y1={yBal(t)} x2={PAD_L + CHART_W} y2={yBal(t)}
                stroke="#e2e8f0" strokeWidth="1"
                strokeDasharray={i === 0 ? '0' : '4,4'}
              />
              <text
                x={PAD_L - 8} y={yBal(t) + 4}
                textAnchor="end" fontSize="11" fill="#94a3b8" fontFamily="inherit"
              >
                {$k(t)}
              </text>
            </g>
          ))}

          {/* Weekend shading */}
          {days.map((d, i) => d.isWeekend ? (
            <rect
              key={'ws' + i}
              x={i === 0 ? xOf(0) : xOf(i) - CHART_W / days.length / 2}
              y={BAL_Y0}
              width={CHART_W / days.length}
              height={BAL_H}
              fill="#f1f5f9"
              opacity="0.6"
            />
          ) : null)}

          {/* Area fill */}
          <path d={areaPath} fill="url(#fcBalGrad)" />

          {/* Balance line */}
          <path
            d={linePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data points */}
          {dayPts.map(([x, y], i) => {
            const d = days[i]
            const isPeak   = d.closingBalance === peakBalance
            const isTrough = d.closingBalance === troughBalance
            const isSelected = selectedDayIdx === i
            const isLast   = i === days.length - 1
            const showLabel = isPeak || isTrough || isLast || i === 0 || isSelected
            return (
              <g
                key={'dp' + i}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedDayIdx(i)}
              >
                {/* Outer pulsing ring on selected or key points */}
                {(isSelected || showLabel) && (
                  <circle
                    cx={x} cy={y}
                    r={isSelected ? 10 : 7}
                    fill={isSelected ? '#3b82f6' : '#2563eb'}
                    stroke="white"
                    strokeWidth="2"
                    opacity={isSelected ? 0.35 : 0.2}
                  />
                )}
                <circle
                  cx={x} cy={y}
                  r={isSelected ? 6 : (showLabel ? 4.5 : 3.5)}
                  fill={isPeak ? '#16a34a' : isTrough ? '#ef4444' : isSelected ? '#1d4ed8' : '#2563eb'}
                  stroke="white"
                  strokeWidth={isSelected ? 2.5 : 2}
                />
                {/* Value label on key/selected points */}
                {showLabel && (
                  <text
                    x={x}
                    y={y - (isSelected ? 16 : 13)}
                    textAnchor={i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'}
                    fontSize={isSelected ? '11.5' : '10'}
                    fontWeight={isSelected ? '800' : '700'}
                    fill={isSelected ? '#1d4ed8' : (isPeak ? '#15803d' : isTrough ? '#b91c1c' : '#1e40af')}
                    fontFamily="inherit"
                  >
                    {$k(d.closingBalance)}
                  </text>
                )}
                {/* Confidence label */}
                {isLast && (
                  <text
                    x={x} y={y + 22}
                    textAnchor="end" fontSize="9.5" fill="#94a3b8" fontFamily="inherit"
                  >
                    {d.confidence}% conf.
                  </text>
                )}
              </g>
            )
          })}

          {/* ── Separator ── */}
          <line x1={PAD_L} y1={SEP_Y} x2={PAD_L + CHART_W} y2={SEP_Y} stroke="#e2e8f0" strokeWidth="1" />
          <text x={PAD_L} y={SEP_LABEL_Y} fontSize="9.5" fill="#64748b" fontWeight="800" letterSpacing="1" fontFamily="inherit">
            DAILY FLOW BREAKDOWN (INFLOW VS OUTFLOW)
          </text>
          <text x={PAD_L + CHART_W} y={SEP_LABEL_Y} fontSize="9.5" fill="#94a3b8" textAnchor="end" fontFamily="inherit">
            max {$k(maxFlow)} / day
          </text>

          {/* ── Flows panel ── */}
          <rect x={PAD_L} y={BAR_Y0} width={CHART_W} height={BAR_H} fill="#fafbff" rx="4" />

          {/* Zero line */}
          <line x1={PAD_L} y1={BAR_Y1} x2={PAD_L + CHART_W} y2={BAR_Y1} stroke="#cbd5e1" strokeWidth="1" />

          {/* Flow bars */}
          {days.map((d, i) => {
            const cx = xOf(i)
            const inH  = (d.projectedInflow  / maxFlow) * BAR_H
            const outH = (d.projectedOutflow / maxFlow) * BAR_H
            const isSelected = selectedDayIdx === i
            return (
              <g
                key={'bar' + i}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedDayIdx(i)}
              >
                {/* Highlight background column on selection */}
                {isSelected && (
                  <rect
                    x={cx - barW - 4} y={BAR_Y0}
                    width={barW * 2 + 8} height={BAR_H}
                    fill="#dbeafe" opacity="0.45" rx="4"
                  />
                )}
                {/* Inflow bar */}
                <rect
                  x={cx - barW - 1} y={BAR_Y1 - inH}
                  width={barW} height={Math.max(inH, 2)}
                  fill="url(#fcInGrad)" rx="2"
                />
                {/* Outflow bar */}
                <rect
                  x={cx + 1} y={BAR_Y1 - outH}
                  width={barW} height={Math.max(outH, 2)}
                  fill="url(#fcOutGrad)" rx="2"
                />
              </g>
            )
          })}

          {/* ── X axis labels ── */}
          {days.map((d, i) => {
            const isSelected = selectedDayIdx === i
            return (
              <text
                key={'xl' + i}
                x={xOf(i)} y={LABEL_Y}
                textAnchor="middle"
                fontSize={isSelected ? '11' : '10'}
                fontWeight={isSelected ? '800' : '600'}
                fill={isSelected ? '#1d4ed8' : (d.isWeekend ? '#94a3b8' : '#334155')}
                fontFamily="inherit"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedDayIdx(i)}
              >
                {d.shortLabel}
              </text>
            )
          })}

          {/* Left axis border */}
          <line x1={PAD_L} y1={BAL_Y0} x2={PAD_L} y2={BAR_Y1} stroke="#e2e8f0" strokeWidth="1" />
        </svg>
      </div>

      {/* Interactive 7-Day Day Selector Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, padding: '0 18px 16px', background: '#fff' }}>
        {days.map((d, idx) => {
          const isSelected = selectedDayIdx === idx
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => setSelectedDayIdx(idx)}
              style={{
                padding: '8px 6px',
                borderRadius: 8,
                border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                background: isSelected ? '#eff6ff' : (d.isWeekend ? '#f8fafc' : '#fff'),
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isSelected ? '#1e40af' : '#475569' }}>
                {d.label.split(',')[0]}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                {d.shortLabel}
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', marginTop: 3 }}>
                {$k(d.closingBalance)}
              </div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: d.netFlow >= 0 ? '#16a34a' : '#dc2626' }}>
                {d.netFlow >= 0 ? '+' : ''}{$k(d.netFlow)}
              </div>
            </button>
          )
        })}
      </div>

      {/* Summary row */}
      <div style={{
        display: 'flex', gap: 0, borderTop: '1px solid #e2e8f0',
        fontSize: '0.78rem', color: '#64748b', background: '#fafbfc'
      }}>
        {[
          { label: 'Opening Balance',  value: $full(openingBalance) },
          { label: 'Total Settling',   value: $full(totalSettling) },
          { label: 'AR Recovery',      value: $full(openARValue) },
          { label: 'AP Outflows',      value: openAPValue > 0 ? $full(openAPValue) : '—' },
          { label: 'Expected Close',   value: $full(expectedClosing) },
        ].map((s, i) => (
          <div key={s.label} style={{
            flex: 1, padding: '12px 14px', textAlign: 'center',
            borderRight: i < 4 ? '1px solid #e2e8f0' : 'none',
          }}>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{s.value}</div>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2, color: '#64748b' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
