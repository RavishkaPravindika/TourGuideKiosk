import { useState } from 'react'
import { getDatabase } from '@/database/db'
import { LANGUAGES, type Journey, type Language } from '@/database/schema'
import { useAppData } from '@/contexts/AppDataContext'
import { useLanguage } from '@/hooks/useLanguage'
import { createId, errorText } from '@/utils/runtime'
import styles from '@/styles/application.module.scss'

function newJourney(): Journey {
  return {
    id: createId(),
    name: { en: '', de: '', ru: '', ja: '' },
    description: { en: '', de: '', ru: '', ja: '' },
    destinationIds: [],
    sortOrder: 100,
    active: true,
    featured: false,
  }
}

export function JourneyManagerPage() {
  const { journeys, destinations } = useAppData()
  const { language, t } = useLanguage()
  const [draft, setDraft] = useState<Journey | null>(null)
  const [draftLanguage, setDraftLanguage] = useState<Language>('en')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const setText = (field: 'name' | 'description', value: string) => {
    setDraft((current) => current ? { ...current, [field]: { ...current[field], [draftLanguage]: value } } : current)
  }

  const save = async () => {
    if (!draft) return
    setError(null)
    if (!LANGUAGES.every((code) => draft.name[code].trim())) {
      setError('Add a journey name in all four languages.')
      return
    }
    try {
      const database = getDatabase()
      const record = { ...draft, featured: draft.active && draft.featured }
      await database.transaction('rw', database.journeys, async () => {
        if (record.featured) {
          await database.journeys.toCollection().modify((journey) => {
            if (journey.id !== record.id) journey.featured = false
          })
        }
        await database.journeys.put(record)
      })
      setDraft(null)
      setNotice(t('settingsSaved'))
    } catch (cause) {
      setError(errorText(cause))
    }
  }

  const remove = async (item: Journey) => {
    if (!window.confirm(t('confirmDelete'))) return
    try {
      await getDatabase().journeys.delete(item.id)
      setNotice(t('delete'))
    } catch (cause) {
      setError(errorText(cause))
    }
  }

  return (
    <main className={styles.content}>
      <section className={styles.sectionHeading}>
        <h1 className={styles.pageTitle}>{t('journeys')}</h1>
        <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={() => {
          setDraft(newJourney())
          setDraftLanguage(language)
          setError(null)
        }}>{t('add')}</button>
      </section>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      <div className={styles.grid}>
        {journeys.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((journey) => (
          <article className={styles.panel} key={journey.id}>
            <h2>{journey.name[language] || t('missingTranslation')}</h2>
            <p>{journey.description[language] || t('missingTranslation')}</p>
            <p className={styles.muted}>{journey.destinationIds.length} {t('countPlaces')} · {journey.active ? t('published') : t('saveDraft')}</p>
            <div className={styles.buttonRow}>
              <button className={styles.button} type="button" onClick={() => {
                setDraft(structuredClone(journey))
                setDraftLanguage(language)
                setError(null)
              }}>{t('edit')}</button>
              <button className={`${styles.button} ${styles.buttonDanger}`} type="button" onClick={() => void remove(journey)}>{t('delete')}</button>
            </div>
          </article>
        ))}
      </div>
      {draft ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label={t('journeys')}>
          <div className={`${styles.modal} ${styles.form}`}>
            <div className={styles.sectionHeading}>
              <h2>{t('journeys')}</h2>
              <button className={styles.button} type="button" onClick={() => setDraft(null)}>{t('cancel')}</button>
            </div>
            <div className={styles.buttonRow}>
              {LANGUAGES.map((code) => <button className={`${styles.button} ${draftLanguage === code ? styles.buttonPrimary : ''}`} key={code} type="button" onClick={() => setDraftLanguage(code)}>{code.toUpperCase()}</button>)}
            </div>
            <label className={styles.field}>{t('title')} · {draftLanguage.toUpperCase()}
              <input className={styles.input} value={draft.name[draftLanguage]} onChange={(event) => setText('name', event.target.value)} />
            </label>
            <label className={styles.field}>{t('description')} · {draftLanguage.toUpperCase()}
              <textarea className={styles.textarea} value={draft.description[draftLanguage]} onChange={(event) => setText('description', event.target.value)} />
            </label>
            <label className={styles.field}>Sort order
              <input className={styles.input} type="number" value={draft.sortOrder} onChange={(event) => setDraft((current) => current ? { ...current, sortOrder: Number(event.target.value) } : current)} />
            </label>
            <label className={styles.checkRow}><input type="checkbox" checked={draft.active} onChange={(event) => setDraft((current) => current ? { ...current, active: event.target.checked } : current)} /><span>{t('published')}</span></label>
            <label className={styles.checkRow}><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft((current) => current ? { ...current, featured: event.target.checked } : current)} /><span>{t('featuredLabel')}</span></label>
            <h3>{t('destinations')} · sequence</h3>
            <div className={styles.stack}>
              {destinations.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((destination) => {
                const title = destination.translations[draftLanguage].name || destination.translations.en.name || t('missingTranslation')
                return (
                  <label className={styles.checkRow} key={destination.id}>
                    <input
                      type="checkbox"
                      checked={draft.destinationIds.includes(destination.id)}
                      onChange={(event) => setDraft((current) => current ? {
                        ...current,
                        destinationIds: event.target.checked
                          ? [...current.destinationIds, destination.id]
                          : current.destinationIds.filter((id) => id !== destination.id),
                      } : current)}
                    />
                    <span>{title}</span>
                  </label>
                )
              })}
            </div>
            <p className={styles.muted}>Selected places appear in the order shown above. Use the up/down controls after adding places.</p>
            {draft.destinationIds.length ? (
              <div className={styles.stack}>
                {draft.destinationIds.map((id, index) => (
                  <div className={styles.buttonRow} key={id}>
                    <span>{index + 1}. {destinations.find((item) => item.id === id)?.translations[draftLanguage].name || id}</span>
                    <button className={styles.button} type="button" disabled={index === 0} onClick={() => setDraft((current) => {
                      if (!current) return current
                      const sequence = [...current.destinationIds]
                      const previous = sequence[index - 1]
                      sequence[index - 1] = sequence[index]
                      sequence[index] = previous
                      return { ...current, destinationIds: sequence }
                    })}>↑</button>
                    <button className={styles.button} type="button" disabled={index === draft.destinationIds.length - 1} onClick={() => setDraft((current) => {
                      if (!current) return current
                      const sequence = [...current.destinationIds]
                      const next = sequence[index + 1]
                      sequence[index + 1] = sequence[index]
                      sequence[index] = next
                      return { ...current, destinationIds: sequence }
                    })}>↓</button>
                  </div>
                ))}
              </div>
            ) : null}
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={() => void save()}>{t('save')}</button>
          </div>
        </div>
      ) : null}
    </main>
  )
}
