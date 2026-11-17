import { useMemo, useState } from 'react'
import { getDatabase } from '@/database/db'
import { LANGUAGES, type Language } from '@/database/schema'
import { useAppData } from '@/contexts/AppDataContext'
import { useLanguage } from '@/hooks/useLanguage'
import { errorText } from '@/utils/runtime'
import styles from '@/styles/application.module.scss'

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export function GuestContactsPage() {
  const { guests } = useAppData()
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<Language | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const countries = [...new Set(guests.map((guest) => guest.countryCode))].sort()
  const visible = useMemo(() => guests
    .filter((guest) => !country || guest.countryCode === country)
    .filter((guest) => !selectedLanguage || guest.selectedLanguage === selectedLanguage)
    .filter((guest) => {
      const needle = query.trim().toLocaleLowerCase()
      return !needle || guest.name.toLocaleLowerCase().includes(needle) ||
        guest.normalizedPhoneNumber.toLocaleLowerCase().includes(needle)
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [country, guests, query, selectedLanguage])

  const exportCsv = () => {
    setError(null)
    const header = ['name', 'countryCode', 'phoneNumber', 'normalizedPhoneNumber', 'language', 'consent', 'consentDate', 'guestSessionId', 'createdAt']
    const rows = guests.map((guest) => [
      guest.name, guest.countryCode, guest.phoneNumber, guest.normalizedPhoneNumber,
      guest.selectedLanguage, String(guest.consent), guest.consentDate, guest.guestSessionId, guest.createdAt,
    ])
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `explore-sri-lanka-contacts-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice(t('downloadRequested'))
  }

  const remove = async (id: string) => {
    if (!window.confirm(t('confirmDelete'))) return
    try {
      await getDatabase().guests.delete(id)
    } catch (cause) {
      setError(errorText(cause))
    }
  }

  const copy = async (phone: string) => {
    setError(null)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable in this browser.')
      await navigator.clipboard.writeText(phone)
      setNotice(t('numberCopied'))
    } catch (cause) {
      setError(errorText(cause))
    }
  }

  return (
    <main className={styles.content}>
      <section className={styles.sectionHeading}>
        <h1 className={styles.pageTitle}>{t('guests')}</h1>
        <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={exportCsv}>{t('exportCsv')}</button>
      </section>
      <p className={styles.notice}>Guest contact details are private. Export only when necessary and protect the downloaded file.</p>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      <div className={styles.toolbar}>
        <input className={styles.input} placeholder={t('searchGuests')} value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className={styles.buttonRow}>
          <select className={styles.select} value={country} onChange={(event) => setCountry(event.target.value)}>
            <option value="">{t('callingCode')}</option>
            {countries.map((code) => <option key={code} value={code}>{code}</option>)}
          </select>
          <select className={styles.select} value={selectedLanguage} onChange={(event) => setSelectedLanguage(event.target.value as Language | '')}>
            <option value="">{t('allLanguages')}</option>
            {LANGUAGES.map((code) => <option key={code} value={code}>{code.toUpperCase()}</option>)}
          </select>
        </div>
      </div>
      <div className={`${styles.panel} ${styles.tableWrap}`}>
        <table className={styles.table}>
          <thead><tr><th>{t('name')}</th><th>{t('phone')}</th><th>{t('language')}</th><th>{t('consentGiven')}</th><th>{t('consentDate')}</th><th /></tr></thead>
          <tbody>
            {visible.map((guest) => (
              <tr key={guest.id}>
                <td>{guest.name || '—'}</td>
                <td>{guest.normalizedPhoneNumber}</td>
                <td>{guest.selectedLanguage.toUpperCase()}</td>
                <td>{guest.consent ? t('consentGiven') : '—'}</td>
                <td>{new Date(guest.consentDate).toLocaleString()}</td>
                <td><div className={styles.buttonRow}>
                  <button className={styles.button} type="button" onClick={() => void copy(guest.normalizedPhoneNumber)}>{t('copyNumber')}</button>
                  <a className={styles.button} href={`https://wa.me/${guest.normalizedPhoneNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{t('openChat')}</a>
                  <button className={`${styles.button} ${styles.buttonDanger}`} type="button" onClick={() => void remove(guest.id)}>{t('delete')}</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length ? <p className={styles.muted}>{t('noGuests')}</p> : null}
      </div>
    </main>
  )
}
