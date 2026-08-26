import { useEffect, useState, useRef, useMemo } from 'react'
import { useFinanceContext } from '../finance/FinanceContext'
import { generateBatchSet } from '../finance/csvService'
import { runReconciliation } from '../finance/reconciliationEngine'
import { runMLScoring } from '../finance/mlScorer'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

type CategoryType = 'All' | 'Pages' | 'Batches' | 'Live Records' | 'Exceptions' | 'Quick Actions'

interface PaletteItem {
  id: string
  title: string
  subtitle: string
  category: 'Pages' | 'Batches' | 'Live Records' | 'Quick Actions'
  badge?: string
  badgeBg?: string
  badgeColor?: string
  icon: string
  amount?: string
  isException?: boolean
  action: () => void
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryType>('All')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const ctx = useFinanceContext()

  // Only use real report if user has actually loaded one; never generate fake/static data
  const hasLoadedReport = !!ctx.report
  const activeReport = ctx.report

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setActiveCategory('All')
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [isOpen])

  // Batch loader
  const loadBatch = (batchId: number) => {
    const data = generateBatchSet(batchId)
    const report = runReconciliation({
      bankStatements: data.bank,
      ledgerEntries: data.ledger,
      invoices: data.invoices
    })
    const ml = runMLScoring(data.all)
    ctx.setReport(report)
    ctx.setMLResult(ml)
    ctx.setActiveFileName(data.filename)
    ctx.setRecordCount(data.all.length)
    window.location.hash = '#/reconciliation'
    onClose()
  }

  // Base navigation, batches and quick action items
  const baseItems: PaletteItem[] = useMemo(() => {
    const list: PaletteItem[] = [
      // Navigation Pages
      {
        id: 'nav-dash',
        title: 'Executive Dashboard',
        subtitle: hasLoadedReport
          ? `${activeReport?.totalRecords} records active · ${activeReport?.matchRate.toFixed(1)}% match rate`
          : 'Reconciliation overview, balance sheet, and live feed telemetry',
        category: 'Pages',
        icon: '📊',
        badge: hasLoadedReport ? `${activeReport?.matchRate.toFixed(0)}% Matched` : 'Dashboard',
        badgeBg: hasLoadedReport ? '#064e3b' : '#1e293b',
        badgeColor: hasLoadedReport ? '#6ee7b7' : '#94a3b8',
        action: () => { window.location.hash = '#/dashboard'; onClose(); }
      },
      {
        id: 'nav-recon',
        title: '3-Way Reconciliation Engine',
        subtitle: hasLoadedReport
          ? `Active Batch: ${ctx.activeFileName || 'Loaded Batch'} · ${activeReport?.totalRecords} records`
          : 'Upload custom Bank, Ledger & Invoice feeds or select a test batch',
        category: 'Pages',
        icon: '⚡',
        badge: hasLoadedReport ? `${activeReport?.totalRecords} Recs` : 'Idle',
        badgeBg: hasLoadedReport ? '#172554' : '#1e293b',
        badgeColor: hasLoadedReport ? '#93c5fd' : '#94a3b8',
        action: () => { window.location.hash = '#/reconciliation'; onClose(); }
      },
      {
        id: 'nav-exc',
        title: '1-Click Exceptions Workbench',
        subtitle: hasLoadedReport
          ? `${activeReport?.exceptions} exceptions requiring GAAP settlement or debit memos`
          : 'No exceptions loaded. Run reconciliation on a batch to detect anomalies',
        category: 'Pages',
        icon: '🛡️',
        badge: hasLoadedReport ? `${activeReport?.exceptions} Open` : '0 Open',
        badgeBg: hasLoadedReport && (activeReport?.exceptions || 0) > 0 ? '#450a0a' : '#1e293b',
        badgeColor: hasLoadedReport && (activeReport?.exceptions || 0) > 0 ? '#fca5a5' : '#94a3b8',
        isException: true,
        action: () => { window.location.hash = '#/exceptions'; onClose(); }
      },
      {
        id: 'nav-cash',
        title: 'Forward Cash Forecaster',
        subtitle: 'T+1 to T+7 daily liquidity trajectories and DSO stress-testing',
        category: 'Pages',
        icon: '📈',
        action: () => { window.location.hash = '#/cash-forecast'; onClose(); }
      },
      {
        id: 'nav-tax',
        title: 'Statutory Tax & Notice Defense',
        subtitle: 'Section 115BAA vs Old Regime, Section 270A penalty shield, and Form 26A',
        category: 'Pages',
        icon: '🏛️',
        badge: 'Tax Shield',
        badgeBg: '#2e1065',
        badgeColor: '#d8b4fe',
        action: () => { window.location.hash = '#/tax-matcher'; onClose(); }
      },
      {
        id: 'nav-rep',
        title: 'Executive Audit Reports',
        subtitle: 'Certified PDF/Excel exports with CA DSC Class-3 digital signatures',
        category: 'Pages',
        icon: '📑',
        action: () => { window.location.hash = '#/reports'; onClose(); }
      },
      {
        id: 'nav-ai',
        title: 'Settlement AI Copilot',
        subtitle: 'Thought-step financial reasoning and automated discrepancy Q&A',
        category: 'Pages',
        icon: '🤖',
        action: () => { window.location.hash = '#/ai-assistant'; onClose(); }
      },
      {
        id: 'nav-set',
        title: 'Tolerances & Engine Settings',
        subtitle: 'Configure fee tolerance thresholds, date lag windows, and API keys',
        category: 'Pages',
        icon: '⚙️',
        action: () => { window.location.hash = '#/settings'; onClose(); }
      },

      // Ingestion Batches
      {
        id: 'act-b1',
        title: 'Load Batch #1 · Enterprise Multi-Entity',
        subtitle: '500 records · Standard 3-way reconciliation (Bank, Ledger, Invoices)',
        category: 'Batches',
        icon: '📁',
        badge: 'Batch #1',
        badgeBg: '#1e3a8a',
        badgeColor: '#93c5fd',
        action: () => loadBatch(1)
      },
      {
        id: 'act-b2',
        title: 'Load Batch #2 · Global Cross-Border FX',
        subtitle: '500 records · Multi-currency conversions (USD/EUR/INR), spot FX delta',
        category: 'Batches',
        icon: '🌐',
        badge: 'Batch #2',
        badgeBg: '#312e81',
        badgeColor: '#a5b4fc',
        action: () => loadBatch(2)
      },
      {
        id: 'act-b3',
        title: 'Load Batch #3 · High-Volume E-Commerce / UPI',
        subtitle: '500 records · Payment gateway MDR fee tolerances (0.9% - 1.5%)',
        category: 'Batches',
        icon: '🛍️',
        badge: 'Batch #3',
        badgeBg: '#451a03',
        badgeColor: '#fcd34d',
        action: () => loadBatch(3)
      },
      {
        id: 'act-b4',
        title: 'Load Batch #4 · SaaS Recurring Subscriptions',
        subtitle: '500 records · Prorated charges, billing upgrades, missing references',
        category: 'Batches',
        icon: '🔄',
        badge: 'Batch #4',
        badgeBg: '#164e63',
        badgeColor: '#67e8f9',
        action: () => loadBatch(4)
      },
      {
        id: 'act-b5',
        title: 'Load Batch #5 · Year-End Statutory Audit',
        subtitle: '500 records · Unbooked accruals, orphan ledgers, tax scrutiny audits',
        category: 'Batches',
        icon: '🏛️',
        badge: 'Batch #5',
        badgeBg: '#064e3b',
        badgeColor: '#6ee7b7',
        action: () => loadBatch(5)
      },

      // Quick Actions
      {
        id: 'act-solve-all',
        title: '1-Click Solve All Exceptions',
        subtitle: hasLoadedReport
          ? `Auto-resolve all ${activeReport?.exceptions} exceptions via GAAP debit memos`
          : 'Requires an active reconciliation batch with detected exceptions',
        category: 'Quick Actions',
        icon: '⚡',
        badge: 'Action',
        badgeBg: '#064e3b',
        badgeColor: '#6ee7b7',
        action: () => { window.location.hash = '#/exceptions'; onClose(); }
      },
      {
        id: 'tax-115baa',
        title: 'Simulate Section 115BAA Tax Savings',
        subtitle: 'Calculate 25.17% corporate tax savings vs 34.94% Old Regime with verified DIN',
        category: 'Quick Actions',
        icon: '💰',
        badge: 'Tax',
        badgeBg: '#1e3a8a',
        badgeColor: '#93c5fd',
        action: () => { window.location.hash = '#/tax-matcher'; onClose(); }
      }
    ]

    return list
  }, [hasLoadedReport, activeReport, ctx.activeFileName])

  // Real live records: ONLY present when a real batch is actively loaded
  const recordItems: PaletteItem[] = useMemo(() => {
    if (!hasLoadedReport || !activeReport || !activeReport.results) {
      return []
    }

    return activeReport.results.map((r) => {
      const isFixed = !!ctx.resolvedMap[r.record.id]
      const statusLabel = isFixed ? 'Exact (Fixed)' : r.status
      const isExc = r.status === 'Exception' && !isFixed

      const badgeBg = isFixed
        ? '#064e3b'
        : r.status === 'Exact'
        ? '#064e3b'
        : r.status === 'Fuzzy'
        ? '#172554'
        : r.status === 'Partial'
        ? '#451a03'
        : '#450a0a'

      const badgeColor = isFixed
        ? '#6ee7b7'
        : r.status === 'Exact'
        ? '#6ee7b7'
        : r.status === 'Fuzzy'
        ? '#93c5fd'
        : r.status === 'Partial'
        ? '#fcd34d'
        : '#fca5a5'

      const passText = r.pass ? `Pass ${r.pass}` : 'Exception'
      const exceptionInfo = r.exceptionCode ? `[${r.exceptionCode}] ` : ''
      const deltaText = r.delta > 0 ? ` · Delta −₹${r.delta.toFixed(2)}` : ''

      return {
        id: `rec-${r.record.id}`,
        title: `${r.record.id} · ${r.record.counterparty}`,
        subtitle: `${r.record.source} · ${passText} · ${exceptionInfo}${r.confidence}% conf${deltaText}`,
        category: 'Live Records',
        badge: statusLabel,
        badgeBg,
        badgeColor,
        isException: isExc,
        amount: `₹${r.record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: r.record.source === 'BANK' ? '🏦' : r.record.source === 'LEDGER' ? '📑' : '🧾',
        action: () => {
          window.location.hash = `#/record-details?id=${r.record.id}`
          onClose()
        }
      }
    })
  }, [hasLoadedReport, activeReport, ctx.resolvedMap])

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      All: baseItems.length + recordItems.length,
      Pages: baseItems.filter(i => i.category === 'Pages').length,
      Batches: baseItems.filter(i => i.category === 'Batches').length,
      'Live Records': recordItems.length,
      Exceptions: recordItems.filter(i => i.isException).length,
      'Quick Actions': baseItems.filter(i => i.category === 'Quick Actions').length
    }
  }, [baseItems, recordItems])

  // Filtered list
  const filtered = useMemo(() => {
    let list: PaletteItem[] = []

    if (activeCategory === 'All') {
      list = [...baseItems, ...recordItems]
    } else if (activeCategory === 'Exceptions') {
      list = recordItems.filter(i => i.isException)
    } else if (activeCategory === 'Live Records') {
      list = recordItems
    } else {
      list = baseItems.filter(i => i.category === activeCategory)
    }

    if (!search.trim()) {
      if (activeCategory === 'All') {
        return [
          ...baseItems.slice(0, 8),
          ...recordItems.slice(0, 10)
        ]
      }
      return list.slice(0, 30)
    }

    const tokens = search.toLowerCase().trim().split(/\s+/).filter(Boolean)
    return list.filter((item) => {
      const searchable = `${item.id} ${item.title} ${item.subtitle} ${item.category} ${item.amount || ''} ${item.badge || ''}`.toLowerCase()
      return tokens.every(token => searchable.includes(token))
    }).slice(0, 30)
  }, [search, activeCategory, baseItems, recordItems])

  // Auto-scroll selected item
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.querySelector<HTMLElement>(`[data-palette-idx="${selectedIdx}"]`)
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIdx])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx(prev => (prev + 1) % Math.max(1, filtered.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIdx]) {
          filtered[selectedIdx].action()
        }
      } else if (e.key === 'Tab') {
        e.preventDefault()
        const categories: CategoryType[] = ['All', 'Pages', 'Batches', 'Exceptions', 'Live Records', 'Quick Actions']
        const nextIdx = (categories.indexOf(activeCategory) + (e.shiftKey ? -1 : 1) + categories.length) % categories.length
        setActiveCategory(categories[nextIdx])
        setSelectedIdx(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filtered, selectedIdx, activeCategory, onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '9vh',
        animation: 'fadeIn 0.12s ease-out'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '700px',
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '14px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Search Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid #1e293b',
          background: '#0f172a'
        }}>
          <span style={{ color: '#94a3b8', fontSize: '1rem' }}>⌕</span>

          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedIdx(0); }}
            placeholder={
              hasLoadedReport
                ? `Search ${activeReport?.totalRecords} records, pages, batches, or tax notices...`
                : 'Type a page, select a batch to reconcile, or search actions...'
            }
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.94rem',
              fontWeight: 500,
              fontFamily: 'inherit'
            }}
          />

          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSelectedIdx(0); inputRef.current?.focus(); }}
              style={{
                background: '#1e293b',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                fontSize: '0.7rem'
              }}
            >
              ✕
            </button>
          )}

          <kbd style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 5,
            padding: '2px 6px',
            color: '#94a3b8'
          }}>
            ESC
          </kbd>
        </div>

        {/* Category Filter Chips Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          background: '#0b1120',
          borderBottom: '1px solid #1e293b',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          {(['All', 'Pages', 'Batches', 'Exceptions', 'Live Records', 'Quick Actions'] as CategoryType[]).map(cat => {
            const isActive = activeCategory === cat
            const count = categoryCounts[cat]
            return (
              <button
                key={cat}
                type="button"
                onClick={() => { setActiveCategory(cat); setSelectedIdx(0); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${isActive ? '#3b82f6' : '#1e293b'}`,
                  background: isActive ? '#1e3a8a' : '#111827',
                  color: isActive ? '#f8fafc' : '#94a3b8',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{cat}</span>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '1px 4px',
                  borderRadius: 4,
                  background: isActive ? '#1d4ed8' : '#1e293b',
                  color: isActive ? '#ffffff' : '#64748b'
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Dataset Meta Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 18px',
          background: '#090e1a',
          borderBottom: '1px solid #1e293b',
          fontSize: '0.72rem',
          color: '#64748b'
        }}>
          <div>
            {hasLoadedReport ? (
              <span>Active Dataset: <strong style={{ color: '#93c5fd' }}>{ctx.activeFileName || 'Batch #1'}</strong> ({activeReport?.totalRecords} records)</span>
            ) : (
              <span>Dataset: <strong style={{ color: '#94a3b8' }}>None Loaded (0 records)</strong> — select a batch below</span>
            )}
          </div>
          {hasLoadedReport && (
            <div>
              <span>Match Rate: <strong style={{ color: '#6ee7b7' }}>{activeReport?.matchRate.toFixed(1)}%</strong></span>
              <span style={{ margin: '0 6px' }}>·</span>
              <span>Exceptions: <strong style={{ color: (activeReport?.exceptions || 0) > 0 ? '#fca5a5' : '#6ee7b7' }}>{activeReport?.exceptions}</strong></span>
            </div>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '8px 10px'
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>📁</div>
              <div style={{ fontSize: '0.88rem', color: '#cbd5e1', fontWeight: 600 }}>
                {activeCategory === 'Live Records' || activeCategory === 'Exceptions'
                  ? 'No live transaction records loaded yet'
                  : 'No matching items found'}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 3 }}>
                {activeCategory === 'Live Records' || activeCategory === 'Exceptions'
                  ? 'Click any dataset under "Batches" to load and reconcile real records.'
                  : `No results match "${search}"`}
              </div>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIdx
              return (
                <div
                  key={item.id}
                  data-palette-idx={idx}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '9px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isSelected ? '#1e293b' : 'transparent',
                    borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                    transition: 'background 0.08s ease',
                    marginBottom: 2
                  }}
                >
                  {/* Left: Icon & Text */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <span style={{
                      fontSize: '1rem',
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: '#1e293b',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}>
                      {item.icon}
                    </span>

                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: isSelected ? '#ffffff' : '#e2e8f0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.title}
                      </div>
                      <div style={{
                        fontSize: '0.72rem',
                        color: isSelected ? '#cbd5e1' : '#64748b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: 1
                      }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {item.amount && (
                      <span style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#f8fafc',
                        fontFamily: 'monospace'
                      }}>
                        {item.amount}
                      </span>
                    )}

                    {item.badge && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: item.badgeBg || '#1e293b',
                        color: item.badgeColor || '#94a3b8'
                      }}>
                        {item.badge}
                      </span>
                    )}

                    {isSelected && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: '#94a3b8',
                        background: '#0f172a',
                        padding: '2px 5px',
                        borderRadius: 4
                      }}>
                        ↵
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          background: '#090e1a',
          borderTop: '1px solid #1e293b',
          fontSize: '0.7rem',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <span><kbd style={{ color: '#94a3b8', background: '#1e293b', padding: '1px 5px', borderRadius: 3, marginRight: 3 }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ color: '#94a3b8', background: '#1e293b', padding: '1px 5px', borderRadius: 3, marginRight: 3 }}>↵</kbd> Select</span>
            <span><kbd style={{ color: '#94a3b8', background: '#1e293b', padding: '1px 5px', borderRadius: 3, marginRight: 3 }}>Tab</kbd> Filter</span>
            <span><kbd style={{ color: '#94a3b8', background: '#1e293b', padding: '1px 5px', borderRadius: 3, marginRight: 3 }}>ESC</kbd> Close</span>
          </div>

          <span style={{ color: '#64748b' }}>
            RiskShield Command Intelligence
          </span>
        </div>
      </div>
    </div>
  )
}
