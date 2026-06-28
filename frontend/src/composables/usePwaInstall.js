import { ref, computed, onMounted, onUnmounted } from 'vue'

const deferredPrompt = ref(null)
const isDismissed = ref(localStorage.getItem('pwa_banner_dismissed') === 'true')
let promptListener = null

export function usePwaInstall() {
  const isIOS = computed(() => {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent
    return /iPad|iPhone|iPod/.test(ua) && !window.MSStream
  })

  const isStandalone = computed(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
  })

  const isInstallable = computed(() => {
    if (isStandalone.value) return false
    return !!deferredPrompt.value || isIOS.value
  })

  const showBanner = computed(() => {
    return isInstallable.value && !isDismissed.value
  })

  const triggerInstall = async () => {
    if (!deferredPrompt.value) return
    deferredPrompt.value.prompt()
    const result = await deferredPrompt.value.userChoice
    deferredPrompt.value = null
    if (result.outcome === 'accepted') {
      dismiss()
    }
  }

  const dismiss = () => {
    isDismissed.value = true
    localStorage.setItem('pwa_banner_dismissed', 'true')
  }

  const resetDismissal = () => {
    isDismissed.value = false
    localStorage.removeItem('pwa_banner_dismissed')
  }

  const init = () => {
    if (typeof window === 'undefined') return
    if (promptListener) return
    promptListener = (e) => {
      e.preventDefault()
      deferredPrompt.value = e
    }
    window.addEventListener('beforeinstallprompt', promptListener)
  }

  const cleanup = () => {
    if (promptListener) {
      window.removeEventListener('beforeinstallprompt', promptListener)
      promptListener = null
    }
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      if (!promptListener) {
        promptListener = (e) => {
          e.preventDefault()
          deferredPrompt.value = e
        }
        window.addEventListener('beforeinstallprompt', promptListener)
      }
    }
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    deferredPrompt,
    isIOS,
    isStandalone,
    isInstallable,
    showBanner,
    triggerInstall,
    dismiss,
    resetDismissal,
    init,
    cleanup,
  }
}
