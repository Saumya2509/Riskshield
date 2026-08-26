import { useEffect, useRef } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'

const STEPS = [
  {
    num: '01',
    title: 'Multi-Source Ingestion',
    desc: 'Upload Bank MT940 statements, ERP General Ledger exports, and GST e-Invoice feeds. The normalizer parses and standardizes all 3 data sources in real time.',
    tags: ['Bank MT940', 'SAP GL', 'GST e-Invoice'],
    color: '#2563eb',
  },
  {
    num: '02',
    title: '3-Pass Heuristic Matching',
    desc: 'Pass 1 Exact: hash-based 100% match. Pass 2 Fuzzy: ±1% fee tolerance with ±2-day settlement lag. Pass 3 Partial: short-pay flagging and multi-line aggregation.',
    tags: ['Exact Match', 'Fuzzy ±1%', 'Partial Short-Pay'],
    color: '#16a34a',
  },
  {
    num: '03',
    title: '6-D Isolation Forest ML',
    desc: 'Unsupervised anomaly detection across 6 feature vectors: variance delta, settlement lag, FX volatility, round-number frequency, counterparty velocity, and GL deviation.',
    tags: ['6 Dimensions', '98.7% AUC-ROC', 'Auto-Flag'],
    color: '#6366f1',
  },
  {
    num: '04',
    title: '1-Click Exception Settlement',
    desc: 'Auto-classify exceptions into 7 GAAP codes. 1-click batch resolution applies debit memos, suspense GL 2190 clearing, and duplicate voiding in milliseconds.',
    tags: ['GAAP Compliant', '7 Exception Codes', 'Batch Resolve'],
    color: '#d97706',
  },
  {
    num: '05',
    title: 'Statutory Tax Defense',
    desc: 'Map expenses to corporate tax regimes (Sec 115BAA @ 25.17%). Defend against Section 270A penalties with Section 144B e-filing and CA DSC Class-3 signing.',
    tags: ['CBDT 115BAA', 'DIN Verified', 'DSC Class-3'],
    color: '#dc2626',
  },
  {
    num: '06',
    title: 'Forward Cash Forecaster',
    desc: 'Generate T+1 to T+7 daily liquidity trajectories with epistemic confidence bounds and interactive DSO lag stress-testing for working capital planning.',
    tags: ['T+1…T+7', '95% Confidence', 'DSO Stress-Test'],
    color: '#0891b2',
  },
]

export default function ScrollytellingSection() {
  const sectionRef = useScrollReveal<HTMLDivElement>(0.05)
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
            el.style.transitionDelay = `${idx * 80}ms`
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
    <section id="how-it-works" className="lp-section lp-section-light">
      <div className="lp-wrap">
        <div className="lp-section-head reveal" ref={sectionRef.ref}>
          <div className="lp-badge lp-badge-blue">
            <span className="lp-badge-dot" />
            HOW IT WORKS
          </div>
          <h2>6-Stage Reconciliation Pipeline</h2>
          <p>From raw multi-source data to certified audit trails and forward liquidity forecasts — fully automated.</p>
        </div>

        <div className="lp-steps-grid" ref={containerRef}>
          {STEPS.map(s => (
            <div key={s.num} className="lp-card lp-step-card reveal-item">
              <div className="lp-step-num" style={{ background: `${s.color}12`, color: s.color }}>
                {s.num}
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <div className="lp-step-tags">
                {s.tags.map(t => (
                  <span key={t} className="lp-step-tag" style={{ background: `${s.color}10`, color: s.color, borderColor: `${s.color}25` }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
