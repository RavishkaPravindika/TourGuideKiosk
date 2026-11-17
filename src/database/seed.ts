import { getDatabase } from './db'
import type {
  AppSettings,
  Area,
  Category,
  ContentTranslation,
  Destination,
  Language,
} from './schema'

const emptyTranslation = (): ContentTranslation => ({
  name: '',
  shortDescription: '',
  description: '',
  historicalBackground: '',
  facts: [],
  highlights: [],
  dressCode: '',
  etiquette: '',
  photography: '',
  accessibility: '',
  bestTime: '',
  videoDescription: '',
})

const areas: Area[] = [
  {
    id: 'western-coast',
    translations: {
      en: 'Western Coast',
      de: 'Westküste',
      ru: 'Западное побережье',
      ja: '西海岸',
    },
    descriptions: { en: '', de: '', ru: '', ja: '' },
    parentAreaId: null,
    imageMediaId: null,
    sortOrder: 1,
  },
  {
    id: 'southern-coast',
    translations: {
      en: 'Southern Coast',
      de: 'Südküste',
      ru: 'Южное побережье',
      ja: '南海岸',
    },
    descriptions: { en: '', de: '', ru: '', ja: '' },
    parentAreaId: null,
    imageMediaId: null,
    sortOrder: 2,
  },
  {
    id: 'central-highlands',
    translations: {
      en: 'Central Highlands',
      de: 'Zentrales Hochland',
      ru: 'Центральное нагорье',
      ja: '中央高地',
    },
    descriptions: { en: '', de: '', ru: '', ja: '' },
    parentAreaId: null,
    imageMediaId: null,
    sortOrder: 3,
  },
  {
    id: 'cultural-triangle',
    translations: {
      en: 'Cultural Triangle',
      de: 'Kulturdreieck',
      ru: 'Культурный треугольник',
      ja: '文化三角地帯',
    },
    descriptions: { en: '', de: '', ru: '', ja: '' },
    parentAreaId: null,
    imageMediaId: null,
    sortOrder: 4,
  },
]

const categories: Category[] = [
  {
    id: 'temples',
    translations: { en: 'Temples & Religion', de: 'Tempel & Religion', ru: 'Храмы и религия', ja: '寺院と宗教' },
    descriptions: { en: '', de: '', ru: '', ja: '' },
    icon: 'landmark',
    imageMediaId: null,
    sortOrder: 1,
  },
  {
    id: 'heritage',
    translations: { en: 'History & Heritage', de: 'Geschichte & Kulturerbe', ru: 'История и наследие', ja: '歴史と文化遺産' },
    descriptions: { en: '', de: '', ru: '', ja: '' },
    icon: 'scroll',
    imageMediaId: null,
    sortOrder: 2,
  },
  {
    id: 'beaches',
    translations: { en: 'Beaches & Surfing', de: 'Strände & Surfen', ru: 'Пляжи и сёрфинг', ja: 'ビーチとサーフィン' },
    descriptions: { en: '', de: '', ru: '', ja: '' },
    icon: 'waves',
    imageMediaId: null,
    sortOrder: 3,
  },
  {
    id: 'nature',
    translations: { en: 'Nature & Wildlife', de: 'Natur & Tierwelt', ru: 'Природа и животный мир', ja: '自然と野生動物' },
    descriptions: { en: '', de: '', ru: '', ja: '' },
    icon: 'trees',
    imageMediaId: null,
    sortOrder: 4,
  },
]

const initialDestination: Destination = {
  id: 'kande-viharaya',
  slug: 'kande-viharaya',
  areaId: 'western-coast',
  categoryIds: ['temples', 'heritage'],
  translations: {
    en: {
      ...emptyTranslation(),
      name: 'Kande Viharaya',
      shortDescription: 'A destination profile awaiting locally verified details.',
    },
    de: emptyTranslation(),
    ru: emptyTranslation(),
    ja: emptyTranslation(),
  },
  galleryMediaIds: [],
  videoMediaIds: [],
  audioMediaIds: [],
  nearbyDestinationIds: [],
  keywords: [],
  alternateNames: [],
  visitDuration: '',
  published: false,
  featured: false,
  sortOrder: 1,
  sources: '',
  lastVerifiedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const initialSettings: AppSettings = {
  id: 'app',
  appName: 'Explore Sri Lanka',
  defaultLanguage: 'en',
  guideWhatsAppNumber: '',
  theme: 'light',
  invitationDelayMinutes: 5,
  maxVideoSizeMb: 150,
  adminSalt: null,
  adminVerifier: null,
  failedLoginCount: 0,
  lockedUntil: null,
}

export async function seedDatabase(): Promise<void> {
  const database = getDatabase()
  await database.transaction(
    'rw',
    database.areas,
    database.categories,
    database.destinations,
    database.journeys,
    database.settings,
    async () => {
      if ((await database.areas.count()) === 0) await database.areas.bulkAdd(areas)
      if ((await database.categories.count()) === 0) await database.categories.bulkAdd(categories)
      if ((await database.destinations.count()) === 0) await database.destinations.add(initialDestination)
      if ((await database.journeys.count()) === 0) {
        await database.journeys.add({
          id: 'airport-to-beruwala',
          name: { en: 'Airport to Beruwala', de: 'Flughafen nach Beruwala', ru: 'Из аэропорта в Берувелу', ja: '空港からベルワラへ' },
          description: { en: '', de: '', ru: '', ja: '' },
          destinationIds: [],
          sortOrder: 1,
          active: true,
          featured: true,
        })
      }
      if (!(await database.settings.get('app'))) await database.settings.add(initialSettings)
    },
  )
}

export function isLanguage(value: string): value is Language {
  return value === 'en' || value === 'de' || value === 'ru' || value === 'ja'
}
