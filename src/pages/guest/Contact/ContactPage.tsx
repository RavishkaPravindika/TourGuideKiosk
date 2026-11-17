import { useState, type FormEvent } from 'react'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { getDatabase } from '@/database/db'
import { useAppData } from '@/contexts/AppDataContext'
import { useLanguage } from '@/hooks/useLanguage'
import { createId } from '@/utils/runtime'
import styles from '@/styles/application.module.scss'

export function ContactPage() {
  const { session, settings } = useAppData()
  const { language, t } = useLanguage()
  const [name, setName] = useState('')
  const [countryCode, setCountryCode] = useState('+94')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    if (!session) {
      setError(t('contactRequired'))
      return
    }
    if (!consent) {
      setError(t('contactRequired'))
      return
    }
    const normalizedCountryCode = countryCode.trim()
    if (!/^\+[1-9]\d{0,3}$/.test(normalizedCountryCode)) {
      setError(t('contactRequired'))
      return
    }
    const nationalDigits = phone.replace(/[^\d]/g, '').replace(/^0+/, '')
    const parsed = parsePhoneNumberFromString(`${normalizedCountryCode}${nationalDigits}`)
    if (!parsed?.isValid()) {
      setError(t('contactRequired'))
      return
    }

    const now = new Date().toISOString()
    try {
      await getDatabase().guests.add({
        id: createId(),
        name: name.trim(),
        countryCode: normalizedCountryCode,
        phoneNumber: phone.trim(),
        normalizedPhoneNumber: parsed.number,
        selectedLanguage: language,
        consent: true,
        consentDate: now,
        guestSessionId: session.id,
        createdAt: now,
      })
      setMessage(t('contactSaved'))
      setName('')
      setPhone('')
      setConsent(false)
    } catch (cause) {
      console.error('Could not save guest contact locally', cause)
      setError(t('contactSaveError'))
    }
  }

  const guideNumber = settings?.guideWhatsAppNumber.replace(/\D/g, '')
  const guideUrl = guideNumber ? `https://wa.me/${guideNumber}` : null

  return (
    <main className={styles.content}>
      <section className={styles.section}>
        <p className={styles.eyebrow}>{t('contact')}</p>
        <h1 className={styles.pageTitle}>{t('contactTitle')}</h1>
        <p className={styles.subtitle}>{t('contactIntro')}</p>
        <p className={styles.notice}>{t('contactPrivacy')}</p>
      </section>

      <form className={`${styles.panel} ${styles.form}`} onSubmit={(event) => void save(event)}>
        <label className={styles.field}>
          {t('name')}
          <input className={styles.input} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <div className={styles.toolbar}>
          <label className={styles.field}>
            {t('callingCode')}
            <input className={styles.input} type="tel" inputMode="tel" value={countryCode} onChange={(event) => setCountryCode(event.target.value)} placeholder="+94" required />
          </label>
          <label className={styles.field}>
            {t('phone')}
            <input
              className={styles.input}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </label>
        </div>
        <label className={styles.checkRow}>
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          <span>{t('consent')}</span>
        </label>
        <p className={styles.muted}>{t('contactPrivacy')}</p>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {message ? <p className={styles.notice} role="status">{message}</p> : null}
        <div className={styles.buttonRow}>
          <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit">{t('saveContact')}</button>
          <button className={styles.button} type="button" onClick={() => window.history.back()}>{t('continue')}</button>
        </div>
      </form>

      <section className={styles.section}>
        <h2>{t('contactGuide')}</h2>
        {guideUrl
          ? <a className={`${styles.button} ${styles.buttonPrimary}`} href={guideUrl} target="_blank" rel="noreferrer">{t('contactGuide')}</a>
          : <p className={styles.notice}>{t('notConfigured')}</p>}
      </section>
    </main>
  )
}
