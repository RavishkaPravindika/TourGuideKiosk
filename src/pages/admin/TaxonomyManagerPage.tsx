import { useState } from 'react'
import { getDatabase } from '@/database/db'
import { LocalMediaThumbnail } from '@/components/destination/DestinationCard'
import { LANGUAGES, type Area, type Category, type Language } from '@/database/schema'
import { useAppData } from '@/contexts/AppDataContext'
import { useLanguage } from '@/hooks/useLanguage'
import { createId, errorText } from '@/utils/runtime'
import styles from '@/styles/application.module.scss'

type TaxonomyItem = Area | Category
type TaxonomyDraft = TaxonomyItem & { parentAreaId?: string | null; icon?: string }

function emptyDraft(kind: 'area' | 'category'): TaxonomyDraft {
  const names = { en: '', de: '', ru: '', ja: '' }
  const descriptions = { en: '', de: '', ru: '', ja: '' }
  const base = {
    id: createId(),
    translations: names,
    descriptions,
    imageMediaId: null,
    sortOrder: 100,
  }
  return kind === 'area' ? { ...base, parentAreaId: null } : { ...base, icon: 'map-pin' }
}

export function TaxonomyManagerPage({ kind }: { kind: 'area' | 'category' }) {
  const { areas, categories, destinations, media } = useAppData()
  const { language, t } = useLanguage()
  const [draft, setDraft] = useState<TaxonomyDraft | null>(null)
  const [draftLanguage, setDraftLanguage] = useState<Language>('en')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const items: TaxonomyItem[] = kind === 'area' ? areas : categories
  const title = kind === 'area' ? t('areas') : t('categories')

  const updateText = (type: 'translations' | 'descriptions', value: string) => {
    setDraft((current) => current ? {
      ...current,
      [type]: { ...current[type], [draftLanguage]: value },
    } : current)
  }

  const save = async () => {
    if (!draft) return
    setError(null)
    if (!LANGUAGES.every((code) => draft.translations[code].trim())) {
      setError('Add a name in all four languages. Descriptions may remain empty.')
      return
    }
    if (kind === 'area' && draft.parentAreaId) {
      let parentId: string | null = draft.parentAreaId
      const visited = new Set<string>()
      while (parentId && !visited.has(parentId)) {
        if (parentId === draft.id) {
          setError('An area cannot be its own ancestor.')
          return
        }
        visited.add(parentId)
        parentId = areas.find((area) => area.id === parentId)?.parentAreaId ?? null
      }
    }
    try {
      if (kind === 'area') await getDatabase().areas.put(draft as Area)
      else await getDatabase().categories.put(draft as Category)
      setDraft(null)
      setNotice(t('settingsSaved'))
    } catch (cause) {
      setError(errorText(cause))
    }
  }

  const remove = async (item: TaxonomyItem) => {
    if (!window.confirm(t('confirmDelete'))) return
    const references = kind === 'area'
      ? destinations.some((destination) => destination.areaId === item.id)
      : destinations.some((destination) => destination.categoryIds.includes(item.id))
    if (references) {
      setError('Reassign the destinations that use this item before deleting it.')
      return
    }
    try {
      if (kind === 'area') {
        const hasChildren = areas.some((area) => area.parentAreaId === item.id)
        if (hasChildren) {
          setError('Move or delete child areas before deleting this area.')
          return
        }
        await getDatabase().areas.delete(item.id)
      } else {
        await getDatabase().categories.delete(item.id)
      }
      setNotice(t('delete'))
    } catch (cause) {
      setError(errorText(cause))
    }
  }

  return (
    <main className={styles.content}>
      <section className={styles.sectionHeading}>
        <h1 className={styles.pageTitle}>{title}</h1>
        <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={() => {
          setDraft(emptyDraft(kind))
          setDraftLanguage(language)
          setError(null)
        }}>{t('add')}</button>
      </section>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      <div className={styles.grid}>
        {items.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((item) => (
          <article className={styles.panel} key={item.id}>
            <LocalMediaThumbnail mediaId={item.imageMediaId} />
            <h2>{item.translations[language] || t('missingTranslation')}</h2>
            <p className={styles.muted}>{item.descriptions[language] || t('missingTranslation')}</p>
            <div className={styles.buttonRow}>
              <button className={styles.button} type="button" onClick={() => {
                setDraft(structuredClone(item))
                setDraftLanguage(language)
                setError(null)
              }}>{t('edit')}</button>
              <button className={`${styles.button} ${styles.buttonDanger}`} type="button" onClick={() => void remove(item)}>{t('delete')}</button>
            </div>
          </article>
        ))}
      </div>

      {draft ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label={title}>
          <div className={`${styles.modal} ${styles.form}`}>
            <div className={styles.sectionHeading}>
              <h2>{title}</h2>
              <button className={styles.button} type="button" onClick={() => setDraft(null)}>{t('cancel')}</button>
            </div>
            <div className={styles.buttonRow}>
              {LANGUAGES.map((code) => (
                <button className={`${styles.button} ${draftLanguage === code ? styles.buttonPrimary : ''}`} key={code} type="button" onClick={() => setDraftLanguage(code)}>
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            <label className={styles.field}>{t('title')} · {draftLanguage.toUpperCase()}
              <input className={styles.input} value={draft.translations[draftLanguage]} onChange={(event) => updateText('translations', event.target.value)} />
            </label>
            <label className={styles.field}>{t('description')} · {draftLanguage.toUpperCase()}
              <textarea className={styles.textarea} value={draft.descriptions[draftLanguage]} onChange={(event) => updateText('descriptions', event.target.value)} />
            </label>
            <label className={styles.field}>{t('thumbnail')}
              <select className={styles.select} value={draft.imageMediaId ?? ''} onChange={(event) => setDraft((current) => current ? { ...current, imageMediaId: event.target.value || null } : current)}>
                <option value="">—</option>
                {media.filter((item) => item.mediaType === 'image').map((item) => <option key={item.id} value={item.id}>{item.fileName}</option>)}
              </select>
            </label>
            {kind === 'area' ? (
              <label className={styles.field}>{t('areas')}
                <select
                  className={styles.select}
                  value={draft.parentAreaId ?? ''}
                  onChange={(event) => setDraft((current) => current ? { ...current, parentAreaId: event.target.value || null } : current)}
                >
                  <option value="">—</option>
                  {areas.filter((area) => area.id !== draft.id).map((area) => <option key={area.id} value={area.id}>{area.translations[language]}</option>)}
                </select>
              </label>
            ) : (
              <label className={styles.field}>{t('categories')}
                <input className={styles.input} value={draft.icon ?? ''} onChange={(event) => setDraft((current) => current ? { ...current, icon: event.target.value } : current)} />
              </label>
            )}
            <label className={styles.field}>Sort order
              <input className={styles.input} type="number" value={draft.sortOrder} onChange={(event) => setDraft((current) => current ? { ...current, sortOrder: Number(event.target.value) } : current)} />
            </label>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={() => void save()}>{t('save')}</button>
          </div>
        </div>
      ) : null}
    </main>
  )
}
