import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { getDatabase } from '@/database/db'
import { LANGUAGES, type ContentTranslation, type Destination, type Language } from '@/database/schema'
import { useAppData } from '@/contexts/AppDataContext'
import { useLanguage } from '@/hooks/useLanguage'
import { createId, errorText } from '@/utils/runtime'
import styles from '@/styles/application.module.scss'

function emptyTranslation(): ContentTranslation {
  return {
    name: '',
    shortDescription: '',
    description: '',
    historicalBackground: '',
    facts: [],
    highlights: [],
    dressCode: '',
    etiquette: '',
    photography: '',
    accessibility: '',
    bestTime: '',
    videoDescription: '',
  }
}

function newDestination(): Destination {
  const now = new Date().toISOString()
  return {
    id: createId(),
    slug: '',
    areaId: '',
    categoryIds: [],
    translations: { en: emptyTranslation(), de: emptyTranslation(), ru: emptyTranslation(), ja: emptyTranslation() },
    galleryMediaIds: [],
    videoMediaIds: [],
    audioMediaIds: [],
    nearbyDestinationIds: [],
    keywords: [],
    alternateNames: [],
    visitDuration: '',
    published: false,
    featured: false,
    sortOrder: 100,
    sources: '',
    lastVerifiedAt: null,
    createdAt: now,
    updatedAt: now,
  }
}

function toLines(values: string[]): string {
  return values.join('\n')
}

function parseLines(value: string): string[] {
  return value.split(/\r?\n/).map((part) => part.trim()).filter(Boolean)
}

function factsText(facts: ContentTranslation['facts']): string {
  return facts.map((fact) => `${fact.label}|${fact.value}`).join('\n')
}

function parseFacts(value: string, language: Language): ContentTranslation['facts'] {
  return parseLines(value).map((line, index) => {
    const [label = '', ...rest] = line.split('|')
    return { id: `${language}-fact-${index}`, label: label.trim(), value: rest.join('|').trim() }
  })
}

export function DestinationManagerPage() {
  const { areas, categories, destinations, media } = useAppData()
  const { language, t } = useLanguage()
  const [form, setForm] = useState<Destination | null>(null)
  const [formLanguage, setFormLanguage] = useState<Language>('en')
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [preview, setPreview] = useState(false)

  const visible = useMemo(() => destinations
    .filter((item) => {
      const value = filter.trim().toLocaleLowerCase()
      return !value || Object.values(item.translations).some((translation) => translation.name.toLocaleLowerCase().includes(value))
    })
    .sort((a, b) => a.sortOrder - b.sortOrder), [destinations, filter])

  useEffect(() => {
    if (!dirty) return
    const preventClose = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', preventClose)
    return () => window.removeEventListener('beforeunload', preventClose)
  }, [dirty])

  const openForm = (destination?: Destination) => {
    if (dirty && !window.confirm(t('discardChanges'))) return
    setForm(destination ? structuredClone(destination) : newDestination())
    setFormLanguage(language)
    setDirty(false)
    setError(null)
    setNotice(null)
    setPreview(false)
  }

  const closeForm = () => {
    if (dirty && !window.confirm(t('discardChanges'))) return
    setForm(null)
    setDirty(false)
  }

  const patch = <K extends keyof Destination>(key: K, value: Destination[K]) => {
    setForm((current) => current ? { ...current, [key]: value } : current)
    setDirty(true)
  }

  const patchTranslation = <K extends keyof ContentTranslation>(key: K, value: ContentTranslation[K]) => {
    setForm((current) => current
      ? { ...current, translations: { ...current.translations, [formLanguage]: { ...current.translations[formLanguage], [key]: value } } }
      : current)
    setDirty(true)
  }

  const save = async (event: FormEvent<HTMLFormElement> | undefined, publish: boolean) => {
    event?.preventDefault()
    if (!form) return
    setError(null)
    if (!form.areaId) {
      setError('Choose an area before saving.')
      return
    }
    if (publish) {
      const incomplete = LANGUAGES.filter((code) => {
        const translation = form.translations[code]
        return !translation.name.trim() || !translation.shortDescription.trim() ||
          !translation.description.trim() || !translation.historicalBackground.trim()
      })
      if (incomplete.length) {
        setError(`Complete name, description and historical background in all languages before publishing: ${incomplete.join(', ').toUpperCase()}.`)
        return
      }
      if (!form.sources.trim() || !form.lastVerifiedAt) {
        setError('Add a source and verification date before publishing.')
        return
      }
    }
    const record = {
      ...form,
      slug: form.slug.trim() || form.translations.en.name.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      published: publish,
      updatedAt: new Date().toISOString(),
    }
    try {
      await getDatabase().destinations.put(record)
      setForm(record)
      setDirty(false)
      setNotice(publish ? t('publish') : t('saveDraft'))
    } catch (cause) {
      setError(errorText(cause))
    }
  }

  const remove = async (destination: Destination) => {
    if (!window.confirm(t('confirmDelete'))) return
    try {
      const database = getDatabase()
      await database.transaction('rw', database.destinations, database.journeys, database.media, async () => {
        const all = await database.destinations.toArray()
        await Promise.all(all
          .filter((item) => item.id !== destination.id && item.nearbyDestinationIds.includes(destination.id))
          .map((item) => database.destinations.update(item.id, {
            nearbyDestinationIds: item.nearbyDestinationIds.filter((id) => id !== destination.id),
          })))
        const journeys = await database.journeys.toArray()
        await Promise.all(journeys
          .filter((journey) => journey.destinationIds.includes(destination.id))
          .map((journey) => database.journeys.update(journey.id, {
            destinationIds: journey.destinationIds.filter((id) => id !== destination.id),
          })))
        await database.media.where('destinationId').equals(destination.id).modify({ destinationId: null })
        await database.destinations.delete(destination.id)
      })
      if (form?.id === destination.id) {
        setForm(null)
        setDirty(false)
      }
      setNotice(t('delete'))
    } catch (cause) {
      setError(errorText(cause))
    }
  }

  const titleOf = (item: Destination) => item.translations[language].name || item.translations.en.name || t('missingTranslation')
  const translateStatus = (item: Destination, code: Language) => {
    const value = item.translations[code]
    return value.name && value.shortDescription && value.description && value.historicalBackground
      ? t('verified')
      : t('incomplete')
  }

  const selectedTranslation = form?.translations[formLanguage]

  return (
    <main className={styles.content}>
      <section className={styles.sectionHeading}>
        <h1 className={styles.pageTitle}>{t('destinations')}</h1>
        <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={() => openForm()}>{t('add')}</button>
      </section>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      <label className={styles.field}>
        {t('search')}
        <input className={styles.input} value={filter} onChange={(event) => setFilter(event.target.value)} />
      </label>
      <div className={`${styles.panel} ${styles.tableWrap}`}>
        <table className={styles.table}>
          <thead><tr><th>{t('title')}</th><th>{t('area')}</th><th>{t('published')}</th><th>{t('translation')}</th><th /></tr></thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id}>
                <td>{titleOf(item)}</td>
                <td>{areas.find((area) => area.id === item.areaId)?.translations[language] || t('missingTranslation')}</td>
                <td>{item.published ? t('published') : t('saveDraft')}</td>
                <td>{LANGUAGES.map((code) => <span className={styles.tag} key={code}>{code.toUpperCase()}: {translateStatus(item, code)}</span>)}</td>
                <td><div className={styles.buttonRow}>
                  <button className={styles.button} type="button" onClick={() => openForm(item)}>{t('edit')}</button>
                  <button className={`${styles.button} ${styles.buttonDanger}`} type="button" onClick={() => void remove(item)}>{t('delete')}</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length ? <p className={styles.muted}>{t('emptyAdmin')}</p> : null}
      </div>

      {form && selectedTranslation ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label={t('destinations')}>
          <div className={`${styles.modal} ${styles.form}`}>
            <div className={styles.sectionHeading}>
              <h2>{form.createdAt === form.updatedAt ? t('add') : t('edit')} {t('destinations')}</h2>
              <button className={styles.button} type="button" onClick={closeForm}>{t('cancel')}</button>
            </div>
            <p className={styles.notice}>{t('unverified')}</p>
            <div className={styles.buttonRow}>
              {LANGUAGES.map((code) => (
                <button className={`${styles.button} ${formLanguage === code ? styles.buttonPrimary : ''}`} key={code} type="button" onClick={() => setFormLanguage(code)}>
                  {code.toUpperCase()} · {translateStatus(form, code)}
                </button>
              ))}
            </div>
            <form className={styles.form} onSubmit={(event) => void save(event, false)}>
              <section className={styles.panel}>
                <h3>{t('title')} · {formLanguage.toUpperCase()}</h3>
                <label className={styles.field}>{t('title')}<input className={styles.input} value={selectedTranslation.name} onChange={(event) => patchTranslation('name', event.target.value)} /></label>
                <label className={styles.field}>{t('discover')}<input className={styles.input} value={selectedTranslation.shortDescription} onChange={(event) => patchTranslation('shortDescription', event.target.value)} /></label>
                <label className={styles.field}>{t('history')}<textarea className={styles.textarea} value={selectedTranslation.historicalBackground} onChange={(event) => patchTranslation('historicalBackground', event.target.value)} /></label>
                <label className={styles.field}>{t('description')}<textarea className={styles.textarea} value={selectedTranslation.description} onChange={(event) => patchTranslation('description', event.target.value)} /></label>
              </section>
              <section className={styles.panel}>
                <h3>{t('area')} & {t('categoriesLabel')}</h3>
                <label className={styles.field}>{t('area')}
                  <select className={styles.select} value={form.areaId} onChange={(event) => patch('areaId', event.target.value)} required>
                    <option value="">—</option>
                    {areas.map((area) => <option key={area.id} value={area.id}>{area.translations[formLanguage] || area.id}</option>)}
                  </select>
                </label>
                <div className={styles.stack}>
                  {categories.map((category) => (
                    <label className={styles.checkRow} key={category.id}>
                      <input
                        type="checkbox"
                        checked={form.categoryIds.includes(category.id)}
                        onChange={(event) => patch('categoryIds', event.target.checked
                          ? [...form.categoryIds, category.id]
                          : form.categoryIds.filter((id) => id !== category.id))}
                      />
                      <span>{category.translations[formLanguage] || category.id}</span>
                    </label>
                  ))}
                </div>
              </section>
              <section className={styles.panel}>
                <h3>{t('facts')} & {t('highlights')}</h3>
                <label className={styles.field}>{t('facts')} (one “label|value” per line)
                  <textarea className={styles.textarea} value={factsText(selectedTranslation.facts)} onChange={(event) => patchTranslation('facts', parseFacts(event.target.value, formLanguage))} />
                </label>
                <label className={styles.field}>{t('highlights')} (one per line)
                  <textarea className={styles.textarea} value={toLines(selectedTranslation.highlights)} onChange={(event) => patchTranslation('highlights', parseLines(event.target.value))} />
                </label>
                <label className={styles.field}>{t('dressCode')}<textarea className={styles.textarea} value={selectedTranslation.dressCode} onChange={(event) => patchTranslation('dressCode', event.target.value)} /></label>
                <label className={styles.field}>{t('etiquette')}<textarea className={styles.textarea} value={selectedTranslation.etiquette} onChange={(event) => patchTranslation('etiquette', event.target.value)} /></label>
                <label className={styles.field}>{t('photography')}<textarea className={styles.textarea} value={selectedTranslation.photography} onChange={(event) => patchTranslation('photography', event.target.value)} /></label>
                <label className={styles.field}>{t('bestTime')}<textarea className={styles.textarea} value={selectedTranslation.bestTime} onChange={(event) => patchTranslation('bestTime', event.target.value)} /></label>
                <label className={styles.field}>{t('visitorInfo')}<textarea className={styles.textarea} value={selectedTranslation.accessibility} onChange={(event) => patchTranslation('accessibility', event.target.value)} /></label>
                <label className={styles.field}>{t('videos')}<textarea className={styles.textarea} value={selectedTranslation.videoDescription} onChange={(event) => patchTranslation('videoDescription', event.target.value)} /></label>
              </section>
              <section className={styles.panel}>
                <h3>{t('verified')}</h3>
                <label className={styles.field}>{t('visitDuration')}<input className={styles.input} value={form.visitDuration} onChange={(event) => patch('visitDuration', event.target.value)} /></label>
                <label className={styles.field}>{t('sources')}<textarea className={styles.textarea} value={form.sources} onChange={(event) => patch('sources', event.target.value)} /></label>
                <label className={styles.field}>{t('lastVerifiedAt')}<input className={styles.input} type="date" value={form.lastVerifiedAt?.slice(0, 10) ?? ''} onChange={(event) => patch('lastVerifiedAt', event.target.value ? new Date(`${event.target.value}T00:00:00`).toISOString() : null)} /></label>
                <label className={styles.field}>Keywords (one per line)<textarea className={styles.textarea} value={toLines(form.keywords)} onChange={(event) => patch('keywords', parseLines(event.target.value))} /></label>
                <label className={styles.field}>Alternate names (one per line)<textarea className={styles.textarea} value={toLines(form.alternateNames)} onChange={(event) => patch('alternateNames', parseLines(event.target.value))} /></label>
                <label className={styles.field}>Sort order<input className={styles.input} type="number" value={form.sortOrder} onChange={(event) => patch('sortOrder', Number(event.target.value))} /></label>
                <h3>{t('nearby')}</h3>
                {destinations.filter((item) => item.id !== form.id).map((item) => (
                  <label className={styles.checkRow} key={item.id}>
                    <input type="checkbox" checked={form.nearbyDestinationIds.includes(item.id)} onChange={(event) => patch('nearbyDestinationIds', event.target.checked
                      ? [...form.nearbyDestinationIds, item.id]
                      : form.nearbyDestinationIds.filter((id) => id !== item.id))} />
                    <span>{item.translations[formLanguage].name || item.translations.en.name || item.id}</span>
                  </label>
                ))}
                <label className={styles.checkRow}><input type="checkbox" checked={form.featured} onChange={(event) => patch('featured', event.target.checked)} /><span>{t('featuredLabel')}</span></label>
                <p className={styles.muted}>Media connected to this place: {media.filter((item) => item.destinationId === form.id).length}</p>
              </section>
              {preview ? (
                <article className={styles.panel}>
                  <p className={styles.eyebrow}>{t('preview')} · {formLanguage.toUpperCase()}</p>
                  <h2>{selectedTranslation.name || t('missingTranslation')}</h2>
                  <p>{selectedTranslation.shortDescription || t('missingTranslation')}</p>
                  <h3>{t('history')}</h3>
                  <p>{selectedTranslation.historicalBackground || t('missingTranslation')}</p>
                  <p className={styles.notice}>{t('unverified')}</p>
                </article>
              ) : null}
              {error ? <p className={styles.error} role="alert">{error}</p> : null}
              <div className={styles.buttonRow}>
                <button className={styles.button} type="submit">{t('saveDraft')}</button>
                <button className={styles.button} type="button" onClick={() => setPreview((current) => !current)}>{t('preview')}</button>
                <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={() => void save(undefined, true)}>{t('publish')}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  )
}
