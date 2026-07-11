<template>
  <div>
    <h3 style="color:#fff;margin-bottom:20px;font-size:20px;font-weight:700">Super Admin Dashboard</h3>

    <div class="dash-grid-4" style="margin-bottom:24px">
      <div v-for="(s, i) in stats" :key="s.label" class="dash-dark-card">
        <div class="dash-illustration">
          <svg v-if="i===0" viewBox="0 0 80 80" fill="none">
            <circle cx="30" cy="22" r="12" fill="#667eea" opacity="0.8"/>
            <circle cx="56" cy="28" r="10" fill="#667eea" opacity="0.6"/>
            <path d="M8 66c0-12 10-22 22-22s22 10 22 22" fill="#667eea" opacity="0.55"/>
            <path d="M40 64c0-10 8-18 18-18s18 8 18 18" fill="#667eea" opacity="0.4"/>
          </svg>
          <svg v-else-if="i===1" viewBox="0 0 80 80" fill="none">
            <path d="M8 36L40 12L72 36" fill="#667eea" opacity="0.7"/>
            <rect x="16" y="34" width="48" height="28" rx="2" fill="#667eea" opacity="0.85"/>
            <rect x="28" y="46" width="24" height="16" rx="2" fill="#667eea" opacity="0.5"/>
          </svg>
          <svg v-else-if="i===2" viewBox="0 0 80 80" fill="none">
            <rect x="18" y="28" width="44" height="36" rx="4" fill="#667eea" opacity="0.85"/>
            <path d="M28 28V20a12 12 0 0 1 24 0v8" fill="#667eea" opacity="0.55"/>
            <rect x="18" y="28" width="44" height="6" rx="2" fill="#667eea" opacity="0.5"/>
          </svg>
          <svg v-else viewBox="0 0 80 80" fill="none">
            <path d="M56 14L72 30L56 46" fill="#667eea" opacity="0.7"/>
            <path d="M16 36L72 36" stroke="#667eea" stroke-width="4" opacity="0.5"/>
            <path d="M24 66L8 50L24 34" fill="#667eea" opacity="0.7"/>
            <path d="M64 44L8 44" stroke="#667eea" stroke-width="4" opacity="0.5"/>
          </svg>
        </div>
        <div class="dc-value">{{ s.value }}</div>
        <div class="dc-label">{{ s.label }}</div>
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
        <div class="dash-grid-3" style="margin-bottom:16px">
          <div class="dash-dark-card" style="cursor:default">
            <div class="dash-illustration">
              <svg viewBox="0 0 80 80" fill="none">
                <rect x="18" y="28" width="44" height="36" rx="4" fill="#667eea" opacity="0.85"/>
                <path d="M28 28V20a12 12 0 0 1 24 0v8" fill="#667eea" opacity="0.55"/>
                <rect x="18" y="28" width="44" height="6" rx="2" fill="#667eea" opacity="0.5"/>
              </svg>
            </div>
            <div class="dc-value">{{ prodWithImages }}</div>
            <div class="dc-label">With Images</div>
          </div>
          <div class="dash-dark-card" style="cursor:default">
            <div class="dash-illustration">
              <svg viewBox="0 0 80 80" fill="none">
                <path d="M40 10L66 22V40C66 54 40 70 40 70C40 70 14 54 14 40V22L40 10Z" fill="#667eea" opacity="0.8"/>
                <circle cx="40" cy="40" r="10" fill="#667eea" opacity="0.35"/>
                <path d="M36 40l2 2 4-6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
              </svg>
            </div>
            <div class="dc-value">{{ prodWithoutImages }}</div>
            <div class="dc-label">No Images</div>
          </div>
          <div class="dash-dark-card" style="cursor:default">
            <div class="dash-illustration">
              <svg viewBox="0 0 80 80" fill="none">
                <rect x="18" y="28" width="44" height="36" rx="4" fill="#667eea" opacity="0.85"/>
                <path d="M28 28V20a12 12 0 0 1 24 0v8" fill="#667eea" opacity="0.55"/>
                <rect x="18" y="28" width="44" height="6" rx="2" fill="#667eea" opacity="0.5"/>
              </svg>
            </div>
            <div class="dc-value">{{ totalProducts }}</div>
            <div class="dc-label">Total Products</div>
          </div>
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
import { useAppStore } from '@/stores/app'

const store = useAppStore()

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
  const res = await qe(post('/home/admin/settings/theme', settingsForm))
  saving.value = false
  if (res) {
    store.applyTheme({ ...settingsForm })
    ElMessage.success('Settings saved')
  }
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
.el-form-item { margin-bottom: 16px; }
.el-tabs { --el-tabs-header-text-color: rgba(255,255,255,0.5); --el-tabs-active-color: #667eea; }
.el-descriptions { --el-descriptions-title-color: rgba(255,255,255,0.8); --el-descriptions-table-border-color: rgba(255,255,255,0.06); --el-descriptions-item-label-color: rgba(255,255,255,0.4); --el-descriptions-item-value-color: rgba(255,255,255,0.7); background: transparent; }
.el-form { --el-text-color-regular: rgba(255,255,255,0.6); }
</style>
