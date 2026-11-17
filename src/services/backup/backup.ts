import JSZip from 'jszip'
import { getDatabase } from '@/database/db'
import {
  DATABASE_VERSION,
  LANGUAGES,
  type AppSettings,
  type Area,
  type Category,
  type ContentTranslation,
  type Destination,
  type GuestContact,
  type GuestSession,
  type Journey,
  type Language,
  type LocalMedia,
} from '@/database/schema'

const BACKUP_FORMAT = 'explore-sri-lanka-backup'
const MAX_BACKUP_SIZE_BYTES = 1_000_000_000

interface BackupMediaMetadata extends Omit<LocalMedia, 'blob' | 'thumbnailBlob'> {
  fileEntry: string
  thumbnailEntry: string | null
}

interface BackupDatabase {
  areas: Area[]
  categories: Category[]
  destinations: Destination[]
  guests: GuestContact[]
  guestSessions: GuestSession[]
  journeys: Journey[]
  settings: AppSettings[]
  media: BackupMediaMetadata[]
}

interface BackupManifest {
  format: typeof BACKUP_FORMAT
  databaseVersion: number
  createdAt: string
  mediaCount: number
}

export async function createBackupBlob(): Promise<Blob> {
  const database = getDatabase()
  const [areas, categories, destinations, guests, guestSessions, journeys, settings, media] = await Promise.all([
    database.areas.toArray(),
    database.categories.toArray(),
    database.destinations.toArray(),
    database.guests.toArray(),
    database.guestSessions.toArray(),
    database.journeys.toArray(),
    database.settings.toArray(),
    database.media.toArray(),
  ])
  const zip = new JSZip()
  const mediaFolder = zip.folder('media')
  if (!mediaFolder) throw new Error('Could not create the media folder in the backup.')

  const mediaMetadata: BackupMediaMetadata[] = []
  for (const item of media) {
    const extension = item.fileName.includes('.') ? item.fileName.split('.').pop()!.toLowerCase() : 'bin'
    const fileEntry = `media/${item.mediaType}s/${item.id}.${extension}`
    const thumbnailEntry = item.thumbnailBlob ? `media/images/${item.id}-thumbnail.jpg` : null
    zip.file(fileEntry, item.blob, { compression: 'STORE' })
    if (item.thumbnailBlob && thumbnailEntry) zip.file(thumbnailEntry, item.thumbnailBlob, { compression: 'STORE' })
    const { blob: _blob, thumbnailBlob: _thumbnailBlob, ...metadata } = item
    mediaMetadata.push({ ...metadata, fileEntry, thumbnailEntry })
  }

  const data: BackupDatabase = {
    areas,
    categories,
    destinations,
    guests,
    guestSessions,
    journeys,
    settings,
    media: mediaMetadata,
  }
  const manifest: BackupManifest = {
    format: BACKUP_FORMAT,
    databaseVersion: DATABASE_VERSION,
    createdAt: new Date().toISOString(),
    mediaCount: media.length,
  }
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))
  zip.file('database.json', JSON.stringify(data))
  zip.file(
    'README.txt',
    'Explore Sri Lanka local backup. Keep this archive private because it may contain guest contact details. Restore it only in the Explore Sri Lanka application.',
  )
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 1 } })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasArray(data: Record<string, unknown>, key: string): unknown[] {
  const value = data[key]
  if (!Array.isArray(value)) throw new Error(`The backup is missing the required "${key}" list.`)
  return value
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString)
}

function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && LANGUAGES.some((language) => language === value)
}

function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value)
}

function isLocalizedText(value: unknown): value is Record<Language, string> {
  return isRecord(value) && LANGUAGES.every((language) => isString(value[language]))
}

function isContentTranslation(value: unknown): value is ContentTranslation {
  return isRecord(value) &&
    isString(value.name) && isString(value.shortDescription) &&
    isString(value.description) && isString(value.historicalBackground) &&
    Array.isArray(value.facts) && value.facts.every((fact) =>
      isRecord(fact) && isString(fact.id) && isString(fact.label) && isString(fact.value)) &&
    isStringArray(value.highlights) && isString(value.dressCode) &&
    isString(value.etiquette) && isString(value.photography) &&
    isString(value.accessibility) && isString(value.bestTime) && isString(value.videoDescription)
}

function isTranslations(value: unknown): value is Record<Language, ContentTranslation> {
  return isRecord(value) && LANGUAGES.every((language) => isContentTranslation(value[language]))
}

function isArea(value: unknown): value is Area {
  return isRecord(value) && isSafeId(value.id) && isLocalizedText(value.translations) &&
    isLocalizedText(value.descriptions) && (value.parentAreaId === null || isString(value.parentAreaId)) &&
    (value.imageMediaId === null || isString(value.imageMediaId)) && typeof value.sortOrder === 'number'
}

function isCategory(value: unknown): value is Category {
  return isRecord(value) && isSafeId(value.id) && isLocalizedText(value.translations) &&
    isLocalizedText(value.descriptions) && isString(value.icon) &&
    (value.imageMediaId === null || isString(value.imageMediaId)) && typeof value.sortOrder === 'number'
}

function isDestination(value: unknown): value is Destination {
  return isRecord(value) && isSafeId(value.id) && isString(value.slug) &&
    isString(value.areaId) && isStringArray(value.categoryIds) && isTranslations(value.translations) &&
    isStringArray(value.galleryMediaIds) && isStringArray(value.videoMediaIds) &&
    isStringArray(value.audioMediaIds) && isStringArray(value.nearbyDestinationIds) &&
    isStringArray(value.keywords) && isStringArray(value.alternateNames) &&
    isString(value.visitDuration) && typeof value.published === 'boolean' &&
    typeof value.featured === 'boolean' && typeof value.sortOrder === 'number' &&
    isString(value.sources) && (value.lastVerifiedAt === null || isString(value.lastVerifiedAt)) &&
    isString(value.createdAt) && isString(value.updatedAt)
}

function isGuestContact(value: unknown): value is GuestContact {
  return isRecord(value) && isSafeId(value.id) && isString(value.name) &&
    isString(value.countryCode) && isString(value.phoneNumber) &&
    isString(value.normalizedPhoneNumber) && isLanguage(value.selectedLanguage) &&
    value.consent === true && isString(value.consentDate) &&
    isString(value.guestSessionId) && isString(value.createdAt)
}

function isGuestSession(value: unknown): value is GuestSession {
  return isRecord(value) && isSafeId(value.id) && isLanguage(value.language) &&
    isString(value.startedAt) && (value.endedAt === null || isString(value.endedAt)) &&
    (value.journeyId === null || isString(value.journeyId)) &&
    isStringArray(value.wishlistIds) && typeof value.invitationEligible === 'boolean' &&
    typeof value.invitationShown === 'boolean'
}

function isJourney(value: unknown): value is Journey {
  return isRecord(value) && isSafeId(value.id) && isLocalizedText(value.name) &&
    isLocalizedText(value.description) && isStringArray(value.destinationIds) &&
    typeof value.sortOrder === 'number' && typeof value.active === 'boolean' &&
    typeof value.featured === 'boolean'
}

function isSettings(value: unknown): value is AppSettings {
  return isRecord(value) && value.id === 'app' && isString(value.appName) &&
    isLanguage(value.defaultLanguage) && isString(value.guideWhatsAppNumber) &&
    (value.theme === 'light' || value.theme === 'dark') &&
    typeof value.invitationDelayMinutes === 'number' && typeof value.maxVideoSizeMb === 'number' &&
    (value.adminSalt === null || isString(value.adminSalt)) &&
    (value.adminVerifier === null || isString(value.adminVerifier)) &&
    typeof value.failedLoginCount === 'number' &&
    (value.lockedUntil === null || typeof value.lockedUntil === 'number')
}

function isBackupMedia(value: unknown): value is BackupMediaMetadata {
  return isRecord(value) && isSafeId(value.id) && isString(value.fileName) &&
    isString(value.mimeType) && typeof value.fileSize === 'number' &&
    (value.mediaType === 'image' || value.mediaType === 'video' || value.mediaType === 'audio') &&
    (value.language === undefined || value.language === null || isLanguage(value.language)) &&
    (value.destinationId === null || isString(value.destinationId)) &&
    isString(value.createdAt) && isString(value.fileEntry) &&
    /^media\/(images|videos|audios)\/[A-Za-z0-9_-]+\.[A-Za-z0-9]+$/.test(value.fileEntry) &&
    (value.thumbnailEntry === null ||
      (isString(value.thumbnailEntry) && /^media\/images\/[A-Za-z0-9_-]+-thumbnail\.jpg$/.test(value.thumbnailEntry)))
}

function typedList<T>(data: Record<string, unknown>, key: string, guard: (value: unknown) => value is T): T[] {
  const values = hasArray(data, key)
  if (!values.every(guard)) throw new Error(`The backup contains an invalid "${key}" record.`)
  return values
}

function assertUniqueIds<T extends { id: string }>(items: T[], name: string): void {
  if (new Set(items.map((item) => item.id)).size !== items.length) {
    throw new Error(`The backup contains duplicate IDs in "${name}".`)
  }
}

export async function restoreBackup(file: File): Promise<void> {
  if (file.size > MAX_BACKUP_SIZE_BYTES) throw new Error('The ZIP backup exceeds the 1 GB restore limit.')
  const zip = await JSZip.loadAsync(file)
  const manifestEntry = zip.file('manifest.json')
  const databaseEntry = zip.file('database.json')
  if (!manifestEntry || !databaseEntry) throw new Error('This ZIP does not contain a valid Explore Sri Lanka backup.')

  const manifestValue: unknown = JSON.parse(await manifestEntry.async('text'))
  const dataValue: unknown = JSON.parse(await databaseEntry.async('text'))
  if (!isRecord(manifestValue) || manifestValue.format !== BACKUP_FORMAT) {
    throw new Error('The backup manifest format is not supported.')
  }
  const backupVersion = manifestValue.databaseVersion
  if (typeof backupVersion !== 'number' || !Number.isInteger(backupVersion) ||
    backupVersion < 1 || backupVersion > DATABASE_VERSION) {
    throw new Error('This backup was created by a newer database version and cannot be restored here.')
  }
  if (!isRecord(dataValue)) throw new Error('The backup database data is invalid.')

  const areas = typedList(dataValue, 'areas', isArea)
  const categories = typedList(dataValue, 'categories', isCategory)
  const destinations = typedList(dataValue, 'destinations', isDestination)
  const guests = typedList(dataValue, 'guests', isGuestContact)
  const guestSessions = typedList(dataValue, 'guestSessions', isGuestSession)
  const journeys = typedList(dataValue, 'journeys', isJourney)
  const settings = typedList(dataValue, 'settings', isSettings)
  const metadataList = typedList(dataValue, 'media', isBackupMedia)
  if (settings.length !== 1) throw new Error('The backup must contain exactly one application settings record.')
  assertUniqueIds(areas, 'areas')
  assertUniqueIds(categories, 'categories')
  assertUniqueIds(destinations, 'destinations')
  assertUniqueIds(guests, 'guests')
  assertUniqueIds(guestSessions, 'guestSessions')
  assertUniqueIds(journeys, 'journeys')
  assertUniqueIds(metadataList, 'media')
  if (manifestValue.mediaCount !== metadataList.length) {
    throw new Error('The media count in the manifest does not match the database data.')
  }

  const media: LocalMedia[] = []
  for (const value of metadataList) {
    const blobEntry = zip.file(value.fileEntry)
    if (!blobEntry) throw new Error(`A referenced media file is missing: ${value.fileEntry}`)
    const blob = await blobEntry.async('blob')
    const thumbnailEntry = typeof value.thumbnailEntry === 'string' ? zip.file(value.thumbnailEntry) : null
    if (typeof value.thumbnailEntry === 'string' && !thumbnailEntry) {
      throw new Error(`A media thumbnail is missing: ${value.thumbnailEntry}`)
    }
    const thumbnailBlob = thumbnailEntry ? await thumbnailEntry.async('blob') : null
    const {
      fileEntry: _fileEntry,
      thumbnailEntry: _thumbnailEntry,
      ...metadata
    } = value
    media.push({
      ...metadata,
      language: metadata.language ?? null,
      blob: blob.slice(0, blob.size, value.mimeType),
      thumbnailBlob,
    })
  }

  const mediaIds = new Set(media.map((item) => item.id))
  const areaIds = new Set(areas.map((item) => item.id))
  const categoryIds = new Set(categories.map((item) => item.id))
  const destinationIds = new Set(destinations.map((item) => item.id))
  const sessionIds = new Set(guestSessions.map((item) => item.id))
  for (const area of areas) {
    if (area.parentAreaId && !areaIds.has(area.parentAreaId)) throw new Error(`Area "${area.id}" references an unknown parent area.`)
    if (area.imageMediaId && !mediaIds.has(area.imageMediaId)) throw new Error(`Area "${area.id}" references missing media.`)
  }
  for (const category of categories) {
    if (category.imageMediaId && !mediaIds.has(category.imageMediaId)) throw new Error(`Category "${category.id}" references missing media.`)
  }
  for (const item of media) {
    if (item.destinationId && !destinationIds.has(item.destinationId)) throw new Error(`Media "${item.id}" references an unknown destination.`)
  }
  for (const destination of destinations) {
    if (!areaIds.has(destination.areaId) || destination.categoryIds.some((id) => !categoryIds.has(id))) {
      throw new Error(`Destination "${destination.id}" references an unknown area or category.`)
    }
    const references = [...destination.galleryMediaIds, ...destination.videoMediaIds, ...destination.audioMediaIds]
    if (references.some((id) => !mediaIds.has(id))) {
      throw new Error(`Destination "${destination.id}" references missing media.`)
    }
    if (destination.nearbyDestinationIds.some((id) => !destinationIds.has(id))) {
      throw new Error(`Destination "${destination.id}" references an unknown nearby destination.`)
    }
  }
  for (const journey of journeys) {
    if (journey.destinationIds.some((id) => !destinationIds.has(id))) {
      throw new Error(`Journey "${journey.id}" references an unknown destination.`)
    }
  }
  for (const guest of guests) {
    if (!sessionIds.has(guest.guestSessionId)) throw new Error(`Guest "${guest.id}" references an unknown session.`)
  }
  for (const session of guestSessions) {
    if (session.journeyId && !journeys.some((journey) => journey.id === session.journeyId)) {
      throw new Error(`Guest session "${session.id}" references an unknown journey.`)
    }
    if (session.wishlistIds.some((id) => !destinationIds.has(id))) {
      throw new Error(`Guest session "${session.id}" references an unknown destination.`)
    }
  }

  const database = getDatabase()
  await database.transaction(
    'rw',
    [
      database.areas,
      database.categories,
      database.destinations,
      database.guests,
      database.guestSessions,
      database.journeys,
      database.settings,
      database.media,
    ],
    async () => {
      await Promise.all([
        database.areas.clear(),
        database.categories.clear(),
        database.destinations.clear(),
        database.guests.clear(),
        database.guestSessions.clear(),
        database.journeys.clear(),
        database.settings.clear(),
        database.media.clear(),
      ])
      await Promise.all([
        database.areas.bulkAdd(areas),
        database.categories.bulkAdd(categories),
        database.destinations.bulkAdd(destinations),
        database.guests.bulkAdd(guests),
        database.guestSessions.bulkAdd(guestSessions),
        database.journeys.bulkAdd(journeys),
        database.settings.bulkAdd(settings),
        database.media.bulkAdd(media),
      ])
    },
  )
}
