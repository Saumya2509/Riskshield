import { useState } from 'react'

export default function RoiCalculator() {
  const [monthlyTxns, setMonthlyTxns] = useState(50000)

  // Calculations
  const manualAuditHours = Math.round((monthlyTxns * 0.04)) // ~4 mins per 100 txns
  const penaltyShield = Math.round((monthlyTxns * 18.5) / 100000) // ₹ Lakhs
  const engineLatencyMs = Math.max(1.8, (monthlyTxns / 500) * 0.9).toFixed(1)
  const accuracyPercent = 99.98

  return (
    <section className="lp-section" style={{ background: '#070b14' }}>
      <div className="lp-wrap">
        <div className="lp-section-head">
          <div className="lp-badge-shimmer">
            <span className="lp-pulse-dot" />
            ENTERPRISE EFFICIENCY CALCULATOR
          </div>
          <h2>Quantifiable ROI in Real Numbers</h2>
          <p>Estimate the operational hours saved, penalty leakage prevented, and engine throughput for your transaction volume.</p>
        </div>

        <div className="lp-calc-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                Monthly Transaction Volume
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}>
                {monthlyTxns.toLocaleString('en-IN')} <span style={{ fontSize: '1.2rem', color: '#38bdf8', fontWeight: 600 }}>Records / Month</span>
              </div>
            </div>
            <div style={{ fontSize: '0.84rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', borderRadius: 8, fontWeight: 700 }}>
              ⚡ 3-Pass Rule Engine + 6-D ML
            </div>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={5000}
            max={500000}
            step={5000}
            value={monthlyTxns}
            onChange={(e) => setMonthlyTxns(Number(e.target.value))}
            className="lp-slider-track"
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.76rem', marginTop: -24, marginBottom: 32, fontFamily: 'JetBrains Mono, monospace' }}>
            <span>5,000 txns (Mid-market)</span>
            <span>100,000 txns (Enterprise)</span>
            <span>500,000+ txns (Global Multi-Entity)</span>
          </div>

          {/* Results Grid */}
          <div className="lp-calc-results">
            <div className="lp-calc-card">
              <div className="lp-calc-card-val" style={{ color: '#38bdf8' }}>
                ~{manualAuditHours.toLocaleString('en-IN')} hrs
              </div>
              <div className="lp-calc-card-lbl">Manual Audit Saved / Mo</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>Equivalent to {(manualAuditHours / 160).toFixed(1)} Full-Time CPAs</div>
            </div>

            <div className="lp-calc-card">
              <div className="lp-calc-card-val" style={{ color: '#10b981' }}>
                ₹{penaltyShield} Lakhs
              </div>
              <div className="lp-calc-card-lbl">Sec 270A Penalty Shield</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>200% Misreporting Protection</div>
            </div>

            <div className="lp-calc-card">
              <div className="lp-calc-card-val" style={{ color: '#818cf8' }}>
                {engineLatencyMs} ms
              </div>
              <div className="lp-calc-card-lbl">Total Batch Runtime</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>Sub-second deterministic pass</div>
            </div>

            <div className="lp-calc-card">
              <div className="lp-calc-card-val" style={{ color: '#f59e0b' }}>
                {accuracyPercent}%
              </div>
              <div className="lp-calc-card-lbl">Autonomous Match Accuracy</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>ACID-compliant audit trail</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
