<template>
  <div class="admin-login-wrap">
    <div class="admin-login-box">
      <div class="admin-login-header">
        <div class="admin-logo">A</div>
        <h2>Admin Login</h2>
        <p class="admin-login-sub">Administrator Portal</p>
      </div>
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
      <div class="admin-login-footer">
        <span class="link" @click="$router.push('/forgetpwd')">Forgot password?</span>
      </div>
      <div class="admin-login-back">
        <span class="link" @click="$router.push('/main')">&larr; Back to main site</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
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

onMounted(() => {
  if (store.isLogin) {
    router.replace('/admin/dashboard')
  }
})

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
        await router.replace('/admin/dashboard')
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
      await router.replace('/admin/dashboard')
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
.admin-login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 40px 16px;
}
.admin-login-box {
  width: 420px;
  max-width: 100%;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.admin-login-header {
  text-align: center;
  margin-bottom: 32px;
}
.admin-logo {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 800;
  font-size: 24px;
}
.admin-login-header h2 {
  font-size: 22px;
  color: #1a1a2e;
  margin: 0 0 4px;
}
.admin-login-sub {
  font-size: 13px;
  color: #999;
  margin: 0;
}
.admin-login-footer {
  text-align: center;
  margin-top: 12px;
}
.admin-login-back {
  text-align: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}
.link {
  color: #667eea;
  cursor: pointer;
  font-size: 13px;
}
.link:hover {
  text-decoration: underline;
}
@media (max-width: 768px) {
  .admin-login-wrap { padding: 16px; }
  .admin-login-box { padding: 24px 20px; }
}
</style>
