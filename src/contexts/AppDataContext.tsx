import { liveQuery } from 'dexie'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createId, errorText } from '@/utils/runtime'
import { getDatabase } from '@/database/db'
import { seedDatabase } from '@/database/seed'
import type {
  AppSettings,
  Area,
  Category,
  Destination,
  GuestContact,
  GuestSession,
  Journey,
  Language,
  LocalMedia,
  MediaMetadata,
} from '@/database/schema'

interface AppDataValue {
  loading: boolean
  error: string | null
  areas: Area[]
  categories: Category[]
  destinations: Destination[]
  guests: GuestContact[]
  journeys: Journey[]
  media: MediaMetadata[]
  settings: AppSettings | null
  session: GuestSession | null
  beginSession: (language: Language) => Promise<void>
  changeLanguage: (language: Language) => Promise<void>
  setJourney: (journeyId: string | null) => Promise<void>
  toggleWishlist: (destinationId: string) => Promise<void>
  endGuestSession: () => Promise<void>
  markInvitationEligible: () => Promise<void>
  markInvitationShown: () => Promise<void>
  getMedia: (id: string) => Promise<LocalMedia | undefined>
}

const AppDataContext = createContext<AppDataValue | null>(null)

interface Snapshot {
  areas: Area[]
  categories: Category[]
  destinations: Destination[]
  guests: GuestContact[]
  journeys: Journey[]
  media: MediaMetadata[]
  settings: AppSettings | undefined
  sessions: GuestSession[]
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const sessionInitialized = useRef(false)

  useEffect(() => {
    let active = true
    let subscription: { unsubscribe: () => void } | undefined

    void seedDatabase()
      .then(() => {
        if (!active) return
        subscription = liveQuery(async () => {
          const database = getDatabase()
          const [areas, categories, destinations, guests, journeys, mediaRecords, settings, sessions] =
            await Promise.all([
              database.areas.toArray(),
              database.categories.toArray(),
              database.destinations.toArray(),
              database.guests.toArray(),
              database.journeys.toArray(),
              database.media.toArray(),
              database.settings.get('app'),
              database.guestSessions.orderBy('startedAt').toArray(),
            ])
          const media = mediaRecords.map(({ blob: _blob, thumbnailBlob: _thumbnailBlob, ...metadata }) => metadata)
          return { areas, categories, destinations, guests, journeys, media, settings, sessions }
        }).subscribe({
          next: (value) => {
            if (!active) return
            setSnapshot(value)
            setError(null)
            setLoading(false)
          },
          error: (cause: unknown) => {
            if (!active) return
            setError(errorText(cause))
            setLoading(false)
          },
        })
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(errorText(cause))
        setLoading(false)
      })

    return () => {
      active = false
      subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!snapshot) return
    if (!sessionInitialized.current) {
      const activeSession = [...snapshot.sessions].reverse().find((session) => !session.endedAt)
      sessionInitialized.current = true
      setSessionId(activeSession?.id ?? null)
      return
    }
    if (sessionId && !snapshot.sessions.some((session) => session.id === sessionId && !session.endedAt)) {
      setSessionId(null)
    }
  }, [sessionId, snapshot?.sessions])

  useEffect(() => {
    document.documentElement.dataset.theme = snapshot?.settings?.theme ?? 'light'
    document.title = snapshot?.settings?.appName || 'Explore Sri Lanka'
  }, [snapshot?.settings?.appName, snapshot?.settings?.theme])

  const beginSession = useCallback(async (language: Language) => {
    const database = getDatabase()
    const now = new Date().toISOString()
    const id = createId()
    await database.transaction('rw', [database.guestSessions, database.journeys], async () => {
      const activeSessions = await database.guestSessions.filter((session) => !session.endedAt).toArray()
      await Promise.all(activeSessions.map((session) => database.guestSessions.update(session.id, {
        endedAt: now,
        wishlistIds: [],
      })))
      const defaultJourney = await database.journeys.filter((journey) => journey.active).sortBy('sortOrder')
      await database.guestSessions.add({
        id,
        language,
        startedAt: now,
        endedAt: null,
        journeyId: defaultJourney.find((journey) => journey.featured)?.id ?? defaultJourney[0]?.id ?? null,
        wishlistIds: [],
        invitationEligible: false,
        invitationShown: false,
      })
    })
    setSessionId(id)
  }, [])

  const toggleWishlist = useCallback(async (destinationId: string) => {
    if (!sessionId) throw new Error('Start a guest session before saving places.')
    const database = getDatabase()
    const session = await database.guestSessions.get(sessionId)
    if (!session || session.endedAt) throw new Error('The guest session is no longer active.')
    const wishlistIds = session.wishlistIds.includes(destinationId)
      ? session.wishlistIds.filter((id) => id !== destinationId)
      : [...session.wishlistIds, destinationId]
    await database.guestSessions.update(sessionId, { wishlistIds })
  }, [sessionId])

  const changeLanguage = useCallback(async (language: Language) => {
    if (!sessionId) return
    await getDatabase().guestSessions.update(sessionId, { language })
  }, [sessionId])

  const setJourney = useCallback(async (journeyId: string | null) => {
    if (!sessionId) return
    await getDatabase().guestSessions.update(sessionId, { journeyId })
  }, [sessionId])

  const endGuestSession = useCallback(async () => {
    if (!sessionId) return
    await getDatabase().guestSessions.update(sessionId, {
      endedAt: new Date().toISOString(),
      wishlistIds: [],
      invitationEligible: false,
      invitationShown: false,
    })
    setSessionId(null)
  }, [sessionId])

  const markInvitationShown = useCallback(async () => {
    if (!sessionId) return
    await getDatabase().guestSessions.update(sessionId, { invitationShown: true })
  }, [sessionId])

  const markInvitationEligible = useCallback(async () => {
    if (!sessionId) return
    await getDatabase().guestSessions.update(sessionId, { invitationEligible: true })
  }, [sessionId])

  const getMedia = useCallback(async (id: string) => getDatabase().media.get(id), [])

  const session = useMemo(
    () => snapshot?.sessions.find((item) => item.id === sessionId) ?? null,
    [sessionId, snapshot?.sessions],
  )

  const value: AppDataValue = {
    loading,
    error,
    areas: snapshot?.areas ?? [],
    categories: snapshot?.categories ?? [],
    destinations: snapshot?.destinations ?? [],
    guests: snapshot?.guests ?? [],
    journeys: snapshot?.journeys ?? [],
    media: snapshot?.media ?? [],
    settings: snapshot?.settings ?? null,
    session,
    beginSession,
    changeLanguage,
    setJourney,
    toggleWishlist,
    endGuestSession,
    markInvitationEligible,
    markInvitationShown,
    getMedia,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataValue {
  const value = useContext(AppDataContext)
  if (!value) throw new Error('useAppData must be used within AppDataProvider')
  return value
}
