type SidebarProps = {
  open: boolean
  onClose: () => void
  activeId?: string
}

export const SIDEBAR_NAV = [
  { id: 'dashboard',      label: 'Dashboard',                   href: '#/dashboard',      icon: '▦' },
  { id: 'reconciliation', label: '1. Multi-Source Recon',      href: '#/reconciliation', icon: '🔄' },
  { id: 'exceptions',     label: '2. Exception Workbench',      href: '#/exceptions',     icon: '⚠️' },
  { id: 'cash-forecast',  label: '3. Forward Cash Forecaster',  href: '#/cash-forecast',  icon: '📈' },
  { id: 'tax-matcher',    label: '4. Tax-Line Matcher',        href: '#/tax-matcher',    icon: '📑' },
  { id: 'reports',        label: 'Reports & Downloads',         href: '#/reports',        icon: '📄' },
  { id: 'ai-assistant',   label: 'Settlement Q&A Agent',        href: '#/ai-assistant',   icon: '🤖' },
  { id: 'settings',       label: 'Settings & Rules',            href: '#/settings',       icon: '⚙️' },
]

export default function Sidebar({ open, onClose, activeId = 'dashboard' }: SidebarProps) {
  return (
    <>
      {open && (
        <button className="d-backdrop" type="button" aria-label="Close menu" onClick={onClose} />
      )}
      <aside className={`d-sidebar${open ? ' is-open' : ''}`}>
        <p className="d-side-label">Finance &amp; Risk</p>

        <nav aria-label="Main navigation">
          {SIDEBAR_NAV.map(item => (
            <a
              key={item.id}
              href={item.href}
              className={item.id === activeId ? 'is-active' : ''}
              onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem' }}
            >
              <span style={{ fontSize: '1rem', width: 20, textAlign: 'center', opacity: 0.85 }}>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        {/* Quick system status in sidebar footer */}
        <div style={{ marginTop: 'auto', padding: '16px 14px 8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.74rem', color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            <span>RiskShield v2.4 · Supabase Live</span>
          </div>
        </div>
      </aside>
    </>
  )
}
