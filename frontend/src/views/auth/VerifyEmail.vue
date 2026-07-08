<template>
  <div class="verify-view">
    <div class="verify-box">
      <h2 class="verify-title">Verify Your Email</h2>
      <p class="verify-subtitle" v-if="!verified">A 6-digit code was sent to <strong>{{ userEmail }}</strong>. Enter it below to verify your email address.</p>
      <p class="verify-subtitle" v-else>Your email has been verified successfully!</p>

      <template v-if="!verified">
        <el-form @submit.prevent="handleVerify">
          <el-form-item>
            <el-input v-model="code" placeholder="Enter 6-digit code" size="large" maxlength="6" style="text-align:center;font-size:24px;letter-spacing:8px;font-weight:600" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" style="width:100%;background:var(--g-main_color);border-color:var(--g-main_color)" :loading="loading" @click="handleVerify">Verify Email</el-button>
          </el-form-item>
        </el-form>
        <div class="verify-resend">
          <span>Didn't receive the code?</span>
          <span class="link" :class="{ disabled: resendCooldown > 0 }" @click="handleResend">{{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code' }}</span>
        </div>
      </template>

      <template v-else>
        <el-button type="primary" size="large" style="width:100%;background:var(--g-main_color);border-color:var(--g-main_color)" @click="$router.push('/myaccount')">Go to My Account</el-button>
      </template>

      <div class="verify-links">
        <span class="link" @click="$router.push('/main')">Back to Home</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { post, get } from '@/api/request'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const store = useAppStore()
const code = ref('')
const loading = ref(false)
const verified = ref(false)
const resendCooldown = ref(0)

const userEmail = computed(() => store.userInfo?.email || 'your email')

const handleVerify = async () => {
  if (!code.value || code.value.length !== 6) {
    ElMessage.warning('Please enter the 6-digit code')
    return
  }
  loading.value = true
  const res = await post('/home/auth/verify-email', { code: code.value })
  loading.value = false
  if (res?.code === 0) {
    verified.value = true
    store.userInfo.isEmailVerified = true
    ElMessage.success('Email verified successfully!')
  } else {
    ElMessage.error(res?.msg || 'Verification failed')
  }
}

const handleResend = async () => {
  if (resendCooldown.value > 0) return
  const res = await get('/main/sendMsg/getEmailCode', { email: userEmail.value })
  if (res?.code === 0) {
    ElMessage.success('Verification code resent')
    resendCooldown.value = 60
    const timer = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) clearInterval(timer)
    }, 1000)
  } else {
    ElMessage.error(res?.msg || 'Failed to resend code')
  }
}
</script>

<style scoped>
.verify-view { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 0; background: var(--g-bg); }
.verify-box { width: 420px; background: var(--g-white); border-radius: 8px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.verify-title { text-align: center; margin-bottom: 4px; font-size: 22px; }
.verify-subtitle { text-align: center; color: var(--g-text-light); font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
.verify-resend { text-align: center; margin-top: 12px; font-size: 13px; color: var(--g-text-light); }
.verify-resend .link { margin-left: 4px; color: var(--g-main_color); cursor: pointer; }
.verify-resend .link:hover { text-decoration: underline; }
.verify-resend .link.disabled { opacity: 0.5; cursor: default; text-decoration: none; }
.verify-links { text-align: center; margin-top: 16px; }
.link { color: var(--g-main_color); cursor: pointer; font-size: 13px; }
.link:hover { text-decoration: underline; }
@media (max-width: 768px) {
  .verify-view { padding: 16px; min-height: calc(100vh - 120px); }
  .verify-box { width: 100%; padding: 24px 20px; }
  .verify-title { font-size: 20px; }
}
</style>