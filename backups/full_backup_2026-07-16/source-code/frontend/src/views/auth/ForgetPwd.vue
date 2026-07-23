<template>
  <div class="forget-view">
    <div class="forget-box">
      <h2 class="forget-title">Forgot Password</h2>

      <template v-if="step === 'email'">
        <p class="forget-subtitle">Enter your email to receive a reset code.</p>
        <el-form :model="form" :rules="rules" ref="formRef" label-position="top" @submit.prevent="handleSendCode">
          <el-form-item label="Email" prop="email">
            <el-input v-model="form.email" placeholder="Enter your email" size="large" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" style="width:100%;background:var(--g-main_color);border-color:var(--g-main_color)" :loading="sending" @click="handleSendCode">Send Reset Code</el-button>
          </el-form-item>
        </el-form>
      </template>

      <template v-else>
        <p class="forget-subtitle">A 6-digit code was sent to <strong>{{ form.email }}</strong>. Enter it below along with your new password.</p>
        <el-form :model="form" :rules="resetRules" ref="resetFormRef" label-position="top" @submit.prevent="handleReset">
          <el-form-item label="Reset Code" prop="code">
            <el-input v-model="form.code" placeholder="Enter 6-digit code" size="large" maxlength="6" style="text-align:center;font-size:20px;letter-spacing:6px;font-weight:600" />
          </el-form-item>
          <el-form-item label="New Password" prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="At least 6 characters" size="large" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" style="width:100%;background:var(--g-main_color);border-color:var(--g-main_color)" :loading="loading" @click="handleReset">Reset Password</el-button>
          </el-form-item>
        </el-form>
      </template>

      <div class="forget-links g-flex-align-center g-flex-justify-center">
        <span class="link" @click="$router.push('/login')">Back to Login</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { post, qe } from '@/api/request'

const router = useRouter()
const formRef = ref(null)
const resetFormRef = ref(null)
const loading = ref(false)
const sending = ref(false)
const step = ref('email')

const form = reactive({ email: '', code: '', password: '' })

const rules = {
  email: [{ required: true, type: 'email', message: 'Please enter valid email', trigger: 'blur' }],
}

const resetRules = {
  code: [{ required: true, min: 6, max: 6, message: 'Please enter the 6-digit code', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' }],
}

const handleSendCode = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  sending.value = true
  const res = await qe(post('/main/user/sendResetCode', { email: form.email }))
  sending.value = false
  if (res) {
    ElMessage.success('Reset code sent to your email')
    step.value = 'code'
  }
}

const handleReset = async () => {
  const valid = await resetFormRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  const res = await qe(post('/main/user/forgot', {
    email: form.email,
    code: form.code,
    password: form.password,
  }))
  loading.value = false
  if (res) {
    ElMessage.success('Password reset successful! Please login.')
    router.push('/login')
  }
}
</script>

<style scoped>
.forget-view { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 0; background: var(--g-bg); }
.forget-box { width: 420px; background: var(--g-white); border-radius: 8px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.forget-title { text-align: center; margin-bottom: 4px; font-size: 24px; }
.forget-subtitle { text-align: center; color: var(--g-text-light); font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
.forget-links { margin-top: 16px; }
.link { color: var(--g-main_color); cursor: pointer; font-size: 13px; }
@media (max-width: 768px) {
  .forget-box { width: 90%; padding: 24px 20px; }
  .forget-title { font-size: 20px; }
}
</style>