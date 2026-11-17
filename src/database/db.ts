import Dexie, { type Table } from 'dexie'
import { registerMigrations } from './migrations'
import {
  DATABASE_NAME,
  type AppSettings,
  type Area,
  type Category,
  type Destination,
  type DiagnosticRecord,
  type GuestContact,
  type GuestSession,
  type Journey,
  type LocalMedia,
} from './schema'

export class ExploreSriLankaDB extends Dexie {
  diagnostics!: Table<DiagnosticRecord, string>
  destinations!: Table<Destination, string>
  areas!: Table<Area, string>
  categories!: Table<Category, string>
  media!: Table<LocalMedia, string>
  guests!: Table<GuestContact, string>
  guestSessions!: Table<GuestSession, string>
  journeys!: Table<Journey, string>
  settings!: Table<AppSettings, string>

  constructor() {
    super(DATABASE_NAME)
    registerMigrations(this)
  }
}

let database: ExploreSriLankaDB | null = null

export function getDatabase(): ExploreSriLankaDB {
  if (!database) {
    database = new ExploreSriLankaDB()
  }
  return database
}
