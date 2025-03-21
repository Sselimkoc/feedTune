'use client'

import { useParams } from 'next/navigation'
import { getLanguage } from '@/i18n'

export function useLanguage() {
  const params = useParams()
  const locale = getLanguage(params?.locale)
  
  // Dynamic import for translations
  const translations = require(`@/i18n/locales/${locale}.json`)
  
  function t(key) {
    return key.split('.').reduce((obj, i) => obj[i], translations)
  }

  return { t, locale }
} 