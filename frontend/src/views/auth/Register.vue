<template>
  <div class="register-view">
    <div class="register-box">
      <h2 class="register-title">Create Account</h2>
      <p class="register-subtitle">Register for a new user account</p>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="Username" prop="username">
          <el-input v-model="form.username" placeholder="Choose a username" size="large" />
        </el-form-item>
        <el-form-item label="Email Address" prop="email">
          <el-input v-model="form.email" placeholder="Enter your email" size="large" />
        </el-form-item>
        <el-form-item label="Phone Number" prop="phone">
          <el-input v-model="form.phone" placeholder="Enter your phone number" size="large" />
        </el-form-item>
        <el-form-item label="Password" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="At least 8 characters" size="large" />
        </el-form-item>
        <el-form-item label="Confirm Password" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" show-password placeholder="Repeat password" size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%;background:var(--g-main_color);border-color:var(--g-main_color)" :loading="loading" @click="handleRegister">Register</el-button>
        </el-form-item>
      </el-form>
      <div class="register-links g-flex-align-center g-flex-justify-between">
        <span class="link" @click="$router.push('/login')">Already have account? Login</span>
        <span class="link" v-if="!store.isSeller" @click="$router.push('/applystore')">Apply for Merchant Account</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { post, qe } from '@/api/request'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const store = useAppStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '', email: '', phone: '', password: '', confirmPassword: '',
})

const validatePass = (rule, value, callback) => {
  if (value !== form.password) callback(new Error('Passwords do not match'))
  else callback()
}

const rules = {
  username: [{ required: true, message: 'Please enter a username', trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: 'Please enter valid email', trigger: 'blur' }],
  phone: [{ required: true, message: 'Please enter your phone number', trigger: 'blur' }],
  password: [{ required: true, min: 8, message: 'Password must be at least 8 characters', trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validatePass, trigger: 'blur' }],
}

const handleRegister = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  const res = await qe(post('/main/user/reg', {
    username: form.username,
    email: form.email,
    phone: form.phone,
    password: form.password,
  }))
  loading.value = false
  if (res?.data) {
    ElMessage.success('Registration successful! Please login.')
    router.push('/login')
  } else if (!res) {
    ElMessage.error('Registration failed. Please check your information and try again.')
  }
}
</script>

<style scoped>
.register-view { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 0; background: var(--g-bg); }
.register-box { width: 480px; background: var(--g-white); border-radius: 8px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.register-title { text-align: center; margin-bottom: 4px; font-size: 24px; }
.register-subtitle { text-align: center; color: var(--g-text-light); font-size: 14px; margin-bottom: 30px; }
.register-links { margin-top: 16px; }
.link { color: var(--g-main_color); cursor: pointer; font-size: 13px; }
.link:hover { text-decoration: underline; }
@media (max-width: 768px) {
  .register-view { padding: 16px; min-height: calc(100vh - 120px); }
  .register-box { width: 100%; padding: 24px 20px; }
  .register-title { font-size: 20px; }
}
</style>
