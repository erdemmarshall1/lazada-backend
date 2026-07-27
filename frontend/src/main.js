import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import i18n, { setDocumentLang, setAppInstance } from './locales'
import './assets/styles/tailwind.css'
import './assets/styles/global.css'
import './assets/styles/iconfont.css'
import { useAppStore } from '@/stores/app'
import { connectSocket, getSocket } from '@/socket'
import { initPush } from '@/composables/usePush'
import { usePwa } from '@/pwa/usePwa'
import { imgUrl as _imgUrl, API_BASE } from '@/api/request'
import lazyImg from '@/directives/lazyImg'

const app = createApp(App)
app.config.globalProperties.$imgUrl = _imgUrl
app.directive('lazy-img', lazyImg)

const IMG_CDN = 'https://res.cloudinary.com/u7xxu5dq/image/upload'

const getFilename = (url) => {
  try { const p = url.split('/'); return p[p.length - 1] || '' } catch { return '' }
}

app.config.globalProperties.$imgFallback = function (e) {
  let img = e.target;
  if (img?.tagName === 'DIV' || img?.tagName === 'SPAN') {
    img = img.querySelector('img');
  }
  if (!img || !img.dataset || img.dataset.errored) return;

  const src = img.src || '';
  const handleFallback = (filename) => {
    const fallbackUrl = `${API_BASE}/home/image/placeholder?text=${encodeURIComponent(filename || 'Product')}`;
    if (fallbackUrl !== src) {
      img.src = fallbackUrl;
    }
    img.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    img.style.objectFit = 'contain';
    img.style.padding = '10%';
    img.alt = 'Product Image';
    img.dataset.errored = '1';
  };

  const tryUrl = (url, flag) => {
    if (img.dataset[flag]) return false;
    if (url && url !== src) {
      img.dataset[flag] = '1';
      img.crossOrigin = 'anonymous';
      img.src = url;
      return true;
    }
    img.dataset[flag] = '1';
    return false;
  };

  const withAuto = (cdnPath) => `${IMG_CDN}/f_auto,q_auto${cdnPath.startsWith('/') ? cdnPath : `/${cdnPath}`}`;

  if (src.includes('res.cloudinary.com')) {
    const m = src.match(/\/image\/upload\/(?:[^/]+\/)*(.+)$/);
    const pathPart = m ? m[1] : '';
    if (pathPart && tryUrl(`${API_BASE}/${pathPart}`, 'backendTried')) return;
    handleFallback('Product');
    return;
  }

  const path = src.startsWith(API_BASE) ? src.slice(API_BASE.length) : (src.startsWith('http') ? '' : src);
  const filename = getFilename(path || src);

  if (path.startsWith('/home/image/proxy') || path.startsWith('/home/image/placeholder')) {
    handleFallback(filename);
    return;
  }

  if (path && tryUrl(withAuto(path), 'cdnTried')) return;
  if (filename && !path.includes('/product_images/') && tryUrl(withAuto(`/uploads/product_images/${filename}`), 'productImagesTried')) return;
  if (filename && tryUrl(withAuto(`/${filename}`), 'filenameTried')) return;
  if (filename && tryUrl(withAuto(`/products/${filename}`), 'productsTried')) return;

  handleFallback(filename);
};
app.use(createPinia())
setAppInstance(app)
app.use(router)
app.use(i18n)
app.mount('#app')
const loading = document.getElementById('app-loading')
if (loading) loading.remove()

const { init: initPwa } = usePwa();

const store = useAppStore();
if (store.token) {
  connectSocket();
  initPwa();
}

router.afterEach(() => {
  const store = useAppStore();
  if (store.token && 'serviceWorker' in navigator && !window.__pwaInited) {
    window.__pwaInited = true;
    initPwa();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection:', event.reason)
})