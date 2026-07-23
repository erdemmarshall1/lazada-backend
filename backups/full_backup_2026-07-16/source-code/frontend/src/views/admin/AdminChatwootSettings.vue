<template>
  <div class="admin-page admin-chatwoot-settings">
    <h2>Chatwoot Chat Settings</h2>
    <p class="desc">Configure the Chatwoot live chat widget on your site.</p>

    <el-form ref="formRef" :model="form" label-position="top" v-loading="loading">
      <el-form-item label="Enable Chatwoot Chat">
        <el-switch v-model="form.enabled" />
        <span class="toggle-label">Show Chatwoot chat widget on all pages</span>
      </el-form-item>

      <el-divider content-position="left">Widget Configuration</el-divider>

      <el-form-item label="Website Token" prop="websiteToken">
        <el-input v-model="form.websiteToken" placeholder="e.g. abc123def456" />
        <div class="form-tip">Find this in your Chatwoot dashboard: Settings &rarr; Channels &rarr; Website &rarr; Website Token</div>
      </el-form-item>

      <el-form-item label="Base URL" prop="baseUrl">
        <el-input v-model="form.baseUrl" placeholder="https://app.chatwoot.com" />
        <div class="form-tip">The URL of your Chatwoot installation. Use the default if using Chatwoot Cloud.</div>
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
  enabled: false,
  websiteToken: '',
  baseUrl: 'https://app.chatwoot.com',
})

const loadSettings = async () => {
  loading.value = true
  const res = await get('/home/admin/chatwoot-settings')
  if (res?.code === 0 && res?.data) {
    const s = res.data
    form.enabled = !!s.enabled
    form.websiteToken = s.websiteToken || ''
    form.baseUrl = s.baseUrl || 'https://app.chatwoot.com'
  }
  loading.value = false
}

const handleSave = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  saved.value = false
  const res = await $http.put('/home/admin/chatwoot-settings', form)
  saving.value = false
  if (res?.code === 0) {
    ElMessage.success('Chatwoot settings saved')
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } else {
    ElMessage.error(res?.msg || 'Failed to save')
  }
}

onMounted(loadSettings)
</script>

<style scoped>
.admin-chatwoot-settings { padding: 20px; max-width: 600px; }
.admin-chatwoot-settings h2 { margin-bottom: 4px; }
.admin-chatwoot-settings .desc { color: rgba(255,255,255,0.4); font-size: 13px; margin-bottom: 16px; }
.toggle-label { margin-left: 12px; font-size: 13px; color: rgba(255,255,255,0.5); }
.form-tip { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 4px; }
.el-divider { margin: 24px 0 16px; }
.el-form-item { margin-bottom: 18px; }
</style>
