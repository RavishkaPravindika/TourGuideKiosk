import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandMark } from '@/components/common/BrandMark'
import { HeritageScene } from '@/components/common/HeritageScene'
import { WarningBanner } from '@/components/common/WarningBanner'
import { useAppData } from '@/contexts/AppDataContext'
import { languageNames, translate } from '@/data/uiTranslations'
import { useDiagnostics } from '@/hooks/useDiagnostics'
import type { Language } from '@/database/schema'
import styles from '@/styles/application.module.scss'

const languages: Language[] = ['en', 'de', 'ru', 'ja']

export function WelcomePage() {
  const navigate = useNavigate()
  const { beginSession, error: dataError, settings } = useAppData()
  const { report, running, runError } = useDiagnostics()
  const [actionError, setActionError] = useState<string | null>(null)
  const showDatabaseWarning = Boolean(dataError || runError) || Boolean(report && !report.databaseReady)

  const start = async (language: Language) => {
    setActionError(null)
    try {
      await beginSession(language)
      navigate('/discover')
    } catch (error) {
      console.error('Could not start guest session', error)
      setActionError(translate(language, 'sessionStartError'))
    }
  }

  return (
    <main className={styles.content}>
      <header className={styles.topActions}>
        <BrandMark appName={settings?.appName} onAdminGesture={() => navigate('/admin/login')} />
      </header>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Welcome to Sri Lanka</p>
          <h1 className={styles.title}>{translate('en', 'welcome')}</h1>
          <p className={styles.subtitle}>{translate('en', 'tagline')}</p>
          <p className={styles.muted}>{translate('en', 'welcomeText')}</p>
          <h2>{translate('en', 'chooseLanguage')}</h2>
          <div className={styles.buttonRow}>
            {languages.map((language) => (
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                key={language}
                type="button"
                onClick={() => void start(language)}
              >
                {languageNames[language]}
              </button>
            ))}
          </div>
          {actionError ? <p className={styles.error} role="alert">{actionError}</p> : null}
          {running ? <p className={styles.muted} role="status">Checking local storage on this tablet…</p> : null}
        </div>
        <div className={styles.heroArt}><HeritageScene /></div>
      </section>
      {showDatabaseWarning ? (
        <WarningBanner title="Local storage is not available">
          <p>The on-device database could not be confirmed. Guest data will not be stored in temporary memory.</p>
          {dataError ? <p>Please ask your guide to open the administrator diagnostics screen.</p> : null}
          {report?.criticalFailure ? <p>{report.criticalFailure}</p> : null}
          {runError ? <p>The local storage check could not be completed. Ask your guide to check diagnostics before using saved features.</p> : null}
        </WarningBanner>
      ) : null}
    </main>
  )
}
