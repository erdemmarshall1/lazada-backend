<template>
  <router-view />
  <SwUpdateBanner />
  <audio ref="audioPlay" class="c_audio_play" :src="audioSrc" controls style="display:none"></audio>
  <el-backtop :right="24" :bottom="48" />
</template>

<script setup>
import { ref, watch, onErrorCaptured } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'
import SwUpdateBanner from '@/components/SwUpdateBanner.vue'

const store = useAppStore()
const audioPlay = ref(null)
const audioSrc = ref('')

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
