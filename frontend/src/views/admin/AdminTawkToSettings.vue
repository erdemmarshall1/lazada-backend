<template>
  <div class="admin-tawkto-settings">
    <h2>Tawk.to Chat Settings</h2>
    <p class="desc">Configure the Tawk.to live chat widget on your site.</p>

    <el-form ref="formRef" :model="form" label-position="top" v-loading="loading">
      <el-form-item label="Enable Tawk.to Chat">
        <el-switch v-model="form.enabled" />
        <span class="toggle-label">Show Tawk.to chat widget on all pages</span>
      </el-form-item>

      <el-divider content-position="left">Widget Configuration</el-divider>

      <el-form-item label="Widget ID (Property ID)" prop="widgetId">
        <el-input v-model="form.widgetId" placeholder="e.g. 1234567890abc" />
        <div class="form-tip">Find this in your tawk.to dashboard: Admin &rarr; Property Settings &rarr; Widget &rarr; Direct Chat Link</div>
      </el-form-item>

      <div class="g-flex" style="gap:16px;flex-wrap:wrap">
        <el-form-item label="Widget Position" prop="widgetPosition" style="flex:1;min-width:200px">
          <el-radio-group v-model="form.widgetPosition">
            <el-radio value="bottom-right">Bottom Right</el-radio>
            <el-radio value="bottom-left">Bottom Left</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Widget Color" prop="widgetColor" style="flex:1;min-width:140px">
          <el-input v-model="form.widgetColor" placeholder="#ff6600">
            <template #prepend>
              <span class="color-swatch" :style="{ background: form.widgetColor }" />
            </template>
          </el-input>
        </el-form-item>
      </div>

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
  widgetId: '',
  widgetPosition: 'bottom-right',
  widgetColor: '#ff6600',
})

const loadSettings = async () => {
  loading.value = true
  const res = await get('/home/admin/tawkto-settings')
  if (res?.code === 0 && res?.data) {
    const s = res.data
    form.enabled = !!s.enabled
    form.widgetId = s.widgetId || ''
    form.widgetPosition = s.widgetPosition || 'bottom-right'
    form.widgetColor = s.widgetColor || '#ff6600'
  }
  loading.value = false
}

const handleSave = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  saved.value = false
  const res = await $http.put('/home/admin/tawkto-settings', form)
  saving.value = false
  if (res?.code === 0) {
    ElMessage.success('Tawk.to settings saved')
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } else {
    ElMessage.error(res?.msg || 'Failed to save')
  }
}

onMounted(loadSettings)
</script>

<style scoped>
.admin-tawkto-settings { padding: 20px; max-width: 600px; }
.admin-tawkto-settings h2 { margin-bottom: 4px; }
.admin-tawkto-settings .desc { color: #999; font-size: 13px; margin-bottom: 16px; }
.toggle-label { margin-left: 12px; font-size: 13px; color: #666; }
.form-tip { font-size: 12px; color: #999; margin-top: 4px; }
.el-divider { margin: 24px 0 16px; }
.el-form-item { margin-bottom: 18px; }
.color-swatch { display: inline-block; width: 16px; height: 16px; border-radius: 3px; border: 1px solid #ddd; vertical-align: middle; }
</style>
