<template>
  <div v-if="visible"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { get } from '@/api/request'

const visible = ref(false)
let checkInterval = null

const loadSettings = async () => {
  try {
    const res = await get('/home/admin/tawkto-settings')
    if (res?.code === 0 && res?.data) {
      const s = res.data
      if (s.enabled && s.widgetId) {
        visible.value = true
        initTawkTo(s.widgetId)
        if (checkInterval) clearInterval(checkInterval)
      }
    }
  } catch (e) {
    // silently fail
  }
}

const initTawkTo = (widgetId) => {
  if (window.Tawk_API) return
  const s1 = document.createElement('script')
  s1.async = true
  s1.src = 'https://embed.tawk.to/' + widgetId + '/default'
  s1.charset = 'UTF-8'
  s1.setAttribute('crossorigin', '*')
  document.head.appendChild(s1)
}

onMounted(() => {
  loadSettings()
  checkInterval = setInterval(loadSettings, 60000)
})

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval)
})
</script>
