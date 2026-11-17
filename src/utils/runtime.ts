export function errorText(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }
  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }
  return 'Unknown error'
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`
}

export function formatBytes(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return 'Unavailable'
  }
  if (value < 1024) {
    return `${Math.round(value)} B`
  }
  const units = ['KB', 'MB', 'GB', 'TB']
  let size = value / 1024
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  const digits = size >= 10 ? 0 : 1
  return `${size.toFixed(digits)} ${units[unitIndex]}`
}

export function formatWhen(value: string | null): string {
  if (!value) {
    return 'Not recorded'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

export function localPublicUrl(relativePath: string): string {
  const path = relativePath.replace(/^\.\//, '')
  return new URL(path, window.location.href).href
}
