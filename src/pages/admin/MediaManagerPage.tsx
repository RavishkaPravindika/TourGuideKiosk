import { useState, type ChangeEvent } from 'react'
import { getDatabase } from '@/database/db'
import { LANGUAGES, type Language, type LocalMedia, type MediaMetadata } from '@/database/schema'
import { useAppData } from '@/contexts/AppDataContext'
import { useLanguage } from '@/hooks/useLanguage'
import { createId, errorText, formatBytes } from '@/utils/runtime'
import styles from '@/styles/application.module.scss'

const IMAGE_LIMIT_MB = 35
const AUDIO_LIMIT_MB = 60

async function createThumbnail(file: File): Promise<Blob | null> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = objectUrl
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('The image could not be decoded for a thumbnail.'))
    })
    const scale = Math.min(1, 640 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable for image thumbnail generation.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function mediaTypeFor(file: File): LocalMedia['mediaType'] | null {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'image'
  if (['video/mp4', 'video/webm'].includes(file.type)) return 'video'
  if (['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/ogg', 'audio/webm'].includes(file.type)) return 'audio'
  return null
}

export function MediaManagerPage() {
  const { destinations, media, settings } = useAppData()
  const { language, t } = useLanguage()
  const [destinationId, setDestinationId] = useState('')
  const [audioLanguage, setAudioLanguage] = useState<Language>('en')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const totalSize = media.reduce((sum, item) => sum + item.fileSize, 0)

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setError(null)
    setNotice(null)
    if (!file) return
    const mediaType = mediaTypeFor(file)
    if (!mediaType) {
      setError('Use a JPG, PNG, WebP, MP4, WebM or supported audio file.')
      return
    }
    const maxMb = mediaType === 'video' ? (settings?.maxVideoSizeMb ?? 150)
      : mediaType === 'audio' ? AUDIO_LIMIT_MB : IMAGE_LIMIT_MB
    if (file.size > maxMb * 1024 * 1024) {
      setError(`${t('mediaLimit')} Maximum: ${maxMb} MB.`)
      return
    }
    let thumbnailBlob: Blob | null = null
    if (mediaType === 'image') {
      try {
        thumbnailBlob = await createThumbnail(file)
      } catch (cause) {
        setError(`Thumbnail generation failed: ${errorText(cause)}`)
        return
      }
    }
    const record: LocalMedia = {
      id: createId(),
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      blob: file.slice(0, file.size, file.type),
      thumbnailBlob,
      mediaType,
      language: mediaType === 'audio' ? audioLanguage : null,
      destinationId: destinationId || null,
      createdAt: new Date().toISOString(),
    }
    try {
      const database = getDatabase()
      await database.transaction('rw', database.media, database.destinations, async () => {
        await database.media.add(record)
        if (destinationId) {
          const destination = await database.destinations.get(destinationId)
          if (!destination) throw new Error('The selected destination no longer exists.')
          const updated = { ...destination, updatedAt: new Date().toISOString() }
          if (mediaType === 'image') updated.galleryMediaIds = [...destination.galleryMediaIds, record.id]
          else if (mediaType === 'video') updated.videoMediaIds = [...destination.videoMediaIds, record.id]
          else updated.audioMediaIds = [...destination.audioMediaIds, record.id]
          await database.destinations.put(updated)
        }
      })
      setNotice(`${file.name} ${t('save')}`)
    } catch (cause) {
      setError(errorText(cause))
    }
  }

  const remove = async (item: Pick<MediaMetadata, 'id' | 'destinationId'>) => {
    if (!window.confirm(t('confirmDelete'))) return
    try {
      const database = getDatabase()
      await database.transaction('rw', database.media, database.destinations, async () => {
        if (item.destinationId) {
          const destination = await database.destinations.get(item.destinationId)
          if (destination) {
            await database.destinations.put({
              ...destination,
              galleryMediaIds: destination.galleryMediaIds.filter((id) => id !== item.id),
              videoMediaIds: destination.videoMediaIds.filter((id) => id !== item.id),
              audioMediaIds: destination.audioMediaIds.filter((id) => id !== item.id),
              updatedAt: new Date().toISOString(),
            })
          }
        }
        await database.media.delete(item.id)
      })
    } catch (cause) {
      setError(errorText(cause))
    }
  }

  return (
    <main className={styles.content}>
      <section className={styles.section}>
        <h1 className={styles.pageTitle}>{t('media')}</h1>
        <p className={styles.muted}>Stored on this tablet: {formatBytes(totalSize)} across {media.length} files.</p>
        <p className={styles.notice}>Large videos use tablet storage. Keep a verified backup and allow time for imports to finish.</p>
      </section>
      <section className={`${styles.panel} ${styles.form}`}>
        <label className={styles.field}>{t('destinations')}
          <select className={styles.select} value={destinationId} onChange={(event) => setDestinationId(event.target.value)}>
            <option value="">Media library only</option>
            {destinations.map((destination) => <option key={destination.id} value={destination.id}>{destination.translations[language].name || destination.translations.en.name || destination.id}</option>)}
          </select>
        </label>
        <label className={styles.field}>{t('audio')} · {t('language')}
          <select className={styles.select} value={audioLanguage} onChange={(event) => setAudioLanguage(event.target.value as Language)}>
            {LANGUAGES.map((code) => <option key={code} value={code}>{code.toUpperCase()}</option>)}
          </select>
        </label>
        <label className={styles.field}>{t('importMedia')}
          <input className={styles.input} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,audio/*" onChange={(event) => void importFile(event)} />
        </label>
      </section>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      <section className={`${styles.section} ${styles.grid}`}>
        {media.map((item) => (
          <article className={styles.panel} key={item.id}>
            <p className={styles.eyebrow}>{item.mediaType}</p>
            <h2>{item.fileName}</h2>
            <p className={styles.muted}>{formatBytes(item.fileSize)} · {item.mimeType}</p>
            <p className={styles.muted}>{item.destinationId ? destinations.find((destination) => destination.id === item.destinationId)?.translations[language].name : 'Not assigned'}</p>
            <button className={`${styles.button} ${styles.buttonDanger}`} type="button" onClick={() => void remove(item)}>{t('delete')}</button>
          </article>
        ))}
      </section>
    </main>
  )
}
