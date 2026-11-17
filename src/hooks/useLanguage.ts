import { useMemo } from 'react'
import { languageNames, translate } from '@/data/uiTranslations'
import type { Language } from '@/database/schema'
import { useAppData } from '@/contexts/AppDataContext'

export function useLanguage() {
  const { session, settings } = useAppData()
  const language: Language = session?.language ?? settings?.defaultLanguage ?? 'en'
  return useMemo(() => ({
    language,
    languageNames,
    t: (key: Parameters<typeof translate>[1]) => translate(language, key),
  }), [language])
}
