import { defineStore } from 'pinia'
import { disconnectSocket } from '@/socket'

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

export const useAppStore = defineStore('app', {
  state: () => ({
    token: safeStorageGet('theoutnet_token', ''),
    refreshToken: safeStorageGet('theoutnet_refresh_token', ''),
    userInfo: safeParseJSON(safeStorageGet('theoutnet_user'), {}),
    carNum: 0,
    lang: safeStorageGet('theoutnet_lang', 'en'),
    langList: [],
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
