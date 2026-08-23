import { useEffect, useState } from 'react'
import Landing from './pages/Landing'
import Dashboard from './dashboard/Dashboard'
import ReconciliationPage from './pages/ReconciliationPage'
import ExceptionsPage from './pages/ExceptionsPage'
import CashForecastPage from './pages/CashForecastPage'
import ReportsPage from './pages/ReportsPage'
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
  | 'reports'
  | 'ai-assistant'
  | 'settings'

function currentView(): View {
  const hash = window.location.hash.toLowerCase()
  if (hash.startsWith('#/reconciliation') || hash.startsWith('#/finance')) return 'reconciliation'
  if (hash.startsWith('#/exceptions')) return 'exceptions'
  if (hash.startsWith('#/record-details')) return 'record-details'
  if (hash.startsWith('#/cash-forecast')) return 'cash-forecast'
  if (hash.startsWith('#/reports')) return 'reports'
  if (hash.startsWith('#/ai-assistant')) return 'ai-assistant'
  if (hash.startsWith('#/settings')) return 'settings'
  if (hash.startsWith('#/dashboard')) return 'dashboard'
  return 'landing'
}

export default function App() {
  const [view, setView] = useState<View>(currentView)

  useEffect(() => {
    const onHash = () => setView(currentView())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <FinanceContextProvider>
      {view === 'dashboard'      && <Dashboard />}
      {view === 'reconciliation' && <ReconciliationPage />}
      {view === 'exceptions'     && <ExceptionsPage />}
      {view === 'record-details' && <RecordDetailsPage />}
      {view === 'cash-forecast'  && <CashForecastPage />}
      {view === 'reports'        && <ReportsPage />}
      {view === 'ai-assistant'   && <AIAssistantPage />}
      {view === 'settings'       && <SettingsPage />}
      {view === 'landing'        && <Landing />}
    </FinanceContextProvider>
  )
}
