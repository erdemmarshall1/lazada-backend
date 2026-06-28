<template>
  <div class="admin-email-settings">
    <h2>Email Settings</h2>
    <p class="desc">Configure SMTP credentials and toggle which customer email notifications are sent.</p>

    <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" v-loading="loading">
      <el-divider content-position="left">SMTP Configuration</el-divider>
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
import { ElMessage } from 'element-plus'
import { get, $http } from '@/api/request'
import { Check } from '@element-plus/icons-vue'

const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const saved = ref(false)

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
})

const formRules = {
  host: [{ required: true, message: 'SMTP host is required', trigger: 'blur' }],
  port: [{ required: true, message: 'Port is required', trigger: 'blur' }],
  fromEmail: [{ type: 'email', message: 'Invalid email format', trigger: 'blur' }],
}

const loadSettings = async () => {
  loading.value = true
  const res = await get('/home/admin/email-settings')
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
  const res = await $http.put('/home/admin/email-settings', form)
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
.admin-email-settings .desc { color: #999; font-size: 13px; margin-bottom: 16px; }
.toggle-label { margin-left: 12px; font-size: 13px; color: #666; }
.el-divider { margin: 24px 0 16px; }
.el-form-item { margin-bottom: 18px; }
</style>
