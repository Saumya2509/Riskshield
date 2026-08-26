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

  // Active report
  const activeReport = useMemo(() => {
    return ctx.report || runReconciliation()
  }, [ctx.report])

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

  // Base navigation and action items
  const baseItems: PaletteItem[] = useMemo(() => {
    return [
      // Navigation Pages
      {
        id: 'nav-dash',
        title: 'Executive Dashboard',
        subtitle: 'Reconciliation overview, 3-way balance sheet, and live feed telemetry',
        category: 'Pages',
        icon: '📊',
        action: () => { window.location.hash = '#/dashboard'; onClose(); }
      },
      {
        id: 'nav-recon',
        title: '3-Way Reconciliation Engine',
        subtitle: `Dataset: ${ctx.activeFileName || 'Batch #1'} · ${activeReport.totalRecords} records · ${activeReport.matchRate.toFixed(1)}% match rate`,
        category: 'Pages',
        icon: '⚡',
        badge: `${activeReport.matchRate.toFixed(0)}% Matched`,
        badgeBg: 'rgba(16, 185, 129, 0.16)',
        badgeColor: '#34d399',
        action: () => { window.location.hash = '#/reconciliation'; onClose(); }
      },
      {
        id: 'nav-exc',
        title: '1-Click Exceptions Workbench',
        subtitle: `${activeReport.exceptions} discrepancies requiring GAAP settlement or debit memos`,
        category: 'Pages',
        icon: '🛡️',
        badge: `${activeReport.exceptions} Open`,
        badgeBg: 'rgba(239, 68, 68, 0.16)',
        badgeColor: '#f87171',
        isException: true,
        action: () => { window.location.hash = '#/exceptions'; onClose(); }
      },
      {
        id: 'nav-cash',
        title: 'Forward Cash Forecaster',
        subtitle: 'T+1 to T+7 daily liquidity trajectories and DSO lag stress-testing (95% confidence)',
        category: 'Pages',
        icon: '📈',
        action: () => { window.location.hash = '#/cash-forecast'; onClose(); }
      },
      {
        id: 'nav-tax',
        title: 'Statutory Tax & Notice Defense',
        subtitle: 'Section 115BAA vs Old Regime, Section 270A penalty shield, and Form 26A / 15CB certificates',
        category: 'Pages',
        icon: '🏛️',
        badge: 'CBDT DIN',
        badgeBg: 'rgba(168, 85, 247, 0.16)',
        badgeColor: '#c084fc',
        action: () => { window.location.hash = '#/tax-matcher'; onClose(); }
      },
      {
        id: 'nav-rep',
        title: 'Executive Audit Reports',
        subtitle: 'Certified PDF/Excel exports with CA DSC Class-3 cryptographic digital signature',
        category: 'Pages',
        icon: '📑',
        action: () => { window.location.hash = '#/reports'; onClose(); }
      },
      {
        id: 'nav-ai',
        title: 'Settlement AI Copilot',
        subtitle: 'Thought-step financial reasoning and automated ledger discrepancy Q&A agent',
        category: 'Pages',
        icon: '🤖',
        action: () => { window.location.hash = '#/ai-assistant'; onClose(); }
      },
      {
        id: 'nav-set',
        title: 'Tolerances & Engine Settings',
        subtitle: 'Configure MDR fee tolerances (±1.5%), date lag windows (±2d), and Supabase connection',
        category: 'Pages',
        icon: '⚙️',
        action: () => { window.location.hash = '#/settings'; onClose(); }
      },

      // Ingestion Batches
      {
        id: 'act-b1',
        title: 'Load Batch #1 · Enterprise Multi-Entity (₹1.42 Cr)',
        subtitle: '500 records · Standard 3-way reconciliation, timing delays, minor fee variance',
        category: 'Batches',
        icon: '📁',
        badge: 'Batch #1',
        badgeBg: 'rgba(59, 130, 246, 0.16)',
        badgeColor: '#60a5fa',
        action: () => loadBatch(1)
      },
      {
        id: 'act-b2',
        title: 'Load Batch #2 · Global Cross-Border FX (₹98.2 Lakh)',
        subtitle: '500 records · Multi-currency conversions (USD/EUR/INR), spot FX delta',
        category: 'Batches',
        icon: '🌐',
        badge: 'Batch #2',
        badgeBg: 'rgba(99, 102, 241, 0.16)',
        badgeColor: '#818cf8',
        action: () => loadBatch(2)
      },
      {
        id: 'act-b3',
        title: 'Load Batch #3 · High-Volume E-Commerce / UPI (₹1.52 Cr)',
        subtitle: '500 records · High-frequency micropayments, Payment Gateway MDR fees (0.9% - 1.5%)',
        category: 'Batches',
        icon: '🛍️',
        badge: 'Batch #3',
        badgeBg: 'rgba(245, 158, 11, 0.16)',
        badgeColor: '#fbbf24',
        action: () => loadBatch(3)
      },
      {
        id: 'act-b4',
        title: 'Load Batch #4 · SaaS Recurring Subscriptions (₹88.4 Lakh)',
        subtitle: '500 records · Prorated charges, billing upgrades, missing invoice references',
        category: 'Batches',
        icon: '🔄',
        badge: 'Batch #4',
        badgeBg: 'rgba(6, 182, 212, 0.16)',
        badgeColor: '#22d3ee',
        action: () => loadBatch(4)
      },
      {
        id: 'act-b5',
        title: 'Load Batch #5 · Year-End Statutory Audit (₹2.10 Cr)',
        subtitle: '500 records · Unbooked accruals, orphan general ledgers, tax scrutiny audits',
        category: 'Batches',
        icon: '🏛️',
        badge: 'Batch #5',
        badgeBg: 'rgba(16, 185, 129, 0.16)',
        badgeColor: '#34d399',
        action: () => loadBatch(5)
      },

      // Quick Actions
      {
        id: 'act-solve-all',
        title: '1-Click Solve All Exceptions',
        subtitle: 'Auto-apply GAAP debit memos, suspense clearing (GL 2190), and fee splits',
        category: 'Quick Actions',
        icon: '⚡',
        badge: '1-Click Solve',
        badgeBg: 'rgba(16, 185, 129, 0.22)',
        badgeColor: '#4ade80',
        action: () => { window.location.hash = '#/exceptions'; onClose(); }
      },
      {
        id: 'tax-115baa',
        title: 'Simulate Section 115BAA Tax Regime (25.17%)',
        subtitle: 'Calculate 25.17% corporate tax savings vs 34.94% Old Regime with verified DIN',
        category: 'Quick Actions',
        icon: '💰',
        badge: '25.17% Tax',
        badgeBg: 'rgba(56, 189, 248, 0.22)',
        badgeColor: '#38bdf8',
        action: () => { window.location.hash = '#/tax-matcher'; onClose(); }
      }
    ]
  }, [activeReport, ctx.activeFileName])

  // Real 500-record items
  const recordItems: PaletteItem[] = useMemo(() => {
    if (!activeReport || !activeReport.results) return []

    return activeReport.results.map((r) => {
      const isFixed = !!ctx.resolvedMap[r.record.id]
      const statusLabel = isFixed ? 'Exact (Fixed)' : r.status
      const isExc = r.status === 'Exception' && !isFixed

      const badgeBg = isFixed
        ? 'rgba(16, 185, 129, 0.22)'
        : r.status === 'Exact'
        ? 'rgba(16, 185, 129, 0.18)'
        : r.status === 'Fuzzy'
        ? 'rgba(56, 189, 248, 0.18)'
        : r.status === 'Partial'
        ? 'rgba(245, 158, 11, 0.18)'
        : 'rgba(239, 68, 68, 0.22)'

      const badgeColor = isFixed
        ? '#4ade80'
        : r.status === 'Exact'
        ? '#4ade80'
        : r.status === 'Fuzzy'
        ? '#38bdf8'
        : r.status === 'Partial'
        ? '#fbbf24'
        : '#f87171'

      const passText = r.pass ? `Pass ${r.pass}` : 'Exception'
      const exceptionInfo = r.exceptionCode ? `[${r.exceptionCode}] ` : ''
      const deltaText = r.delta > 0 ? ` · Delta −₹${r.delta.toFixed(2)}` : ''

      return {
        id: `rec-${r.record.id}`,
        title: `${r.record.id} · ${r.record.counterparty}`,
        subtitle: `${r.record.source} · ${passText} · ${exceptionInfo}${r.confidence}% confidence${deltaText}`,
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
  }, [activeReport, ctx.resolvedMap])

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

  // Filtered items
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
          ...recordItems.slice(0, 14)
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

  // Auto-scroll active item into view
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
        background: 'rgba(2, 6, 15, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '8vh',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '740px',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(9, 14, 26, 0.98) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '20px',
          boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1), 0 30px 80px -15px rgba(0, 0, 0, 0.9), 0 0 50px -10px rgba(37, 99, 235, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Search Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.8)'
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(37, 99, 235, 0.18)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'grid',
            placeItems: 'center',
            color: '#38bdf8',
            fontSize: '1.1rem'
          }}>
            ⌕
          </div>

          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedIdx(0); }}
            placeholder="Search commands, pages, or 500 live records (e.g. B1-BNK-001, Razorpay, 45000)..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '1.02rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              letterSpacing: '-0.01em'
            }}
          />

          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSelectedIdx(0); inputRef.current?.focus(); }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '50%',
                width: 22,
                height: 22,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                fontSize: '0.74rem'
              }}
            >
              ✕
            </button>
          )}

          <kbd style={{
            fontSize: '0.72rem',
            fontWeight: 750,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 7,
            padding: '4px 8px',
            color: '#cbd5e1'
          }}>
            ESC
          </kbd>
        </div>

        {/* Category Filter Chips Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 22px',
          background: 'rgba(8, 13, 24, 0.65)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
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
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 999,
                  border: `1px solid ${isActive ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
                  background: isActive ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{cat}</span>
                <span style={{
                  fontSize: '0.66rem',
                  padding: '1px 5px',
                  borderRadius: 999,
                  background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#ffffff' : '#64748b'
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            maxHeight: '420px',
            overflowY: 'auto',
            padding: '10px 14px'
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: '1rem', color: '#f1f5f9', fontWeight: 750 }}>No matching items found</div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>
                No records or actions match &ldquo;<span style={{ color: '#38bdf8' }}>{search}</span>&rdquo; in the <strong style={{ color: '#ffffff' }}>{activeCategory}</strong> category.
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
                    gap: 16,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'linear-gradient(90deg, rgba(37, 99, 235, 0.28) 0%, rgba(99, 102, 241, 0.16) 100%)'
                      : 'transparent',
                    border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.45)' : 'transparent'}`,
                    borderLeft: isSelected ? '3px solid #38bdf8' : '3px solid transparent',
                    boxShadow: isSelected ? '0 4px 20px rgba(37, 99, 235, 0.25)' : 'none',
                    transition: 'all 0.1s ease',
                    marginBottom: 3
                  }}
                >
                  {/* Left: Icon & Titles */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                    <span style={{
                      fontSize: '1.25rem',
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}>
                      {item.icon}
                    </span>

                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.92rem',
                        fontWeight: 750,
                        color: isSelected ? '#ffffff' : '#f8fafc',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.title}
                      </div>
                      <div style={{
                        fontSize: '0.76rem',
                        color: isSelected ? '#bae6fd' : '#94a3b8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: 2
                      }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    {item.amount && (
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        fontFamily: 'JetBrains Mono, monospace'
                      }}>
                        {item.amount}
                      </span>
                    )}

                    {item.badge && (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 8,
                        background: item.badgeBg || 'rgba(56, 189, 248, 0.18)',
                        color: item.badgeColor || '#38bdf8',
                        border: `1px solid ${item.badgeColor || '#38bdf8'}40`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: item.badgeColor || '#38bdf8' }} />
                        {item.badge}
                      </span>
                    )}

                    {isSelected ? (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.12)',
                        padding: '2px 7px',
                        borderRadius: 5
                      }}>
                        ↵
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {item.category}
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
          padding: '12px 24px',
          background: 'rgba(6, 10, 20, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.74rem',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', gap: 18 }}>
            <span><kbd style={{ color: '#f1f5f9', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, marginRight: 4 }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ color: '#f1f5f9', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, marginRight: 4 }}>↵</kbd> Select</span>
            <span><kbd style={{ color: '#f1f5f9', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, marginRight: 4 }}>Tab</kbd> Filter Category</span>
            <span><kbd style={{ color: '#f1f5f9', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, marginRight: 4 }}>ESC</kbd> Close</span>
          </div>

          <span style={{ color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8' }} />
            RiskShield Command Intelligence
          </span>
        </div>
      </div>
    </div>
  )
}
