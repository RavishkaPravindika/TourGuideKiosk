import { DestinationCard } from '@/components/destination/DestinationCard'
import { useAppData } from '@/contexts/AppDataContext'
import { useLanguage } from '@/hooks/useLanguage'
import styles from '@/styles/application.module.scss'

export function MyTripPage() {
  const { destinations, session } = useAppData()
  const { t } = useLanguage()
  const selected = destinations.filter((item) => item.published && session?.wishlistIds.includes(item.id))

  return (
    <main className={styles.content}>
      <section className={styles.section}>
        <p className={styles.eyebrow}>{t('discover')}</p>
        <h1 className={styles.pageTitle}>{t('myTrip')}</h1>
      </section>
      {selected.length
        ? <section className={styles.grid}>{selected.map((item) => <DestinationCard key={item.id} destination={item} />)}</section>
        : <p className={styles.notice}>{t('emptyTrip')}</p>}
    </main>
  )
}
