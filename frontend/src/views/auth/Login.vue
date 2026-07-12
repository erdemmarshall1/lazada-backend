<template>
  <div class="login-view">
    <div class="login-box">
      <h2 class="login-title">Login</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="Username / Email" prop="username">
          <el-input v-model="form.username" placeholder="Enter username or email" size="large" />
        </el-form-item>
        <el-form-item label="Password" prop="password" v-if="!twoFactorRequired">
          <el-input v-model="form.password" type="password" show-password placeholder="Enter password" size="large" />
        </el-form-item>
        <el-form-item label="Authentication Code" prop="twoFactorCode" v-if="twoFactorRequired">
          <el-input v-model="form.twoFactorCode" placeholder="Enter 6-digit code" size="large" maxlength="6" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%;background:var(--g-main_color);border-color:var(--g-main_color)" :loading="loading" @click="handleLogin">
            {{ twoFactorRequired ? 'Verify' : 'Login' }}
          </el-button>
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

const twoFactorRequired = ref(false)
const tempToken = ref('')

const form = reactive({ username: '', password: '', twoFactorCode: '' })
const rules = {
  username: [{ required: true, message: 'Please enter username or email', trigger: 'blur' }],
  password: [{ required: true, message: 'Please enter password', trigger: 'blur' }],
  twoFactorCode: [{ required: true, message: 'Please enter authentication code', trigger: 'blur' }],
}

const getRedirectPath = () => {
  const redirect = route.query.redirect

  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    const redirectPath = redirect.split('?')[0]
    if (!['/login', '/register', '/forgetpwd'].includes(redirectPath)) {
      return redirect
    }
  }

  if (store.isSeller) return '/mystore'
  return '/myaccount'
}

const handleLogin = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    if (twoFactorRequired.value) {
      const res = await post('/main/user/login/2fa', { tempToken: tempToken.value, code: form.twoFactorCode })
      const payload = res?.data || res
      const token = payload?.token || res?.token
      const refreshToken = payload?.refreshToken || res?.refreshToken
      const userInfo = payload?.userInfo || payload?.user || res?.userInfo || res?.user
      const message = payload?.msg || res?.msg || 'Login successful'

      if (token) {
        store.setToken(token)
        if (refreshToken) store.setRefreshToken(refreshToken)
        if (userInfo) store.setUserInfo(userInfo)
        connectSocket()
        ElMessage.success(message)
        const redirectPath = getRedirectPath()
        try { await router.replace(redirectPath) }
        catch { window.location.hash = `#${redirectPath}` }
      } else {
        ElMessage.error(message)
      }
      return
    }

    const res = await post('/main/user/login', { username: form.username, password: form.password })

    if (res?.twoFactorRequired && res?.tempToken) {
      twoFactorRequired.value = true
      tempToken.value = res.tempToken
      form.password = ''
      ElMessage.info('Please enter your two-factor authentication code')
      return
    }

    const responseBody = res?.data && (res.data.token || res.data.userInfo || res.data.user)
      ? res.data
      : res
    const payload = responseBody?.data && (responseBody.data.token || responseBody.data.userInfo || responseBody.data.user)
      ? responseBody.data
      : responseBody
    const token = payload?.token || responseBody?.token || res?.token
    const refreshToken = payload?.refreshToken || responseBody?.refreshToken || res?.refreshToken
    const userInfo = payload?.userInfo || payload?.user || responseBody?.userInfo || responseBody?.user || res?.userInfo || res?.user
    const message = payload?.msg || responseBody?.msg || res?.msg || 'Login successful'

    if (token) {
      store.setToken(token)
      if (refreshToken) store.setRefreshToken(refreshToken)
      if (userInfo) store.setUserInfo(userInfo)
      connectSocket()

      if (responseBody.needsPasswordSetup || userInfo?.needsPasswordSetup) {
        ElMessage.info('Please set up your password first')
        await router.replace('/setup-password')
        return
      }

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
.login-box { width: 420px; background: var(--g-white); border-radius: 10px; padding: 40px 45px 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.login-title { text-align: center; margin-bottom: 30px; font-size: 24px; color: #242424; }
.login-links { margin-top: 16px; }
.link { color: var(--g-main_color); cursor: pointer; font-size: 13px; }
.link:hover { text-decoration: underline; }
.login-view :deep(.el-button--primary) {
  background: linear-gradient(90deg, #0a68ff, #ff3333);
  border-color: transparent;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.login-view :deep(.el-button--primary:hover) {
  background: linear-gradient(90deg, #0957e0, #e62e2e);
  border-color: transparent;
}
.login-view :deep(.el-input__wrapper) {
  border-radius: 10px;
  background: #f4f6fa;
}
.login-view :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(10,104,255,0.2) inset;
}
.login-view :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px rgba(10,104,255,0.4) inset;
}
@media (max-width: 768px) {
  .login-view { padding: 16px; min-height: calc(100vh - 120px); }
  .login-box { width: 100%; padding: 24px 20px; }
  .login-title { font-size: 20px; margin-bottom: 20px; }
}
</style>
