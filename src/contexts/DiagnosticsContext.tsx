import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { rerunDiagnostics, startDiagnostics } from '@/services/diagnostics/runDiagnostics'
import type { CheckId, DiagnosticCheck, DiagnosticReport } from '@/services/diagnostics/types'
import { errorText } from '@/utils/runtime'

interface DiagnosticsContextValue {
  report: DiagnosticReport | null
  running: boolean
  runError: string | null
  rerun: () => void
  updateCheck: (id: CheckId, patch: Pick<DiagnosticCheck, 'status' | 'summary'> & { detail?: string }) => void
}

export const DiagnosticsContext = createContext<DiagnosticsContextValue | null>(null)

export function DiagnosticsProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<DiagnosticReport | null>(null)
  const [running, setRunning] = useState(true)
  const [runError, setRunError] = useState<string | null>(null)
  const runId = useRef(0)

  const execute = useCallback((force: boolean) => {
    const id = runId.current + 1
    runId.current = id
    setRunning(true)
    setRunError(null)
    const task = force ? rerunDiagnostics() : startDiagnostics()
    task
      .then((next) => {
        if (runId.current === id) setReport(next)
      })
      .catch((error: unknown) => {
        if (runId.current === id) setRunError(errorText(error))
      })
      .finally(() => {
        if (runId.current === id) setRunning(false)
      })
  }, [])

  useEffect(() => {
    execute(false)
  }, [execute])

  const updateCheck = useCallback<DiagnosticsContextValue['updateCheck']>((id, patch) => {
    setReport((current) => {
      if (!current) return current
      return {
        ...current,
        checks: current.checks.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      }
    })
  }, [])

  return (
    <DiagnosticsContext.Provider value={{ report, running, runError, rerun: () => execute(true), updateCheck }}>
      {children}
    </DiagnosticsContext.Provider>
  )
}

