<template>
  <div>
    <Teleport to="body">
      <div v-if="showFloatingButton" ref="wrapperRef" class="lw-root" :class="[positionClass]" :style="wrapperStyle">
        <button
          class="lw-trigger"
          :class="{ 'lw-pulse': !open }"
          :style="buttonStyle"
          :aria-label="$t('app.tawkto.chatAria')"
          :aria-expanded="open"
          @click.stop="toggle"
        >
          <svg v-if="!open" width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>

        <transition name="lw-slide" @after-leave="panelClosed">
          <div v-if="open" ref="panelRef" class="lw-panel" :style="panelStyle" role="dialog" :aria-label="$t('app.tawkto.needHelp')">
            <div class="lw-header" :style="headerStyle">
              <div class="lw-header-content">
                <h4 class="lw-title">{{ $t('app.tawkto.needHelp') }}</h4>
                <p class="lw-subtitle">{{ $t('app.tawkto.supportReady') }}</p>
              </div>
              <button class="lw-close-btn" @click="close" :aria-label="$t('app.tawkto.chatAria')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="lw-body">
              <button class="lw-option" @click="openTawkTo">
                <span class="lw-option-icon lw-tawkto-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--g-main_color)"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
                </span>
                <span class="lw-option-text">
                  <strong>{{ $t('app.tawkto.liveChat') }}</strong>
                  <span>{{ $t('app.tawkto.chatRealTime') }}</span>
                </span>
                <svg class="lw-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>

              <a :href="whatsappUrl" target="_blank" rel="noopener" class="lw-option" @click="trackClick('whatsapp')">
                <span class="lw-option-icon lw-whatsapp-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </span>
                <span class="lw-option-text">
                  <strong>{{ $t('app.tawkto.whatsapp') }}</strong>
                  <span>{{ $t('app.tawkto.chatWhatsapp') }}</span>
                </span>
                <svg class="lw-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </a>

              <button v-if="store.isLogin" class="lw-option" @click="openInAppChat">
                <span class="lw-option-icon lw-inapp-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--g-main_color)"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/></svg>
                </span>
                <span class="lw-option-text">
                  <strong>{{ $t('app.tawkto.inAppChat') }}</strong>
                  <span>{{ $t('app.tawkto.sendMessage') }}</span>
                </span>
                <svg class="lw-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>

            <div class="lw-footer">
              <p>{{ $t('app.tawkto.typicalReply') }}</p>
            </div>
          </div>
        </transition>
      </div>
    </Teleport>
    <div v-show="false" ref="tawkContainer" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const store = useAppStore()
const open = ref(false)
const wrapperRef = ref(null)
const panelRef = ref(null)
const showFloatingButton = ref(false)
const touchStartY = ref(0)

const PHONE_NUMBER = '14155238886'
const whatsappUrl = computed(() => `https://wa.me/${PHONE_NUMBER}?text=Hello%20THE%20OUTNET%20support%2C%20I%20need%20help`)

const isMobile = computed(() => typeof window !== 'undefined' && window.innerWidth < 480)
const positionClass = computed(() => {
  const pos = store.tawkTo.widgetPosition || 'bottom-right'
  return `lw-${pos}`
})

const wrapperStyle = computed(() => ({
  zIndex: 999,
  bottom: isMobile.value ? '0px' : '100px'
}))

const buttonStyle = computed(() => {
  const color = store.tawkTo.widgetColor || ''
  if (!color) return {}
  return {
    background: `linear-gradient(135deg, ${color}, ${color}88)`,
    boxShadow: `0 4px 20px ${color}44`
  }
})

const panelStyle = computed(() => {
  if (isMobile.value) {
    return { borderRadius: '0px', maxHeight: '100dvh' }
  }
  return {}
})

const headerStyle = computed(() => {
  const color = store.tawkTo.widgetColor || ''
  if (!color) return {}
  return { background: `linear-gradient(135deg, ${color}, ${color}88)` }
})

const toggle = () => { open.value = !open.value }
const close = () => { open.value = false }
const panelClosed = () => {}

const trackClick = () => {}

const handleDocumentClick = (e) => {
  if (open.value && wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    close()
  }
}

const handleTouchStart = (e) => {
  touchStartY.value = e.touches[0].clientY
}

const handleTouchMove = (e) => {
  if (!panelRef.value || !open.value) return
  const dy = e.touches[0].clientY - touchStartY.value
  if (dy > 80) {
    close()
  }
}

const openTawkTo = () => {
  close()
  if (window.Tawk_API) {
    window.Tawk_API.maximize()
  }
}

const openInAppChat = () => {
  close()
  router.push('/chattostorelist')
}

const loadTawkScript = (widgetId) => {
  if (document.getElementById('tawkto-script')) return
  const s1 = document.createElement('script')
  s1.id = 'tawkto-script'
  s1.async = true
  s1.src = `https://embed.tawk.to/${widgetId}`
  s1.charset = 'UTF-8'
  s1.setAttribute('crossorigin', '*')
  document.body.appendChild(s1)
}

let unregisterGuard = null

onMounted(() => {
  if (store.tawkTo.enabled && store.tawkTo.widgetId) {
    showFloatingButton.value = true
    loadTawkScript(store.tawkTo.widgetId)
  }
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchmove', handleTouchMove, { passive: true })

  unregisterGuard = router.afterEach(() => {
    close()
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchmove', handleTouchMove)
  if (unregisterGuard) unregisterGuard()
})

watch([() => store.tawkTo.enabled, () => store.tawkTo.widgetId], ([enabled, widgetId]) => {
  if (enabled && widgetId) {
    showFloatingButton.value = true
    loadTawkScript(widgetId)
  } else if (!enabled) {
    showFloatingButton.value = false
  }
})
</script>

<style scoped>
.lw-root {
  position: fixed;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.lw-root.lw-bottom-right { right: 20px; }
.lw-root.lw-bottom-left { left: 20px; }

.lw-trigger {
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, var(--g-main_color), #ff8c38);
  color: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  transition: transform 0.2s, box-shadow 0.2s;
  margin-left: auto; border: none; position: relative;
}
.lw-trigger:hover { transform: scale(1.1); box-shadow: 0 6px 24px rgba(0,0,0,0.25); }
.lw-trigger:focus-visible { outline: 3px solid var(--g-main_color); outline-offset: 3px; }

.lw-pulse {
  animation: lw-pulse 2s infinite;
}
@keyframes lw-pulse {
  0% { box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
  50% { box-shadow: 0 4px 30px rgba(255, 140, 56, 0.4); }
  100% { box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
}

.lw-panel {
  position: absolute;
  bottom: 68px;
  width: 340px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.15);
  overflow: auto;
  max-height: 520px;
}
.lw-bottom-right .lw-panel { right: 0; }
.lw-bottom-left .lw-panel { left: 0; }

.lw-header {
  background: linear-gradient(135deg, var(--g-main_color), #ff8c38);
  color: #fff; padding: 20px; display: flex; align-items: flex-start; gap: 8px;
}
.lw-header-content { flex: 1; }
.lw-title { margin: 0 0 2px; font-size: 18px; font-weight: 600; }
.lw-subtitle { margin: 0; font-size: 13px; opacity: 0.9; }
.lw-close-btn {
  background: none; border: none; color: #fff; opacity: 0.8; cursor: pointer;
  padding: 4px; border-radius: 6px; flex-shrink: 0; margin-top: 2px;
  transition: opacity 0.2s, background 0.2s;
}
.lw-close-btn:hover { opacity: 1; background: rgba(255,255,255,0.15); }

.lw-body { padding: 8px; }
.lw-option {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 12px; border-radius: 12px; cursor: pointer;
  transition: background 0.2s; text-decoration: none; color: inherit;
  margin-bottom: 2px; width: 100%; box-sizing: border-box;
  background: none; border: none; text-align: left; font: inherit;
}
.lw-option:hover { background: #f5f5f5; }
.lw-option:focus-visible { outline: 2px solid var(--g-main_color); outline-offset: 2px; }

.lw-option-icon {
  flex-shrink: 0; width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
  background: #fafafa; border-radius: 12px;
}
.lw-option-text { flex: 1; display: flex; flex-direction: column; }
.lw-option-text strong { font-size: 14px; font-weight: 600; }
.lw-option-text span { font-size: 12px; color: #999; margin-top: 2px; }

.lw-arrow { flex-shrink: 0; color: #ccc; transition: transform 0.2s; }
.lw-option:hover .lw-arrow { transform: translateX(3px); }

.lw-footer {
  padding: 12px 20px; border-top: 1px solid #f0f0f0; text-align: center;
}
.lw-footer p { margin: 0; font-size: 11px; color: #bbb; }

.lw-slide-enter-active, .lw-slide-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.lw-slide-enter-from, .lw-slide-leave-to { opacity: 0; transform: translateY(16px) scale(0.96); }

@media (max-width: 767px) {
  .lw-root.lw-bottom-right { right: 12px; }
  .lw-root.lw-bottom-left { left: 12px; }
  .lw-trigger { width: 50px; height: 50px; }
  .lw-panel { width: 300px; }
}

@media (max-width: 479px) {
  .lw-root { right: 0 !important; left: 0 !important; bottom: 0 !important; }
  .lw-trigger {
    position: fixed; bottom: 20px; z-index: 1000;
    width: 54px; height: 54px;
  }
  .lw-root.lw-bottom-right .lw-trigger { right: 16px; left: auto; }
  .lw-root.lw-bottom-left .lw-trigger { left: 16px; right: auto; }
  .lw-panel {
    position: fixed; bottom: 0; left: 0; right: 0;
    width: 100%; border-radius: 0; max-height: 85dvh;
  }
  .lw-header { padding: 16px; }
  .lw-header-content .lw-title { font-size: 17px; }
  .lw-body { padding: 6px; }
  .lw-option { padding: 14px 10px; }
  .lw-option-icon { width: 44px; height: 44px; }
  .lw-option-icon svg { width: 22px; height: 22px; }
  .lw-option-text strong { font-size: 14px; }
  .lw-option-text span { font-size: 12px; }
  .lw-footer { padding: 10px 16px; }
}
</style>
