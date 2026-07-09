<template>
  <div>
    <h3>Super Admin Dashboard</h3>

    <div class="stats-row g-flex" style="gap:12px;margin-bottom:20px">
      <div class="stat-card" v-for="s in stats" :key="s.label">
        <div class="stat-value">{{ s.value }}</div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="Platform Settings" name="settings">
        <el-form :model="settingsForm" label-position="top">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Site Name">
                <el-input v-model="settingsForm.siteName" />
              </el-form-item>
              <el-form-item label="Primary Color">
                <el-input v-model="settingsForm.primaryColor" />
                <el-color-picker v-model="settingsForm.primaryColor" />
              </el-form-item>
              <el-form-item label="Background Color">
                <el-input v-model="settingsForm.backgroundColor" />
                <el-color-picker v-model="settingsForm.backgroundColor" />
              </el-form-item>
              <el-form-item label="Text Color">
                <el-input v-model="settingsForm.textColor" />
                <el-color-picker v-model="settingsForm.textColor" />
              </el-form-item>
              <el-form-item label="Accent Color">
                <el-input v-model="settingsForm.accentColor" />
                <el-color-picker v-model="settingsForm.accentColor" />
              </el-form-item>
              <el-form-item label="Border Color">
                <el-input v-model="settingsForm.borderColor" />
                <el-color-picker v-model="settingsForm.borderColor" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Font Family">
                <el-input v-model="settingsForm.fontFamily" />
              </el-form-item>
              <el-form-item label="Logo URL">
                <el-input v-model="settingsForm.logoUrl" />
                <el-upload :action="uploadUrl" :headers="uploadHeaders" :on-success="(r) => { if(r.code===0) settingsForm.logoUrl = r.data.url }" :show-file-list="false" accept="image/*"><el-button size="small">Upload</el-button></el-upload>
              </el-form-item>
              <el-form-item label="Favicon URL">
                <el-input v-model="settingsForm.faviconUrl" />
                <el-upload :action="uploadUrl" :headers="uploadHeaders" :on-success="(r) => { if(r.code===0) settingsForm.faviconUrl = r.data.url }" :show-file-list="false" accept="image/*"><el-button size="small">Upload</el-button></el-upload>
              </el-form-item>
              <el-form-item label="Custom CSS">
                <el-input v-model="settingsForm.customCSS" type="textarea" :rows="6" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-button type="primary" :loading="saving" @click="saveSettings">Save Settings</el-button>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="Payments & Email" name="integrations">
        <el-descriptions title="Payment Settings" :column="2" border>
          <el-descriptions-item v-for="pm in paymentMethods" :key="pm._id" :label="pm.label">
            {{ pm.method }} — {{ pm.isActive ? 'Active' : 'Inactive' }}
          </el-descriptions-item>
        </el-descriptions>
        <el-button size="small" style="margin-top:8px" @click="$router.push('/admin-payment-settings')">Manage Payments</el-button>

        <el-descriptions title="Email Settings" :column="2" border style="margin-top:20px">
          <el-descriptions-item label="SMTP Host">{{ emailSettings?.host || '—' }}</el-descriptions-item>
          <el-descriptions-item label="From Email">{{ emailSettings?.fromEmail || '—' }}</el-descriptions-item>
        </el-descriptions>
        <el-button size="small" style="margin-top:8px" @click="$router.push('/admin-email-settings')">Manage Email</el-button>
      </el-tab-pane>

      <el-tab-pane label="Product Images" name="images">
        <div class="g-flex" style="gap:12px;margin-bottom:16px">
          <div class="stat-card" style="flex:1"><div class="stat-value">{{ prodWithImages }}</div><div class="stat-label">With Images</div></div>
          <div class="stat-card" style="flex:1"><div class="stat-value">{{ prodWithoutImages }}</div><div class="stat-label">No Images</div></div>
          <div class="stat-card" style="flex:1"><div class="stat-value">{{ totalProducts }}</div><div class="stat-label">Total Products</div></div>
        </div>
        <el-button @click="refreshProdStats">Refresh Stats</el-button>
        <el-button type="success" @click="runFixImages">Fix Missing Images</el-button>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, post, qe, API_BASE } from '@/api/request'

const activeTab = ref('settings')
const saving = ref(false)
const totalProducts = ref(0)
const prodWithImages = ref(0)
const prodWithoutImages = ref(0)
const paymentMethods = ref([])
const emailSettings = ref(null)

const getToken = () => localStorage.getItem('theoutnet_token') || ''
const uploadUrl = `${API_BASE}/home/upload/file`
const uploadHeaders = computed(() => ({ token: getToken() }))

const settingsForm = reactive({
  siteName: '',
  primaryColor: '#000000',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  accentColor: '#b8922a',
  borderColor: '#e6e6e6',
  fontFamily: 'TheOutnetWebXL, Arial',
  logoUrl: '',
  faviconUrl: '',
  customCSS: '',
})

const stats = ref([
  { label: 'Users', value: '...' },
  { label: 'Shops', value: '...' },
  { label: 'Products', value: '...' },
  { label: 'Transactions', value: '...' },
])

const fetchStats = async () => {
  const [users, shops, products, transactions] = await Promise.all([
    get('/home/admin/users?pageSize=1').catch(() => ({ data: { total: 0 } })),
    get('/home/admin/shops?pageSize=1').catch(() => ({ data: { total: 0 } })),
    get('/home/admin/products?pageSize=1').catch(() => ({ data: { total: 0 } })),
    get('/home/admin/transactions?pageSize=1').catch(() => ({ data: { total: 0 } })),
  ])
  stats.value = [
    { label: 'Users', value: users?.data?.total ?? '?' },
    { label: 'Shops', value: shops?.data?.total ?? '?' },
    { label: 'Products', value: products?.data?.total ?? '?' },
    { label: 'Transactions', value: transactions?.data?.total ?? '?' },
  ]
  totalProducts.value = products?.data?.total || 0
}

const fetchSettings = async () => {
  const res = await get('/home/admin/settings/theme')
  if (res?.data) {
    Object.assign(settingsForm, res.data)
  }
}

const fetchPaymentMethods = async () => {
  const res = await get('/home/admin/payment-settings')
  if (res?.data) paymentMethods.value = Array.isArray(res.data) ? res.data : []
}

const fetchEmailSettings = async () => {
  const res = await get('/home/admin/email-settings')
  if (res?.data) emailSettings.value = res.data
}

const refreshProdStats = async () => {
  const res = await get('/home/admin/products?pageSize=5000')
  if (res?.data?.list) {
    const list = res.data.list
    const total = list.length
    const withImg = list.filter(p => p.images && p.images.length > 0 && p.images[0] && p.images[0] !== '').length
    prodWithImages.value = withImg
    prodWithoutImages.value = total - withImg
  }
}

const runFixImages = async () => {
  await ElMessageBox.confirm('This will scan all products and fix missing images. Continue?', 'Confirm', { type: 'warning' })
  ElMessage.info('Scanning products... this may take a moment')
  const LABELS = ['Product', 'Item', 'Merchandise', 'Goods', 'Article', 'Commodity', 'Stock', 'Supply', 'Inventory', 'Piece']
  const localPathRegex = /^\/uploads\/[0-9a-f-]+\.(png|jpg|jpeg|webp)$/
  let fixed = 0, total = 0, page = 1, pageSize = 100, labelIdx = 0
  do {
    const res = await get(`/main/goods/getSearchList?page=${page}&pageSize=${pageSize}`)
    const list = res?.data?.list || []
    total = res?.data?.total || list.length
    if (list.length === 0) break
    for (const product of list) {
      const img = product.images?.[0]
      if (!img || !localPathRegex.test(img)) continue
      const placeholderUrl = API_BASE + '/home/image/placeholder?text=' + encodeURIComponent(LABELS[labelIdx % LABELS.length])
      labelIdx++
      const upd = await qe(post('/home/admin/update-product', { id: product._id, images: [placeholderUrl] }))
      if (upd) fixed++
    }
    page++
  } while ((page - 1) * pageSize < total)
  if (fixed > 0) {
    ElMessage.success(`Fixed ${fixed} products with missing images`)
    await refreshProdStats()
  } else {
    ElMessage.info('All products already have valid images — nothing to fix')
  }
}

const saveSettings = async () => {
  saving.value = true
  await qe(post('/home/admin/settings/theme', settingsForm))
  saving.value = false
  ElMessage.success('Settings saved')
}

onMounted(() => {
  fetchStats()
  fetchSettings()
  fetchPaymentMethods()
  fetchEmailSettings()
  refreshProdStats()
})
</script>

<style scoped>
.stat-card { background: var(--g-bg); border-radius: 8px; padding: 20px; text-align: center; flex: 1; }
.stat-value { font-size: 32px; font-weight: 700; }
.stat-label { font-size: 13px; color: #999; margin-top: 4px; }
.el-form-item { margin-bottom: 16px; }
</style>
