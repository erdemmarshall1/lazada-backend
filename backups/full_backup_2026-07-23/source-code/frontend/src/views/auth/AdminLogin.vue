<template>
  <div class="admin-login-page">
    <div class="admin-login-card">
      <div class="admin-login-logo">A</div>
      <h2>{{ $t('auth.adminLogin.title') }}</h2>
      <p>{{ $t('auth.adminLogin.portal') }}</p>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item :label="$t('auth.adminLogin.usernameLabel')" prop="username">
          <el-input v-model="form.username" :placeholder="$t('auth.adminLogin.usernamePlaceholder')" size="large" />
        </el-form-item>
        <el-form-item :label="$t('auth.adminLogin.passwordLabel')" prop="password" v-if="!twoFactorRequired">
          <el-input v-model="form.password" type="password" show-password :placeholder="$t('auth.adminLogin.passwordPlaceholder')" size="large" />
        </el-form-item>
        <el-form-item :label="$t('auth.adminLogin.codeLabel')" prop="twoFactorCode" v-if="twoFactorRequired">
          <el-input v-model="form.twoFactorCode" :placeholder="$t('auth.adminLogin.codePlaceholder')" size="large" maxlength="6" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" @click="handleLogin">
            {{ twoFactorRequired ? $t('common.confirm') : $t('auth.adminLogin.title') }}
          </el-button>
        </el-form-item>
      </el-form>
      <div class="admin-login-footer">
        <span class="link" @click="$router.push('/admin/forgetpwd')">{{ $t('auth.adminLogin.forgotPassword') }}</span>
        <span class="link" @click="$router.push('/main')">{{ $t('auth.adminLogin.backToMain') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAdminAppStore } from '@/stores/adminApp'
import { adminPost } from '@/api/adminRequest'

const router = useRouter()
const route = useRoute()
const store = useAdminAppStore()
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
      const res = await adminPost('/home/admin/auth/login/2fa', { tempToken: tempToken.value, code: form.twoFactorCode })
      const payload = res?.data || res
      const token = payload?.token || res?.token
      const refreshToken = payload?.refreshToken || res?.refreshToken
      const userInfo = payload?.userInfo || payload?.user || res?.userInfo || res?.user
      const message = payload?.msg || res?.msg || 'Login successful'

      if (token) {
        store.setToken(token)
        if (refreshToken) store.setRefreshToken(refreshToken)
        if (userInfo) store.setUserInfo(userInfo)
        ElMessage.success(message)
        await router.replace('/admin/dashboard')
      } else {
        ElMessage.error(message)
      }
      return
    }

    const res = await adminPost('/home/admin/auth/login', { username: form.username, password: form.password })

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

      if (responseBody.needsPasswordSetup || userInfo?.needsPasswordSetup) {
        ElMessage.info('Please set up your password first')
        await router.replace('/admin/setup-password')
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
.link {
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  font-size: 13px;
  display: block;
  margin-top: 12px;
}
.link:hover {
  color: #667eea;
}
</style>
