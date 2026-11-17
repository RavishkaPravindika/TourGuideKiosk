import { buildInfo } from '@/buildInfo'
import { getDatabase } from '@/database/db'
import {
  DATABASE_NAME,
  PERSISTENCE_CANARY_ID,
  REOPEN_PROBE_ID,
  type DiagnosticRecord,
} from '@/database/schema'
import { createId, errorText, localPublicUrl } from '@/utils/runtime'
import { sampleClipBlob } from './sampleClip'
import type { DiagnosticCheck, DiagnosticReport, EnvironmentReport } from './types'

const CHECK_TIMEOUT_MS = 8000
const pageBootId = createId()

const LOCAL_IMAGE_PATH = 'media/diagnostics/marker.svg'
const LOCAL_VIDEO_PATH = 'media/diagnostics/sample.mp4'

function withTimeout<T>(work: Promise<T>, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(message))
    }, CHECK_TIMEOUT_MS)

    work.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        window.clearTimeout(timer)
        reject(error instanceof Error ? error : new Error(errorText(error)))
      },
    )
  })
}

function check(
  id: DiagnosticCheck['id'],
  title: string,
  status: DiagnosticCheck['status'],
  summary: string,
  detail?: string,
): DiagnosticCheck {
  return { id, title, status, summary, detail }
}

async function readStorageEstimate(): Promise<EnvironmentReport['storage']> {
  if (!navigator.storage?.estimate) {
    return {
      available: false,
      quota: null,
      usage: null,
      detail: 'This browser does not expose a storage estimate.',
    }
  }

  try {
    const estimate = await navigator.storage.estimate()
    return {
      available: true,
      quota: estimate.quota ?? null,
      usage: estimate.usage ?? null,
      detail: 'Estimate reported by this browser for this origin.',
    }
  } catch (error) {
    return {
      available: false,
      quota: null,
      usage: null,
      detail: errorText(error),
    }
  }
}

function describeWebView(userAgent: string): { summary: string; chromeVersion: string | null } {
  const chromeVersion = userAgent.match(/Chrome\/([0-9.]+)/i)?.[1] ?? null
  const browserVersion = userAgent.match(/Version\/([0-9.]+)/i)?.[1] ?? null
  const webViewMarker = /;\s*wv\)/i.test(userAgent) || /WebView/i.test(userAgent)
  const kioskMarker = /Fully|Kiosk/i.test(userAgent)
  const parts = [
    webViewMarker ? 'WebView marker found in the user agent.' : 'No WebView marker in the user agent.',
    chromeVersion ? `Chrome/${chromeVersion}.` : 'Chrome version not found.',
    browserVersion ? `Version/${browserVersion}.` : null,
    kioskMarker ? 'Kiosk marker found in the user agent.' : null,
  ].filter((part): part is string => Boolean(part))

  return { summary: parts.join(' '), chromeVersion }
}

async function collectEnvironment(databaseVersion: number | null, databaseOpen: boolean): Promise<EnvironmentReport> {
  const userAgent = navigator.userAgent
  const webView = describeWebView(userAgent)

  return {
    userAgent,
    platform: navigator.platform || 'Unavailable',
    language: navigator.language || 'Unavailable',
    androidVersion: userAgent.match(/Android\s+([0-9.]+)/i)?.[1] ?? null,
    webViewSummary: webView.summary,
    chromeVersion: webView.chromeVersion,
    url: window.location.href,
    protocol: window.location.protocol,
    viewport: `${window.innerWidth} × ${window.innerHeight} at ${window.devicePixelRatio || 1}x`,
    buildVersion: buildInfo.version,
    buildTime: buildInfo.builtAt,
    databaseName: DATABASE_NAME,
    databaseVersion,
    databaseOpen,
    storage: await readStorageEstimate(),
  }
}

function loadImage(src: string): Promise<{ width: number; height: number }> {
  return withTimeout(
    new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        if (image.naturalWidth < 1 || image.naturalHeight < 1) {
          reject(new Error('The image loaded with an empty size.'))
          return
        }
        resolve({ width: image.naturalWidth, height: image.naturalHeight })
      }
      image.onerror = () => {
        reject(new Error('The image could not be loaded.'))
      }
      image.src = src
    }),
    'The image load timed out.',
  )
}

interface VideoProbe {
  played: boolean
  width: number
  height: number
  gestureRequired: boolean
}

function probeVideo(src: string): Promise<VideoProbe> {
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.setAttribute('playsinline', 'true')
  video.preload = 'auto'
  video.setAttribute('aria-hidden', 'true')
  video.style.position = 'fixed'
  video.style.width = '64px'
  video.style.height = '64px'
  video.style.left = '0'
  video.style.top = '0'
  video.style.opacity = '0'
  video.style.pointerEvents = 'none'
  document.body.appendChild(video)

  const finish = () => {
    video.pause()
    video.removeAttribute('src')
    video.load()
    video.remove()
  }

  const loaded = withTimeout(
    new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => {
        const code = video.error?.code
        reject(new Error(`The video could not be loaded (media error ${code ?? 'unknown'}).`))
      }
      video.src = src
      video.load()
    }),
    'The video load timed out.',
  )

  return loaded
    .then(async () => {
      const width = video.videoWidth
      const height = video.videoHeight
      if (width < 1 || height < 1) {
        throw new Error('The video loaded without a picture size.')
      }
      try {
        await video.play()
        video.pause()
        return { played: true, width, height, gestureRequired: false }
      } catch (error) {
        const name = error instanceof DOMException ? error.name : ''
        if (name === 'NotAllowedError') {
          return { played: false, width, height, gestureRequired: true }
        }
        throw error
      }
    })
    .finally(finish)
}

async function pngBlob(): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 16
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas rendering is not available.')
  }
  context.fillStyle = '#174A35'
  context.fillRect(0, 0, 16, 16)
  context.fillStyle = '#C5A15D'
  context.fillRect(4, 4, 8, 8)

  const blob = await withTimeout(
    new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/png')
    }),
    'Creating an image blob timed out.',
  )
  if (!blob) {
    throw new Error('The browser did not return a PNG blob.')
  }
  return blob
}

async function runBlobChecks(): Promise<DiagnosticCheck> {
  const notes: string[] = []
  let imageUrl: string | null = null
  let videoUrl: string | null = null

  try {
    const imageBlob = await pngBlob()
    imageUrl = URL.createObjectURL(imageBlob)
    const image = await loadImage(imageUrl)
    notes.push(`Image blob rendered at ${image.width}×${image.height}.`)

    const videoBlob = sampleClipBlob()
    videoUrl = URL.createObjectURL(videoBlob)
    const video = await probeVideo(videoUrl)
    notes.push(
      video.played
        ? `Video blob played at ${video.width}×${video.height}.`
        : `Video blob loaded at ${video.width}×${video.height}. Playback needs a tap.`,
    )

    return check(
      'blob-url',
      'Blob URL rendering',
      video.played ? 'pass' : 'warning',
      video.played
        ? 'An image and a video created in memory were shown through blob URLs.'
        : 'Blob media loaded. Video playback needs a tap on this device.',
      notes.join(' '),
    )
  } catch (error) {
    return check(
      'blob-url',
      'Blob URL rendering',
      'fail',
      'In-memory media could not be shown through a blob URL.',
      errorText(error),
    )
  } finally {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    if (videoUrl) URL.revokeObjectURL(videoUrl)
  }
}

function inspectFileInput(): DiagnosticCheck {
  const input = document.createElement('input')
  input.type = 'file'
  const usable = 'files' in input && typeof FileReader !== 'undefined' && typeof Blob !== 'undefined'

  if (!usable) {
    return check(
      'file-input',
      'File input support',
      'fail',
      'This browser does not expose a file input and FileReader.',
    )
  }

  return check(
    'file-input',
    'File input support',
    'warning',
    'The file API is present. Choose a file below to confirm this device can read it.',
    'Automatic selection is not possible. A passing result requires a file chosen on this tablet.',
  )
}

async function runDatabaseChecks(checks: DiagnosticCheck[]): Promise<{
  databaseVersion: number | null
  databaseOpen: boolean
  criticalFailure: string | null
}> {
  checks.push(
    check(
      'javascript',
      'JavaScript execution',
      'pass',
      'Application script is running in this browser.',
    ),
  )

  if (!('indexedDB' in window) || !window.indexedDB) {
    const summary = 'IndexedDB is missing. Local destinations and contacts cannot be stored.'
    checks.push(check('indexeddb', 'IndexedDB availability', 'fail', summary))
    checks.push(
      check('dexie-open', 'Dexie database creation', 'fail', 'Skipped because IndexedDB is missing.'),
      check('read-write', 'IndexedDB read and write', 'fail', 'Skipped because IndexedDB is missing.'),
      check('reopen', 'Reopen the database', 'fail', 'Skipped because IndexedDB is missing.'),
      check('persistence', 'Database persistence after reopening the app', 'fail', 'Skipped because IndexedDB is missing.'),
    )
    return {
      databaseVersion: null,
      databaseOpen: false,
      criticalFailure: summary,
    }
  }

  checks.push(
    check(
      'indexeddb',
      'IndexedDB availability',
      'pass',
      'The IndexedDB API is present. This does not yet prove data survives a restart.',
    ),
  )

  const database = getDatabase()
  try {
    await withTimeout(database.open(), 'Opening the local database timed out.')
  } catch (error) {
    const detail = errorText(error)
    const summary = 'The local database could not be created or opened. Nothing was switched to temporary memory.'
    checks.push(check('dexie-open', 'Dexie database creation', 'fail', summary, detail))
    checks.push(
      check('read-write', 'IndexedDB read and write', 'fail', 'Skipped because the database did not open.', detail),
      check('reopen', 'Reopen the database', 'fail', 'Skipped because the database did not open.', detail),
      check(
        'persistence',
        'Database persistence after reopening the app',
        'fail',
        'Skipped because the database did not open.',
        detail,
      ),
    )
    return { databaseVersion: null, databaseOpen: false, criticalFailure: summary }
  }

  checks.push(
    check(
      'dexie-open',
      'Dexie database creation',
      'pass',
      `Opened “${DATABASE_NAME}”, schema version ${database.verno}.`,
    ),
  )

  let criticalFailure: string | null = null

  try {
    const probeId = `probe-${createId()}`
    const now = new Date().toISOString()
    const note = createId()
    const probe: DiagnosticRecord = {
      id: probeId,
      kind: 'probe',
      bootId: pageBootId,
      note,
      createdAt: now,
      updatedAt: now,
      confirmedAt: null,
    }
    await database.diagnostics.put(probe)
    const stored = await database.diagnostics.get(probeId)
    if (!stored || stored.note !== note) {
      throw new Error('The record read back from IndexedDB did not match the record that was written.')
    }
    await database.diagnostics.delete(probeId)
    const removed = await database.diagnostics.get(probeId)
    if (removed) {
      throw new Error('The test record was still present after deletion.')
    }
    checks.push(
      check(
        'read-write',
        'IndexedDB read and write',
        'pass',
        'A test record was written, read back, and removed.',
      ),
    )
  } catch (error) {
    const detail = errorText(error)
    const summary = 'IndexedDB did not complete a write and read. In-memory storage was not used.'
    checks.push(check('read-write', 'IndexedDB read and write', 'fail', summary, detail))
    criticalFailure = summary
  }

  try {
    const prior = await database.diagnostics.get(PERSISTENCE_CANARY_ID)
    const now = new Date().toISOString()
    const sawEarlierSession = Boolean(prior && prior.bootId !== pageBootId)
    const confirmedAt = sawEarlierSession ? now : (prior?.confirmedAt ?? null)
    const canary: DiagnosticRecord = {
      id: PERSISTENCE_CANARY_ID,
      kind: 'canary',
      bootId: pageBootId,
      note: 'persistence-canary',
      createdAt: prior?.createdAt ?? now,
      updatedAt: now,
      confirmedAt,
    }
    await database.diagnostics.put(canary)

    if (confirmedAt) {
      checks.push(
        check(
          'persistence',
          'Database persistence after reopening the app',
          'pass',
          'A canary written by an earlier opening of this page was still in IndexedDB.',
          `First written ${prior?.createdAt ?? confirmedAt}. Confirmed ${confirmedAt}.`,
        ),
      )
    } else {
      checks.push(
        check(
          'persistence',
          'Database persistence after reopening the app',
          'pending',
          'A canary was written for this page load. Close the app completely, open the same index.html again, and return here. This check passes only when that record is still present.',
          `Canary id “${PERSISTENCE_CANARY_ID}” in database “${DATABASE_NAME}”.`,
        ),
      )
    }
  } catch (error) {
    const detail = errorText(error)
    const summary = 'The persistence canary could not be saved. Local data may not survive on this device.'
    checks.push(
      check('persistence', 'Database persistence after reopening the app', 'fail', summary, detail),
    )
    criticalFailure = criticalFailure ?? summary
  }

  try {
    const now = new Date().toISOString()
    const note = createId()
    await database.diagnostics.put({
      id: REOPEN_PROBE_ID,
      kind: 'probe',
      bootId: pageBootId,
      note,
      createdAt: now,
      updatedAt: now,
      confirmedAt: null,
    })
    database.close()
    await withTimeout(database.open(), 'Reopening the local database timed out.')
    const stored = await database.diagnostics.get(REOPEN_PROBE_ID)
    if (!stored || stored.note !== note) {
      throw new Error('The record was not readable after the database was closed and opened again.')
    }
    await database.diagnostics.delete(REOPEN_PROBE_ID)
    checks.push(
      check(
        'reopen',
        'Reopen the database',
        'pass',
        'The database was closed, opened again, and the test record was still readable.',
      ),
    )
  } catch (error) {
    const detail = errorText(error)
    const summary = 'The database could not be closed and opened again in this session.'
    checks.push(check('reopen', 'Reopen the database', 'fail', summary, detail))
    criticalFailure = criticalFailure ?? summary
  }

  return {
    databaseVersion: database.verno,
    databaseOpen: database.isOpen(),
    criticalFailure,
  }
}

export async function runDiagnostics(): Promise<DiagnosticReport> {
  const startedAt = new Date().toISOString()
  const checks: DiagnosticCheck[] = []
  const database = await runDatabaseChecks(checks)

  try {
    const image = await loadImage(localPublicUrl(LOCAL_IMAGE_PATH))
    checks.push(
      check(
        'local-image',
        'Local image rendering',
        'pass',
        'The bundled marker image rendered from a relative path.',
        `${LOCAL_IMAGE_PATH} at ${image.width}×${image.height}.`,
      ),
    )
  } catch (error) {
    checks.push(
      check(
        'local-image',
        'Local image rendering',
        'fail',
        'The bundled marker image did not render. Keep the media folder beside index.html.',
        errorText(error),
      ),
    )
  }

  try {
    const video = await probeVideo(localPublicUrl(LOCAL_VIDEO_PATH))
    checks.push(
      check(
        'local-video',
        'Local video playback',
        video.played ? 'pass' : 'warning',
        video.played
          ? 'The bundled MP4 loaded and played from a relative path.'
          : 'The bundled MP4 loaded. Playback needs a tap. Use the player below.',
        `${LOCAL_VIDEO_PATH} at ${video.width}×${video.height}.`,
      ),
    )
  } catch (error) {
    checks.push(
      check(
        'local-video',
        'Local video playback',
        'fail',
        'The bundled MP4 did not play. Keep the media folder beside index.html.',
        errorText(error),
      ),
    )
  }

  checks.push(await runBlobChecks())
  checks.push(inspectFileInput())

  const databaseReady =
    checks.find((item) => item.id === 'dexie-open')?.status === 'pass' &&
    checks.find((item) => item.id === 'read-write')?.status === 'pass' &&
    checks.find((item) => item.id === 'reopen')?.status === 'pass'

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    environment: await collectEnvironment(database.databaseVersion, database.databaseOpen),
    checks,
    databaseReady,
    criticalFailure: database.criticalFailure,
  }
}

let inFlight: Promise<DiagnosticReport> | null = null

export function startDiagnostics(): Promise<DiagnosticReport> {
  if (!inFlight) {
    inFlight = runDiagnostics()
  }
  return inFlight
}

export function rerunDiagnostics(): Promise<DiagnosticReport> {
  inFlight = runDiagnostics()
  return inFlight
}
