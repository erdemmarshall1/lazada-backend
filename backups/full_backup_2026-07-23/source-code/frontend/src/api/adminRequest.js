import axios from 'axios'
import { ElMessage } from 'element-plus'

export const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const service = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

let isRefreshing = false
let refreshSubscribers = []
let lastAuthErrorTime = 0

const onRefreshed = (newToken, newRefreshToken) => {
  refreshSubscribers.forEach(cb => cb(newToken, newRefreshToken))
  refreshSubscribers = []
}

const addRefreshSubscriber = (cb) => {
  refreshSubscribers.push(cb)
}

const showAuthErrorOnce = (msg) => {
  const now = Date.now()
  if (now - lastAuthErrorTime > 3000) {
    lastAuthErrorTime = now
    ElMessage.error(msg)
  }
}

const ADMIN_TOKEN_KEY = 'theoutnet_admin_token'
const ADMIN_REFRESH_KEY = 'theoutnet_admin_refresh'

const getAdminToken = () => {
  try { return localStorage.getItem(ADMIN_TOKEN_KEY) || '' } catch { return '' }
}

const setAdminToken = (token) => {
  try { localStorage.setItem(ADMIN_TOKEN_KEY, token || '') } catch {}
}

const getAdminRefreshToken = () => {
  try { return localStorage.getItem(ADMIN_REFRESH_KEY) || '' } catch { return '' }
}

const setAdminRefreshToken = (token) => {
  try { localStorage.setItem(ADMIN_REFRESH_KEY, token || '') } catch {}
}

const removeAdminTokens = () => {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(ADMIN_REFRESH_KEY)
  } catch {}
}

service.interceptors.request.use((config) => {
  const token = getAdminToken()
  if (token) {
    config.headers.token = token
    config.headers.Authorization = `Bearer ${token}`
    config.headers['x-access-token'] = token
  }
  config.headers['X-Requested-With'] = 'XMLHttpRequest'
  if (config.method === 'post' && config.headers['Content-Type'] !== 'multipart/form-data') {
    if (typeof config.data !== 'string' && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
      config.data = JSON.stringify(config.data)
    }
  }
  return config
})

service.interceptors.response.use(
  (response) => {
    const data = response?.data
    const msg = data?.msg || data?.message || ''
    if (data?.code === -2) {
      return data
    }

    const isAuthError = data?.code === -1 || data?.code === 401 || data?.code === 403 ||
      (data?.code !== 0 && data?.code !== 1 && /not authorized|token expired|invalid token|not logged in|please login|token required|refresh token/i.test(msg))

    if (isAuthError) {
      const refreshToken = getAdminRefreshToken()
      if (refreshToken && !data?.twoFactorRequired) {
        if (!isRefreshing) {
          isRefreshing = true
          axios.post(`${API_BASE}/home/admin/auth/refresh`, { refreshToken })
            .then((res) => {
              const refreshData = res?.data
              if (refreshData?.code === 0 && refreshData?.data?.token) {
                setAdminToken(refreshData.data.token)
                setAdminRefreshToken(refreshData.data.refreshToken)
                isRefreshing = false
                onRefreshed(refreshData.data.token, refreshData.data.refreshToken)
              } else {
                isRefreshing = false
                refreshSubscribers = []
                removeAdminTokens()
                window.location.href = '/admin'
                showAuthErrorOnce('Please enter your username/email and password to access your account')
              }
            })
            .catch(() => {
              isRefreshing = false
              refreshSubscribers = []
              removeAdminTokens()
              window.location.href = '/admin'
              ElMessage.error('Please enter your username/email and password to access your account')
            })
        }
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken) => {
            response.config.headers.token = newToken
            response.config.headers.Authorization = `Bearer ${newToken}`
            response.config.headers['x-access-token'] = newToken
            resolve(service(response.config))
          })
        })
      }
      removeAdminTokens()
      if (window.location.pathname !== '/admin') {
        window.location.href = '/admin'
        showAuthErrorOnce('Please enter your username/email and password to access your account')
      }
      return Promise.reject(data)
    }

    return data
  },
  (error) => {
    const data = error?.response?.data
    const msg = data?.msg || data?.message || error?.message || 'Network error'
    const isAuthError = error?.response?.status === 401 || error?.response?.status === 403 ||
      /not authorized|token expired|invalid token|not logged in|please login|token required|refresh token/i.test(msg)

    if (isAuthError) {
      const refreshToken = getAdminRefreshToken()
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true
          axios.post(`${API_BASE}/home/admin/auth/refresh`, { refreshToken })
            .then((res) => {
              const refreshData = res?.data
              if (refreshData?.code === 0 && refreshData?.data?.token) {
                setAdminToken(refreshData.data.token)
                setAdminRefreshToken(refreshData.data.refreshToken)
                isRefreshing = false
                onRefreshed(refreshData.data.token, refreshData.data.refreshToken)
              } else {
                isRefreshing = false
                refreshSubscribers = []
                removeAdminTokens()
                window.location.href = '/admin'
                showAuthErrorOnce('Please enter your username/email and password to access your account')
              }
            })
            .catch(() => {
              isRefreshing = false
              refreshSubscribers = []
              removeAdminTokens()
              window.location.href = '/admin'
              ElMessage.error('Please enter your username/email and password to access your account')
            })
        }
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken) => {
            error.config.headers.token = newToken
            error.config.headers.Authorization = `Bearer ${newToken}`
            error.config.headers['x-access-token'] = newToken
            resolve(service(error.config))
          })
        })
      }
      removeAdminTokens()
      if (window.location.pathname !== '/admin') {
        window.location.href = '/admin'
        showAuthErrorOnce('Please enter your username/email and password to access your account')
      }
      return Promise.reject(error)
    }

    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export const adminRequest = service
export const adminGet = (url, params) => service.get(url, { params })
export const adminPost = (url, data) => service.post(url, data)
export const adminPut = (url, data) => service.put(url, data)
export const adminDel = (url) => service.delete(url)
