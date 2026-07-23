import { defineStore } from 'pinia'

const ADMIN_TOKEN_KEY = 'theoutnet_admin_token'
const ADMIN_REFRESH_KEY = 'theoutnet_admin_refresh'
const ADMIN_USER_KEY = 'theoutnet_admin_user'

const safeGet = (key, fallback = '') => {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}
const safeSet = (key, value) => {
  try { localStorage.setItem(key, value) } catch {}
}
const safeRemove = (key) => {
  try { localStorage.removeItem(key) } catch {}
}
const safeParse = (value, fallback = {}) => {
  if (!value) return fallback
  try { return JSON.parse(value) } catch { return fallback }
}

export const useAdminAppStore = defineStore('adminApp', {
  state: () => ({
    token: safeGet(ADMIN_TOKEN_KEY, ''),
    refreshToken: safeGet(ADMIN_REFRESH_KEY, ''),
    userInfo: safeParse(safeGet(ADMIN_USER_KEY), {}),
  }),
  getters: {
    isLogin: (state) => !!state.token,
    isAdmin: (state) => ['admin', 'super_admin'].includes(state.userInfo?.role),
    isSuperAdmin: (state) => state.userInfo?.role === 'super_admin',
  },
  actions: {
    setToken(token) {
      this.token = token || ''
      safeSet(ADMIN_TOKEN_KEY, this.token)
    },
    setRefreshToken(refreshToken) {
      this.refreshToken = refreshToken || ''
      safeSet(ADMIN_REFRESH_KEY, this.refreshToken)
    },
    setUserInfo(info) {
      this.userInfo = info || {}
      safeSet(ADMIN_USER_KEY, JSON.stringify(this.userInfo))
    },
    logout() {
      this.token = ''
      this.refreshToken = ''
      this.userInfo = {}
      safeRemove(ADMIN_TOKEN_KEY)
      safeRemove(ADMIN_REFRESH_KEY)
      safeRemove(ADMIN_USER_KEY)
    },
  },
})
