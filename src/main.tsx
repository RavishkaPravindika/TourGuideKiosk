import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from '@/App'
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary'
import { AppDataProvider } from '@/contexts/AppDataContext'
import { DiagnosticsProvider } from '@/contexts/DiagnosticsContext'
import './styles/global.scss'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('The app root element (#root) was not found.')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppDataProvider>
        <DiagnosticsProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </DiagnosticsProvider>
      </AppDataProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
