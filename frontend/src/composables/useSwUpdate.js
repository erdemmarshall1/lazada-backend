import { ref } from 'vue'

const needRefresh = ref(false)
let updateServiceWorkerFn = null

export function useSwUpdate() {
  const init = async () => {
    try {
      const { registerSW } = await import('virtual:pwa-register')
      const sw = registerSW({
        onNeedRefresh() {
          needRefresh.value = true
        },
        onOfflineReady() {},
      })
      updateServiceWorkerFn = sw
    } catch {
      // PWA registration not available
    }
  }

  const refresh = () => {
    needRefresh.value = false
    if (updateServiceWorkerFn) {
      updateServiceWorkerFn()
    } else {
      window.location.reload()
    }
  }

  const dismiss = () => {
    needRefresh.value = false
  }

  return { needRefresh, init, refresh, dismiss }
}
