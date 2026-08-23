const workflowSteps = [
  {
    step: '01',
    title: 'Multi-Source Batch Ingestion',
    tag: 'BANK · LEDGER · INVOICE',
    desc: 'Ingest raw multi-source files (Bank Statements, ERP General Ledgers, and Invoicing billing feeds). Upload custom CSVs or select from enterprise batch datasets.',
  },
  {
    step: '02',
    title: '3-Pass Deterministic Matching',
    tag: 'EXACT ➔ FUZZY ➔ PARTIAL',
    desc: 'Executes Pass 1 (Exact ID & Amount), Pass 2 (Fuzzy ±1% Banking Fee & Settlement Lag), and Pass 3 (Partial Delta & Short-Pay detection) automatically in sequence.',
  },
  {
    step: '03',
    title: 'ML Anomaly & Risk Scoring',
    tag: 'ISOLATION FOREST',
    desc: 'Evaluates a 6-feature Isolation Forest vector model to score anomalies (0–100 scale), flagging duplicate charges, currency FX skews, and timing gaps.',
  },
  {
    step: '04',
    title: '3-Way Record Details & Resolution',
    tag: '1-CLICK WORKBENCH',
    desc: 'Click any row in the engine to open 3-way cross-verification cards, AI root-cause variance explanations, suggested fixes, and 1-click analyst assignments.',
  },
  {
    step: '05',
    title: 'Forward Cash Forecaster & Tax Matcher',
    tag: 'T+1…T+7 LIQUIDITY CURVE',
    desc: 'Simulates settlement curves, daily Inflow/Outflow Donut charts, Net Delta Histograms, and maps deductible vendor lines into corporate tax liability estimates.',
  },
  {
    step: '06',
    title: 'Executive Reports & Cloud Audit Sync',
    tag: 'SUPABASE POSTGRESQL',
    desc: 'Generates 9-section sign-off compliance reports, syncs records to Supabase cloud PostgreSQL, and exports certified audit JSON and CSV packages.',
  },
]

export default function HowItWorks() {
  return (
    <section className="section" id="workflow">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="eyebrow">End-to-End Workflow</p>
            <h2>How RiskShield operates from raw files to certified sign-off.</h2>
          </div>
          <p className="lead">
            Eliminate error-prone manual spreadsheets. RiskShield connects your financial sources into a continuous, automated 6-stage reconciliation and forecasting pipeline.
          </p>
        </div>

        <div className="workflow-track">
          {workflowSteps.map((item) => (
            <article className="workflow-card" key={item.step}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div className="workflow-num">{item.step}</div>
                <span className="workflow-pill">{item.tag}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
