import { useEffect } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BrandMark } from '@/components/common/BrandMark'
import { useAppData } from '@/contexts/AppDataContext'
import { useLanguage } from '@/hooks/useLanguage'
import { isAdminUnlocked, lockAdmin } from '@/services/auth/adminPin'
import styles from '@/styles/application.module.scss'

const SESSION_TIMEOUT_MS = 15 * 60 * 1000

export function AdminLayout() {
  const navigate = useNavigate()
  const { error, loading, settings } = useAppData()
  const { t } = useLanguage()
  const unlocked = isAdminUnlocked()

  useEffect(() => {
    if (!unlocked) return
    let timer = 0
    const expire = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        lockAdmin()
        navigate('/admin/login', { replace: true })
      }, SESSION_TIMEOUT_MS)
    }
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart']
    events.forEach((name) => window.addEventListener(name, expire, { passive: true }))
    expire()
    return () => {
      window.clearTimeout(timer)
      events.forEach((name) => window.removeEventListener(name, expire))
    }
  }, [navigate, unlocked])

  if (!unlocked) return <Navigate to="/admin/login" replace />

  const links = [
    ['/admin/dashboard', t('dashboard')],
    ['/admin/destinations', t('destinations')],
    ['/admin/areas', t('areas')],
    ['/admin/categories', t('categories')],
    ['/admin/journeys', t('journeys')],
    ['/admin/guests', t('guests')],
    ['/admin/media', t('media')],
    ['/admin/settings', t('settings')],
    ['/admin/diagnostics', t('diagnostics')],
    ['/admin/backup', t('backup')],
  ] as const

  const logout = () => {
    lockAdmin()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className={styles.adminLayout}>
      <header className={styles.adminHeader}>
        <BrandMark appName={settings?.appName} />
        <button className={`${styles.button} ${styles.buttonQuiet}`} type="button" onClick={logout}>{t('logout')}</button>
      </header>
      <nav className={styles.adminNav} aria-label="Administrator navigation">
        {links.map(([to, label]) => (
          <NavLink
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            key={to}
            to={to}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      {loading ? <p className={styles.notice} role="status">{t('loadingData')}</p> : null}
      {error ? <div className={styles.content}>
        <p className={styles.error} role="alert">{t('dataUnavailable')}</p>
        <details><summary>Technical details</summary><pre>{error}</pre></details>
      </div> : null}
      <Outlet />
    </div>
  )
}
