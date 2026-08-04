<template>
  <div v-if="visible" class="wt-overlay" @click.self="dismiss">
    <div class="wt-popup">
      <button class="wt-close" @click="dismiss" aria-label="Close">&times;</button>
      <div class="wt-head">
        <div class="wt-logo">The Outnet</div>
        <h3>Welcome to THE OUTNET!</h3>
        <p>Get started in three simple steps and start earning <strong>20% profits</strong> on every sale.</p>
      </div>
      <div class="wt-steps">
        <div v-for="(step, i) in steps" :key="i" :class="['wt-step', { active: current === i, completed: current > i }]">
          <div class="wt-step-num">{{ i + 1 }}</div>
          <div class="wt-step-content">
            <h4>{{ step.title }}</h4>
            <p>{{ step.desc }}</p>
            <button v-if="step.action && current === i" class="wt-btn wt-btn-primary" @click="goStep(step)">{{ step.actionLabel }}</button>
          </div>
        </div>
      </div>
      <div class="wt-footer">
        <div class="wt-dots">
          <span v-for="(_, i) in steps" :key="i" :class="['wt-dot', { active: current === i }]" @click="current = i"></span>
        </div>
        <div class="wt-actions">
          <button v-if="current > 0" class="wt-btn wt-btn-ghost" @click="current--">Back</button>
          <button v-if="current < steps.length - 1" class="wt-btn wt-btn-primary" @click="current++">Next</button>
          <button v-else class="wt-btn wt-btn-primary" @click="finish">Start Exploring</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const visible = ref(false)
const current = ref(0)

const SEEN_KEY = 'theoutnet_walkthrough_seen'

const steps = [
  {
    title: 'Create Your Account',
    desc: 'Register for free on THE OUTNET. You can sign up as a buyer, or get ready to become a merchant and sell to buyers worldwide.',
    action: '/register',
    actionLabel: 'Register Now',
  },
  {
    title: 'Apply for a Merchant Store',
    desc: 'Submit your store application from your account. Once approved, you own a store where you can list and sell your products.',
    action: '/applystore',
    actionLabel: 'Apply Store',
  },
  {
    title: 'Own Your Store & Earn 20% Profit',
    desc: 'Manage products and orders from your own store dashboard. For every sale you make, you keep 20% of the profit.',
    action: '/mystore',
    actionLabel: 'View My Store',
  },
]

const show = () => {
  if (localStorage.getItem(SEEN_KEY)) return
  current.value = 0
  visible.value = true
}

const dismiss = () => {
  visible.value = false
  localStorage.setItem(SEEN_KEY, 'true')
}

const finish = dismiss

const goStep = (step) => {
  dismiss()
  if (step.action) router.push(step.action)
}

onMounted(() => {
  setTimeout(show, 2500)
})

defineExpose({ show })
</script>

<style scoped>
.wt-overlay {
  position: fixed; inset: 0; z-index: 10050;
  background: rgba(0,0,0,0.65);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.wt-popup {
  background: #1e1e2e;
  border-radius: 20px;
  padding: 32px 32px 24px;
  max-width: 480px; width: 100%;
  position: relative;
  box-shadow: 0 24px 80px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.06);
}
.wt-close {
  position: absolute; top: 12px; right: 16px;
  background: none; border: none; font-size: 28px;
  cursor: pointer; color: rgba(255,255,255,0.3); line-height: 1;
}
.wt-close:hover { color: #fff; }
.wt-head { text-align: center; margin-bottom: 20px; }
.wt-logo {
  display: inline-block; background: #667eea; color: #fff;
  font-weight: 700; font-size: 14px; padding: 6px 16px; border-radius: 20px;
  margin-bottom: 12px; letter-spacing: 0.5px;
}
.wt-head h3 { font-size: 18px; font-weight: 700; color: #fff; margin: 0 0 6px; }
.wt-head p { font-size: 13px; color: rgba(255,255,255,0.55); margin: 0; line-height: 1.5; }
.wt-head p strong { color: #10b981; }
.wt-steps { display: flex; flex-direction: column; gap: 0; margin-bottom: 24px; }
.wt-step {
  display: flex; gap: 14px; padding: 16px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  opacity: 0.35; transition: all 0.3s;
}
.wt-step.active { opacity: 1; }
.wt-step.completed { opacity: 0.5; }
.wt-step:last-child { border-bottom: none; }
.wt-step-num {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(255,255,255,0.06);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.4);
  flex-shrink: 0; margin-top: 2px;
}
.wt-step.active .wt-step-num { background: #667eea; color: #fff; }
.wt-step.completed .wt-step-num { background: rgba(16,185,129,0.3); color: #10b981; }
.wt-step-content { flex: 1; }
.wt-step-content h4 { font-size: 15px; font-weight: 600; color: #fff; margin: 0 0 4px; }
.wt-step-content p { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; line-height: 1.5; }
.wt-btn { padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; margin-top: 10px; }
.wt-btn-primary { background: #667eea; color: #fff; }
.wt-btn-primary:hover { background: #7c93f5; }
.wt-btn-ghost { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); }
.wt-btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }
.wt-footer { display: flex; align-items: center; justify-content: space-between; }
.wt-dots { display: flex; gap: 6px; }
.wt-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.15); cursor: pointer; transition: all 0.2s; }
.wt-dot.active { background: #667eea; width: 24px; border-radius: 4px; }
.wt-actions { display: flex; gap: 8px; }
@media (max-width: 480px) {
  .wt-popup { padding: 24px 20px 20px; max-width: 94%; }
  .wt-step { padding: 12px 0; }
  .wt-step-content h4 { font-size: 14px; }
  .wt-step-content p { font-size: 12px; }
  .wt-footer { flex-direction: column; gap: 12px; }
}
</style>
