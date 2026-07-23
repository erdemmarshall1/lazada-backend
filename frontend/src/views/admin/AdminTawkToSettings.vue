<template>
  <div class="admin-page admin-tawkto-settings">
    <h2>Tawk.to Live Chat Settings</h2>
    <p class="desc">Configure the live chat widget that appears on all public pages.</p>

    <div class="settings-layout">
      <div class="settings-form">
        <el-form ref="formRef" :model="form" label-position="top" v-loading="loading">
          <el-form-item label="Enable Live Chat">
            <el-switch v-model="form.enabled" />
            <span class="toggle-label">Show live chat widget on all pages</span>
          </el-form-item>

          <el-divider content-position="left">Widget Configuration</el-divider>

          <el-form-item label="Widget ID (Property ID)" prop="widgetId">
            <el-input v-model="form.widgetId" placeholder="e.g. 1234567890abc" />
            <div class="form-tip">Find this in your Tawk.to dashboard: Admin &rarr; Property Settings &rarr; Widget &rarr; Direct Chat Link. The ID is the path after <code>embed.tawk.to/</code></div>
          </el-form-item>

          <div class="form-row">
            <el-form-item label="Widget Position" prop="widgetPosition" class="form-col">
              <el-radio-group v-model="form.widgetPosition">
                <el-radio value="bottom-right">Bottom Right</el-radio>
                <el-radio value="bottom-left">Bottom Left</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="Widget Color" prop="widgetColor" class="form-col">
              <div class="color-picker-row">
                <el-input v-model="form.widgetColor" placeholder="#ff6600" class="color-input">
                  <template #prepend>
                    <span class="color-swatch" :style="{ background: form.widgetColor }" />
                  </template>
                </el-input>
                <input type="color" :value="form.widgetColor" @input="form.widgetColor = $event.target.value" class="native-color-picker" />
              </div>
            </el-form-item>
          </div>

          <el-divider content-position="left">Actions</el-divider>

          <div class="action-row">
            <el-button type="primary" :loading="saving" @click="handleSave" size="large">
              Save Settings
            </el-button>
            <el-button v-if="saved" type="success" :icon="Check">Saved</el-button>
            <el-button :loading="testing" @click="handleTestConnection">
              Test Connection
            </el-button>
          </div>
        </el-form>
      </div>

      <div class="settings-preview">
        <h3 class="preview-title">Live Preview</h3>
        <p class="preview-desc">Widget appearance with current settings</p>
        <div class="preview-area" :class="previewPositionClass">
          <div class="preview-device">
            <div class="preview-page">
              <div class="preview-header-bar"></div>
              <div class="preview-content">
                <div class="preview-line w60"></div>
                <div class="preview-line w80"></div>
                <div class="preview-line w45"></div>
                <div class="preview-line w70"></div>
              </div>
            </div>
            <button class="preview-chat-btn" :style="previewBtnStyle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
            </button>
          </div>
          <div class="preview-badge">{{ form.widgetPosition === 'bottom-left' ? 'Left' : 'Right' }} — {{ form.widgetColor }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, $http } from '@/api/request'
import { Check } from '@element-plus/icons-vue'

const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const saved = ref(false)
const testing = ref(false)

const form = reactive({
  enabled: false,
  widgetId: '',
  widgetPosition: 'bottom-right',
  widgetColor: '#ff6600',
})

const previewPositionClass = computed(() => `preview-${form.widgetPosition}`)
const previewBtnStyle = computed(() => {
  const color = form.widgetColor || '#ff6600'
  return {
    background: `linear-gradient(135deg, ${color}, ${color}88)`,
    boxShadow: `0 4px 16px ${color}44`
  }
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

const handleTestConnection = async () => {
  if (!form.widgetId) {
    ElMessage.warning('Please enter a Widget ID first')
    return
  }
  testing.value = true
  try {
    const img = new Image()
    const promise = new Promise((resolve, reject) => {
      img.onload = () => resolve(true)
      img.onerror = () => reject(new Error('Could not reach Tawk.to'))
      const timeout = setTimeout(() => { img.src = ''; reject(new Error('Timeout')) }, 8000)
      img.onload = () => { clearTimeout(timeout); resolve(true) }
      img.onerror = () => { clearTimeout(timeout); reject(new Error('Tawk.to server unreachable')) }
    })
    img.src = `https://embed.tawk.to/${form.widgetId}?${Date.now()}`
    await promise
    ElMessage.success('Tawk.to server is reachable! Widget ID looks valid.')
  } catch (e) {
    ElMessageBox.alert(
      `Could not connect to Tawk.to with this Widget ID.\n\n${e.message}\n\nMake sure the Widget ID is correct and Tawk.to is online.`,
      'Connection Test', { confirmButtonText: 'OK', type: 'warning' }
    )
  }
  testing.value = false
}

onMounted(loadSettings)
</script>

<style scoped>
.admin-tawkto-settings { padding: 24px; }
.admin-tawkto-settings h2 { margin-bottom: 4px; }
.admin-tawkto-settings .desc { color: rgba(255,255,255,0.4); font-size: 13px; margin-bottom: 24px; }

.settings-layout { display: flex; gap: 32px; align-items: flex-start; flex-wrap: wrap; }
.settings-form { flex: 1; min-width: 360px; max-width: 600px; }
.settings-preview { flex: 0 0 280px; position: sticky; top: 24px; }

.preview-title { margin: 0 0 2px; font-size: 15px; font-weight: 600; }
.preview-desc { margin: 0 0 16px; font-size: 12px; color: rgba(255,255,255,0.35); }

.preview-area {
  background: #0d1b3e; border-radius: 16px; padding: 20px;
  border: 1px solid rgba(255,255,255,0.06);
}
.preview-device {
  position: relative; background: #1a1a2e; border-radius: 12px;
  height: 260px; overflow: hidden;
}
.preview-page { padding: 16px; }
.preview-header-bar { height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-bottom: 20px; width: 60%; }
.preview-content { display: flex; flex-direction: column; gap: 10px; }
.preview-line { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; }
.preview-line.w60 { width: 60%; } .preview-line.w80 { width: 80%; } .preview-line.w45 { width: 45%; } .preview-line.w70 { width: 70%; }

.preview-chat-btn {
  position: absolute; bottom: 20px; width: 44px; height: 44px;
  border-radius: 50%; border: none; color: #fff; cursor: default;
  display: flex; align-items: center; justify-content: center;
  transition: none;
}
.preview-area.preview-bottom-right .preview-chat-btn { right: 16px; }
.preview-area.preview-bottom-left .preview-chat-btn { left: 16px; }

.preview-badge { margin-top: 12px; font-size: 11px; color: rgba(255,255,255,0.3); text-align: center; }

.toggle-label { margin-left: 12px; font-size: 13px; color: rgba(255,255,255,0.5); }
.form-tip { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 4px; line-height: 1.5; }
.form-tip code { background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 3px; font-size: 11px; }
.el-divider { margin: 24px 0 16px; }
.el-form-item { margin-bottom: 18px; }
.form-row { display: flex; gap: 16px; flex-wrap: wrap; }
.form-col { flex: 1; min-width: 180px; }
.color-swatch { display: inline-block; width: 18px; height: 18px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); vertical-align: middle; }
.color-picker-row { display: flex; gap: 8px; align-items: center; }
.color-input { flex: 1; }
.native-color-picker { width: 36px; height: 36px; border: none; border-radius: 6px; cursor: pointer; background: transparent; padding: 0; flex-shrink: 0; }
.native-color-picker::-webkit-color-swatch-wrapper { padding: 0; }
.native-color-picker::-webkit-color-swatch { border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; }
.action-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

@media (max-width: 768px) {
  .settings-layout { flex-direction: column; }
  .settings-preview { flex: 1; position: static; width: 100%; }
}
</style>
