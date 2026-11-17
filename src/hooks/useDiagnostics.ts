import { useContext } from 'react'
import { DiagnosticsContext } from '@/contexts/DiagnosticsContext'

export function useDiagnostics() {
  const value = useContext(DiagnosticsContext)
  if (!value) {
    throw new Error('useDiagnostics must be used within DiagnosticsProvider')
  }
  return value
}
