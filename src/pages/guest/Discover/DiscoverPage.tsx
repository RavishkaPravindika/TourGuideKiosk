import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DestinationCard, LocalMediaThumbnail } from '@/components/destination/DestinationCard'
import { useAppData } from '@/contexts/AppDataContext'
import { useLanguage } from '@/hooks/useLanguage'
import styles from '@/styles/application.module.scss'

export function DiscoverPage() {
  const { areas, categories, destinations, journeys, session, setJourney } = useAppData()
  const { language, t } = useLanguage()
  const [query, setQuery] = useState('')
  const [journeyError, setJourneyError] = useState(false)

  const published = destinations
    .filter((destination) => destination.published)
    .sort((left, right) => left.sortOrder - right.sortOrder)
  const journey = journeys.find((item) => item.id === session?.journeyId)
  const journeyDestinations = journey
    ? journey.destinationIds.map((id) => published.find((item) => item.id === id)).filter((item) => item !== undefined)
    : []

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return []
    return published.filter((destination) => {
      const translations = Object.values(destination.translations)
      const area = areas.find((item) => item.id === destination.areaId)
      const matchingText = [
        ...translations.flatMap((item) => [item.name, item.shortDescription, item.description]),
        ...destination.keywords,
        ...destination.alternateNames,
        ...(area ? Object.values(area.translations) : []),
        ...destination.categoryIds.flatMap((id) => {
          const category = categories.find((item) => item.id === id)
          return category ? Object.values(category.translations) : []
        }),
      ]
      return matchingText.some((value) => value.toLocaleLowerCase().includes(needle))
    })
  }, [areas, categories, published, query])

  const featured = published.filter((destination) => destination.featured)

  return (
    <main className={styles.content}>
      <section className={styles.section}>
        <p className={styles.eyebrow}>{t('appName')}</p>
        <h1 className={styles.pageTitle}>{t('popular')}</h1>
        <div className={styles.toolbar}>
          <label className={styles.srOnly} htmlFor="place-search">{t('search')}</label>
          <input
            className={styles.input}
            id="place-search"
            type="search"
            placeholder={t('search')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {session ? (
            <label className={styles.srOnly} htmlFor="journey-select">{t('chooseJourney')}</label>
          ) : null}
          {session ? (
            <select
              className={styles.select}
              id="journey-select"
              value={session.journeyId ?? ''}
              onChange={(event) => {
                setJourneyError(false)
                void setJourney(event.target.value || null).catch((cause: unknown) => {
                  console.error('Could not update guest journey', cause)
                  setJourneyError(true)
                })
              }}
            >
              <option value="">{t('chooseJourney')}</option>
              {journeys.filter((item) => item.active).sort((a, b) => a.sortOrder - b.sortOrder).map((item) => (
                <option key={item.id} value={item.id}>{item.name[language] || t('missingTranslation')}</option>
              ))}
            </select>
          ) : null}
          {journeyError ? <p className={styles.error} role="alert">{t('dataUnavailable')}</p> : null}
        </div>
      </section>

      {query.trim() ? (
        <section className={styles.section}>
          <div className={styles.sectionHeading}><h2>{t('search')}</h2></div>
          {results.length ? <div className={styles.grid}>{results.map((item) => <DestinationCard key={item.id} destination={item} />)}</div> : <p className={styles.notice}>{t('noResults')}</p>}
        </section>
      ) : (
        <>
          {journey ? (
            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <h2>{t('journey')}: {journey.name[language] || t('missingTranslation')}</h2>
                <Link className={styles.button} to="/areas">{t('viewAll')}</Link>
              </div>
              {journeyDestinations.length
                ? <div className={styles.grid}>{journeyDestinations.map((item) => <DestinationCard key={item.id} destination={item} />)}</div>
                : <p className={styles.notice}>{t('noPlaces')}</p>}
            </section>
          ) : null}

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <h2>{t('featured')}</h2>
              <Link className={styles.button} to="/categories">{t('viewAll')}</Link>
            </div>
            {featured.length
              ? <div className={styles.grid}>{featured.map((item) => <DestinationCard key={item.id} destination={item} />)}</div>
              : <p className={styles.notice}>{t('noPlaces')}</p>}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}><h2>{t('areas')}</h2></div>
            <div className={styles.grid}>
              {areas.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((area) => {
                const count = published.filter((item) => item.areaId === area.id).length
                return (
                  <Link className={styles.card} key={area.id} to={`/areas?area=${encodeURIComponent(area.id)}`}>
                    <LocalMediaThumbnail mediaId={area.imageMediaId} />
                    <div className={styles.cardBody}>
                      <h3>{area.translations[language] || t('missingTranslation')}</h3>
                      <p className={styles.muted}>{area.descriptions[language] || t('missingTranslation')}</p>
                      <span className={styles.tag}>{count} {t('countPlaces')}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
