import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppData } from '@/contexts/AppDataContext'
import { useLanguage } from '@/hooks/useLanguage'
import { createAdminPin, isAdminUnlocked, verifyAdminPin } from '@/services/auth/adminPin'
import { errorText } from '@/utils/runtime'
import styles from '@/styles/application.module.scss'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { loading, settings, error: dataError } = useAppData()
  const { t } = useLanguage()
  const [pin, setPin] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const isSetup = Boolean(settings && !settings.adminVerifier)

  useEffect(() => {
    if (isAdminUnlocked()) navigate('/admin/dashboard', { replace: true })
  }, [navigate])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (isSetup && pin !== confirmation) {
      setError(t('pinMismatch'))
      return
    }
    setBusy(true)
    try {
      if (isSetup) await createAdminPin(pin)
      else await verifyAdminPin(pin)
      navigate('/admin/dashboard', { replace: true })
    } catch (cause) {
      setError(errorText(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.content}>
      {loading || !settings ? (
        <section className={styles.panel}>
          <p className={styles.notice}>{dataError
            ? 'Local application data could not be opened. No temporary storage is being used. Check device diagnostics or reopen the app.'
            : 'Opening local application data…'}</p>
          {dataError ? <details><summary>Technical details</summary><pre>{dataError}</pre></details> : null}
          {dataError ? <button className={styles.button} type="button" onClick={() => window.location.reload()}>Retry</button> : null}
        </section>
      ) : null}
      {!loading && settings ? (
      <section className={`${styles.panel} ${styles.form}`} style={{ maxWidth: 560, margin: '3rem auto' }}>
        <p className={styles.eyebrow}>{t('admin')}</p>
        <h1 className={styles.pageTitle}>{isSetup ? t('createPin') : t('adminLogin')}</h1>
        <p className={styles.muted}>{t('pinHelp')}</p>
        <form className={styles.form} onSubmit={(event) => void submit(event)}>
          <label className={styles.field}>
            {isSetup ? t('createPin') : t('enterPin')}
            <input
              className={styles.input}
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              pattern="[0-9]{6,12}"
              minLength={6}
              maxLength={12}
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              required
            />
          </label>
          {isSetup ? (
            <label className={styles.field}>
              {t('confirmPin')}
              <input
                className={styles.input}
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                pattern="[0-9]{6,12}"
                minLength={6}
                maxLength={12}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
              />
            </label>
          ) : null}
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <div className={styles.buttonRow}>
            <button className={`${styles.button} ${styles.buttonPrimary}`} disabled={busy} type="submit">
              {busy ? '…' : isSetup ? t('createPin') : t('adminLogin')}
            </button>
            <Link className={styles.button} to="/">{t('back')}</Link>
          </div>
        </form>
      </section>
      ) : null}
    </main>
  )
}
