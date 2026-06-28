import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import i18n from './locales'
import './assets/styles/global.css'
import './assets/styles/iconfont.css'
import { useAppStore } from '@/stores/app'
import { connectSocket, getSocket } from '@/socket'
import { imgUrl as _imgUrl, API_BASE } from '@/api/request'

const app = createApp(App)
app.config.globalProperties.$imgUrl = _imgUrl

const IMG_CDN = 'https://d3oobv9weovhej.cloudfront.net'

const getFilename = (url) => {
  try { const p = url.split('/'); return p[p.length - 1] || '' } catch { return '' }
}

app.config.globalProperties.$imgFallback = function (e) {
  let img = e.target
  if (img?.tagName === 'DIV' || img?.tagName === 'SPAN') {
    img = img.querySelector('img')
  }
  if (!img || !img.dataset) return
  if (img.dataset.errored) return
  const src = img.src || ''
  const path = src.startsWith(API_BASE) ? src.slice(API_BASE.length) : (src.startsWith('http') ? '' : src)
  const filename = getFilename(path || src)
  const tryUrl = (url, flag) => {
    if (img.dataset[flag]) return false
    if (url && url !== src) {
      img.dataset[flag] = '1'
      img.crossOrigin = 'anonymous'
      img.src = url
      return true
    }
    img.dataset[flag] = '1'
    return false
  }
  if (path.startsWith('/home/image/proxy') || path.startsWith('/home/image/placeholder')) {
    img.dataset.errored = '1'
    const fallbackUrl = API_BASE + '/home/image/placeholder?text=' + encodeURIComponent(filename || 'Product')
    if (fallbackUrl !== src) { img.src = fallbackUrl; return }
    img.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    img.style.objectFit = 'contain'
    img.style.padding = '10%'
    img.alt = 'Product Image'
    return
  }
  if (path && tryUrl(IMG_CDN + (path.startsWith('/') ? path : '/' + path), 'cdnTried')) return
  if (filename && !path.includes('/product_images/') && tryUrl(IMG_CDN + '/uploads/product_images/' + filename, 'productImagesTried')) return
  if (filename && tryUrl(IMG_CDN + '/' + filename, 'filenameTried')) return
  img.dataset.errored = '1'
  const fallbackUrl = API_BASE + '/home/image/placeholder?text=' + encodeURIComponent(filename || 'Product')
  if (fallbackUrl !== src) { img.src = fallbackUrl; return }
  img.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  img.style.objectFit = 'contain'
  img.style.padding = '10%'
  img.alt = 'Product Image'
}
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.use(i18n)
app.mount('#app')
const loading = document.getElementById('app-loading')
if (loading) loading.remove()

const store = useAppStore()
if (store.token) {
  connectSocket()
}
router.afterEach(() => {
  const store = useAppStore()
  if (store.token && !getSocket()?.connected) {
    connectSocket()
  }
})

window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection:', event.reason)
})
