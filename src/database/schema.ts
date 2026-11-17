export const DATABASE_NAME = 'ExploreSriLanka'
export const DATABASE_VERSION = 4

export const PERSISTENCE_CANARY_ID = 'persistence-canary'
export const REOPEN_PROBE_ID = 'reopen-probe'

export const LANGUAGES = ['en', 'de', 'ru', 'ja'] as const
export type Language = (typeof LANGUAGES)[number]
export type LocalizedText = Record<Language, string>

export interface ContentTranslation {
  name: string
  shortDescription: string
  description: string
  historicalBackground: string
  facts: Array<{ id: string; label: string; value: string }>
  highlights: string[]
  dressCode: string
  etiquette: string
  photography: string
  accessibility: string
  bestTime: string
  videoDescription: string
}

export interface Destination {
  id: string
  slug: string
  areaId: string
  categoryIds: string[]
  translations: Record<Language, ContentTranslation>
  galleryMediaIds: string[]
  videoMediaIds: string[]
  audioMediaIds: string[]
  nearbyDestinationIds: string[]
  keywords: string[]
  alternateNames: string[]
  visitDuration: string
  published: boolean
  featured: boolean
  sortOrder: number
  sources: string
  lastVerifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Area {
  id: string
  translations: LocalizedText
  descriptions: LocalizedText
  parentAreaId: string | null
  imageMediaId: string | null
  sortOrder: number
}

export interface Category {
  id: string
  translations: LocalizedText
  descriptions: LocalizedText
  icon: string
  imageMediaId: string | null
  sortOrder: number
}

export interface LocalMedia {
  id: string
  fileName: string
  mimeType: string
  fileSize: number
  blob: Blob
  thumbnailBlob: Blob | null
  mediaType: 'image' | 'video' | 'audio'
  language: Language | null
  destinationId: string | null
  createdAt: string
}

export type MediaMetadata = Omit<LocalMedia, 'blob' | 'thumbnailBlob'>

export interface GuestContact {
  id: string
  name: string
  email: string
  roomNumber: string
  countryCode: string
  phoneNumber: string
  normalizedPhoneNumber: string
  selectedLanguage: Language
  consent: true
  consentDate: string
  guestSessionId: string
  createdAt: string
}

export interface GuestSession {
  id: string
  language: Language
  startedAt: string
  endedAt: string | null
  journeyId: string | null
  wishlistIds: string[]
  invitationEligible: boolean
  invitationShown: boolean
}

export interface Journey {
  id: string
  name: LocalizedText
  description: LocalizedText
  destinationIds: string[]
  sortOrder: number
  active: boolean
  featured: boolean
}

export interface AppSettings {
  id: 'app'
  appName: string
  defaultLanguage: Language
  guideWhatsAppNumber: string
  theme: 'light' | 'dark'
  invitationDelayMinutes: number
  maxVideoSizeMb: number
  adminSalt: string | null
  adminVerifier: string | null
  failedLoginCount: number
  lockedUntil: number | null
}

export interface DiagnosticRecord {
  id: string
  kind: 'canary' | 'probe'
  bootId: string
  note: string
  createdAt: string
  updatedAt: string
  confirmedAt: string | null
}
