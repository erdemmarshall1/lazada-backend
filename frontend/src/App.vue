<template>
  <div class="app-root">
    <div class="offline-bar" v-if="isOffline">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
      <span>You are offline — some features may be unavailable</span>
    </div>
    <div class="route-loading-bar" :class="{ active: routeLoading }"></div>
    <router-view />
    <SwUpdateBanner />
    <audio ref="audioPlay" class="c_audio_play" :src="audioSrc" controls style="display:none"></audio>
    <el-backtop :right="24" :bottom="48" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'
import SwUpdateBanner from '@/components/SwUpdateBanner.vue'

const router = useRouter()
const store = useAppStore()
const audioPlay = ref(null)
const audioSrc = ref('')
const isOffline = ref(typeof navigator !== 'undefined' && !navigator.onLine)
const routeLoading = ref(false)

let removeBeforeEach = null
let removeAfterEach = null

onMounted(() => {
  const updateOnline = () => { isOffline.value = false }
  const updateOffline = () => { isOffline.value = true }
  window.addEventListener('online', updateOnline)
  window.addEventListener('offline', updateOffline)

  removeBeforeEach = router.beforeEach(() => {
    routeLoading.value = true
  })
  removeAfterEach = router.afterEach(() => {
    routeLoading.value = false
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', updateOnline)
    window.removeEventListener('offline', updateOffline)
    if (removeBeforeEach) removeBeforeEach()
    if (removeAfterEach) removeAfterEach()
  })
})

watch(() => store.audioList, (list) => {
  if (list && list.length > 0 && audioPlay.value) {
    audioSrc.value = list[0]
    audioPlay.value.play()
  }
}, { deep: true })

onErrorCaptured((err) => {
  console.error('Unhandled error:', err)
  const message = err?.response?.data?.msg || err?.message || 'An unexpected error occurred'
  ElMessage.error(message)
  return false
})
</script>

<style>
.app-root { position: relative; min-height: 100vh; }
.offline-bar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
  background: #e74c3c; color: #fff;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 8px 16px; font-size: 13px; font-weight: 500;
  animation: slideDown 0.3s ease;
}
@keyframes slideDown {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}
.route-loading-bar {
  position: fixed; top: 0; left: 0; z-index: 9998;
  width: 0; height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2, #667eea);
  background-size: 200% 100%;
  transition: width 0.3s ease;
  opacity: 0;
}
.route-loading-bar.active {
  width: 60%; opacity: 1;
  animation: loadingGlide 1.2s ease infinite;
}
@keyframes loadingGlide {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
