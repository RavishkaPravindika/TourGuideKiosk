import type { ExploreSriLankaDB } from './db'
import { DATABASE_VERSION } from './schema'

export function registerMigrations(database: ExploreSriLankaDB): void {
  database.version(1).stores({
    diagnostics: 'id, updatedAt',
  })
  const stores = {
    diagnostics: 'id, updatedAt',
    destinations: 'id, slug, areaId, published, featured, sortOrder, updatedAt',
    areas: 'id, parentAreaId, sortOrder',
    categories: 'id, sortOrder',
    media: 'id, mediaType, destinationId, createdAt',
    guests: 'id, normalizedPhoneNumber, selectedLanguage, consentDate, createdAt, guestSessionId',
    guestSessions: 'id, startedAt, language',
    journeys: 'id, active, featured, sortOrder',
    settings: 'id',
  }
  database.version(2).stores(stores)
  database.version(3).stores(stores).upgrade(async (transaction) => {
    await transaction.table('media').toCollection().modify((media: { language?: string | null }) => {
      if (!('language' in media)) media.language = null
    })
  })
  database.version(DATABASE_VERSION).stores(stores).upgrade(async (transaction) => {
    await transaction.table('guests').toCollection().modify((guest: { email?: string; roomNumber?: string }) => {
      if (!('email' in guest)) guest.email = ''
      if (!('roomNumber' in guest)) guest.roomNumber = ''
    })
  })
}
