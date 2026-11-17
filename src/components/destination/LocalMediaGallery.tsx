import { useEffect, useState } from 'react'
import { useAppData } from '@/contexts/AppDataContext'
import type { LocalMedia } from '@/database/schema'
import { useLanguage } from '@/hooks/useLanguage'
import styles from '@/styles/application.module.scss'

function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [blob])
  return url
}

export function LocalMediaGallery({ items }: { items: string[] }) {
  const { getMedia } = useAppData()
  const { t } = useLanguage()
  const [current, setCurrent] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [image, setImage] = useState<LocalMedia | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    setCurrent(0)
    setExpanded(false)
  }, [items])

  useEffect(() => {
    let active = true
    const mediaId = items[current]
    setImage(null)
    setLoadError(false)
    if (!mediaId) return () => { active = false }
    void getMedia(mediaId).then((value) => {
      if (active && value?.mediaType === 'image') setImage(value)
    }).catch((cause: unknown) => {
      if (active) {
        console.error('Could not load gallery image', cause)
        setLoadError(true)
      }
    })
    return () => { active = false }
  }, [current, getMedia, items])

  const url = useObjectUrl(image?.blob)

  if (!items.length) return <p className={styles.muted}>{t('missingTranslation')}</p>
  if (loadError) return <p className={styles.error}>{t('mediaLoadError')}</p>
  if (!image) return <p className={styles.muted}>{t('loadingMedia')}</p>

  const previous = () => setCurrent((index) => (index - 1 + items.length) % items.length)
  const next = () => setCurrent((index) => (index + 1) % items.length)

  return (
    <>
      <div className={styles.stack}>
        {url ? (
          <button type="button" className={styles.button} onClick={() => setExpanded(true)} aria-label={image.fileName}>
            <img className={styles.cardImage} src={url} alt={image.fileName} />
          </button>
        ) : null}
        <div className={styles.buttonRow}>
          <button className={styles.button} type="button" onClick={previous}>{t('back')}</button>
          <span>{current + 1} / {items.length}</span>
          <button className={styles.button} type="button" onClick={next}>{t('viewAll')}</button>
        </div>
      </div>
      {expanded && url ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label={image.fileName} onClick={() => setExpanded(false)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <img className={styles.cardImage} src={url} alt={image.fileName} />
            <p>{image.fileName}</p>
            <div className={styles.buttonRow}>
              <button className={styles.button} type="button" onClick={previous}>{t('back')}</button>
              <button className={styles.button} type="button" onClick={() => setExpanded(false)}>{t('continue')}</button>
              <button className={styles.button} type="button" onClick={next}>{t('viewAll')}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export function LocalMediaPlayer({ mediaId, label }: { mediaId: string; label: string }) {
  const { getMedia } = useAppData()
  const { t } = useLanguage()
  const [media, setMedia] = useState<LocalMedia | null>(null)
  const url = useObjectUrl(media?.blob)
  const [failed, setFailed] = useState(false)
  const type = media?.mediaType
  useEffect(() => {
    let active = true
    setMedia(null)
    setFailed(false)
    void getMedia(mediaId).then((value) => {
      if (active) setMedia(value ?? null)
    }).catch((cause: unknown) => {
      if (active) {
        console.error('Could not load destination media', cause)
        setFailed(true)
      }
    })
    return () => { active = false }
  }, [getMedia, mediaId])
  if (!media || !url) return failed ? <p className={styles.error}>{t('mediaLoadError')}</p> : null
  if (failed) return <p className={styles.error}>{t('mediaPlaybackError')}</p>
  if (type === 'video') {
    return (
      <div className={styles.stack}>
        <video className={styles.cardImage} controls playsInline preload="metadata" src={url} onError={() => setFailed(true)}>
          {label}
        </video>
      </div>
    )
  }
  if (type === 'audio') {
    return <audio controls preload="metadata" src={url} onError={() => setFailed(true)}>{label}</audio>
  }
  return null
}
