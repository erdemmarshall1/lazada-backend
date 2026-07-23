import axios from 'axios'
import qs from 'qs'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useAppStore } from '@/stores/app'

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

const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const EXTERNAL_IMAGE_DOMAINS = [
  'pixabay.com', 'd3oobv9weovhej.cloudfront.net', 'images.pexels.com',
  'cdn.pixabay.com', 'i.imgur.com', 'unsplash.com', 'images.unsplash.com',
  'picsum.photos',
]

const needsProxy = (url) => {
  try {
    const host = new URL(url).hostname
    return EXTERNAL_IMAGE_DOMAINS.some(d => host === d || host.endsWith('.' + d))
  } catch { return false }
}

export const imgUrl = (path) => {
  if (!path) return TRANSPARENT_PIXEL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (needsProxy(path)) return `${API_BASE}/home/image/proxy?url=${encodeURIComponent(path)}`
    return path
  }
  if (path.startsWith('/')) return `${API_BASE}${path}`
  return path
}

service.interceptors.request.use((config) => {
  const store = useAppStore()
  const token = store.token || localStorage.getItem('theoutnet_token') || localStorage.getItem('seller_temp_token') || localStorage.getItem('theoutnet_admin_token')
  if (token) {
    config.headers.token = token
    config.headers.Authorization = `Bearer ${token}`
    config.headers['x-access-token'] = token
  }
  if (store.lang) {
    config.headers.lang = store.lang
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
      const store = useAppStore()
      const refreshToken = store.refreshToken || localStorage.getItem('theoutnet_refresh_token')
      if (refreshToken && !data?.twoFactorRequired) {
        if (!isRefreshing) {
          isRefreshing = true
          axios.post(`${API_BASE}/home/auth/refresh`, { refreshToken })
            .then((res) => {
              const refreshData = res?.data
              if (refreshData?.code === 0 && refreshData?.data?.token) {
                const store = useAppStore()
                store.setToken(refreshData.data.token)
                store.setRefreshToken(refreshData.data.refreshToken)
                isRefreshing = false
                onRefreshed(refreshData.data.token, refreshData.data.refreshToken)
              } else {
                isRefreshing = false
                refreshSubscribers = []
                store.logout()
                if (router.currentRoute.value.fullPath !== '/login') {
                  router.push('/login')
                  showAuthErrorOnce('Please enter your username/email and password to access your account')
                }
              }
            })
            .catch(() => {
              isRefreshing = false
              refreshSubscribers = []
              const store = useAppStore()
              store.logout()
              if (router.currentRoute.value.fullPath !== '/login') {
                router.push('/login')
                ElMessage.error('Please enter your username/email and password to access your account')
              }
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
      store.logout()
      if (router.currentRoute.value.fullPath !== '/login') {
        router.push('/login')
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
      const store = useAppStore()
      const refreshToken = store.refreshToken || localStorage.getItem('theoutnet_refresh_token')
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true
          axios.post(`${API_BASE}/home/auth/refresh`, { refreshToken })
            .then((res) => {
              const refreshData = res?.data
              if (refreshData?.code === 0 && refreshData?.data?.token) {
                const store = useAppStore()
                store.setToken(refreshData.data.token)
                store.setRefreshToken(refreshData.data.refreshToken)
                isRefreshing = false
                onRefreshed(refreshData.data.token, refreshData.data.refreshToken)
              } else {
                isRefreshing = false
                refreshSubscribers = []
                store.logout()
                if (router.currentRoute.value.fullPath !== '/login') {
                  router.push('/login')
                  showAuthErrorOnce('Please enter your username/email and password to access your account')
                }
              }
            })
            .catch(() => {
              isRefreshing = false
              refreshSubscribers = []
              const store = useAppStore()
              store.logout()
              if (router.currentRoute.value.fullPath !== '/login') {
                router.push('/login')
                ElMessage.error('Please enter your username/email and password to access your account')
              }
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
      store.logout()
      if (router.currentRoute.value.fullPath !== '/login') {
        router.push('/login')
        showAuthErrorOnce('Please enter your username/email and password to access your account')
      }
      return Promise.reject(error)
    }

    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export const $http = service

export const get = (url, params) => service.get(url, { params })
export const post = (url, data) => service.post(url, data)
export const put = (url, data) => service.put(url, data)
export const del = (url) => service.delete(url)
export const patch = (url, data) => service.patch(url, data)

export const qe = async (fn) => {
  try {
    const res = await fn
    if (res.code < 0) {
      ElMessage.error(res.msg || 'Error')
      return null
    }
    return res
  } catch (e) {
    return null
  }
}

export const uploadFile = async (file, data = {}) => {
  const formData = new FormData()
  formData.append('file', file)
  Object.keys(data).forEach(k => formData.append(k, data[k]))
  return service.post('/home/upload/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
