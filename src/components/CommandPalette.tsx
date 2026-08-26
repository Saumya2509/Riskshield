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
  category: 'Navigation' | 'Actions' | 'Records' | 'Tax & Compliance'
  badge?: string
  icon: string
  action: () => void
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const ctx = useFinanceContext()

  // Reset search and focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
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

  // Base list of commands
  const allItems: PaletteItem[] = useMemo(() => {
    const list: PaletteItem[] = [
      // Navigation
      {
        id: 'nav-dash',
        title: 'Executive Dashboard',
        subtitle: 'KPI overview, reconciliation breakdown, and feed telemetry',
        category: 'Navigation',
        icon: '📊',
        action: () => { window.location.hash = '#/dashboard'; onClose(); }
      },
      {
        id: 'nav-recon',
        title: '3-Way Reconciliation Engine',
        subtitle: 'Multi-source ingestion, 3-pass matching, and live ledger feeds',
        category: 'Navigation',
        icon: '⚡',
        badge: 'Core',
        action: () => { window.location.hash = '#/reconciliation'; onClose(); }
      },
      {
        id: 'nav-exc',
        title: '1-Click Exceptions Workbench',
        subtitle: '7 GAAP exception classifications, debit memos, and suspense clearing',
        category: 'Navigation',
        icon: '🛡️',
        badge: `${ctx.report ? ctx.report.exceptions : 39} Exceptions`,
        action: () => { window.location.hash = '#/exceptions'; onClose(); }
      },
      {
        id: 'nav-cash',
        title: 'Forward Cash Forecaster',
        subtitle: 'T+1 to T+7 daily liquidity trajectories and DSO lag stress-testing',
        category: 'Navigation',
        icon: '📈',
        action: () => { window.location.hash = '#/cash-forecast'; onClose(); }
      },
      {
        id: 'nav-tax',
        title: 'Statutory Tax & Notice Defense',
        subtitle: 'Section 115BAA vs Old Regime, Section 270A penalty shield, and Form 26A',
        category: 'Navigation',
        icon: '🏛️',
        badge: 'CBDT DIN',
        action: () => { window.location.hash = '#/tax-matcher'; onClose(); }
      },
      {
        id: 'nav-rep',
        title: 'Executive Audit Reports',
        subtitle: 'Certified PDF/Excel exports with CA DSC Class-3 cryptographic signing',
        category: 'Navigation',
        icon: '📑',
        action: () => { window.location.hash = '#/reports'; onClose(); }
      },
      {
        id: 'nav-ai',
        title: 'Settlement AI Copilot',
        subtitle: 'Thought-step financial reasoning and automated ledger discrepancy Q&A',
        category: 'Navigation',
        icon: '🤖',
        action: () => { window.location.hash = '#/ai-assistant'; onClose(); }
      },
      {
        id: 'nav-set',
        title: 'Tolerances & Engine Settings',
        subtitle: 'Configure MDR percentage tolerance, date lag windows, and Supabase keys',
        category: 'Navigation',
        icon: '⚙️',
        action: () => { window.location.hash = '#/settings'; onClose(); }
      },

      // Actions / Batches
      {
        id: 'act-b1',
        title: 'Load Batch #1 · Enterprise Q1 (₹1.42 Cr)',
        subtitle: 'Standard 3-way reconciliation across 500 Bank, Ledger & Invoice records',
        category: 'Actions',
        icon: '📁',
        action: () => loadBatch(1)
      },
      {
        id: 'act-b2',
        title: 'Load Batch #2 · Cross-Border FX (₹98.2 L)',
        subtitle: 'Multi-currency USD/EUR conversions and spot FX delta testing',
        category: 'Actions',
        icon: '🌐',
        action: () => loadBatch(2)
      },
      {
        id: 'act-b3',
        title: 'Load Batch #3 · High-Volume E-Commerce (₹1.52 Cr)',
        subtitle: 'Payment gateway MDR fees (0.9% - 1.5%) and micro-transactions',
        category: 'Actions',
        icon: '🛍️',
        action: () => loadBatch(3)
      },
      {
        id: 'act-b4',
        title: 'Load Batch #4 · SaaS Recurring Subscriptions (₹88.4 L)',
        subtitle: 'Prorated charges, billing upgrades, and missing invoice references',
        category: 'Actions',
        icon: '🔄',
        action: () => loadBatch(4)
      },
      {
        id: 'act-b5',
        title: 'Load Batch #5 · Year-End Statutory Audit (₹2.10 Cr)',
        subtitle: 'Unbooked accruals, orphan ledgers, and Section 148 tax liabilities',
        category: 'Actions',
        icon: '🏛️',
        action: () => loadBatch(5)
      },

      // Tax Actions
      {
        id: 'tax-115baa',
        title: 'Calculate Section 115BAA Tax Savings',
        subtitle: 'Simulate 25.17% vs 34.94% Old Regime corporate tax liability',
        category: 'Tax & Compliance',
        icon: '💰',
        action: () => { window.location.hash = '#/tax-matcher'; onClose(); }
      },
      {
        id: 'tax-270a',
        title: 'Review Section 270A Penalty Protection',
        subtitle: 'Check 200% misreporting penalty mitigation across defended notices',
        category: 'Tax & Compliance',
        icon: '🛡️',
        action: () => { window.location.hash = '#/tax-matcher'; onClose(); }
      }
    ]

    // If report has records, append matched/exception records to search list
    if (ctx.report && ctx.report.results) {
      ctx.report.results.slice(0, 40).forEach(r => {
        list.push({
          id: `rec-${r.record.id}`,
          title: `${r.record.id} · ${r.record.counterparty}`,
          subtitle: `${r.record.source} · ₹${r.record.amount.toLocaleString('en-IN')} · ${r.status} (${r.confidence}% confidence)`,
          category: 'Records',
          badge: r.status,
          icon: r.status === 'Exact' ? '✓' : r.status === 'Exception' ? '⚠️' : '≈',
          action: () => {
            window.location.hash = `#/record-details?id=${r.record.id}`
            onClose()
          }
        })
      })
    }

    return list
  }, [ctx.report, ctx.resolvedMap])

  // Filter items based on search query
  const filtered = useMemo(() => {
    if (!search.trim()) return allItems.slice(0, 12)
    const q = search.toLowerCase()
    return allItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    ).slice(0, 16)
  }, [search, allItems])

  // Keyboard navigation inside palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx(prev => (prev + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx(prev => (prev - 1 + filtered.length) % filtered.length)
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
        background: 'rgba(7, 11, 20, 0.75)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '640px',
          background: '#0e1525',
          border: '1px solid rgba(56, 189, 248, 0.28)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(37, 99, 235, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Search Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(14, 21, 37, 0.95)'
        }}>
          <span style={{ fontSize: '1.2rem', color: '#38bdf8' }}>⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedIdx(0); }}
            placeholder="Type a command, page, batch, or transaction ID..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 500,
              fontFamily: 'inherit'
            }}
          />
          <kbd style={{
            fontSize: '0.7rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 6,
            padding: '2px 8px',
            color: '#94a3b8'
          }}>
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              No matching commands or records found for &ldquo;{search}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIdx
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 14,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(37, 99, 235, 0.22)' : 'transparent',
                    border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.35)' : 'transparent'}`,
                    transition: 'all 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <span style={{ fontSize: '1.2rem', width: 28, textAlign: 'center', flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: isSelected ? '#ffffff' : '#e2e8f0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.title}
                      </div>
                      <div style={{
                        fontSize: '0.74rem',
                        color: isSelected ? '#93c5fd' : '#64748b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {item.badge && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 750,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: item.badge === 'Exact' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        color: item.badge === 'Exact' ? '#34d399' : '#38bdf8',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        {item.badge}
                      </span>
                    )}
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
          padding: '10px 18px',
          background: 'rgba(6, 10, 20, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.72rem',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <span><kbd style={{ color: '#94a3b8' }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ color: '#94a3b8' }}>↵</kbd> Select</span>
            <span><kbd style={{ color: '#94a3b8' }}>ESC</kbd> Close</span>
          </div>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>RiskShield Command Palette</span>
        </div>
      </div>
    </div>
  )
}
