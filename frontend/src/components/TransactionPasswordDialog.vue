<template>
  <el-dialog :model-value="visible" :title="dialogTitle" width="420px" :close-on-click-modal="false" @close="handleClose" @update:model-value="v => !v && handleClose()">
    <div class="tx-body">
      <template v-if="mode === 'confirm'">
        <div class="tx-icon"><i class="iconfont icon-anquan" style="font-size:48px;color:var(--g-main_color)"></i></div>
        <p class="tx-description">{{ description }}</p>
        <div class="tx-amount" v-if="amount !== null">${{ typeof amount === 'number' ? amount.toFixed(2) : amount }}</div>
        <div class="tx-password">
          <label>Transaction Password</label>
          <el-input ref="passwordInput" v-model="password" type="password" show-password placeholder="Enter your transaction password" size="large" @keyup.enter="handleConfirm" />
        </div>
      </template>
      <template v-else>
        <div class="tx-icon"><i class="iconfont icon-shezhi" style="font-size:48px;color:#e6a23c"></i></div>
        <p class="setup-text">Transaction password required. Please set one to continue.</p>
        <div class="tx-password">
          <label>New Transaction Password</label>
          <el-input v-model="newPassword" type="password" show-password placeholder="At least 8 characters" size="large" />
        </div>
        <div class="tx-password" style="margin-top:12px">
          <label>Confirm Transaction Password</label>
          <el-input v-model="confirmPassword" type="password" show-password placeholder="Repeat password" size="large" @keyup.enter="handleConfirm" />
        </div>
      </template>
      <div v-if="error" class="tx-error">{{ error }}</div>
    </div>
    <template #footer>
      <el-button @click="handleClose">Cancel</el-button>
      <el-button type="primary" style="background:var(--g-main_color);border-color:var(--g-main_color)" :loading="loading" @click="handleConfirm">{{ mode === 'setup' ? 'Set Password & Continue' : 'Confirm' }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { post } from '@/api/request'

const props = defineProps({
  visible: Boolean,
  title: { type: String, default: 'Confirm Transaction' },
  description: { type: String, default: '' },
  amount: { type: [Number, String], default: null },
  apiFunc: { type: Function, default: null },
})

const emit = defineEmits(['close', 'success'])

const mode = ref('confirm')
const password = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

const dialogTitle = computed(() => mode.value === 'setup' ? 'Set Transaction Password' : props.title)

watch(() => props.visible, (val) => {
  if (val) {
    mode.value = 'confirm'
    password.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    error.value = ''
    loading.value = false
    nextTick(() => {
      const el = document.querySelector('.tx-password input')
      if (el) setTimeout(() => el.focus(), 100)
    })
  }
})

const handleConfirm = async () => {
  error.value = ''
  if (mode.value === 'setup') {
    if (!newPassword.value) { error.value = 'Please enter a transaction password'; return }
    if (newPassword.value.length < 8) { error.value = 'Password must be at least 8 characters'; return }
    if (newPassword.value !== confirmPassword.value) { error.value = 'Passwords do not match'; return }
    loading.value = true
    try {
      const res = await post('/home/user/editFundPassword', { password: newPassword.value })
      if (res.code === 0) {
        password.value = newPassword.value
        mode.value = 'confirm'
        newPassword.value = ''
        confirmPassword.value = ''
        loading.value = false
        error.value = ''
        await doTransaction()
      } else {
        error.value = res.msg || 'Failed to set password'
        loading.value = false
      }
    } catch (e) {
      error.value = e?.msg || e?.message || 'Failed to set password'
      loading.value = false
    }
    return
  }
  if (!password.value) { error.value = 'Please enter your transaction password'; return }
  loading.value = true
  await doTransaction()
}

const doTransaction = async () => {
  if (!props.apiFunc) { error.value = 'No transaction function provided'; loading.value = false; return }
  try {
    const res = await props.apiFunc(password.value)
    if (res.code === 0) {
      emit('success')
      handleClose()
    } else if (res.msg && /set a transaction password/i.test(res.msg)) {
      mode.value = 'setup'
      error.value = ''
      loading.value = false
    } else {
      error.value = res.msg || 'Transaction failed'
      loading.value = false
    }
  } catch (e) {
    error.value = e?.msg || e?.message || 'Transaction failed'
    loading.value = false
  }
}

const handleClose = () => {
  password.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  error.value = ''
  loading.value = false
  mode.value = 'confirm'
  emit('close')
}
</script>

<style scoped>
.tx-body { text-align: center; padding: 8px 0; }
.tx-icon { margin-bottom: 12px; }
.tx-description { font-size: 14px; color: #666; margin-bottom: 8px; line-height: 1.5; }
.tx-amount { font-size: 28px; font-weight: 700; color: var(--g-main_color); margin-bottom: 20px; }
.tx-password { text-align: left; margin-bottom: 4px; }
.tx-password label { display: block; font-size: 13px; color: #999; margin-bottom: 4px; }
.setup-text { font-size: 14px; color: #e6a23c; margin-bottom: 16px; line-height: 1.5; }
.tx-error { color: #f56c6c; font-size: 13px; margin-top: 8px; }
@media (max-width: 768px) {
  :deep(.el-dialog) { width: 90% !important; max-width: 360px; }
}
</style>
