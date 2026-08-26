import { useEffect, useState } from 'react'
import Landing from './pages/Landing'
import Dashboard from './dashboard/Dashboard'
import ReconciliationPage from './pages/ReconciliationPage'
import ExceptionsPage from './pages/ExceptionsPage'
import CashForecastPage from './pages/CashForecastPage'
import ReportsPage from './pages/ReportsPage'
import TaxMatcherPage from './pages/TaxMatcherPage'
import AIAssistantPage from './pages/AIAssistantPage'
import SettingsPage from './pages/SettingsPage'
import RecordDetailsPage from './pages/RecordDetailsPage'
import { FinanceContextProvider } from './finance/FinanceContext'

export type View =
  | 'landing'
  | 'dashboard'
  | 'reconciliation'
  | 'exceptions'
  | 'record-details'
  | 'cash-forecast'
  | 'tax-matcher'
  | 'reports'
  | 'ai-assistant'
  | 'settings'

function currentView(): View {
  const hash = window.location.hash.toLowerCase()
  if (hash.startsWith('#/reconciliation') || hash.startsWith('#/finance')) return 'reconciliation'
  if (hash.startsWith('#/exceptions')) return 'exceptions'
  if (hash.startsWith('#/record-details')) return 'record-details'
  if (hash.startsWith('#/cash-forecast')) return 'cash-forecast'
  if (hash.startsWith('#/tax-matcher')) return 'tax-matcher'
  if (hash.startsWith('#/reports')) return 'reports'
  if (hash.startsWith('#/ai-assistant')) return 'ai-assistant'
  if (hash.startsWith('#/settings')) return 'settings'
  if (hash.startsWith('#/dashboard')) return 'dashboard'
  return 'landing'
}

import CommandPalette from './components/CommandPalette'

export default function App() {
  const [view, setView] = useState<View>(currentView)
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Global Ctrl+K / Cmd+K key listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.toLowerCase()
      const isPageRoute = hash.startsWith('#/')
      setView(currentView())

      // Only force scroll to top on actual page route transitions, not in-page anchor jumps
      if (isPageRoute) {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
        const mainEl = document.querySelector('.d-main')
        if (mainEl) mainEl.scrollTop = 0
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <FinanceContextProvider>
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      {view === 'dashboard'      && <Dashboard />}
      {view === 'reconciliation' && <ReconciliationPage />}
      {view === 'exceptions'     && <ExceptionsPage />}
      {view === 'record-details' && <RecordDetailsPage />}
      {view === 'cash-forecast'  && <CashForecastPage />}
      {view === 'tax-matcher'    && <TaxMatcherPage />}
      {view === 'reports'        && <ReportsPage />}
      {view === 'ai-assistant'   && <AIAssistantPage />}
      {view === 'settings'       && <SettingsPage />}
      {view === 'landing'        && <Landing />}
    </FinanceContextProvider>
  )
}
