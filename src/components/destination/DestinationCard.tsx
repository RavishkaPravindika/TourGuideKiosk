import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '@/contexts/AppDataContext'
import { useLanguage } from '@/hooks/useLanguage'
import type { Destination } from '@/database/schema'
import styles from '@/styles/application.module.scss'

export function LocalMediaThumbnail({ mediaId }: { mediaId: string | null | undefined }) {
  const [url, setUrl] = useState<string | null>(null)
  const { getMedia } = useAppData()

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    setUrl(null)
    if (!mediaId) {
      return () => { active = false }
    }
    void getMedia(mediaId).then((media) => {
      if (!active || !media || media.mediaType !== 'image') return
      objectUrl = URL.createObjectURL(media.thumbnailBlob ?? media.blob)
      setUrl(objectUrl)
    }).catch((cause: unknown) => {
      if (active) console.error('Could not load destination card image', cause)
    })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [getMedia, mediaId])

  return url
    ? <img className={styles.cardImage} src={url} alt="" loading="lazy" />
    : <div className={styles.placeholderImage} aria-hidden="true">✦</div>
}

export function DestinationCard({ destination }: { destination: Destination }) {
  const { areas, categories, session, toggleWishlist } = useAppData()
  const { language, t } = useLanguage()
  const [wishlistError, setWishlistError] = useState(false)
  const translation = destination.translations[language]
  const isSaved = session?.wishlistIds.includes(destination.id) ?? false
  const area = areas.find((item) => item.id === destination.areaId)
  const title = translation?.name.trim() ?? ''
  const description = translation?.shortDescription.trim() ?? ''
  const coverId = destination.galleryMediaIds[0]

  const toggle = async () => {
    setWishlistError(false)
    try {
      await toggleWishlist(destination.id)
    } catch (cause) {
      console.error('Could not update guest trip list', cause)
      setWishlistError(true)
    }
  }

  return (
    <article className={styles.card}>
      <Link to={`/destination/${destination.id}`} aria-label={title || t('missingTranslation')}>
        <LocalMediaThumbnail mediaId={coverId} />
      </Link>
      <div className={styles.cardBody}>
        <p className={styles.eyebrow}>{area?.translations[language] || t('missingTranslation')}</p>
        <h3>{title || t('missingTranslation')}</h3>
        <p className={styles.muted}>{description || t('missingTranslation')}</p>
        <div className={styles.tagRow}>
          {destination.categoryIds.map((id) => {
            const category = categories.find((item) => item.id === id)
            return category
              ? <span className={styles.tag} key={id}>{category.translations[language] || t('missingTranslation')}</span>
              : null
          })}
          {destination.featured ? <span className={styles.tag}>{t('featured')}</span> : null}
        </div>
        <div className={styles.buttonRow}>
          <Link className={`${styles.button} ${styles.buttonPrimary}`} to={`/destination/${destination.id}`}>
            {t('readMore')}
          </Link>
          <button
            className={styles.button}
            type="button"
            disabled={!session}
            onClick={() => void toggle()}
          >
            {isSaved ? t('removeTrip') : t('addTrip')}
          </button>
        </div>
        {wishlistError ? <p className={styles.error} role="alert">{t('wishlistError')}</p> : null}
      </div>
    </article>
  )
}
