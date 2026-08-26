import { useCallback, useEffect, useRef, useState } from 'react'

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const rafRef = useRef(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { setTimeout(() => setLoaded(true), 100) }, [])

  const handleMove = useCallback((e: MouseEvent) => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const rect = heroRef.current?.getBoundingClientRect()
      if (!rect) return
      setMouse({
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
      })
    })
  }, [])

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    el.addEventListener('mousemove', handleMove)
    return () => {
      el.removeEventListener('mousemove', handleMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [handleMove])

  const px = (factor: number) => ({
    transform: `translate3d(${mouse.x * factor}px, ${mouse.y * factor}px, 0)`,
  })

  return (
    <section className="lp-hero" id="top" ref={heroRef}>
      {/* Animated Gradient Mesh */}
      <div className="lp-hero-mesh">
        <div className="lp-hero-orb lp-hero-orb-1" />
        <div className="lp-hero-orb lp-hero-orb-2" />
        <div className="lp-hero-orb lp-hero-orb-3" />
      </div>
      <div className="lp-hero-grid" />

      <div className="lp-hero-content">
        {/* Left: Copy */}
        <div className="lp-hero-text" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="lp-badge lp-badge-dark" style={{ marginBottom: 20 }}>
            <span className="lp-badge-dot" />
            AUTONOMOUS FINANCE OS
          </div>
          <h1>
            Reconcile, detect, and forecast{' '}
            <span>across 3 sources in seconds</span>
          </h1>
          <p className="lp-hero-desc">
            RiskShield ingests Bank Statements, ERP General Ledgers, and GST e-Invoices.
            Execute 3-pass matching, isolate anomalies with 6-D ML, forecast liquidity,
            and defend balance sheets with statutory automation.
          </p>
          <div className="lp-hero-ctas">
            <a className="lp-btn lp-btn-primary" href="#/reconciliation">⚡ Open Reconciliation Engine</a>
            <a className="lp-btn lp-btn-outline-light" href="#how-it-works">Explore Workflow</a>
          </div>
          <div className="lp-hero-trust">
            <span className="lp-hero-trust-item"><span className="lp-hero-trust-check">✓</span> 3-Pass Rule Engine</span>
            <span style={{ color: '#475569' }}>·</span>
            <span className="lp-hero-trust-item"><span className="lp-hero-trust-check">✓</span> Isolation Forest ML</span>
            <span style={{ color: '#475569' }}>·</span>
            <span className="lp-hero-trust-item"><span className="lp-hero-trust-check">✓</span> DSC Class-3 Signing</span>
          </div>
        </div>

        {/* Right: Parallax Preview Card */}
        <div className="lp-hero-visual" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(40px)', transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s' }}>
          <div className="lp-parallax-layer" style={px(20)}>
            <div className="lp-preview-card">
              <div className="lp-preview-header">
                <div className="lp-preview-title">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Live Audit Engine · Batch #1
                </div>
                <div className="lp-preview-dots">
                  <span className="lp-preview-dot" style={{ background: '#ef4444' }} />
                  <span className="lp-preview-dot" style={{ background: '#f59e0b' }} />
                  <span className="lp-preview-dot" style={{ background: '#10b981' }} />
                </div>
              </div>

              <div className="lp-preview-kpis">
                <div className="lp-preview-kpi">
                  <div className="lp-preview-kpi-label">Cleared Value</div>
                  <div className="lp-preview-kpi-value" style={{ color: '#10b981' }}>₹1.48 Cr</div>
                </div>
                <div className="lp-preview-kpi">
                  <div className="lp-preview-kpi-label">Penalty Shield</div>
                  <div className="lp-preview-kpi-value" style={{ color: '#818cf8' }}>₹3.42 L</div>
                </div>
                <div className="lp-preview-kpi">
                  <div className="lp-preview-kpi-label">Engine Runtime</div>
                  <div className="lp-preview-kpi-value" style={{ color: '#38bdf8' }}>2.8 ms</div>
                </div>
                <div className="lp-preview-kpi">
                  <div className="lp-preview-kpi-label">Capital Runway</div>
                  <div className="lp-preview-kpi-value" style={{ color: '#f59e0b' }}>42 Days</div>
                </div>
              </div>

              <div className="lp-preview-telemetry">
                <div style={{ color: '#4ade80' }}>[PASS 1] 432 / 500 exact match (0.00 delta)</div>
                <div style={{ color: '#38bdf8' }}>[PASS 2] 46 fuzzy reconciled ±1.5% MDR</div>
                <div style={{ color: '#f87171' }}>[SOLVE] 39 exceptions auto-settled via GL 6140</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
