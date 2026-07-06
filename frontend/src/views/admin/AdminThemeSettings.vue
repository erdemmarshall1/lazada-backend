<template>
  <div class="theme-settings">
    <h3 class="page-title">Theme Settings</h3>

    <el-form label-position="top" class="theme-form">
      <el-divider content-position="left">Branding</el-divider>
      <el-form-item label="Site Name">
        <el-input v-model="form.siteName" placeholder="THE OUTNET WHOLESALE" />
      </el-form-item>
      <el-form-item label="Logo URL">
        <el-input v-model="form.logoUrl" placeholder="https://example.com/logo.png" />
      </el-form-item>
      <el-form-item label="Favicon URL">
        <el-input v-model="form.faviconUrl" placeholder="https://example.com/favicon.ico" />
      </el-form-item>

      <el-divider content-position="left">Colors</el-divider>
      <div class="color-grid">
        <el-form-item label="Primary Color">
          <el-color-picker v-model="form.primaryColor" show-alpha />
        </el-form-item>
        <el-form-item label="Background Color">
          <el-color-picker v-model="form.backgroundColor" show-alpha />
        </el-form-item>
        <el-form-item label="Text Color">
          <el-color-picker v-model="form.textColor" show-alpha />
        </el-form-item>
        <el-form-item label="Accent Color">
          <el-color-picker v-model="form.accentColor" show-alpha />
        </el-form-item>
        <el-form-item label="Border Color">
          <el-color-picker v-model="form.borderColor" show-alpha />
        </el-form-item>
      </div>

      <el-divider content-position="left">Typography</el-divider>
      <el-form-item label="Font Family">
        <el-select v-model="form.fontFamily" style="width:100%">
          <el-option label="TheOutnetWebXL (Default)" value="'TheOutnetWebXL', 'Helvetica Neue', Arial, sans-serif" />
          <el-option label="Arial" value="Arial, Helvetica, sans-serif" />
          <el-option label="Georgia" value="Georgia, 'Times New Roman', serif" />
          <el-option label="Helvetica Neue" value="'Helvetica Neue', Arial, sans-serif" />
          <el-option label="Inter" value="Inter, -apple-system, BlinkMacSystemFont, sans-serif" />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">Custom CSS</el-divider>
      <el-form-item label="Additional CSS">
        <el-input v-model="form.customCSS" type="textarea" :rows="6" placeholder="/* Enter custom CSS rules */" />
      </el-form-item>

      <el-divider content-position="left">Preview</el-divider>
      <div class="theme-preview" :style="previewStyle">
        <h4>Preview</h4>
        <p>This is how your site will look with the selected colors.</p>
        <div class="preview-buttons">
          <span class="preview-btn preview-btn-primary">Primary Button</span>
          <span class="preview-btn preview-btn-accent">Accent Button</span>
        </div>
      </div>

      <el-form-item>
        <el-button type="primary" :loading="saving" @click="handleSave" style="background:var(--g-main_color);border-color:var(--g-main_color)">
          Save Theme Settings
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { get, post } from '@/api/request'

const saving = ref(false)

const form = reactive({
  siteName: 'THE OUTNET WHOLESALE',
  primaryColor: '#000000',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  accentColor: '#b8922a',
  borderColor: '#e8e6e2',
  fontFamily: "'TheOutnetWebXL', 'Helvetica Neue', Arial, sans-serif",
  logoUrl: '',
  faviconUrl: '',
  customCSS: '',
})

const previewStyle = computed(() => ({
  '--preview-primary': form.primaryColor,
  '--preview-bg': form.backgroundColor,
  '--preview-text': form.textColor,
  '--preview-accent': form.accentColor,
  '--preview-border': form.borderColor,
}))

const handleSave = async () => {
  saving.value = true
  try {
    const res = await post('/home/admin/settings/theme', form)
    if (res?.code === 0 || res?.code === 1 || res?.data) {
      ElMessage.success('Theme settings saved')
    } else {
      ElMessage.error(res?.msg || 'Failed to save')
    }
  } catch (err) {
    ElMessage.error(err?.response?.data?.msg || 'Failed to save')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const res = await get('/home/settings/theme')
    if (res?.data) {
      Object.keys(form).forEach(key => {
        if (res.data[key] !== undefined && res.data[key] !== null) {
          form[key] = res.data[key]
        }
      })
    }
  } catch {
    // use defaults
  }
})
</script>

<style scoped>
.theme-settings { max-width: 700px; }
.page-title { font-size: 18px; font-weight: 600; margin-bottom: 24px; }
.theme-form { max-width: 600px; }
.color-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.color-grid .el-form-item { margin-bottom: 12px; }
.theme-preview { border: 1px solid var(--preview-border); border-radius: 8px; padding: 20px; background: var(--preview-bg); color: var(--preview-text); margin-bottom: 16px; }
.theme-preview h4 { font-size: 16px; margin-bottom: 8px; }
.theme-preview p { font-size: 13px; margin-bottom: 12px; opacity: 0.7; }
.preview-buttons { display: flex; gap: 8px; }
.preview-btn { padding: 8px 20px; font-size: 12px; border-radius: 4px; cursor: default; }
.preview-btn-primary { background: var(--preview-primary); color: #fff; }
.preview-btn-accent { background: var(--preview-accent); color: #fff; }
@media (max-width: 600px) {
  .color-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
