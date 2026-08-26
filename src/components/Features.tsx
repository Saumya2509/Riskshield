import { useEffect, useRef } from 'react'

const FEATURES = [
  {
    icon: '⚡',
    iconClass: 'lp-bento-icon-blue',
    title: '3-Pass Multi-Source Reconciliation',
    desc: 'Deterministic exact, fuzzy (±1% MDR), and partial short-pay matching across Bank, Ledger, and Invoice feeds in under 3ms.',
    stats: ['86.4% Pass 1', '9.2% Pass 2', '2.8ms Runtime'],
    span: true,
  },
  {
    icon: '🔮',
    iconClass: 'lp-bento-icon-indigo',
    title: 'Isolation Forest ML',
    desc: '6-dimensional unsupervised anomaly detection with 98.7% AUC-ROC precision and automatic false-positive suppression.',
    stats: ['6-D Vectors', '98.7% Precision'],
  },
  {
    icon: '🛡️',
    iconClass: 'lp-bento-icon-red',
    title: '1-Click Exception Workbench',
    desc: 'Auto-classify and batch-resolve exceptions with GAAP/IFRS compliant fixes — debit memos, suspense clearing, duplicate voiding.',
    stats: ['7 GAAP Codes', '1-Click Resolve'],
  },
  {
    icon: '🏛️',
    iconClass: 'lp-bento-icon-amber',
    title: 'Statutory Tax Defense',
    desc: 'Mitigate Section 270A 200% penalties with Section 144B e-filing, Form 26A certificates, and CA DSC Class-3 digital signing.',
    stats: ['CBDT 115BAA', 'DIN Verified'],
  },
  {
    icon: '📈',
    iconClass: 'lp-bento-icon-cyan',
    title: 'Forward Cash Forecaster',
    desc: 'T+1 to T+7 daily liquidity trajectories with epistemic confidence bounds and interactive DSO lag stress-testing.',
    stats: ['T+7 Horizon', '95% Confidence'],
    span: true,
  },
]

export default function Features() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const items = container.querySelectorAll('.reveal-item')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            const idx = Array.from(items).indexOf(el)
            el.style.transitionDelay = `${idx * 100}ms`
            el.classList.add('revealed')
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" className="lp-section lp-section-light" style={{ background: '#fff' }}>
      <div className="lp-wrap">
        <div className="lp-section-head">
          <div className="lp-badge lp-badge-blue">
            <span className="lp-badge-dot" />
            PLATFORM CAPABILITIES
          </div>
          <h2>Everything You Need to Control Finance</h2>
          <p>From ingestion to statutory defense — a unified platform replacing spreadsheets, manual matching, and compliance gaps.</p>
        </div>

        <div className="lp-bento" ref={containerRef}>
          {FEATURES.map(f => (
            <div key={f.title} className={`lp-card lp-bento-item reveal-item ${f.span ? 'span-2' : ''}`}>
              <div className={`lp-bento-icon ${f.iconClass}`}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <div className="lp-bento-mini">
                {f.stats.map(s => (
                  <span key={s} className="lp-bento-stat">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
