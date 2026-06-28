<template>
  <div class="forget-view">
    <div class="forget-box">
      <h2 class="forget-title">Forgot Password</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" placeholder="Enter your email" size="large" />
        </el-form-item>
        <el-form-item label="New Password" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="Enter new password" size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%;background:var(--g-main_color);border-color:var(--g-main_color)" :loading="loading" @click="handleReset">Reset Password</el-button>
        </el-form-item>
      </el-form>
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
const loading = ref(false)
const form = reactive({ email: '', password: '' })
const rules = {
  email: [{ required: true, type: 'email', message: 'Please enter valid email', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' }],
}

const handleReset = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  const res = await qe(post('/main/user/forgot', form))
  loading.value = false
  if (res) {
    ElMessage.success('Password reset successful!')
    router.push('/login')
  }
}
</script>

<style scoped>
.forget-view { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 0; background: var(--g-bg); }
.forget-box { width: 420px; background: var(--g-white); border-radius: 8px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.forget-title { text-align: center; margin-bottom: 30px; font-size: 24px; }
.forget-links { margin-top: 16px; }
.link { color: var(--g-main_color); cursor: pointer; font-size: 13px; }
@media (max-width: 768px) {
  .forget-box { width: 90%; padding: 24px 20px; }
  .forget-title { font-size: 20px; }
}
</style>
