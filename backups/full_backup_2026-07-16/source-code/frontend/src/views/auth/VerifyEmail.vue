<template>
  <div class="verify-view">
    <div class="verify-box">
      <h2 class="verify-title">Email Verified</h2>
      <p class="verify-subtitle">Your email has been automatically verified.</p>
      <el-button type="primary" size="large" style="width:100%;background:var(--g-main_color);border-color:var(--g-main_color)" @click="$router.push('/myaccount')">Go to My Account</el-button>
      <div class="verify-links">
        <span class="link" @click="$router.push('/main')">Back to Home</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
onMounted(() => {
  if (store.userInfo) store.userInfo.isEmailVerified = true
})
</script>

<style scoped>
.verify-view { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 0; background: var(--g-bg); }
.verify-box { width: 420px; background: var(--g-white); border-radius: 8px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.verify-title { text-align: center; margin-bottom: 4px; font-size: 22px; }
.verify-subtitle { text-align: center; color: var(--g-text-light); font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
.verify-links { text-align: center; margin-top: 16px; }
.link { color: var(--g-main_color); cursor: pointer; font-size: 13px; }
.link:hover { text-decoration: underline; }
@media (max-width: 768px) {
  .verify-view { padding: 16px; min-height: calc(100vh - 120px); }
  .verify-box { width: 100%; padding: 24px 20px; }
  .verify-title { font-size: 20px; }
}
</style>