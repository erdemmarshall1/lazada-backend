<template>
  <div class="setup-pwd-view">
    <div class="setup-pwd-box">
      <h2 class="setup-pwd-title">Welcome! Set Your Password</h2>
      <p class="setup-pwd-desc">This is your first login. Please set a new password to continue.</p>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="New Password" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="At least 6 characters" size="large" />
        </el-form-item>
        <el-form-item label="Confirm Password" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" show-password placeholder="Re-enter new password" size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%;background:var(--g-main_color);border-color:var(--g-main_color)" :loading="loading" @click="handleSetup">
            Set Password
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { post } from '@/api/request'

const router = useRouter()
const store = useAppStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({ password: '', confirmPassword: '' })

const validateConfirm = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('Passwords do not match'))
  } else {
    callback()
  }
}

const rules = {
  password: [
    { required: true, message: 'Please enter new password', trigger: 'blur' },
    { min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm new password', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

const handleSetup = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await post('/main/user/setup-password', { password: form.password })
    const msg = res?.msg || res?.data?.msg || 'Password set successfully'
    if (res?.code === 0 || res?.data?.code === 0) {
      ElMessage.success(msg)
      store.logout()
      await router.replace('/login')
    } else {
      ElMessage.error(msg)
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.msg || error?.msg || 'Failed to set password')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.setup-pwd-view { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 0; background: var(--g-bg); }
.setup-pwd-box { width: 420px; background: var(--g-white); border-radius: 8px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.setup-pwd-title { text-align: center; margin-bottom: 8px; font-size: 22px; }
.setup-pwd-desc { text-align: center; color: #999; font-size: 13px; margin-bottom: 24px; }
@media (max-width: 768px) {
  .setup-pwd-view { padding: 16px; min-height: calc(100vh - 120px); }
  .setup-pwd-box { width: 100%; padding: 24px 20px; }
  .setup-pwd-title { font-size: 18px; }
}
</style>
