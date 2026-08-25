import { useFinanceContext } from '../finance/FinanceContext'

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
  const ctx = useFinanceContext()
  const exceptionCount = ctx.report?.exceptionList?.length ?? 0
  const resolvedCount = Object.keys(ctx.resolvedMap).length
  const openExceptions = Math.max(0, exceptionCount - resolvedCount)

  return (
    <>
      {open && (
        <button className="d-backdrop" type="button" aria-label="Close menu" onClick={onClose} />
      )}
      <aside className={`d-sidebar${open ? ' is-open' : ''}`}>
        <p className="d-side-label">Finance &amp; Risk</p>

        <nav aria-label="Main navigation">
          {SIDEBAR_NAV.map(item => {
            const isActive = item.id === activeId
            return (
              <a
                key={item.id}
                href={item.href}
                className={isActive ? 'is-active' : ''}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '1rem', width: 20, textAlign: 'center', opacity: 0.85 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>

                {item.id === 'exceptions' && ctx.report && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 750,
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: openExceptions > 0 ? '#ef4444' : '#10b981',
                    color: '#ffffff',
                    lineHeight: 1.3
                  }}>
                    {openExceptions > 0 ? openExceptions : '✓'}
                  </span>
                )}

                {item.id === 'reconciliation' && ctx.report && (
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 6px #10b981'
                  }} />
                )}
              </a>
            )
          })}
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
