import { useEffect, useRef, useState } from 'react'

const METRICS = [
  { val: 98.4, suffix: '%', label: '3-Way Match Rate', sub: 'Pass 1 Exact + Pass 2 Fuzzy', color: '#10b981' },
  { val: 2.8, suffix: ' ms', label: 'Processing Latency', sub: 'Sub-3ms per 500 records', color: '#38bdf8' },
  { val: 0, prefix: '₹', suffix: '', label: 'Sec 270A Penalties', sub: 'Builds Audit Trail for CA Response', color: '#a78bfa', display: '₹0' },
  { val: 7, prefix: 'T+', suffix: ' Days', label: 'Forward Cash Runway', sub: '95% Epistemic Confidence', color: '#fbbf24' },
]

function Counter({ item }: { item: typeof METRICS[0] }) {
  const [num, setNum] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isAnimated.current) {
        isAnimated.current = true
        const start = performance.now()
        const duration = 1200
        const frame = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          const easeOut = 1 - Math.pow(1 - progress, 3)
          setNum(easeOut * item.val)
          if (progress < 1) requestAnimationFrame(frame)
        }
        requestAnimationFrame(frame)
        observer.unobserve(el)
      }
    }, { threshold: 0.3 })

    observer.observe(el)
    return () => observer.disconnect()
  }, [item.val])

  const formatted = item.display && num >= item.val
    ? item.display
    : `${item.prefix || ''}${item.val < 10 ? num.toFixed(1) : Math.round(num)}${item.suffix}`

  return (
    <div ref={ref} className="lp-trust-card">
      <div className="lp-trust-num" style={{ color: item.color }}>
        {formatted}
      </div>
      <div className="lp-trust-desc">{item.label}</div>
      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>{item.sub}</div>
    </div>
  )
}

export default function TrustMetrics() {
  return (
    <div className="lp-trust-strip">
      <div className="lp-wrap">
        <div className="lp-trust-grid">
          {METRICS.map((m) => (
            <Counter key={m.label} item={m} />
          ))}
        </div>
      </div>
    </div>
  )
}
