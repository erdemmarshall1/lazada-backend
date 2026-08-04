<template>
  <teleport to="body">
    <transition name="popup-fade">
      <div v-if="current" class="popup-ad-mask" @click.self="closePopup">
        <div class="popup-ad" :style="adStyle">
          <button v-if="current.popupDismissible !== false" class="popup-ad-close" @click="closePopup" aria-label="Close">
            <i class="iconfont icon-guanbi"></i>
          </button>
          <img :src="imgUrl(current.image)" :alt="current.title || 'Promotion'" class="popup-ad-img" @error="onImgError" />
          <div v-if="current.title" class="popup-ad-title">{{ current.title }}</div>
          <div class="popup-ad-timer" v-if="remaining > 0">{{ remaining }}s</div>
          <div v-if="current.link" class="popup-ad-action" @click="goLink(current.link)">Learn More</div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { get, imgUrl } from '@/api/request'

const router = useRouter()

const queue = ref([])
const current = ref(null)
const remaining = ref(0)
let timer = null
let delayTimer = null
let frequencyTimer = null

const POPUP_SEEN_KEY = 'theoutnet_popup_seen'

const adStyle = computed(() => {
  if (!current.value) return {}
  const w = Math.min(480, Math.max(300, window.innerWidth * 0.9))
  return { width: `${w}px` }
})

const getSeen = () => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const all = JSON.parse(localStorage.getItem(POPUP_SEEN_KEY) || '{}')
    return { today, all }
  } catch { return { today: '', all: {} } }
}

const recordSeen = (id) => {
  const { today, all } = getSeen()
  const key = `${id}::${today}`
  all[key] = (all[key] || 0) + 1
  // Prune old dates
  Object.keys(all).forEach((k) => {
    if (!k.endsWith(`::${today}`)) delete all[k]
  })
  try { localStorage.setItem(POPUP_SEEN_KEY, JSON.stringify(all)) } catch { /* ignore */ }
}

const isWithinFrequency = (b) => {
  const freq = Math.max(1, Number(b.popupFrequency) || 1)
  const { today, all } = getSeen()
  const key = `${b._id}::${today}`
  return (all[key] || 0) >= freq
}

const clearTimer = () => {
  if (timer) { clearInterval(timer); timer = null }
  if (delayTimer) { clearTimeout(delayTimer); delayTimer = null }
  if (frequencyTimer) { clearTimeout(frequencyTimer); frequencyTimer = null }
}

const startCountdown = () => {
  const duration = Math.max(1, Number(current.value.popupDuration) || 10)
  remaining.value = duration
  clearTimer()
  timer = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) nextPopup()
  }, 1000)
}

const nextPopup = () => {
  if (current.value) recordSeen(current.value._id)
  if (queue.value.length === 0) {
    current.value = null
    return
  }
  const next = queue.value.shift()
  current.value = next
  startCountdown()
}

const showNextAfterDelay = () => {
  clearTimer()
  const next = queue.value.shift()
  if (!next) { current.value = null; return }
  const delay = Math.max(0, Number(next.popupDelay) || 0) * 1000
  delayTimer = setTimeout(() => {
    current.value = next
    startCountdown()
  }, delay)
}

const closePopup = () => {
  if (current.value) recordSeen(current.value._id)
  current.value = null
  clearTimer()
}

const goLink = (link) => {
  if (!link) return
  closePopup()
  if (/^https?:\/\//i.test(link)) {
    window.open(link, '_blank', 'noopener')
  } else if (link.startsWith('/')) {
    router.push(link)
  }
}

const onImgError = (e) => { e.target.src = imgUrl('') }

const init = async () => {
  try {
    const res = await get('/main/banner/popup').catch(() => null)
    const data = res?.data
    const list = Array.isArray(data) ? data : (data?.data ? (Array.isArray(data.data) ? data.data : []) : [])
    const fresh = list.filter(b => !isWithinFrequency(b))
    if (fresh.length === 0) return
    queue.value = fresh
    const first = queue.value.shift()
    const delay = Math.max(0, Number(first.popupDelay) || 0) * 1000
    delayTimer = setTimeout(() => {
      current.value = first
      startCountdown()
    }, delay)
  } catch { /* ignore */ }
}

onMounted(() => {
  frequencyTimer = setTimeout(init, 1500)
})

onBeforeUnmount(clearTimer)
</script>

<style scoped>
.popup-ad-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: popup-mask-in 0.25s ease;
}
.popup-ad {
  position: relative;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  animation: popup-ad-in 0.3s ease;
  text-align: center;
}
.popup-ad-close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.popup-ad-close:hover { background: rgba(0, 0, 0, 0.7); }
.popup-ad-img {
  width: 100%;
  max-height: 65vh;
  object-fit: cover;
  display: block;
}
.popup-ad-title {
  padding: 14px 16px 4px;
  font-size: 16px;
  font-weight: 600;
  color: #222;
}
.popup-ad-timer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #e91e63;
  opacity: 0;
}
.popup-ad-action {
  display: inline-block;
  margin: 10px 0 18px;
  padding: 8px 28px;
  border-radius: 20px;
  background: #e91e63;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.popup-ad-action:hover { opacity: 0.85; }
.popup-fade-enter-active, .popup-fade-leave-active { transition: opacity 0.25s ease; }
.popup-fade-enter-from, .popup-fade-leave-to { opacity: 0; }
@keyframes popup-mask-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes popup-ad-in { from { transform: scale(0.85); } to { transform: scale(1); } }
</style>
