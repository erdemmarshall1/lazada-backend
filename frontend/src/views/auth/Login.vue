<template>
  <div class="login-view">
    <div class="login-box">
      <h2 class="login-title">Login</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="Username / Email" prop="username">
          <el-input v-model="form.username" placeholder="Enter username or email" size="large" />
        </el-form-item>
        <el-form-item label="Password" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="Enter password" size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%;background:var(--g-main_color);border-color:var(--g-main_color)" :loading="loading" @click="handleLogin">Login</el-button>
        </el-form-item>
      </el-form>
      <div class="login-links g-flex-align-center g-flex-justify-between">
        <span class="link" @click="$router.push('/register')">Register</span>
        <span class="link" @click="$router.push('/forgetpwd')">Forgot password?</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { post } from '@/api/request'
import { connectSocket } from '@/socket'

const router = useRouter()
const route = useRoute()
const store = useAppStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: 'Please enter username or email', trigger: 'blur' }],
  password: [{ required: true, message: 'Please enter password', trigger: 'blur' }],
}

const getRedirectPath = () => {
  const redirect = route.query.redirect

  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    const redirectPath = redirect.split('?')[0]
    if (!['/login', '/register', '/forgetpwd'].includes(redirectPath)) {
      return redirect
    }
  }

  return '/myaccount'
}

const handleLogin = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await post('/main/user/login', form)

    const responseBody = res?.data && (res.data.token || res.data.userInfo || res.data.user)
      ? res.data
      : res
    const payload = responseBody?.data && (responseBody.data.token || responseBody.data.userInfo || responseBody.data.user)
      ? responseBody.data
      : responseBody
    const token = payload?.token || responseBody?.token || res?.token
    const userInfo = payload?.userInfo || payload?.user || responseBody?.userInfo || responseBody?.user || res?.userInfo || res?.user
    const message = payload?.msg || responseBody?.msg || res?.msg || 'Login successful'

    if (token) {
      store.setToken(token)
      if (userInfo) {
        store.setUserInfo(userInfo)
      }
      connectSocket()
      ElMessage.success(message)

      const redirectPath = getRedirectPath()
      try {
        await router.replace(redirectPath)
      } catch (navigationError) {
        window.location.hash = `#${redirectPath}`
      }
    } else {
      ElMessage.error(message)
    }
  } catch (error) {
    const message = error?.response?.data?.msg || error?.msg || 'Login failed'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-view { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 0; background: var(--g-bg); }
.login-box { width: 420px; background: var(--g-white); border-radius: 8px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.login-title { text-align: center; margin-bottom: 30px; font-size: 24px; }
.login-links { margin-top: 16px; }
.link { color: var(--g-main_color); cursor: pointer; font-size: 13px; }
.link:hover { text-decoration: underline; }
@media (max-width: 768px) {
  .login-view { padding: 16px; min-height: calc(100vh - 120px); }
  .login-box { width: 100%; padding: 24px 20px; }
  .login-title { font-size: 20px; margin-bottom: 20px; }
}
</style>
