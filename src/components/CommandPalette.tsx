import { useEffect, useState, useRef, useMemo } from 'react'
import { useFinanceContext } from '../finance/FinanceContext'
import { generateBatchSet } from '../finance/csvService'
import { runReconciliation } from '../finance/reconciliationEngine'
import { runMLScoring } from '../finance/mlScorer'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

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
  action: () => void
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const ctx = useFinanceContext()

  // Get active report or fallback to default reconciliation batch
  const activeReport = useMemo(() => {
    return ctx.report || runReconciliation()
  }, [ctx.report])

  // Reset search and focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [isOpen])

  // Helper to load a batch
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

  // Base list of navigation, batches and quick actions
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
        badgeBg: 'rgba(16, 185, 129, 0.15)',
        badgeColor: '#34d399',
        action: () => { window.location.hash = '#/reconciliation'; onClose(); }
      },
      {
        id: 'nav-exc',
        title: '1-Click Exceptions Workbench',
        subtitle: `${activeReport.exceptions} discrepancies requiring GAAP settlement, debit memos, or suspense clearing`,
        category: 'Pages',
        icon: '🛡️',
        badge: `${activeReport.exceptions} Exceptions`,
        badgeBg: 'rgba(239, 68, 68, 0.15)',
        badgeColor: '#f87171',
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
        badgeBg: 'rgba(168, 85, 247, 0.15)',
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

      // Batches
      {
        id: 'act-b1',
        title: 'Load Batch #1 · Enterprise Multi-Entity (₹1.42 Cr)',
        subtitle: '500 records · 3-way reconciliation, timing delays, minor fee variance',
        category: 'Batches',
        icon: '📁',
        badge: 'Batch #1',
        badgeBg: 'rgba(59, 130, 246, 0.15)',
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
        badgeBg: 'rgba(99, 102, 241, 0.15)',
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
        badgeBg: 'rgba(245, 158, 11, 0.15)',
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
        badgeBg: 'rgba(6, 182, 212, 0.15)',
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
        badgeBg: 'rgba(16, 185, 129, 0.15)',
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
        badgeBg: 'rgba(16, 185, 129, 0.2)',
        badgeColor: '#4ade80',
        action: () => { window.location.hash = '#/exceptions'; onClose(); }
      },
      {
        id: 'tax-115baa',
        title: 'Simulate Section 115BAA Tax Regime (25.17%)',
        subtitle: 'Calculate 25.17% corporate tax savings vs 34.94% Old Regime with verified DIN',
        category: 'Quick Actions',
        icon: '💰',
        badge: 'Tax Shield',
        badgeBg: 'rgba(56, 189, 248, 0.2)',
        badgeColor: '#38bdf8',
        action: () => { window.location.hash = '#/tax-matcher'; onClose(); }
      }
    ]
  }, [activeReport, ctx.activeFileName])

  // Live real records from the active batch (indexed with exact accuracy)
  const recordItems: PaletteItem[] = useMemo(() => {
    if (!activeReport || !activeReport.results) return []

    return activeReport.results.map((r) => {
      const isFixed = !!ctx.resolvedMap[r.record.id]
      const statusLabel = isFixed ? 'Exact (Fixed)' : r.status
      const badgeBg = isFixed
        ? 'rgba(16, 185, 129, 0.2)'
        : r.status === 'Exact'
        ? 'rgba(16, 185, 129, 0.18)'
        : r.status === 'Fuzzy'
        ? 'rgba(56, 189, 248, 0.18)'
        : r.status === 'Partial'
        ? 'rgba(245, 158, 11, 0.18)'
        : 'rgba(239, 68, 68, 0.2)'

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
        subtitle: `${r.record.source} · ${passText} · ${exceptionInfo}${r.confidence}% confidence${deltaText} · Date: ${r.record.date}`,
        category: 'Live Records',
        badge: statusLabel,
        badgeBg,
        badgeColor,
        amount: `₹${r.record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: r.record.source === 'BANK' ? '🏦' : r.record.source === 'LEDGER' ? '📑' : '🧾',
        action: () => {
          window.location.hash = `#/record-details?id=${r.record.id}`
          onClose()
        }
      }
    })
  }, [activeReport, ctx.resolvedMap])

  // Combine base and records
  const allItems = useMemo(() => {
    return [...baseItems, ...recordItems]
  }, [baseItems, recordItems])

  // Precision multi-token search filter
  const filtered = useMemo(() => {
    if (!search.trim()) {
      return [
        ...baseItems.slice(0, 8),
        ...recordItems.slice(0, 12)
      ]
    }

    const tokens = search.toLowerCase().trim().split(/\s+/).filter(Boolean)

    return allItems
      .filter((item) => {
        const searchable = `${item.id} ${item.title} ${item.subtitle} ${item.category} ${item.amount || ''} ${item.badge || ''}`.toLowerCase()
        return tokens.every(token => searchable.includes(token))
      })
      .slice(0, 30)
  }, [search, baseItems, recordItems, allItems])

  // Auto scroll to active item in view
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.querySelector<HTMLElement>(`[data-palette-idx="${selectedIdx}"]`)
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIdx])

  // Keyboard navigation inside palette
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
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filtered, selectedIdx, onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 8, 18, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '9vh',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '720px',
          background: 'linear-gradient(180deg, #0d1527 0%, #090e1a 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '18px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.8), 0 0 45px rgba(37, 99, 235, 0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '18px 22px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(15, 23, 42, 0.95)'
        }}>
          <span style={{ fontSize: '1.25rem', color: '#38bdf8', filter: 'drop-shadow(0 0 6px #38bdf8)' }}>⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedIdx(0); }}
            placeholder="Search all 500 records (e.g. B1-BNK-001, Razorpay, 45000), pages, batches, or tax..."
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
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#cbd5e1',
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
            fontWeight: 700,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 6,
            padding: '3px 8px',
            color: '#cbd5e1'
          }}>
            ESC
          </kbd>
        </div>

        {/* Active Batch & Accuracy Meta Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 22px',
          background: 'rgba(6, 11, 22, 0.75)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '0.76rem',
          color: '#94a3b8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            <span>Dataset: <strong style={{ color: '#ffffff' }}>{ctx.activeFileName || 'Batch #1 (Enterprise Multi-Entity)'}</strong> ({activeReport.totalRecords} records)</span>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <span>Match Rate: <strong style={{ color: '#34d399' }}>{activeReport.matchRate.toFixed(1)}%</strong></span>
            <span>·</span>
            <span>Exceptions: <strong style={{ color: activeReport.exceptions > 0 ? '#f87171' : '#34d399' }}>{activeReport.exceptions}</strong></span>
          </div>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            maxHeight: '440px',
            overflowY: 'auto',
            padding: '10px 12px'
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 700 }}>No matching records or commands</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>
                No results found for &ldquo;<span style={{ color: '#38bdf8' }}>{search}</span>&rdquo; in the active dataset.
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
                      ? 'linear-gradient(90deg, rgba(37, 99, 235, 0.3) 0%, rgba(30, 58, 138, 0.2) 100%)'
                      : 'transparent',
                    border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.45)' : 'transparent'}`,
                    boxShadow: isSelected ? '0 0 20px rgba(37, 99, 235, 0.2)' : 'none',
                    transition: 'all 0.12s ease',
                    marginBottom: 4
                  }}
                >
                  {/* Left: Icon & Title/Subtitle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                    <span style={{
                      fontSize: '1.25rem',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
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
                        color: isSelected ? '#ffffff' : '#f1f5f9',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <span>{item.title}</span>
                      </div>
                      <div style={{
                        fontSize: '0.76rem',
                        color: isSelected ? '#93c5fd' : '#94a3b8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: 2
                      }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
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
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '3px 9px',
                        borderRadius: 6,
                        background: item.badgeBg || 'rgba(56, 189, 248, 0.18)',
                        color: item.badgeColor || '#38bdf8',
                        border: `1px solid ${item.badgeColor || '#38bdf8'}50`
                      }}>
                        {item.badge}
                      </span>
                    )}

                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: isSelected ? '#cbd5e1' : '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {item.category}
                    </span>
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
          padding: '12px 22px',
          background: 'rgba(6, 10, 20, 0.98)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.74rem',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <span><kbd style={{ color: '#e2e8f0', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ color: '#e2e8f0', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>↵</kbd> Open Record / Run</span>
            <span><kbd style={{ color: '#e2e8f0', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>ESC</kbd> Close</span>
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
