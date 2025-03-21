// i18n configuration
export const i18n = {
  defaultLocale: 'tr',
  locales: ['tr', 'en'],
}

// Helper function to get user language
export function getLanguage(locale) {
  return i18n.locales.includes(locale) ? locale : i18n.defaultLocale
} 