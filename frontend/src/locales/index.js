import { createI18n } from 'vue-i18n'
import en from './en.json'
import zhCN from './zh-CN.json'
import zhTW from './zh-TW.json'
import vi from './vi.json'
import de from './de.json'
import fr from './fr.json'
import ja from './ja.json'
import es from './es.json'

const messages = {
  'en': en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'vi': vi,
  'de': de,
  'fr': fr,
  'ja': ja,
  'es': es,
}

const safeStorageGet = (key, fallback = '') => {
  try {
    return localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

const savedLang = safeStorageGet('lazada_lang')
const browserLang = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en'
const defaultLang = savedLang || (messages[browserLang] ? browserLang : 'en')

const i18n = createI18n({
  legacy: false,
  locale: defaultLang,
  fallbackLocale: 'en',
  messages,
})

export default i18n
export const t = (key) => i18n.global.t(key)
