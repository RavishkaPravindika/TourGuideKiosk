import { useEffect, useState, type FormEvent } from 'react'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { useNavigate } from 'react-router-dom'
import { getDatabase } from '@/database/db'
import { LANGUAGES, type Language } from '@/database/schema'
import { useAppData } from '@/contexts/AppDataContext'
import { languageNames } from '@/data/uiTranslations'
import { useLanguage } from '@/hooks/useLanguage'
import { errorText } from '@/utils/runtime'
import styles from '@/styles/application.module.scss'

export function AdminSettingsPage() {
  const navigate = useNavigate()
  const { settings, session, endGuestSession } = useAppData()
  const { t } = useLanguage()
  const [appName, setAppName] = useState('')
  const [guideNumber, setGuideNumber] = useState('')
  const [delay, setDelay] = useState(5)
  const [maxVideoSize, setMaxVideoSize] = useState(150)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [defaultLanguage, setDefaultLanguage] = useState<Language>('en')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!settings) return
    setAppName(settings.appName)
    setGuideNumber(settings.guideWhatsAppNumber)
    setDelay(settings.invitationDelayMinutes)
    setMaxVideoSize(settings.maxVideoSizeMb)
    setTheme(settings.theme)
    setDefaultLanguage(settings.defaultLanguage)
  }, [settings])

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    if (guideNumber.trim() && !parsePhoneNumberFromString(guideNumber)?.isValid()) {
      setError('Enter the guide number in valid international format, for example +94771234567.')
      return
    }
    if (!Number.isInteger(delay) || delay < 1 || delay > 120 || !Number.isInteger(maxVideoSize) || maxVideoSize < 1 || maxVideoSize > 2048) {
      setError('Check that the invitation delay is 1–120 minutes and video limit is 1–2048 MB.')
      return
    }
    try {
      await getDatabase().settings.update('app', {
        appName: appName.trim() || 'Explore Sri Lanka',
        guideWhatsAppNumber: guideNumber.trim(),
        invitationDelayMinutes: delay,
        maxVideoSizeMb: maxVideoSize,
        theme,
        defaultLanguage,
      })
      setNotice(t('settingsSaved'))
    } catch (cause) {
      setError(errorText(cause))
    }
  }

  const finishSession = async () => {
    if (!session) return
    if (!window.confirm(t('endSessionConfirm'))) return
    try {
      await endGuestSession()
      navigate('/', { replace: true })
    } catch (cause) {
      setError(errorText(cause))
    }
  }

  return (
    <main className={styles.content}>
      <section className={styles.section}>
        <h1 className={styles.pageTitle}>{t('settings')}</h1>
      </section>
      <form className={`${styles.panel} ${styles.form}`} onSubmit={(event) => void save(event)}>
        <label className={styles.field}>{t('appName')}<input className={styles.input} value={appName} onChange={(event) => setAppName(event.target.value)} /></label>
        <label className={styles.field}>{t('guideNumber')}<input className={styles.input} type="tel" inputMode="tel" value={guideNumber} onChange={(event) => setGuideNumber(event.target.value)} /></label>
        <label className={styles.field}>{t('invitationDelay')}<input className={styles.input} type="number" min={1} max={120} value={delay} onChange={(event) => setDelay(Number(event.target.value))} /></label>
        <label className={styles.field}>{t('maxVideoSize')}<input className={styles.input} type="number" min={1} max={2048} value={maxVideoSize} onChange={(event) => setMaxVideoSize(Number(event.target.value))} /></label>
        <label className={styles.field}>Theme
          <select className={styles.select} value={theme} onChange={(event) => setTheme(event.target.value as 'light' | 'dark')}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className={styles.field}>{t('defaultLanguage')}
          <select className={styles.select} value={defaultLanguage} onChange={(event) => setDefaultLanguage(event.target.value as Language)}>
            {LANGUAGES.map((code) => <option key={code} value={code}>{languageNames[code]}</option>)}
          </select>
        </label>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
        <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit">{t('save')}</button>
      </form>

      <section className={`${styles.section} ${styles.panel} ${styles.stack}`}>
        <h2>{t('endSession')}</h2>
        <p className={styles.muted}>{t('sessionResetDescription')}</p>
        <button className={`${styles.button} ${styles.buttonDanger}`} disabled={!session} type="button" onClick={() => void finishSession()}>{t('endSession')}</button>
      </section>
    </main>
  )
}
