import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '@/components/common/BrandMark'
import { useAppData } from '@/contexts/AppDataContext'
import { useLanguage } from '@/hooks/useLanguage'
import { languageNames } from '@/data/uiTranslations'
import type { Language } from '@/database/schema'
import styles from '@/styles/application.module.scss'

const languages: Language[] = ['en', 'de', 'ru', 'ja']

export function GuestLayout() {
  const navigate = useNavigate()
  const { changeLanguage, error, loading, markInvitationEligible, markInvitationShown, session, settings } = useAppData()
  const { language, t } = useLanguage()
  const location = useLocation()
  const [showInvitation, setShowInvitation] = useState(false)
  const [invitationError, setInvitationError] = useState<string | null>(null)
  const [languageError, setLanguageError] = useState(false)

  useEffect(() => {
    if (!session || session.endedAt || session.invitationShown) return
    const delay = (settings?.invitationDelayMinutes ?? 5) * 60_000
    const eligible = session.invitationEligible || Date.now() - new Date(session.startedAt).getTime() >= delay
    if (!eligible) return

    void (async () => {
      try {
        if (!session.invitationEligible) await markInvitationEligible()
        if (location.pathname === '/discover') {
          await markInvitationShown()
          setShowInvitation(true)
        }
      } catch (cause) {
        console.error('Could not update contact invitation state', cause)
        setInvitationError(t('invitationError'))
      }
    })()
  }, [location.pathname, markInvitationEligible, markInvitationShown, session, settings?.invitationDelayMinutes, t])

  return (
    <div className={styles.guestShell}>
      <header className={styles.topbar}>
        <BrandMark appName={settings?.appName} onAdminGesture={() => navigate('/admin/login')} />
        <nav className={styles.nav} aria-label="Main navigation">
          <NavLink className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`} to="/discover">{t('discover')}</NavLink>
          <NavLink className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`} to="/areas">{t('areas')}</NavLink>
          <NavLink className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`} to="/categories">{t('categories')}</NavLink>
          <NavLink className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`} to="/my-trip">{t('myTrip')}</NavLink>
          <NavLink className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`} to="/contact">{t('contact')}</NavLink>
        </nav>
        <div className={styles.topActions}>
          <label className="sr-only" htmlFor="guest-language">{t('language')}</label>
          <select
            className={styles.select}
            id="guest-language"
            value={language}
            onChange={(event) => {
              const next = event.target.value as Language
              setLanguageError(false)
              void changeLanguage(next).catch((cause: unknown) => {
                console.error('Could not change guest language', cause)
                setLanguageError(true)
              })
            }}
          >
            {languages.map((code) => <option key={code} value={code}>{languageNames[code]}</option>)}
          </select>
        </div>
      </header>
      {loading ? <p className={styles.notice} role="status">{t('loadingData')}</p> : null}
      {error ? <p className={styles.error} role="alert">{t('dataUnavailable')}</p> : null}
      {languageError ? <p className={styles.error} role="alert">{t('languageChangeError')}</p> : null}
      <Outlet />
      {showInvitation ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="contact-invitation-title">
          <div className={styles.modal}>
            <p className={styles.eyebrow}>{t('contact')}</p>
            <h2 id="contact-invitation-title">{t('contactTitle')}</h2>
            <p>{t('contactIntro')}</p>
            <div className={styles.buttonRow}>
              <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={() => {
                setShowInvitation(false)
                navigate('/contact')
              }}>{t('contact')}</button>
              <button className={styles.button} type="button" onClick={() => setShowInvitation(false)}>{t('maybeLater')}</button>
            </div>
          </div>
        </div>
      ) : null}
      {invitationError ? <p className={styles.error} role="alert">{invitationError}</p> : null}
    </div>
  )
}
