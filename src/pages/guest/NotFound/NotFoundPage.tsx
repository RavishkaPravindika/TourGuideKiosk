import { Link } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'
import styles from './NotFoundPage.module.scss'

export function NotFoundPage() {
  const { t } = useLanguage()
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>{t('appName')}</p>
      <h1>{t('notFoundHeading')}</h1>
      <Link className={styles.link} to="/">
        {t('returnWelcome')}
      </Link>
    </main>
  )
}
