import { getDatabase } from '@/database/db'
import type { AppSettings } from '@/database/schema'

const ITERATIONS = 240_000
const LOCK_AFTER_FAILURES = 5
const LOCK_DURATION_MS = 30_000
const SESSION_KEY = 'explore-sri-lanka-admin-unlocked'

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function deriveVerifier(pin: string, salt: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure PIN verification is unavailable in this browser. Check device diagnostics.')
  }
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const saltBuffer = new ArrayBuffer(salt.byteLength)
  new Uint8Array(saltBuffer).set(salt)
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBuffer, iterations: ITERATIONS },
    key,
    256,
  )
  return bytesToHex(new Uint8Array(bits))
}

function hexToBytes(value: string): Uint8Array {
  return Uint8Array.from(value.match(/.{1,2}/g) ?? [], (part) => Number.parseInt(part, 16))
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index]
  return mismatch === 0
}

function randomSalt(): Uint8Array {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure random number generation is unavailable in this browser.')
  }
  return crypto.getRandomValues(new Uint8Array(16))
}

export async function createAdminPin(pin: string): Promise<void> {
  if (!/^\d{6,12}$/.test(pin)) throw new Error('Use an administrator PIN with 6 to 12 digits.')
  const settings = await getDatabase().settings.get('app')
  if (!settings) throw new Error('Application settings are unavailable. Check the local database.')
  const salt = randomSalt()
  const verifier = await deriveVerifier(pin, salt)
  const updated = await getDatabase().settings.update('app', {
    adminSalt: bytesToHex(salt),
    adminVerifier: verifier,
    failedLoginCount: 0,
    lockedUntil: null,
  })
  if (!updated) throw new Error('Application settings could not be updated.')
  setAdminUnlocked()
}

export async function verifyAdminPin(pin: string): Promise<void> {
  if (!/^\d{6,12}$/.test(pin)) throw new Error('Enter a PIN with 6 to 12 digits.')
  const database = getDatabase()
  const settings = await database.settings.get('app')
  if (!settings?.adminSalt || !settings.adminVerifier) throw new Error('Create an administrator PIN first.')

  const lockedUntil = settings.lockedUntil ?? null
  if (lockedUntil && lockedUntil > Date.now()) throw new Error('Too many attempts. Please wait before trying again.')

  const candidate = await deriveVerifier(pin, hexToBytes(settings.adminSalt))
  const matches = constantTimeEqual(hexToBytes(candidate), hexToBytes(settings.adminVerifier))
  if (!matches) {
    const failedLoginCount = settings.failedLoginCount + 1
    const updates: Partial<AppSettings> = {
      failedLoginCount,
      lockedUntil: failedLoginCount >= LOCK_AFTER_FAILURES ? Date.now() + LOCK_DURATION_MS : null,
    }
    if (failedLoginCount >= LOCK_AFTER_FAILURES) updates.failedLoginCount = 0
    await database.settings.update('app', updates)
    throw new Error(failedLoginCount >= LOCK_AFTER_FAILURES
      ? 'Too many attempts. Please wait before trying again.'
      : 'Incorrect PIN.')
  }

  await database.settings.update('app', { failedLoginCount: 0, lockedUntil: null })
  setAdminUnlocked()
}

export function isAdminUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function setAdminUnlocked(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    throw new Error('This browser cannot keep an administrator session. Enable session storage and retry.')
  }
}

export function lockAdmin(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    throw new Error('Could not clear the administrator session from this browser.')
  }
}
