import { useEffect, useRef, useState } from 'react'

const METRICS = [
  { value: 98.4, suffix: '%', label: '3-Way Match Rate', color: '#16a34a' },
  { value: 2.8, suffix: 'ms', label: 'Engine Latency', color: '#2563eb' },
  { value: 0, prefix: '₹', suffix: '', label: 'Sec 270A Penalty', color: '#6366f1', display: '₹0' },
  { value: 7, prefix: 'T+', suffix: ' Days', label: 'Liquidity Forecast', color: '#d97706' },
]

function AnimatedNumber({ value, prefix = '', suffix = '', display, color }: {
  value: number; prefix?: string; suffix?: string; display?: string; color: string
}) {
  const [current, setCurrent] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const animated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true
          const start = performance.now()
          const duration = 1200

          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCurrent(eased * value)
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          observer.unobserve(el)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  const formatted = display && current >= value
    ? display
    : `${prefix}${value >= 10 ? Math.round(current) : current.toFixed(1)}${suffix}`

  return (
    <div ref={ref} className="lp-trust-value" style={{ color }}>
      {formatted}
    </div>
  )
}

export default function TrustMetrics() {
  return (
    <section className="lp-trust">
      <div className="lp-wrap">
        <div className="lp-trust-grid">
          {METRICS.map(m => (
            <div key={m.label} className="lp-trust-item">
              <AnimatedNumber
                value={m.value}
                prefix={(m as any).prefix}
                suffix={m.suffix}
                display={(m as any).display}
                color={m.color}
              />
              <div className="lp-trust-label">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
