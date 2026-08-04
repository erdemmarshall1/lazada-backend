<template>
  <div class="admin-page admin-email-settings">
    <h2>Email Settings</h2>
    <p class="desc">Configure SMTP credentials and toggle which customer email notifications are sent.</p>

    <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" v-loading="loading">
      <el-divider content-position="left">SMTP Configuration</el-divider>
      <div class="g-flex" style="gap:16px;flex-wrap:wrap">
        <el-form-item label="SMTP Provider Preset" style="flex:1;min-width:220px">
          <el-select v-model="presetKey" placeholder="Load a free SMTP preset..." clearable style="width:100%" @change="applyPreset">
            <el-option label="Gmail (App Password)" value="gmail" />
            <el-option label="Zoho Mail" value="zoho" />
            <el-option label="Brevo / Sendinblue" value="brevo" />
            <el-option label="Mailtrap (Testing)" value="mailtrap" />
            <el-option label="Ethereal (Testing)" value="ethereal" />
          </el-select>
          <div class="field-hint">Pick a provider to auto-fill host/port, then enter your credentials below.</div>
        </el-form-item>
      </div>
      <div class="g-flex" style="gap:16px;flex-wrap:wrap">
        <el-form-item label="SMTP Host" prop="host" style="flex:2;min-width:240px">
          <el-input v-model="form.host" placeholder="smtp.example.com" />
        </el-form-item>
        <el-form-item label="Port" prop="port" style="flex:1;min-width:100px">
          <el-input-number v-model="form.port" :min="1" :max="65535" style="width:100%" />
        </el-form-item>
      </div>
      <div class="g-flex" style="gap:16px;flex-wrap:wrap">
        <el-form-item label="Username" prop="user" style="flex:1;min-width:200px">
          <el-input v-model="form.user" placeholder="SMTP username" />
        </el-form-item>
        <el-form-item label="Password" prop="pass" style="flex:1;min-width:200px">
          <el-input v-model="form.pass" type="password" placeholder="SMTP password" show-password />
        </el-form-item>
      </div>
      <div class="g-flex" style="gap:16px;flex-wrap:wrap">
        <el-form-item label="From Name" prop="fromName" style="flex:1;min-width:200px">
          <el-input v-model="form.fromName" placeholder="Shopify Wholesale" />
        </el-form-item>
        <el-form-item label="From Email" prop="fromEmail" style="flex:1;min-width:200px">
          <el-input v-model="form.fromEmail" placeholder="noreply@shopifywholesale.com" />
        </el-form-item>
      </div>
      <div class="g-flex" style="gap:16px;flex-wrap:wrap;align-items:flex-end">
        <el-form-item label="Test Recipient" style="flex:1;min-width:200px">
          <el-input v-model="form.testTo" placeholder="email to send the test to (defaults to your email)" />
        </el-form-item>
        <el-form-item style="margin-bottom:18px">
          <el-button :loading="testing" :disabled="!form.host || !form.user || !form.pass" @click="testSmtp">
            <i class="iconfont icon-email" style="margin-right:6px"></i> Test SMTP Connection
          </el-button>
        </el-form-item>
      </div>

      <el-divider content-position="left">Email Notifications</el-divider>
      <p class="desc">Toggle which customer emails are sent automatically.</p>
      <el-form-item label="Order Confirmation">
        <el-switch v-model="form.sendOrderConfirmation" />
        <span class="toggle-label">Send email when customer places an order</span>
      </el-form-item>
      <el-form-item label="Payment Confirmation">
        <el-switch v-model="form.sendPaymentConfirmation" />
        <span class="toggle-label">Send email when payment is received</span>
      </el-form-item>
      <el-form-item label="Shipping Update">
        <el-switch v-model="form.sendShippingUpdate" />
        <span class="toggle-label">Send email when order is shipped</span>
      </el-form-item>
      <el-form-item label="Refund Notification">
        <el-switch v-model="form.sendRefundNotification" />
        <span class="toggle-label">Send email when refund is processed</span>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="saving" @click="handleSave">Save Settings</el-button>
        <el-button v-if="saved" type="success" :icon="Check">Saved</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminGet, adminRequest } from '@/api/adminRequest'
import { Check } from '@element-plus/icons-vue'

const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const saved = ref(false)
const testing = ref(false)
const presetKey = ref('')

const PRESETS = {
  gmail: { host: 'smtp.gmail.com', port: 465, hint: 'Use a Google App Password (not your Gmail password).' },
  zoho: { host: 'smtp.zoho.com', port: 465, hint: 'Use your Zoho Mail account credentials.' },
  brevo: { host: 'smtp-relay.brevo.com', port: 587, hint: 'Use your Brevo SMTP key as the password.' },
  mailtrap: { host: 'sandbox.smtp.mailtrap.io', port: 2525, hint: 'Mailtrap captures emails in a test inbox.' },
  ethereal: { host: 'smtp.ethereal.email', port: 587, hint: 'Ethereal generates throwaway test credentials.' },
}

const applyPreset = (key) => {
  const p = PRESETS[key]
  if (!p) return
  form.host = p.host
  form.port = p.port
  ElMessage.info(p.hint)
}

const testSmtp = async () => {
  testing.value = true
  try {
    const res = await adminRequest.post('/home/admin/email-settings/test', {
      host: form.host,
      port: form.port,
      user: form.user,
      pass: form.pass,
      fromName: form.fromName,
      fromEmail: form.fromEmail,
      to: form.testTo || '',
    })
    if (res?.code === 0) {
      const d = res.data || {}
      ElMessage.success(res.msg || 'SMTP test passed')
      if (d.previewUrl) {
        ElMessageBox.alert(`Test email sent to ${d.to}.${d.previewUrl ? `\n\nPreview: ${d.previewUrl}` : ''}`, 'SMTP OK', { type: 'success' })
      }
    } else {
      ElMessage.error(res?.msg || 'SMTP test failed')
    }
  } catch (err) {
    ElMessage.error(err?.response?.data?.msg || err?.message || 'SMTP test failed')
  } finally {
    testing.value = false
  }
}

const form = reactive({
  host: 'smtp.ethereal.email',
  port: 587,
  user: '',
  pass: '',
  fromName: 'Shopify Wholesale',
  fromEmail: 'noreply@shopifywholesale.com',
  sendOrderConfirmation: true,
  sendPaymentConfirmation: true,
  sendShippingUpdate: true,
  sendRefundNotification: true,
  testTo: '',
})

const formRules = {
  host: [{ required: true, message: 'SMTP host is required', trigger: 'blur' }],
  port: [{ required: true, message: 'Port is required', trigger: 'blur' }],
  fromEmail: [{ type: 'email', message: 'Invalid email format', trigger: 'blur' }],
}

const loadSettings = async () => {
  loading.value = true
  const res = await adminGet('/home/admin/email-settings')
  if (res?.code === 0 && res?.data) {
    const s = res.data
    form.host = s.host || 'smtp.ethereal.email'
    form.port = s.port ?? 587
    form.user = s.user || ''
    form.pass = s.pass || ''
    form.fromName = s.fromName || 'Shopify Wholesale'
    form.fromEmail = s.fromEmail || 'noreply@shopifywholesale.com'
    form.sendOrderConfirmation = s.sendOrderConfirmation !== false
    form.sendPaymentConfirmation = s.sendPaymentConfirmation !== false
    form.sendShippingUpdate = s.sendShippingUpdate !== false
    form.sendRefundNotification = s.sendRefundNotification !== false
  }
  loading.value = false
}

const handleSave = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  saved.value = false
  const res = await adminRequest.put('/home/admin/email-settings', form)
  saving.value = false
  if (res?.code === 0) {
    ElMessage.success('Email settings saved')
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } else {
    ElMessage.error(res?.msg || 'Failed to save')
  }
}

onMounted(loadSettings)
</script>

<style scoped>
.admin-email-settings { padding: 20px; max-width: 720px; }
.admin-email-settings h2 { margin-bottom: 4px; }
.admin-email-settings .desc { color: rgba(255,255,255,0.4); font-size: 13px; margin-bottom: 16px; }
.toggle-label { margin-left: 12px; font-size: 13px; color: rgba(255,255,255,0.5); }
.field-hint { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 4px; }
.el-divider { margin: 24px 0 16px; }
.el-form-item { margin-bottom: 18px; }
</style>
