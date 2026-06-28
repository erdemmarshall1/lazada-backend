<template>
  <div class="admin-live-chat-settings">
    <h2>Live Chat Settings</h2>
    <p class="desc">Configure the live chat widget appearance and assign support agents.</p>

    <el-form ref="formRef" :model="form" label-position="top" v-loading="loading">
      <el-form-item label="Enable Live Chat">
        <el-switch v-model="form.enabled" />
        <span class="toggle-label">Show live chat widget on all pages</span>
      </el-form-item>

      <el-divider content-position="left">Widget Appearance</el-divider>

      <div class="g-flex" style="gap:16px;flex-wrap:wrap">
        <el-form-item label="Widget Title" prop="widgetTitle" style="flex:1;min-width:200px">
          <el-input v-model="form.widgetTitle" placeholder="Live Chat" />
        </el-form-item>
        <el-form-item label="Widget Color" prop="widgetColor" style="flex:1;min-width:140px">
          <el-input v-model="form.widgetColor" placeholder="#165dff">
            <template #prepend>
              <span class="color-swatch" :style="{ background: form.widgetColor }" />
            </template>
          </el-input>
        </el-form-item>
      </div>

      <el-form-item label="Widget Position" prop="widgetPosition">
        <el-radio-group v-model="form.widgetPosition">
          <el-radio value="bottom-right">Bottom Right</el-radio>
          <el-radio value="bottom-left">Bottom Left</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="Auto Greeting" prop="autoGreeting">
        <el-input v-model="form.autoGreeting" type="textarea" :rows="2" placeholder="Hello! How can we help you today?" />
      </el-form-item>

      <el-form-item label="Offline Message" prop="offlineMessage">
        <el-input v-model="form.offlineMessage" type="textarea" :rows="2" placeholder="Our team is offline. Leave a message and we'll get back to you." />
      </el-form-item>

      <el-divider content-position="left">Support Agents</el-divider>
      <p class="desc">Select which admin users receive live chat messages. They can reply from the Live Chat Inbox page.</p>

      <el-form-item label="Agents" prop="agentIds">
        <el-select v-model="form.agentIds" multiple filterable placeholder="Select admin agents" style="width:100%">
          <el-option v-for="u in adminUsers" :key="u._id" :label="`${u.username} (${u.email || 'no email'})`" :value="u._id" />
        </el-select>
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
const adminUsers = ref([])

const form = reactive({
  enabled: false,
  widgetTitle: 'Live Chat',
  widgetColor: '#165dff',
  widgetPosition: 'bottom-right',
  autoGreeting: 'Hello! How can we help you today?',
  offlineMessage: 'Our team is offline. Leave a message and we\'ll get back to you.',
  agentIds: [],
})

const loadSettings = async () => {
  loading.value = true
  const res = await get('/home/admin/live-chat-settings')
  if (res?.code === 0 && res?.data) {
    const s = res.data
    form.enabled = !!s.enabled
    form.widgetTitle = s.widgetTitle || 'Live Chat'
    form.widgetColor = s.widgetColor || '#165dff'
    form.widgetPosition = s.widgetPosition || 'bottom-right'
    form.autoGreeting = s.autoGreeting || ''
    form.offlineMessage = s.offlineMessage || ''
    form.agentIds = (s.agentIds || []).map(a => a._id || a)
  }
  loading.value = false
}

const loadAdminUsers = async () => {
  try {
    const res = await get('/home/admin/users', { params: { pageSize: 200 } })
    if (res?.code === 0 && res?.data?.list) {
      adminUsers.value = res.data.list.filter(u => u.role === 'admin')
    }
  } catch (e) {}
}

const handleSave = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  saved.value = false
  const res = await $http.put('/home/admin/live-chat-settings', form)
  saving.value = false
  if (res?.code === 0) {
    ElMessage.success('Live chat settings saved')
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } else {
    ElMessage.error(res?.msg || 'Failed to save')
  }
}

onMounted(() => {
  loadSettings()
  loadAdminUsers()
})
</script>

<style scoped>
.admin-live-chat-settings { padding: 20px; max-width: 720px; }
.admin-live-chat-settings h2 { margin-bottom: 4px; }
.admin-live-chat-settings .desc { color: #999; font-size: 13px; margin-bottom: 16px; }
.toggle-label { margin-left: 12px; font-size: 13px; color: #666; }
.el-divider { margin: 24px 0 16px; }
.el-form-item { margin-bottom: 18px; }
.color-swatch { display: inline-block; width: 16px; height: 16px; border-radius: 3px; border: 1px solid #ddd; vertical-align: middle; }
</style>
