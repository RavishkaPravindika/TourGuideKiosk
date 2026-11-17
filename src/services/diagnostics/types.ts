export type CheckStatus = 'pass' | 'fail' | 'warning' | 'pending'

export type CheckId =
  | 'javascript'
  | 'indexeddb'
  | 'dexie-open'
  | 'read-write'
  | 'reopen'
  | 'persistence'
  | 'local-image'
  | 'local-video'
  | 'blob-url'
  | 'file-input'

export interface DiagnosticCheck {
  id: CheckId
  title: string
  status: CheckStatus
  summary: string
  detail?: string
}

export interface StorageEstimateReport {
  available: boolean
  quota: number | null
  usage: number | null
  detail: string
}

export interface EnvironmentReport {
  userAgent: string
  platform: string
  language: string
  androidVersion: string | null
  webViewSummary: string
  chromeVersion: string | null
  url: string
  protocol: string
  viewport: string
  buildVersion: string
  buildTime: string
  databaseName: string
  databaseVersion: number | null
  databaseOpen: boolean
  storage: StorageEstimateReport
}

export interface DiagnosticReport {
  startedAt: string
  finishedAt: string
  environment: EnvironmentReport
  checks: DiagnosticCheck[]
  databaseReady: boolean
  criticalFailure: string | null
}
