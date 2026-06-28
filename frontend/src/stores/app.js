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
    token: safeStorageGet('lazada_token', ''),
    userInfo: safeParseJSON(safeStorageGet('lazada_user'), {}),
    carNum: 0,
    lang: safeStorageGet('lazada_lang', 'en'),
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
    isSeller: (state) => state.userInfo?.role === 'seller' || state.userInfo?.role === 'admin',
    isAdmin: (state) => state.userInfo?.role === 'admin',
  },

  actions: {
    setToken(token) {
      this.token = token || ''
      safeStorageSet('lazada_token', this.token)
    },
    setUserInfo(info) {
      this.userInfo = info || {}
      safeStorageSet('lazada_user', JSON.stringify(this.userInfo))
    },
    setLanguage(lang) {
      this.lang = lang || 'en'
      safeStorageSet('lazada_lang', this.lang)
    },
    setWalletBalance(balance) {
      this.walletBalance = balance
    },
    setLoadingShow(show) {
      this.loadingShow = show
    },
    logout() {
      this.token = ''
      this.userInfo = {}
      this.carNum = 0
      this.userUnreadMsgNum = 0
      this.storeUnReadMsgNum = 0
      this.newOrderCount = 0
      this.refundRequestCount = 0
      this.walletBalance = 0
      safeStorageRemove('lazada_token')
      safeStorageRemove('lazada_user')
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
