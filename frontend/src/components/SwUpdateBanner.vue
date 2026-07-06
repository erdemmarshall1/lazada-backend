<template>
  <transition name="sw-up">
    <div v-if="sw.needRefresh.value" class="sw-update-banner">
      <div class="sw-update-content">
        <span class="sw-update-icon">&#9670;</span>
        <span class="sw-update-text">New version available</span>
        <button class="sw-update-btn" @click="sw.refresh">Refresh</button>
        <button class="sw-update-close" @click="sw.dismiss">&times;</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { onMounted } from 'vue'
import { useSwUpdate } from '@/composables/useSwUpdate'

const sw = useSwUpdate()

onMounted(() => {
  sw.init()
})
</script>

<style scoped>
.sw-update-banner {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.sw-update-content {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}
.sw-update-icon {
  color: #409eff;
  font-size: 18px;
}
.sw-update-text {
  color: #e0e0e0;
  font-size: 14px;
}
.sw-update-btn {
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}
.sw-update-btn:hover {
  background: #66b1ff;
}
.sw-update-close {
  background: transparent;
  color: #888;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.sw-update-close:hover {
  color: #fff;
}
.sw-up-enter-active,
.sw-up-leave-active {
  transition: all 0.3s ease;
}
.sw-up-enter-from,
.sw-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
@media (max-width: 768px) {
  .sw-update-banner {
    bottom: 12px;
    left: 12px;
    right: 12px;
    transform: none;
  }
  .sw-update-content {
    white-space: normal;
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
