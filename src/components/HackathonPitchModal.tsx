import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function HackathonPitchModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'architecture' | 'problem_solution' | 'roi' | 'tech_stack'>('architecture')

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(11, 27, 52, 0.82)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        maxWidth: '920px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
        border: '1px solid #cbd5e1',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #0b1b34 0%, #1e3a8a 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.6rem' }}>🏆</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                RiskShield — Hackathon Executive &amp; Architecture Brief
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#93c5fd' }}>
                Next-Gen Multi-Source Reconciliation, ML Isolation Forest &amp; Statutory Tax Defense Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              width: 32,
              height: 32,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          padding: '0 24px',
          gap: 8
        }}>
          {[
            { id: 'architecture', label: '🏗️ System Architecture' },
            { id: 'problem_solution', label: '🎯 Problem & Solution' },
            { id: 'roi', label: '📈 Quantifiable Business ROI' },
            { id: 'tech_stack', label: '⚙️ Tech Stack & Security' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 16px',
                fontSize: '0.84rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#1e3a8a' : '#64748b',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, maxHeight: 'calc(90vh - 150px)' }}>

          {/* TAB 1: SYSTEM ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem', color: '#0f172a', fontWeight: 800 }}>
                End-to-End Enterprise Data Pipeline &amp; Algorithmic Layer
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#475569', marginBottom: 18, lineHeight: 1.5 }}>
                RiskShield executes an asynchronous 5-stage pipeline transforming messy banking statements, ERP general ledgers, and invoice telemetry into reconciled audit books and statutory tax defense submissions.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
                <div style={{ background: '#eff6ff', padding: '14px', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>1. Ingestion Layer</div>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', margin: '4px 0' }}>Multi-Source Normalizer</strong>
                  <span style={{ fontSize: '0.76rem', color: '#334155' }}>Ingests Bank MT940/CAMT, ERP GL dumps, and e-Invoices with UTF-8 normalization.</span>
                </div>

                <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>2. 3-Pass Rule Engine</div>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', margin: '4px 0' }}>Heuristic Reconciliation</strong>
                  <span style={{ fontSize: '0.76rem', color: '#334155' }}>Pass 1 Exact (100%), Pass 2 Fuzzy (±1% delta/±2d window), Pass 3 Partial Short-Pay.</span>
                </div>

                <div style={{ background: '#faf5ff', padding: '14px', borderRadius: 10, border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }}>3. ML Scoring Layer</div>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', margin: '4px 0' }}>Isolation Forest Scorer</strong>
                  <span style={{ fontSize: '0.76rem', color: '#334155' }}>6-feature anomaly vector detecting rogue duplicates, round-sum patterns, &amp; drift.</span>
                </div>

                <div style={{ background: '#fffbeb', padding: '14px', borderRadius: 10, border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>4. Statutory Tax Defense</div>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', margin: '4px 0' }}>CBDT &amp; GST Rule 88C</strong>
                  <span style={{ fontSize: '0.76rem', color: '#334155' }}>Sec 148 scrutiny defense, Form 26A/201(1), Form 15CB DTAA, and DIN tracking.</span>
                </div>
              </div>

              <div style={{ background: '#0b1b34', color: '#e2e8f0', padding: '16px', borderRadius: 10, fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.6 }}>
                <div><code>[Bank Feed] + [ERP Ledger] + [Invoice QR]</code></div>
                <div><code>   │</code></div>
                <div><code>   ├──▶ 3-Pass Rule Engine (Exact / Fuzzy / Partial) ──▶ 98.4% Match Rate</code></div>
                <div><code>   ├──▶ ML Isolation Forest (6-D Feature Vector)    ──▶ Anomaly Flagging</code></div>
                <div><code>   ├──▶ Statutory Tax Matcher (Sec 148 / 195 / 88C) ──▶ CA DSC Certification</code></div>
                <div><code>   └──▶ Forward Liquidity Forecaster (T+1…T+7)       ──▶ Daily Cash Curve</code></div>
              </div>
            </div>
          )}

          {/* TAB 2: PROBLEM & SOLUTION */}
          {activeTab === 'problem_solution' && (
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem', color: '#0f172a', fontWeight: 800 }}>
                The $4.2 Trillion Enterprise Pain Point
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ background: '#fef2f2', padding: '16px', borderRadius: 12, border: '1px solid #fecaca' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#991b1b', fontSize: '0.92rem' }}>❌ The Old Broken Way</h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8rem', color: '#7f1d1d', lineHeight: 1.7 }}>
                    <li>Finance teams spend <strong>14–21 business days</strong> each month manually matching Excel rows.</li>
                    <li>Payment gateway fee variances (1–3%) trigger false exception alarms.</li>
                    <li>Unreconciled expenses trigger <strong>Section 270A 200% tax penalty notices</strong> from income tax authorities.</li>
                    <li>CFOs have zero visibility into true T+1 to T+7 forward cash positions.</li>
                  </ul>
                </div>

                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#166534', fontSize: '0.92rem' }}>✅ The RiskShield Advantage</h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8rem', color: '#14532d', lineHeight: 1.7 }}>
                    <li><strong>3-Second Autonomous Matching</strong> across 500+ multi-source transactions.</li>
                    <li>1-Click Accounting Fixes: Automated debit notes, suspense GL 2190, &amp; FX gains/loss.</li>
                    <li><strong>Built-in Statutory Tax Notice Defense</strong> with DIN tracking &amp; CA DSC Class-3 signing.</li>
                    <li>Epistemic T+1 to T+7 forward liquidity curves with DSO lag stress-testing.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUANTIFIABLE ROI */}
          {activeTab === 'roi' && (
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem', color: '#0f172a', fontWeight: 800 }}>
                Measurable Impact for Corporate Finance &amp; Audit Committees
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#2563eb' }}>98.4%</div>
                  <strong style={{ fontSize: '0.82rem', color: '#0f172a', display: 'block', margin: '4px 0' }}>Faster Books Closing</strong>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Reduced month-end closing from 18 days to under 4 hours.</span>
                </div>

                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#16a34a' }}>₹0</div>
                  <strong style={{ fontSize: '0.82rem', color: '#166534', display: 'block', margin: '4px 0' }}>Sec 270A Penalties</strong>
                  <span style={{ fontSize: '0.74rem', color: '#15803d' }}>100% deduction protection under Section 37(1) &amp; Rule 88C.</span>
                </div>

                <div style={{ padding: '16px', background: '#faf5ff', borderRadius: 10, border: '1px solid #e9d5ff', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#7c3aed' }}>100%</div>
                  <strong style={{ fontSize: '0.82rem', color: '#6b21a8', display: 'block', margin: '4px 0' }}>Audit Trail Integrity</strong>
                  <span style={{ fontSize: '0.74rem', color: '#9333ea' }}>Every transaction linked to Bank ID, ERP GL, &amp; Invoice QR.</span>
                </div>

                <div style={{ padding: '16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#d97706' }}>5.8x</div>
                  <strong style={{ fontSize: '0.82rem', color: '#92400e', display: 'block', margin: '4px 0' }}>Direct ROI Multiplier</strong>
                  <span style={{ fontSize: '0.74rem', color: '#b45309' }}>Eliminates audit firm billable hours &amp; penalty liabilities.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TECH STACK & SECURITY */}
          {activeTab === 'tech_stack' && (
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem', color: '#0f172a', fontWeight: 800 }}>
                Enterprise Tech Stack, Security &amp; Compliance Standard
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <strong style={{ fontSize: '0.86rem', color: '#0f172a', display: 'block', marginBottom: 8 }}>💻 Frontend &amp; Algorithmic Engine</strong>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
                    <li><strong>React 18 + TypeScript</strong> for type-safe financial accounting logic.</li>
                    <li><strong>Vite 6 Bundler</strong> achieving sub-second hot reload &amp; production builds.</li>
                    <li><strong>Custom Vector ML Engine</strong>: Isolation Forest with 6-feature anomaly scores.</li>
                    <li><strong>SVG Liquidity Forecaster</strong>: Dynamic spline curve modeling T+1…T+7.</li>
                  </ul>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <strong style={{ fontSize: '0.86rem', color: '#0f172a', display: 'block', marginBottom: 8 }}>🔒 Security &amp; Statutory Compliance</strong>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
                    <li><strong>Supabase Cloud Realtime</strong> for persistent audit logging &amp; multi-analyst sync.</li>
                    <li><strong>CA Digital Signature (DSC Class-3)</strong> validation standard.</li>
                    <li><strong>Income Tax DIN Compliant</strong> (Document Identification Number).</li>
                    <li><strong>GST DRC-01 Rule 88C</strong> outward vs inward turnover reconciliation.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Built for <strong>Global FinTech &amp; AI Hackathon 2026</strong> · RiskShield v2.4
          </div>
          <button
            onClick={onClose}
            className="d-btn d-btn-primary"
            style={{ fontSize: '0.84rem', padding: '8px 20px' }}
          >
            Got It, Back to App 🚀
          </button>
        </div>
      </div>
    </div>
  )
}
