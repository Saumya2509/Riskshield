const problems = [
  {
    tag: 'Spreadsheet Chaos',
    title: 'Manual VLOOKUPs break on scale',
    body: 'Finance teams spend days wrestling with mismatched CSVs, broken formulas, and missing transaction IDs across disparate bank feeds and ERP ledgers.',
  },
  {
    tag: 'Hidden Cash Leaks',
    title: 'Unchecked banking fees & short-pays',
    body: 'Minor FX spreads, gateway processing fees, and partial customer underpayments slip through coarse batch totals, silently eroding operating margins.',
  },
  {
    tag: 'Blind Liquidity',
    title: 'No forward visibility on settlement delays',
    body: 'Knowing what cleared yesterday doesn’t tell you if you have enough cash for Friday’s payroll. Without T+n realization curves, liquidity planning is guesswork.',
  },
]

export default function Problem() {
  return (
    <section className="section problem" id="problem">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="eyebrow">The Challenge</p>
            <h2>Financial reconciliation shouldn’t take days of manual spreadsheet work.</h2>
          </div>
          <p className="lead">
            Traditional finance stacks rely on disconnected ERPs and static spreadsheets. When discrepancies occur, accountants spend hours hunting down root causes.
          </p>
        </div>
        <div className="problem-grid">
          {problems.map((item) => (
            <article className="problem-card" key={item.tag}>
              <div className="tag">{item.tag}</div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
