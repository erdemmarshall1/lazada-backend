import { createI18n } from 'vue-i18n'
import en from './en.json'
import zhCN from './zh-CN.json'
import zhTW from './zh-TW.json'
import vi from './vi.json'
import de from './de.json'
import fr from './fr.json'
import ja from './ja.json'
import es from './es.json'
import ko from './ko.json'
import pt from './pt.json'
import ru from './ru.json'
import it from './it.json'
import th from './th.json'
import ar from './ar.json'
import tr from './tr.json'
import nl from './nl.json'
import pl from './pl.json'
import hi from './hi.json'
import id from './id.json'
import ms from './ms.json'

const messages = {
  'en': en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'vi': vi,
  'de': de,
  'fr': fr,
  'ja': ja,
  'es': es,
  'ko': ko,
  'pt': pt,
  'ru': ru,
  'it': it,
  'th': th,
  'ar': ar,
  'tr': tr,
  'nl': nl,
  'pl': pl,
  'hi': hi,
  'id': id,
  'ms': ms,
}

const safeStorageGet = (key, fallback = '') => {
  try {
    return localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

export const supportedCodes = Object.keys(messages)
export const isValidLang = (code) => supportedCodes.includes(code)

const savedLang = safeStorageGet('theoutnet_lang')
const browserLang = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en'
const browserLangShort = typeof navigator !== 'undefined' && navigator.language ? navigator.language.split('-')[0] : 'en'
const defaultLang = savedLang || (messages[browserLang] ? browserLang : (messages[browserLangShort] ? browserLangShort : 'en'))

const i18n = createI18n({
  legacy: false,
  locale: defaultLang,
  fallbackLocale: 'en',
  messages,
})

const rtlCodes = ['ar']

const elLocaleMap = {
  'en': () => import('element-plus/dist/locale/en.mjs'),
  'zh-CN': () => import('element-plus/dist/locale/zh-cn.mjs'),
  'zh-TW': () => import('element-plus/dist/locale/zh-tw.mjs'),
  'vi': () => import('element-plus/dist/locale/vi.mjs'),
  'de': () => import('element-plus/dist/locale/de.mjs'),
  'fr': () => import('element-plus/dist/locale/fr.mjs'),
  'ja': () => import('element-plus/dist/locale/ja.mjs'),
  'es': () => import('element-plus/dist/locale/es.mjs'),
  'ko': () => import('element-plus/dist/locale/ko.mjs'),
  'pt': () => import('element-plus/dist/locale/pt-br.mjs'),
  'ru': () => import('element-plus/dist/locale/ru.mjs'),
  'it': () => import('element-plus/dist/locale/it.mjs'),
  'th': () => import('element-plus/dist/locale/th.mjs'),
  'ar': () => import('element-plus/dist/locale/ar.mjs'),
  'tr': () => import('element-plus/dist/locale/tr.mjs'),
  'nl': () => import('element-plus/dist/locale/nl.mjs'),
  'pl': () => import('element-plus/dist/locale/pl.mjs'),
  'hi': () => import('element-plus/dist/locale/hi.mjs'),
  'id': () => import('element-plus/dist/locale/id.mjs'),
  'ms': () => import('element-plus/dist/locale/ms.mjs'),
}

const elLocaleCache = {}
let _app = null

function setAppInstance(app) {
  _app = app
}

async function switchLocale(code) {
  if (!code || !messages[code]) return
  i18n.global.locale.value = code
  setDocumentLang(code)
  if (_app && elLocaleMap[code]) {
    if (!elLocaleCache[code]) {
      elLocaleCache[code] = (await elLocaleMap[code]()).default
    }
    _app.config.globalProperties.$ELEMENT = { locale: elLocaleCache[code] }
  }
}

export function setDocumentLang(locale) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale || 'en'
    document.documentElement.dir = rtlCodes.includes(locale) ? 'rtl' : 'ltr'
  }
}

if (typeof document !== 'undefined') {
  setDocumentLang(defaultLang)
}

export default i18n
export const t = (key) => i18n.global.t(key)
export const isRtl = (locale) => rtlCodes.includes(locale)
export { rtlCodes, elLocaleMap, elLocaleCache, switchLocale, setAppInstance }
