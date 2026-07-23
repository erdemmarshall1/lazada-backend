import { defineStore } from 'pinia'
import { disconnectSocket } from '@/socket'
import { get } from '@/api/request'

const safeStorageGet = (key, fallback = '') => {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

const safeStorageSet = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore storage write failures
  }
}

const safeStorageRemove = (key) => {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore storage removal failures
  }
}

const safeParseJSON = (value, fallback = {}) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const DEFAULT_LANG_LIST = [
  { code: 'en', name: 'English' }, { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' }, { code: 'vi', name: 'Tiếng Việt' },
  { code: 'de', name: 'Deutsch' }, { code: 'fr', name: 'Français' },
  { code: 'ja', name: '日本語' }, { code: 'es', name: 'Español' },
  { code: 'ko', name: '한국어' }, { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' }, { code: 'it', name: 'Italiano' },
  { code: 'th', name: 'ไทย' }, { code: 'ar', name: 'العربية' },
  { code: 'tr', name: 'Türkçe' }, { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' }, { code: 'hi', name: 'हिन्दी' },
  { code: 'id', name: 'Bahasa Indonesia' }, { code: 'ms', name: 'Bahasa Melayu' },
]

export const useAppStore = defineStore('app', {
  state: () => ({
    token: safeStorageGet('theoutnet_token', ''),
    refreshToken: safeStorageGet('theoutnet_refresh_token', ''),
    userInfo: safeParseJSON(safeStorageGet('theoutnet_user'), {}),
    carNum: 0,
    lang: safeStorageGet('theoutnet_lang', 'en'),
    langList: DEFAULT_LANG_LIST,
    langObj: {},
    loadedLanguages: [],
    system: {},
    lunbo: [],
    webLogo: {},
    userUnreadMsgNum: 0,
    storeUnReadMsgNum: 0,
    loadingShow: false,
    audioList: [],
    kefu: '',
    newOrderCount: 0,
    refundRequestCount: 0,
    walletBalance: 0,

  }),

  getters: {
    isLogin: (state) => !!state.token,
    isSeller: (state) => ['seller', 'admin', 'super_admin', 'manager', 'staff'].includes(state.userInfo?.role),
    isAdmin: (state) => ['admin', 'super_admin'].includes(state.userInfo?.role),
    isSuperAdmin: (state) => state.userInfo?.role === 'super_admin',
  },

  actions: {
    setToken(token) {
      this.token = token || ''
      safeStorageSet('theoutnet_token', this.token)
    },
    setRefreshToken(refreshToken) {
      this.refreshToken = refreshToken || ''
      safeStorageSet('theoutnet_refresh_token', this.refreshToken)
    },
    setUserInfo(info) {
      this.userInfo = info || {}
      safeStorageSet('theoutnet_user', JSON.stringify(this.userInfo))
    },
    setLanguage(lang) {
      this.lang = lang || 'en'
      safeStorageSet('theoutnet_lang', this.lang)
    },
    setWalletBalance(balance) {
      this.walletBalance = balance
    },
    setLoadingShow(show) {
      this.loadingShow = show
    },
    logout() {
      this.token = ''
      this.refreshToken = ''
      this.userInfo = {}
      this.carNum = 0
      this.userUnreadMsgNum = 0
      this.storeUnReadMsgNum = 0
      this.newOrderCount = 0
      this.refundRequestCount = 0
      this.walletBalance = 0
      safeStorageRemove('theoutnet_token')
      safeStorageRemove('theoutnet_refresh_token')
      safeStorageRemove('theoutnet_user')
      disconnectSocket()
    },
    addAudio(src) {
      this.audioList.push(src)
    },
    applyTheme(theme) {
      if (!theme) return
      const root = document.documentElement
      const map = {
        primaryColor: '--g-main_color',
        backgroundColor: '--g-bg',
        textColor: '--g-text',
        accentColor: '--g-accent',
        borderColor: '--g-border',
        fontFamily: '--g-font-family',
      }
      Object.entries(map).forEach(([key, cssVar]) => {
        if (cssVar && theme[key]) {
          root.style.setProperty(cssVar, theme[key])
        }
      })
      if (theme.primaryColor) {
        root.style.setProperty('--g-main_color_hover', theme.primaryColor + 'cc')
        root.style.setProperty('--el-color-primary', theme.primaryColor)
      }
      if (theme.customCSS) {
        let styleEl = document.getElementById('theme-custom-css')
        if (!styleEl) {
          styleEl = document.createElement('style')
          styleEl.id = 'theme-custom-css'
          document.head.appendChild(styleEl)
        }
        styleEl.textContent = theme.customCSS
      }
      if (theme.siteName) {
        document.title = theme.siteName
      }
      if (theme.logoUrl) {
        const logo = document.querySelector('.ton-logo-img')
        if (logo) logo.src = theme.logoUrl
      }
      if (theme.faviconUrl) {
        const link = document.getElementById('linkicon')
        if (link) link.href = theme.faviconUrl
      }
    },
    incrementNewOrderCount() {
      this.newOrderCount++
    },
    resetNewOrderCount() {
      this.newOrderCount = 0
    },
    incrementRefundRequestCount() {
      this.refundRequestCount++
    },
    resetRefundRequestCount() {
      this.refundRequestCount = 0
    },

  },
})