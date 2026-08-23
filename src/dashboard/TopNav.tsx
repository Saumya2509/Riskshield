import Logo from '../components/Logo'

type TopNavProps = {
  onMenu: () => void
}

export default function TopNav({ onMenu }: TopNavProps) {
  return (
    <header className="d-topnav">
      <button className="d-icon-btn d-menu" type="button" onClick={onMenu} aria-label="Open navigation">
        ☰
      </button>
      <a className="d-brand" href="#/dashboard">
        <Logo variant="dash" size={30} />
        <span>RiskShield</span>
      </a>
      <label className="d-search">
        <span className="d-search-icon" aria-hidden="true">⌕</span>
        <input type="search" placeholder="Search orders, customers, cases…" />
      </label>
      <div className="d-top-actions">
        <button className="d-icon-btn" type="button" aria-label="Notifications">
          <span className="d-dot" />
          🔔
        </button>
        <div className="d-user">
          <span className="d-avatar">AM</span>
          <span className="d-user-meta">
            <strong>Alex Morgan</strong>
            <small>Risk analyst</small>
          </span>
        </div>
      </div>
    </header>
  )
}
