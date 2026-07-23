<template>
  <div class="admin-page admin-settings">
    <h2>Settings</h2>
    <el-tabs v-model="activeTab">
      <!-- General Settings -->
      <el-tab-pane label="General" name="general">
        <div class="settings-section">
          <el-form label-position="top" style="max-width:500px">
            <el-form-item label="Store Name">
              <el-input v-model="gen.siteName" placeholder="Your store name" />
            </el-form-item>
            <el-form-item label="Store Description">
              <el-input v-model="gen.siteDescription" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="Support Email">
              <el-input v-model="gen.supportEmail" placeholder="support@example.com" />
            </el-form-item>
            <el-form-item label="Support Phone">
              <el-input v-model="gen.supportPhone" placeholder="+1 234 567 8900" />
            </el-form-item>
            <el-form-item label="Default Timezone">
              <el-select v-model="gen.timezone" style="width:100%">
                <el-option v-for="tz in timezones" :key="tz" :label="tz" :value="tz" />
              </el-select>
            </el-form-item>
            <el-form-item label="Default Language">
              <el-select v-model="gen.defaultLang" style="width:100%">
                <el-option label="English" value="en" />
                <el-option label="Chinese (Simplified)" value="zh-cn" />
                <el-option label="Chinese (Traditional)" value="zh-tw" />
                <el-option label="Japanese" value="ja" />
                <el-option label="Korean" value="ko" />
                <el-option label="Spanish" value="es" />
                <el-option label="French" value="fr" />
                <el-option label="German" value="de" />
                <el-option label="Portuguese" value="pt" />
                <el-option label="Arabic" value="ar" />
              </el-select>
            </el-form-item>
            <el-form-item label="Items Per Page">
              <el-input-number v-model="gen.itemsPerPage" :min="10" :max="100" />
            </el-form-item>
            <el-form-item label="Maintenance Mode">
              <el-switch v-model="gen.maintenanceMode" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-button type="primary" @click="saveGeneral" :loading="genLoading">Save General Settings</el-button>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- Tax Rates -->
      <el-tab-pane label="Tax" name="tax">
        <div class="admin-cms-header">
          <h3>Tax Rates</h3>
          <el-button type="primary" size="small" @click="showTaxForm(null)">+ Add Tax Rate</el-button>
        </div>
        <div class="g-responsive-table">
          <el-table :data="taxRates" stripe v-loading="taxLoading">
            <el-table-column prop="name" label="Name" />
            <el-table-column label="Rate">
              <template #default="{row}">{{ row.type === 'percentage' ? row.rate + '%' : '$' + row.rate }}</template>
            </el-table-column>
            <el-table-column prop="type" label="Type" width="100" />
            <el-table-column prop="region" label="Region" />
            <el-table-column label="Default" width="70">
              <template #default="{row}"><el-tag v-if="row.isDefault" type="success" size="small">Default</el-tag></template>
            </el-table-column>
            <el-table-column label="Status" width="70">
              <template #default="{row}"><el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? 'Active' : 'Inactive' }}</el-tag></template>
            </el-table-column>
            <el-table-column label="Actions" width="150">
              <template #default="{row}">
                <el-button size="small" @click="showTaxForm(row)">Edit</el-button>
                <el-button size="small" type="danger" @click="delTax(row)">Delete</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Currencies -->
      <el-tab-pane label="Currencies" name="currencies">
        <div class="admin-cms-header">
          <h3>Currencies</h3>
          <el-button type="primary" size="small" @click="showCurrencyForm(null)">+ Add Currency</el-button>
        </div>
        <div class="g-responsive-table">
          <el-table :data="currencies" stripe v-loading="curLoading">
            <el-table-column prop="code" label="Code" width="80" />
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="symbol" label="Symbol" width="60" />
            <el-table-column label="Exchange Rate" width="120">
              <template #default="{row}">{{ row.exchangeRate }}</template>
            </el-table-column>
            <el-table-column label="Default" width="70">
              <template #default="{row}"><el-tag v-if="row.isDefault" type="success" size="small">Default</el-tag></template>
            </el-table-column>
            <el-table-column label="Status" width="70">
              <template #default="{row}"><el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? 'Active' : 'Inactive' }}</el-tag></template>
            </el-table-column>
            <el-table-column label="Actions" width="150">
              <template #default="{row}">
                <el-button size="small" @click="showCurrencyForm(row)">Edit</el-button>
                <el-button size="small" type="danger" @click="delCurrency(row)">Delete</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Shipping Methods -->
      <el-tab-pane label="Shipping" name="shipping">
        <div class="admin-cms-header">
          <h3>Shipping Methods</h3>
          <el-button type="primary" size="small" @click="showShippingForm(null)">+ Add Method</el-button>
        </div>
        <div class="g-responsive-table">
          <el-table :data="shippingMethods" stripe v-loading="shipLoading">
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="carrier" label="Carrier" />
            <el-table-column prop="type" label="Type" width="110" />
            <el-table-column label="Rate" width="80"><template #default="{row}">${{ row.rate }}</template></el-table-column>
            <el-table-column label="Free Threshold" width="120"><template #default="{row}">${{ row.freeShippingThreshold }}</template></el-table-column>
            <el-table-column label="Est. Days" width="80"><template #default="{row}">{{ row.estimatedDays }}</template></el-table-column>
            <el-table-column label="Status" width="70">
              <template #default="{row}"><el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? 'Active' : 'Inactive' }}</el-tag></template>
            </el-table-column>
            <el-table-column label="Actions" width="150">
              <template #default="{row}">
                <el-button size="small" @click="showShippingForm(row)">Edit</el-button>
                <el-button size="small" type="danger" @click="delShipping(row)">Delete</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Tax Dialog -->
    <el-dialog v-model="taxDialog" :title="editingTax ? 'Edit Tax Rate' : 'Add Tax Rate'" width="450px">
      <el-form :model="taxForm" label-position="top">
        <el-form-item label="Name" required><el-input v-model="taxForm.name" /></el-form-item>
        <el-form-item label="Rate" required><el-input-number v-model="taxForm.rate" :min="0" :max="100" :precision="2" style="width:100%" /></el-form-item>
        <el-form-item label="Type"><el-select v-model="taxForm.type" style="width:100%"><el-option label="Percentage" value="percentage" /><el-option label="Fixed" value="fixed" /></el-select></el-form-item>
        <el-form-item label="Region"><el-input v-model="taxForm.region" placeholder="e.g. US, EU, Global" /></el-form-item>
        <el-form-item label="Default"><el-switch v-model="taxForm.isDefault" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="taxDialog=false">Cancel</el-button><el-button type="primary" @click="saveTax" :loading="taxSaving">Save</el-button></template>
    </el-dialog>

    <!-- Currency Dialog -->
    <el-dialog v-model="curDialog" :title="editingCur ? 'Edit Currency' : 'Add Currency'" width="450px">
      <el-form :model="curForm" label-position="top">
        <el-form-item label="Code" required><el-input v-model="curForm.code" placeholder="USD" :disabled="!!editingCur" /></el-form-item>
        <el-form-item label="Name" required><el-input v-model="curForm.name" placeholder="US Dollar" /></el-form-item>
        <el-form-item label="Symbol" required><el-input v-model="curForm.symbol" placeholder="$" /></el-form-item>
        <el-form-item label="Exchange Rate (vs default)"><el-input-number v-model="curForm.exchangeRate" :min="0.0001" :precision="4" style="width:100%" /></el-form-item>
        <el-form-item label="Default"><el-switch v-model="curForm.isDefault" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="curDialog=false">Cancel</el-button><el-button type="primary" @click="saveCurrency" :loading="curSaving">Save</el-button></template>
    </el-dialog>

    <!-- Shipping Dialog -->
    <el-dialog v-model="shipDialog" :title="editingShip ? 'Edit Shipping Method' : 'Add Shipping Method'" width="500px">
      <el-form :model="shipForm" label-position="top">
        <el-form-item label="Name" required><el-input v-model="shipForm.name" /></el-form-item>
        <el-form-item label="Carrier"><el-input v-model="shipForm.carrier" placeholder="e.g. FedEx, DHL" /></el-form-item>
        <el-form-item label="Type"><el-select v-model="shipForm.type" style="width:100%"><el-option label="Flat Rate" value="flat" /><el-option label="Free Shipping" value="free" /></el-select></el-form-item>
        <el-form-item label="Rate ($)" v-if="shipForm.type !== 'free'"><el-input-number v-model="shipForm.rate" :min="0" :precision="2" style="width:100%" /></el-form-item>
        <el-form-item label="Free Shipping Threshold ($)"><el-input-number v-model="shipForm.freeShippingThreshold" :min="0" :precision="2" style="width:100%" /></el-form-item>
        <el-form-item label="Estimated Delivery"><el-input v-model="shipForm.estimatedDays" placeholder="3-7" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="shipDialog=false">Cancel</el-button><el-button type="primary" @click="saveShipping" :loading="shipSaving">Save</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { get, post, put, del } from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('general')

// General settings
const gen = reactive({
  siteName: '', siteDescription: '', supportEmail: '', supportPhone: '',
  timezone: 'UTC', defaultLang: 'en', itemsPerPage: 20, maintenanceMode: 0,
})
const genLoading = ref(false)
const timezones = Intl.supportedValuesOf?.('timeZone') || ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland']

const loadGeneral = async () => {
  const res = await get('/home/admin/settings/settings')
  if (res?.code === 0 && res?.data) {
    const map = {}
    res.data.forEach(s => { map[s.key] = s.value })
    if (map.siteName !== undefined) gen.siteName = map.siteName
    if (map.siteDescription !== undefined) gen.siteDescription = map.siteDescription
    if (map.supportEmail !== undefined) gen.supportEmail = map.supportEmail
    if (map.supportPhone !== undefined) gen.supportPhone = map.supportPhone
    if (map.timezone !== undefined) gen.timezone = map.timezone
    if (map.defaultLang !== undefined) gen.defaultLang = map.defaultLang
    if (map.itemsPerPage !== undefined) gen.itemsPerPage = map.itemsPerPage
    if (map.maintenanceMode !== undefined) gen.maintenanceMode = map.maintenanceMode
  }
}

const saveGeneral = async () => {
  genLoading.value = true
  const settings = Object.entries(gen).map(([key, value]) => ({ key, value }))
  const res = await post('/home/admin/settings/settings/bulk', { settings })
  genLoading.value = false
  if (res?.code === 0) ElMessage.success('Settings saved')
  else ElMessage.error(res?.msg || 'Save failed')
}

// Tax
const taxRates = ref([])
const taxLoading = ref(false)
const taxDialog = ref(false)
const editingTax = ref(null)
const taxForm = ref({ name: '', rate: 0, type: 'percentage', region: '', isDefault: false })
const taxSaving = ref(false)

const loadTax = async () => {
  taxLoading.value = true
  const res = await get('/home/admin/settings/tax-rates')
  if (res?.code === 0) taxRates.value = res.data || []
  taxLoading.value = false
}

const showTaxForm = (row) => {
  editingTax.value = row?._id || null
  taxForm.value = row ? { ...row } : { name: '', rate: 0, type: 'percentage', region: '', isDefault: false }
  taxDialog.value = true
}

const saveTax = async () => {
  if (!taxForm.value.name) { ElMessage.warning('Name required'); return }
  taxSaving.value = true
  let res
  if (editingTax.value) res = await put(`/home/admin/settings/tax-rates/${editingTax.value}`, taxForm.value)
  else res = await post('/home/admin/settings/tax-rates', taxForm.value)
  taxSaving.value = false
  if (res?.code === 0) { ElMessage.success(res.msg || 'Saved'); taxDialog.value = false; loadTax() }
  else ElMessage.error(res?.msg || 'Save failed')
}

const delTax = async (row) => {
  try { await ElMessageBox.confirm(`Delete "${row.name}"?`, 'Confirm', { type: 'warning' })
    const res = await del(`/home/admin/settings/tax-rates/${row._id}`)
    if (res?.code === 0) { ElMessage.success('Deleted'); loadTax() }
  } catch {}
}

// Currency
const currencies = ref([])
const curLoading = ref(false)
const curDialog = ref(false)
const editingCur = ref(null)
const curForm = ref({ code: '', name: '', symbol: '', exchangeRate: 1, isDefault: false })
const curSaving = ref(false)

const loadCurrencies = async () => {
  curLoading.value = true
  const res = await get('/home/admin/settings/currencies')
  if (res?.code === 0) currencies.value = res.data || []
  curLoading.value = false
}

const showCurrencyForm = (row) => {
  editingCur.value = row?._id || null
  curForm.value = row ? { ...row } : { code: '', name: '', symbol: '', exchangeRate: 1, isDefault: false }
  curDialog.value = true
}

const saveCurrency = async () => {
  if (!curForm.value.code || !curForm.value.name || !curForm.value.symbol) { ElMessage.warning('All fields required'); return }
  curSaving.value = true
  let res
  if (editingCur.value) res = await put(`/home/admin/settings/currencies/${editingCur.value}`, curForm.value)
  else res = await post('/home/admin/settings/currencies', curForm.value)
  curSaving.value = false
  if (res?.code === 0) { ElMessage.success(res.msg || 'Saved'); curDialog.value = false; loadCurrencies() }
  else ElMessage.error(res?.msg || 'Save failed')
}

const delCurrency = async (row) => {
  try { await ElMessageBox.confirm(`Delete "${row.code}"?`, 'Confirm', { type: 'warning' })
    const res = await del(`/home/admin/settings/currencies/${row._id}`)
    if (res?.code === 0) { ElMessage.success('Deleted'); loadCurrencies() }
  } catch {}
}

// Shipping
const shippingMethods = ref([])
const shipLoading = ref(false)
const shipDialog = ref(false)
const editingShip = ref(null)
const shipForm = ref({ name: '', carrier: '', type: 'flat', rate: 0, freeShippingThreshold: 0, estimatedDays: '3-7' })
const shipSaving = ref(false)

const loadShipping = async () => {
  shipLoading.value = true
  const res = await get('/home/admin/settings/shipping-methods')
  if (res?.code === 0) shippingMethods.value = res.data || []
  shipLoading.value = false
}

const showShippingForm = (row) => {
  editingShip.value = row?._id || null
  shipForm.value = row ? { ...row } : { name: '', carrier: '', type: 'flat', rate: 0, freeShippingThreshold: 0, estimatedDays: '3-7' }
  shipDialog.value = true
}

const saveShipping = async () => {
  if (!shipForm.value.name) { ElMessage.warning('Name required'); return }
  shipSaving.value = true
  let res
  if (editingShip.value) res = await put(`/home/admin/settings/shipping-methods/${editingShip.value}`, shipForm.value)
  else res = await post('/home/admin/settings/shipping-methods', shipForm.value)
  shipSaving.value = false
  if (res?.code === 0) { ElMessage.success(res.msg || 'Saved'); shipDialog.value = false; loadShipping() }
  else ElMessage.error(res?.msg || 'Save failed')
}

const delShipping = async (row) => {
  try { await ElMessageBox.confirm(`Delete "${row.name}"?`, 'Confirm', { type: 'warning' })
    const res = await del(`/home/admin/settings/shipping-methods/${row._id}`)
    if (res?.code === 0) { ElMessage.success('Deleted'); loadShipping() }
  } catch {}
}

onMounted(() => {
  loadGeneral()
  loadTax()
  loadCurrencies()
  loadShipping()
})
</script>

<style scoped>
.admin-settings { padding: 20px; }
.admin-settings h2 { margin-bottom: 16px; }
.settings-section { max-width: 600px; }
.admin-cms-header { display: flex; align-items: center; justify-content: space-between; margin: 16px 0 12px; }
.admin-cms-header h3 { margin: 0; }
</style>
