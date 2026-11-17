import { Link } from 'react-router-dom'
import { useAppData } from '@/contexts/AppDataContext'
import { useLanguage } from '@/hooks/useLanguage'
import { formatBytes } from '@/utils/runtime'
import styles from '@/styles/application.module.scss'

export function AdminDashboardPage() {
  const { areas, categories, destinations, guests, media } = useAppData()
  const { t } = useLanguage()
  const published = destinations.filter((item) => item.published).length
  const draft = destinations.length - published
  const mediaBytes = media.reduce((total, item) => total + item.fileSize, 0)
  const cards = [
    { label: t('destinations'), value: destinations.length, href: '/admin/destinations' },
    { label: t('published'), value: published, href: '/admin/destinations' },
    { label: t('saveDraft'), value: draft, href: '/admin/destinations' },
    { label: t('areas'), value: areas.length, href: '/admin/areas' },
    { label: t('categories'), value: categories.length, href: '/admin/categories' },
    { label: t('guests'), value: guests.length, href: '/admin/guests' },
    { label: t('media'), value: formatBytes(mediaBytes), href: '/admin/media' },
  ]

  return (
    <main className={styles.content}>
      <section className={styles.section}>
        <p className={styles.eyebrow}>{t('admin')}</p>
        <h1 className={styles.pageTitle}>{t('dashboard')}</h1>
      </section>
      <section className={styles.grid}>
        {cards.map((card) => (
          <Link className={styles.panel} key={card.label} to={card.href}>
            <p className={styles.muted}>{card.label}</p>
            <strong style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>{card.value}</strong>
          </Link>
        ))}
      </section>
    </main>
  )
}
