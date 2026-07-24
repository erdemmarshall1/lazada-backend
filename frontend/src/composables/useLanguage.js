import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { isValidLang, switchLocale } from '@/locales'

const LANG_KEY = 'theoutnet_lang'
const RECENT_KEY = 'theoutnet_recent_langs'

const safeGet = (key, fallback) => {
  try { return localStorage.getItem(key) || fallback } catch { return fallback }
}
const safeSet = (key, val) => {
  try { localStorage.setItem(key, val) } catch {}
}

export const LANGUAGE_DATA = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', region: 'europe' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', native: '简体中文', flag: '🇨🇳', region: 'asia' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', native: '繁體中文', flag: '🇭🇰', region: 'asia' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳', region: 'asia' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', region: 'europe' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', region: 'europe' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵', region: 'asia' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', region: 'europe' },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷', region: 'asia' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇵🇹', region: 'europe' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺', region: 'europe' },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹', region: 'europe' },
  { code: 'th', name: 'Thai', native: 'ไทย', flag: '🇹🇭', region: 'asia' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', region: 'middleEast' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷', region: 'europe' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', flag: '🇳🇱', region: 'europe' },
  { code: 'pl', name: 'Polish', native: 'Polski', flag: '🇵🇱', region: 'europe' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', region: 'asia' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩', region: 'asia' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', flag: '🇲🇾', region: 'asia' },
]

export const REGION_KEYS = ['all', 'europe', 'asia', 'middleEast']

const browserLangRaw = typeof navigator !== 'undefined' ? navigator.language : ''
const browserLangShort = browserLangRaw.split('-')[0]
const detectedCode = LANGUAGE_DATA.find(l => l.code === browserLangRaw)?.code
  || LANGUAGE_DATA.find(l => l.code === browserLangShort)?.code
  || null

function getRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function setRecent(codes) {
  safeSet(RECENT_KEY, JSON.stringify(codes.slice(0, 5)))
}

const searchQuery = ref('')
const regionFilter = ref('all')
const isOpen = ref(false)

export function useLanguage() {
  const store = useAppStore()

  const currentLang = computed(() => LANGUAGE_DATA.find(l => l.code === store.lang) || LANGUAGE_DATA[0])

  const recentCodes = ref(getRecent())

  const recentLanguages = computed(() => {
    return recentCodes.value
      .map(c => LANGUAGE_DATA.find(l => l.code === c))
      .filter(Boolean)
  })

  const filteredLanguages = computed(() => {
    let list = LANGUAGE_DATA
    if (regionFilter.value && regionFilter.value !== 'all') {
      list = list.filter(l => l.region === regionFilter.value)
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      list = list.filter(l =>
        l.name.toLowerCase().includes(q)
        || l.native.toLowerCase().includes(q)
        || l.code.toLowerCase().includes(q)
      )
    }
    return list
  })

  async function changeLanguage(code) {
    if (code === store.lang || !isValidLang(code)) return
    store.setLanguage(code)
    await switchLocale(code)
    const recents = getRecent()
    const filtered = recents.filter(c => c !== code)
    filtered.unshift(code)
    setRecent(filtered)
    recentCodes.value = getRecent()
  }

  function setSearch(q) {
    searchQuery.value = q
  }

  function setRegion(region) {
    regionFilter.value = region
  }

  function toggleOpen() {
    isOpen.value = !isOpen.value
  }

  function close() {
    isOpen.value = false
    searchQuery.value = ''
  }

  return {
    currentLang,
    recentLanguages,
    recentCodes,
    filteredLanguages,
    searchQuery,
    regionFilter,
    isOpen,
    detectedCode,
    changeLanguage,
    setSearch,
    setRegion,
    toggleOpen,
    close,
  }
}
