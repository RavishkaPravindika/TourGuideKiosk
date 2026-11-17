import { Link, useSearchParams } from 'react-router-dom'
import { DestinationCard, LocalMediaThumbnail } from '@/components/destination/DestinationCard'
import { useAppData } from '@/contexts/AppDataContext'
import { useLanguage } from '@/hooks/useLanguage'
import styles from '@/styles/application.module.scss'

export function ExplorePage({ type }: { type: 'area' | 'category' }) {
  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get(type)
  const { areas, categories, destinations } = useAppData()
  const { language, t } = useLanguage()
  const selectedArea = areas.find((area) => area.id === selectedId)
  const selectedCategory = categories.find((category) => category.id === selectedId)
  const selectedName = type === 'area' ? selectedArea?.translations[language] : selectedCategory?.translations[language]
  const filtered = destinations
    .filter((destination) => destination.published)
    .filter((destination) => {
      if (!selectedId) return true
      return type === 'area'
        ? destination.areaId === selectedId
        : destination.categoryIds.includes(selectedId)
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const items = type === 'area' ? areas : categories

  return (
    <main className={styles.content}>
      <section className={styles.section}>
        <p className={styles.eyebrow}>{t('discover')}</p>
        <h1 className={styles.pageTitle}>{selectedName || (type === 'area' ? t('areas') : t('categories'))}</h1>
        {selectedId ? <Link className={styles.button} to={type === 'area' ? '/areas' : '/categories'}>{t('back')}</Link> : null}
      </section>
      {!selectedId ? (
        <section className={styles.grid}>
          {items.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((item) => {
            const name = item.translations[language]
            const description = item.descriptions[language]
            const count = destinations.filter((destination) => destination.published && (
              type === 'area'
                ? destination.areaId === item.id
                : destination.categoryIds.includes(item.id)
            )).length
            return (
              <Link
                className={styles.card}
                key={item.id}
                to={`/${type === 'area' ? 'areas' : 'categories'}?${type}=${encodeURIComponent(item.id)}`}
              >
                <LocalMediaThumbnail mediaId={item.imageMediaId} />
                <div className={styles.cardBody}>
                  <p className={styles.eyebrow}>{type === 'area' ? t('areas') : t('categories')}</p>
                  <h2>{name || t('missingTranslation')}</h2>
                  <p className={styles.muted}>{description || t('missingTranslation')}</p>
                  <span className={styles.tag}>{count} {t('countPlaces')}</span>
                </div>
              </Link>
            )
          })}
        </section>
      ) : filtered.length ? (
        <section className={styles.grid}>{filtered.map((destination) => <DestinationCard key={destination.id} destination={destination} />)}</section>
      ) : (
        <p className={styles.notice}>{t('noPlaces')}</p>
      )}
    </main>
  )
}
