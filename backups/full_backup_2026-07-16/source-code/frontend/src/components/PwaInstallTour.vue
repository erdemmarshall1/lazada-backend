<template>
  <div v-if="visible" class="tour-overlay" @click.self="dismiss">
    <div class="tour-popup">
      <button class="tour-close" @click="dismiss">&times;</button>
      <div class="tour-steps">
        <div v-for="(step, i) in steps" :key="i" :class="['tour-step', { active: current === i, completed: current > i }]">
          <div class="tour-step-num">{{ i + 1 }}</div>
          <div class="tour-step-content">
            <h4>{{ step.title }}</h4>
            <p>{{ step.desc }}</p>
          </div>
        </div>
      </div>
      <div class="tour-footer">
        <div class="tour-dots">
          <span v-for="(_, i) in steps" :key="i" :class="['tour-dot', { active: current === i }]" @click="current = i"></span>
        </div>
        <div class="tour-actions">
          <button v-if="current > 0" class="tour-btn tour-btn-ghost" @click="current--">Back</button>
          <button v-if="current < steps.length - 1" class="tour-btn tour-btn-primary" @click="current++">Next</button>
          <button v-else class="tour-btn tour-btn-primary" @click="installApp">{{ isIOS ? 'Got it' : 'Install Now' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePwaInstall } from '@/composables/usePwaInstall'

const emit = defineEmits(['close'])
const pwa = usePwaInstall()
const current = ref(0)
const visible = ref(false)

const isIOS = computed(() => pwa.isIOS.value)
const isStandalone = computed(() => pwa.isStandalone.value)

const steps = computed(() => [
  { title: 'Install THE OUTNET App', desc: 'Get the fastest experience with our PWA app. Works offline and loads instantly from your home screen.' },
  isIOS.value
    ? { title: 'Tap Share', desc: 'In Safari, tap the Share button at the bottom of the screen.' }
    : { title: 'Click Install', desc: 'Click the "Install" button in the browser prompt or our install button below.' },
  isIOS.value
    ? { title: 'Add to Home Screen', desc: 'Scroll down and tap "Add to Home Screen", then tap "Add" in the top right.' }
    : { title: 'Confirm Installation', desc: 'A dialog will appear. Click "Install" to add THE OUTNET to your device.' },
  { title: 'You\'re All Set!', desc: 'Launch THE OUTNET from your home screen for the best experience. You can also download our mobile app from the App Store or Google Play.' },
])

const show = () => {
  if (isStandalone.value) return
  const seen = localStorage.getItem('pwa_tour_seen')
  if (seen) return
  current.value = 0
  visible.value = true
}

const dismiss = () => {
  visible.value = false
  emit('close')
}

const installApp = () => {
  if (!isIOS.value && pwa.deferredPrompt?.value) {
    pwa.triggerInstall()
  }
  localStorage.setItem('pwa_tour_seen', 'true')
  visible.value = false
  emit('close')
}

onMounted(() => {
  setTimeout(show, 2000)
})

defineExpose({ show })
</script>

<style scoped>
.tour-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.65);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.tour-popup {
  background: #1e1e2e;
  border-radius: 20px;
  padding: 36px 32px 24px;
  max-width: 460px; width: 100%;
  position: relative;
  box-shadow: 0 24px 80px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.06);
}
.tour-close {
  position: absolute; top: 12px; right: 16px;
  background: none; border: none; font-size: 28px;
  cursor: pointer; color: rgba(255,255,255,0.3); line-height: 1;
}
.tour-close:hover { color: #fff; }
.tour-steps { display: flex; flex-direction: column; gap: 0; margin-bottom: 24px; }
.tour-step {
  display: flex; gap: 14px; padding: 16px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  opacity: 0.35; transition: all 0.3s;
}
.tour-step.active { opacity: 1; }
.tour-step.completed { opacity: 0.5; }
.tour-step:last-child { border-bottom: none; }
.tour-step-num {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(255,255,255,0.06);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.4);
  flex-shrink: 0; margin-top: 2px;
}
.tour-step.active .tour-step-num { background: #667eea; color: #fff; }
.tour-step.completed .tour-step-num { background: rgba(16,185,129,0.3); color: #10b981; }
.tour-step-content { flex: 1; }
.tour-step-content h4 { font-size: 15px; font-weight: 600; color: #fff; margin: 0 0 4px; }
.tour-step-content p { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; line-height: 1.5; }
.tour-footer { display: flex; align-items: center; justify-content: space-between; }
.tour-dots { display: flex; gap: 6px; }
.tour-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.15); cursor: pointer; transition: all 0.2s; }
.tour-dot.active { background: #667eea; width: 24px; border-radius: 4px; }
.tour-actions { display: flex; gap: 8px; }
.tour-btn { padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
.tour-btn-primary { background: #667eea; color: #fff; }
.tour-btn-primary:hover { background: #7c93f5; }
.tour-btn-ghost { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); }
.tour-btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }
@media (max-width: 480px) {
  .tour-popup { padding: 28px 20px 20px; max-width: 94%; }
  .tour-step { padding: 12px 0; }
  .tour-step-content h4 { font-size: 14px; }
  .tour-step-content p { font-size: 12px; }
  .tour-footer { flex-direction: column; gap: 12px; }
}
</style>
