import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LocalMediaGallery, LocalMediaPlayer } from '@/components/destination/LocalMediaGallery'
import { useAppData } from '@/contexts/AppDataContext'
import { useLanguage } from '@/hooks/useLanguage'
import styles from '@/styles/application.module.scss'

export function DestinationDetailsPage() {
  const { id } = useParams()
  const [selectedVideo, setSelectedVideo] = useState('')
  const [selectedAudio, setSelectedAudio] = useState('')
  const [wishlistError, setWishlistError] = useState(false)
  const { areas, categories, destinations, media, session, toggleWishlist } = useAppData()
  const { language, t } = useLanguage()
  const destination = destinations.find((item) => item.id === id && item.published)

  if (!destination) {
    return (
      <main className={styles.content}>
        <p className={styles.notice}>{t('noPlaces')}</p>
        <Link className={styles.button} to="/discover">{t('back')}</Link>
      </main>
    )
  }

  const text = destination.translations[language]
  const area = areas.find((item) => item.id === destination.areaId)
  const photos = destination.galleryMediaIds
  const videos = destination.videoMediaIds
  const audios = destination.audioMediaIds.filter((mediaId) => {
    const item = media.find((candidate) => candidate.id === mediaId)
    return !item || item.language === null || item.language === language
  })
  const videoId = videos.includes(selectedVideo) ? selectedVideo : videos[0]
  const audioId = audios.includes(selectedAudio) ? selectedAudio : audios[0]
  const nearby = destination.nearbyDestinationIds
    .map((nearbyId) => destinations.find((item) => item.id === nearbyId && item.published))
    .filter((item) => item !== undefined)
  const isSaved = session?.wishlistIds.includes(destination.id) ?? false
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
    <main className={styles.content}>
      <section className={styles.section}>
        <Link className={styles.button} to="/discover">{t('back')}</Link>
        <p className={styles.eyebrow}>{area?.translations[language] || t('missingTranslation')}</p>
        <h1 className={styles.pageTitle}>{text.name || t('missingTranslation')}</h1>
        <p className={styles.subtitle}>{text.shortDescription || t('missingTranslation')}</p>
        <div className={styles.tagRow}>
          {destination.categoryIds.map((categoryId) => {
            const category = categories.find((item) => item.id === categoryId)
            return category ? <span className={styles.tag} key={categoryId}>{category.translations[language] || t('missingTranslation')}</span> : null
          })}
        </div>
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          type="button"
          disabled={!session}
          onClick={() => void toggle()}
        >
          {isSaved ? t('removeTrip') : t('addTrip')}
        </button>
        {wishlistError ? <p className={styles.error} role="alert">{t('wishlistError')}</p> : null}
      </section>

      <section className={styles.section}>
        <h2>{t('history')}</h2>
        <p className={styles.subtitle}>{text.historicalBackground || text.description || t('missingTranslation')}</p>
      </section>

      <section className={styles.section}>
        <h2>{t('facts')}</h2>
        {text.facts.length ? (
          <div className={styles.grid}>
            {text.facts.map((fact) => (
              <article className={styles.panel} key={fact.id}>
                <h3>{fact.label || t('missingTranslation')}</h3>
                <p>{fact.value || t('missingTranslation')}</p>
              </article>
            ))}
          </div>
        ) : <p className={styles.muted}>{t('missingTranslation')}</p>}
      </section>

      <section className={styles.section}>
        <h2>{t('highlights')}</h2>
        {text.highlights.length
          ? <ul>{text.highlights.map((highlight, index) => <li key={`${index}-${highlight}`}>{highlight}</li>)}</ul>
          : <p className={styles.muted}>{t('missingTranslation')}</p>}
      </section>

      <section className={styles.section}>
        <h2>{t('gallery')}</h2>
        <LocalMediaGallery items={photos} />
      </section>

      {videos.length ? (
        <section className={styles.section}>
          <h2>{t('videos')}</h2>
          <p>{text.videoDescription || t('missingTranslation')}</p>
          {videos.length > 1 ? (
            <label className={styles.field}>{t('videos')}
              <select className={styles.select} value={videoId} onChange={(event) => setSelectedVideo(event.target.value)}>
                {videos.map((mediaId) => <option key={mediaId} value={mediaId}>{media.find((item) => item.id === mediaId)?.fileName || mediaId}</option>)}
              </select>
            </label>
          ) : null}
          {videoId ? <LocalMediaPlayer key={videoId} mediaId={videoId} label={text.name} /> : null}
        </section>
      ) : null}

      {audios.length ? (
        <section className={styles.section}>
          <h2>{t('audio')}</h2>
          {audios.length > 1 ? (
            <label className={styles.field}>{t('audio')}
              <select className={styles.select} value={audioId} onChange={(event) => setSelectedAudio(event.target.value)}>
                {audios.map((mediaId) => <option key={mediaId} value={mediaId}>{media.find((item) => item.id === mediaId)?.fileName || mediaId}</option>)}
              </select>
            </label>
          ) : null}
          {audioId ? <LocalMediaPlayer key={audioId} mediaId={audioId} label={text.name} /> : null}
        </section>
      ) : null}

      <section className={styles.section}>
        <h2>{t('visitorInfo')}</h2>
        <div className={styles.grid}>
          <article className={styles.panel}><h3>{t('dressCode')}</h3><p>{text.dressCode || t('missingTranslation')}</p></article>
          <article className={styles.panel}><h3>{t('etiquette')}</h3><p>{text.etiquette || t('missingTranslation')}</p></article>
          <article className={styles.panel}><h3>{t('bestTime')}</h3><p>{text.bestTime || t('missingTranslation')}</p></article>
          <article className={styles.panel}><h3>{t('visitorInfo')}</h3><p>{text.accessibility || t('missingTranslation')}</p></article>
        </div>
      </section>

      {nearby.length ? (
        <section className={styles.section}>
          <h2>{t('nearby')}</h2>
          <div className={styles.grid}>
            {nearby.map((item) => (
              <Link className={styles.card} key={item.id} to={`/destination/${item.id}`}>
                <div className={styles.cardBody}>
                  <h3>{item.translations[language].name || t('missingTranslation')}</h3>
                  <p>{item.translations[language].shortDescription || t('missingTranslation')}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {destination.lastVerifiedAt ? <p className={styles.muted}>{t('verified')}: {new Date(destination.lastVerifiedAt).toLocaleDateString(language)}</p> : null}
    </main>
  )
}
