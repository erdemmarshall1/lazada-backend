<template>
  <div class="twofa-page">
    <h3 class="page-title">Two-Factor Authentication</h3>

    <div v-if="!twoFactorEnabled" class="twofa-setup">
      <p class="twofa-intro">Enhance your account security with an additional verification step when signing in.</p>
      <el-button type="primary" :loading="setupLoading" @click="handleSetup" style="background:var(--g-main_color);border-color:var(--g-main_color)">
        Enable Two-Factor Authentication
      </el-button>
    </div>

    <div v-else-if="showQR" class="twofa-qr-section">
      <div class="twofa-step">
        <h4>Step 1: Scan QR Code</h4>
        <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
        <div class="qr-container" v-if="qrCode">
          <img :src="qrCode" alt="QR Code" />
        </div>
        <p v-if="secretKey" class="secret-key">
          Or enter this key manually: <code>{{ secretKey }}</code>
        </p>
      </div>
      <div class="twofa-step">
        <h4>Step 2: Verify Code</h4>
        <p>Enter the 6-digit code from your authenticator app to confirm setup.</p>
        <div class="verify-row">
          <el-input v-model="verifyCode" placeholder="000000" maxlength="6" class="code-input" />
          <el-button type="primary" :loading="verifyLoading" @click="handleVerify" style="background:var(--g-main_color);border-color:var(--g-main_color)">
            Verify
          </el-button>
        </div>
      </div>
    </div>

    <div v-else class="twofa-active">
      <el-alert type="success" :closable="false" show-icon title="Two-factor authentication is enabled" />
      <div class="backup-section" v-if="backupCodes.length">
        <h4>Backup Codes</h4>
        <p>Save these backup codes in a secure place. Each code can be used only once.</p>
        <div class="backup-codes">
          <div class="backup-code" v-for="(code, i) in backupCodes" :key="i">
            <span>{{ code }}</span>
            <el-tag size="small" type="warning" v-if="code.used">Used</el-tag>
          </div>
        </div>
        <el-button size="small" @click="generateBackupCodes" :loading="backupLoading">Generate New Backup Codes</el-button>
      </div>
      <div class="disable-section">
        <h4>Disable Two-Factor Authentication</h4>
        <div class="verify-row">
          <el-input v-model="disablePassword" type="password" placeholder="Enter your password" class="code-input" />
          <el-button type="danger" :loading="disableLoading" @click="handleDisable">Disable</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, post } from '@/api/request'

const twoFactorEnabled = ref(false)
const showQR = ref(false)
const qrCode = ref('')
const secretKey = ref('')
const verifyCode = ref('')
const backupCodes = ref([])
const disablePassword = ref('')

const setupLoading = ref(false)
const verifyLoading = ref(false)
const backupLoading = ref(false)
const disableLoading = ref(false)

const handleSetup = async () => {
  setupLoading.value = true
  try {
    const res = await post('/home/user/2fa/setup')
    if (res?.data) {
      qrCode.value = res.data.qrCode
      secretKey.value = res.data.secret
      showQR.value = true
    } else {
      ElMessage.error(res?.msg || 'Setup failed')
    }
  } catch (err) {
    ElMessage.error(err?.response?.data?.msg || 'Setup failed')
  } finally {
    setupLoading.value = false
  }
}

const handleVerify = async () => {
  if (!verifyCode.value || verifyCode.value.length !== 6) {
    ElMessage.warning('Please enter a valid 6-digit code')
    return
  }
  verifyLoading.value = true
  try {
    const res = await post('/home/user/2fa/verify', { code: verifyCode.value })
    if (res?.data) {
      ElMessage.success('Two-factor authentication enabled')
      showQR.value = false
      twoFactorEnabled.value = true
      backupCodes.value = res.data.backupCodes || []
    } else {
      ElMessage.error(res?.msg || 'Verification failed')
    }
  } catch (err) {
    ElMessage.error(err?.response?.data?.msg || 'Verification failed')
  } finally {
    verifyLoading.value = false
  }
}

const generateBackupCodes = async () => {
  backupLoading.value = true
  try {
    const res = await post('/home/user/2fa/backup-codes')
    if (res?.data) {
      backupCodes.value = res.data.backupCodes || []
      ElMessage.success('New backup codes generated')
    }
  } catch (err) {
    ElMessage.error(err?.response?.data?.msg || 'Failed to generate codes')
  } finally {
    backupLoading.value = false
  }
}

const handleDisable = async () => {
  if (!disablePassword.value) {
    ElMessage.warning('Please enter your password')
    return
  }
  disableLoading.value = true
  try {
    const res = await post('/home/user/2fa/disable', { password: disablePassword.value })
    if (res?.code === 0 || res?.code === 1 || res?.data) {
      ElMessage.success('Two-factor authentication disabled')
      twoFactorEnabled.value = false
      showQR.value = false
      qrCode.value = ''
      secretKey.value = ''
      backupCodes.value = []
      disablePassword.value = ''
    } else {
      ElMessage.error(res?.msg || 'Failed to disable')
    }
  } catch (err) {
    ElMessage.error(err?.response?.data?.msg || 'Failed to disable')
  } finally {
    disableLoading.value = false
  }
}

onMounted(async () => {
  try {
    const res = await get('/home/user/getInfo')
    if (res?.data?.twoFactorEnabled) {
      twoFactorEnabled.value = true
    }
  } catch {
    // silently fail
  }
})
</script>

<style scoped>
.twofa-page { max-width: 560px; }
.page-title { font-size: 18px; font-weight: 600; margin-bottom: 24px; }
.twofa-intro { font-size: 14px; color: #666; margin-bottom: 20px; line-height: 1.6; }
.twofa-step { margin-bottom: 24px; }
.twofa-step h4 { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
.twofa-step p { font-size: 13px; color: #666; margin-bottom: 12px; }
.qr-container { display: inline-block; border: 2px solid #e8e6e2; border-radius: 8px; padding: 8px; margin-bottom: 12px; }
.qr-container img { width: 180px; height: 180px; }
.secret-key { font-size: 12px; }
.secret-key code { background: #f4f2ee; padding: 2px 8px; border-radius: 4px; font-size: 12px; user-select: all; }
.verify-row { display: flex; gap: 8px; align-items: center; }
.code-input { width: 140px; }
.twofa-active .el-alert { margin-bottom: 20px; }
.backup-section { margin-bottom: 24px; }
.backup-section h4 { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
.backup-section p { font-size: 13px; color: #666; margin-bottom: 12px; }
.backup-codes { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.backup-code { background: #f4f2ee; padding: 6px 12px; border-radius: 4px; font-family: monospace; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.disable-section { margin-top: 24px; padding-top: 20px; border-top: 1px solid #e8e6e2; }
.disable-section h4 { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
</style>
