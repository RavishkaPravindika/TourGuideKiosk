import { useEffect, useMemo, useState, type FormEvent, type ChangeEvent } from 'react'
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
  const [quickAdd, setQuickAdd] = useState(false)
  // Simplified quick add form state
  const [quickForm, setQuickForm] = useState<{
    name: string
    areaId: string
    categoryIds: string[]
    shortDescription: string
    description: string
    historicalBackground: string
    imageFile: File | null
  } | null>(null)

  type QuickFormState = NonNullable<typeof quickForm>

  // JSON Import state
  const [importError, setImportError] = useState<string | null>(null)
  const [importNotice, setImportNotice] = useState<string | null>(null)

  const importFromJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setImportError(null)
    setImportNotice(null)
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!Array.isArray(data)) {
        setImportError('JSON must be an array of place objects.')
        return
      }

      const areaIds = new Set(areas.map((a) => a.id))
      const categoryIds = new Set(categories.map((c) => c.id))
      const existingDestIds = new Set(destinations.map((d) => d.id))
      const now = new Date().toISOString()
      let imported = 0
      let skipped = 0

      for (const item of data) {
        try {
          // Validate required fields
          if (!item.id || !item.title || !item.area_id || !item.category_id) {
            console.warn('Skipping item missing required fields:', item)
            skipped++
            continue
          }

          if (!areaIds.has(item.area_id)) {
            console.warn(`Skipping item ${item.id}: unknown area_id ${item.area_id}`)
            skipped++
            continue
          }

          if (!categoryIds.has(item.category_id)) {
            console.warn(`Skipping item ${item.id}: unknown category_id ${item.category_id}`)
            skipped++
            continue
          }

          // Check for duplicate ID
          let destId = item.id
          if (existingDestIds.has(destId)) {
            destId = createId()
          }

          // Build translations object
          const translations: Record<Language, ContentTranslation> = {
            en: emptyTranslation(),
            de: emptyTranslation(),
            ru: emptyTranslation(),
            ja: emptyTranslation(),
          }

          const langs: Language[] = ['en', 'de', 'ru', 'ja']
          for (const lang of langs) {
            const t = item.title?.[lang] || item.title?.en || ''
            const sd = item.short_description?.[lang] || item.short_description?.en || ''
            const desc = item.description?.[lang] || item.description?.en || ''
            const hb = item.historical_value?.[lang] || item.historical_value?.en || ''

            translations[lang] = {
              ...emptyTranslation(),
              name: t,
              shortDescription: sd,
              description: desc,
              historicalBackground: hb,
            }
          }

          // Build facts from stats
          const facts: ContentTranslation['facts'] = []
          if (Array.isArray(item.stats)) {
            for (const stat of item.stats) {
              const label = stat.label?.en || ''
              const value = stat.value?.en || ''
              if (label && value) {
                facts.push({
                  id: `${stat.label?.en || 'fact'}-${facts.length}`,
                  label,
                  value,
                })
              }
            }
          }

          // Set facts for all languages
          for (const lang of langs) {
            translations[lang].facts = facts
          }

          // Build highlights from gallery or description
          const highlights: string[] = []
          if (Array.isArray(item.gallery) && item.gallery.length > 0) {
            highlights.push(`Photo gallery with ${item.gallery.length} images`)
          }
          if (item.featured_image) {
            highlights.push('Featured image available')
          }

          for (const lang of langs) {
            translations[lang].highlights = highlights
          }

          const newDest: Destination = {
            id: destId,
            slug: item.id,
            areaId: item.area_id,
            categoryIds: [item.category_id],
            translations,
            galleryMediaIds: [],
            videoMediaIds: [],
            audioMediaIds: [],
            nearbyDestinationIds: [],
            keywords: [],
            alternateNames: [],
            visitDuration: '',
            published: true,
            featured: false,
            sortOrder: 100,
            sources: item.sources || 'JSON import',
            lastVerifiedAt: now,
            createdAt: now,
            updatedAt: now,
          }

          await getDatabase().destinations.put(newDest)
          existingDestIds.add(destId)
          imported++
        } catch (itemError) {
          console.error('Error importing item:', itemError)
          skipped++
        }
      }

      setImportNotice(`${t('imported')}: ${imported}, ${t('skipped')}: ${skipped}`)
    } catch (cause) {
      setImportError(`${t('importError')}: ${errorText(cause)}`)
    }
  }

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

  const openForm = (destination?: Destination, isQuickAdd = false) => {
    if (dirty && !window.confirm(t('discardChanges'))) return
    if (isQuickAdd) {
      setQuickForm({
        name: '',
        areaId: '',
        categoryIds: [],
        shortDescription: '',
        description: '',
        historicalBackground: '',
        imageFile: null,
      })
      setQuickAdd(true)
      setForm(null)
      setDirty(false)
      setError(null)
      setNotice(null)
      setPreview(false)
      return
    }
    setForm(destination ? structuredClone(destination) : newDestination())
    setFormLanguage(language)
    setDirty(false)
    setError(null)
    setNotice(null)
    setPreview(false)
    setQuickAdd(false)
  }

  const closeForm = () => {
    if (dirty && !window.confirm(t('discardChanges'))) return
    if (quickAdd && quickForm) {
      if (!window.confirm(t('discardChanges'))) return
    }
    setForm(null)
    setQuickForm(null)
    setDirty(false)
    setQuickAdd(false)
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
    if (publish && !quickAdd) {
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
    if (publish && quickAdd) {
      // Quick publish: only require English content
      const en = form.translations.en
      if (!en.name.trim() || !en.shortDescription.trim() || !en.description.trim() || !en.historicalBackground.trim()) {
        setError('Complete name, short description, description and historical background in English for quick publish.')
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

  const patchQuickForm = <K extends keyof QuickFormState>(key: K, value: QuickFormState[K]) => {
    setQuickForm((current) => current ? { ...current, [key]: value } : current)
  }

  const saveQuickForm = async (event: FormEvent<HTMLFormElement> | undefined, publish: boolean) => {
    event?.preventDefault()
    if (!quickForm) return
    setError(null)
    if (!quickForm.name.trim()) {
      setError('Enter a name for the place.')
      return
    }
    if (!quickForm.areaId) {
      setError('Choose an area before saving.')
      return
    }
    if (!quickForm.shortDescription.trim() || !quickForm.description.trim() || !quickForm.historicalBackground.trim()) {
      setError('Complete short description, description and historical background.')
      return
    }

    // Handle image upload if provided
    let galleryMediaIds: string[] = []
    if (quickForm.imageFile) {
      const mediaType = quickForm.imageFile.type.startsWith('image/') ? 'image' : 'video'
      const maxMb = mediaType === 'video' ? 150 : 35
      if (quickForm.imageFile.size > maxMb * 1024 * 1024) {
        setError(`Image too large. Maximum: ${maxMb} MB.`)
        return
      }
      let thumbnailBlob: Blob | null = null
      if (mediaType === 'image') {
        const objectUrl = URL.createObjectURL(quickForm.imageFile)
        try {
          const image = new Image()
          image.src = objectUrl
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve()
            image.onerror = () => reject(new Error('Could not decode image.'))
          })
          const scale = Math.min(1, 640 / Math.max(image.naturalWidth, image.naturalHeight))
          const canvas = document.createElement('canvas')
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
          const context = canvas.getContext('2d')
          if (!context) throw new Error('Canvas unavailable.')
          context.drawImage(image, 0, 0, canvas.width, canvas.height)
          thumbnailBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
        } finally {
          URL.revokeObjectURL(objectUrl)
        }
      }
      const mediaId = createId()
      const now = new Date().toISOString()
      await getDatabase().media.add({
        id: mediaId,
        fileName: quickForm.imageFile.name,
        mimeType: quickForm.imageFile.type,
        fileSize: quickForm.imageFile.size,
        blob: quickForm.imageFile.slice(0, quickForm.imageFile.size, quickForm.imageFile.type),
        thumbnailBlob,
        mediaType: mediaType as 'image' | 'video',
        language: null,
        destinationId: null,
        createdAt: now,
      })
      galleryMediaIds = [mediaId]
    }

    const now = new Date().toISOString()
    const newDest: Destination = {
      id: createId(),
      slug: quickForm.name.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      areaId: quickForm.areaId,
      categoryIds: quickForm.categoryIds,
      translations: {
        en: {
          name: quickForm.name,
          shortDescription: quickForm.shortDescription,
          description: quickForm.description,
          historicalBackground: quickForm.historicalBackground,
          facts: [],
          highlights: [],
          dressCode: '',
          etiquette: '',
          photography: '',
          accessibility: '',
          bestTime: '',
          videoDescription: '',
        },
        de: emptyTranslation(),
        ru: emptyTranslation(),
        ja: emptyTranslation(),
      },
      galleryMediaIds,
      videoMediaIds: [],
      audioMediaIds: [],
      nearbyDestinationIds: [],
      keywords: [],
      alternateNames: [],
      visitDuration: '',
      published: publish,
      featured: false,
      sortOrder: 100,
      sources: '',
      lastVerifiedAt: publish ? now : null,
      createdAt: now,
      updatedAt: now,
    }

    try {
      await getDatabase().destinations.put(newDest)
      if (publish) {
        await getDatabase().destinations.update(newDest.id, { lastVerifiedAt: now })
      }
      setQuickForm(null)
      setQuickAdd(false)
      setNotice(publish ? t('publish') : t('saveDraft'))
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
        <div className={styles.buttonRow}>
          <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={() => openForm()}>{t('add')}</button>
          <button className={styles.button} type="button" onClick={() => openForm(undefined, true)}>{t('quickAdd')}</button>
          <label className={styles.button}>
            {t('importJson')}
            <input type="file" accept=".json" onChange={(event) => void importFromJson(event)} style={{ display: 'none' }} />
          </label>
        </div>
      </section>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      {importError ? <p className={styles.error} role="alert">{importError}</p> : null}
      {importNotice ? <p className={styles.notice} role="status">{importNotice}</p> : null}
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
              <h2>{form.createdAt === form.updatedAt ? (quickAdd ? t('quickAdd') : t('add')) : t('edit')} {t('destinations')}</h2>
              {quickAdd && <span className={styles.tag}>Quick mode: English only</span>}
              <button className={styles.button} type="button" onClick={closeForm}>{t('cancel')}</button>
            </div>
            <p className={styles.notice}>{quickAdd ? t('quickAddNotice') : t('unverified')}</p>
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

      {quickAdd && quickForm ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label={t('destinations')}>
          <div className={`${styles.modal} ${styles.form}`}>
            <div className={styles.sectionHeading}>
              <h2>{t('quickAdd')} {t('destinations')}</h2>
              <button className={styles.button} type="button" onClick={closeForm}>{t('cancel')}</button>
            </div>
            <p className={styles.notice}>{t('quickAddNotice')}</p>
            <form className={styles.form} onSubmit={(event) => void saveQuickForm(event, false)}>
              <section className={styles.panel}>
                <h3>{t('title')} · EN</h3>
                <label className={styles.field}>{t('title')}<input className={styles.input} value={quickForm.name} onChange={(event) => patchQuickForm('name', event.target.value)} required /></label>
                <label className={styles.field}>{t('discover')}<input className={styles.input} value={quickForm.shortDescription} onChange={(event) => patchQuickForm('shortDescription', event.target.value)} required /></label>
                <label className={styles.field}>{t('history')}<textarea className={styles.textarea} value={quickForm.historicalBackground} onChange={(event) => patchQuickForm('historicalBackground', event.target.value)} required /></label>
                <label className={styles.field}>{t('description')}<textarea className={styles.textarea} value={quickForm.description} onChange={(event) => patchQuickForm('description', event.target.value)} required /></label>
              </section>
              <section className={styles.panel}>
                <h3>{t('area')} & {t('categoriesLabel')}</h3>
                <label className={styles.field}>{t('area')}
                  <select className={styles.select} value={quickForm.areaId} onChange={(event) => patchQuickForm('areaId', event.target.value)} required>
                    <option value="">—</option>
                    {areas.map((area) => <option key={area.id} value={area.id}>{area.translations.en || area.id}</option>)}
                  </select>
                </label>
                <div className={styles.stack}>
                  {categories.map((category) => (
                    <label className={styles.checkRow} key={category.id}>
                      <input
                        type="checkbox"
                        checked={quickForm.categoryIds.includes(category.id)}
                        onChange={(event) => patchQuickForm('categoryIds', event.target.checked
                          ? [...quickForm.categoryIds, category.id]
                          : quickForm.categoryIds.filter((id) => id !== category.id))}
                      />
                      <span>{category.translations.en || category.id}</span>
                    </label>
                  ))}
                </div>
              </section>
              <section className={styles.panel}>
                <h3>Cover Image</h3>
                <label className={styles.field}>{t('importMedia')}
                  <input className={styles.input} type="file" accept="image/*" capture="environment" onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) patchQuickForm('imageFile', file)
                  }} />
                  <p className={styles.muted}>{t('cameraCaptureHint')}</p>
                </label>
                {quickForm.imageFile && <p className={styles.muted}>Selected: {quickForm.imageFile.name}</p>}
              </section>
              {error ? <p className={styles.error} role="alert">{error}</p> : null}
              <div className={styles.buttonRow}>
                <button className={styles.button} type="submit">{t('saveDraft')}</button>
                <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={() => void saveQuickForm(undefined, true)}>{t('publish')}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  )
}
