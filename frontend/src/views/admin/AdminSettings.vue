<template>
  <div class="admin-page admin-settings">
    <h2>{{ $t('admin.settingsPage.title') }}</h2>
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('admin.settingsPage.general')" name="general">
        <div class="settings-section">
          <el-form label-position="top" style="max-width:500px">
            <el-form-item :label="$t('admin.settingsPage.storeName')">
              <el-input v-model="gen.siteName" />
            </el-form-item>
            <el-form-item :label="$t('admin.settingsPage.storeDescription')">
              <el-input v-model="gen.siteDescription" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item :label="$t('admin.settingsPage.supportEmail')">
              <el-input v-model="gen.supportEmail" />
            </el-form-item>
            <el-form-item :label="$t('admin.settingsPage.supportPhone')">
              <el-input v-model="gen.supportPhone" />
            </el-form-item>
            <el-form-item :label="$t('admin.settingsPage.defaultTimezone')">
              <el-select v-model="gen.timezone" style="width:100%">
                <el-option v-for="tz in timezones" :key="tz" :label="tz" :value="tz" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('admin.settingsPage.defaultLanguage')">
              <el-select v-model="gen.defaultLang" style="width:100%">
                <el-option v-for="l in langOptions" :key="l.value" :label="l.label" :value="l.value" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('admin.settingsPage.itemsPerPage')">
              <el-input-number v-model="gen.itemsPerPage" :min="10" :max="100" />
            </el-form-item>
            <el-form-item :label="$t('admin.settingsPage.maintenanceMode')">
              <el-switch v-model="gen.maintenanceMode" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-button type="primary" @click="saveGeneral" :loading="genLoading">{{ $t('admin.settingsPage.saveGeneral') }}</el-button>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="$t('admin.settingsPage.tax')" name="tax">
        <div class="admin-cms-header">
          <h3>{{ $t('admin.settingsPage.taxRates') }}</h3>
          <el-button type="primary" size="small" @click="showTaxForm(null)">{{ $t('admin.settingsPage.addTaxRate') }}</el-button>
        </div>
        <div class="g-responsive-table">
          <el-table :data="taxRates" stripe v-loading="taxLoading">
            <el-table-column prop="name" :label="$t('admin.settingsPage.name')" />
            <el-table-column :label="$t('admin.settingsPage.rate')">
              <template #default="{row}">{{ row.type === 'percentage' ? row.rate + '%' : '$' + row.rate }}</template>
            </el-table-column>
            <el-table-column prop="type" :label="$t('admin.settingsPage.type')" width="100" />
            <el-table-column prop="region" :label="$t('admin.settingsPage.region')" />
            <el-table-column :label="$t('admin.settingsPage.default')" width="70">
              <template #default="{row}"><el-tag v-if="row.isDefault" type="success" size="small">{{ $t('admin.settingsPage.default') }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="$t('admin.settingsPage.status')" width="70">
              <template #default="{row}"><el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? $t('admin.settingsPage.active') : $t('admin.settingsPage.inactive') }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="$t('admin.settingsPage.actions')" width="150">
              <template #default="{row}">
                <el-button size="small" @click="showTaxForm(row)">{{ $t('admin.settingsPage.edit') }}</el-button>
                <el-button size="small" type="danger" @click="delTax(row)">{{ $t('admin.settingsPage.delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="$t('admin.settingsPage.currencies')" name="currencies">
        <div class="admin-cms-header">
          <h3>{{ $t('admin.settingsPage.currencies') }}</h3>
          <el-button type="primary" size="small" @click="showCurrencyForm(null)">{{ $t('admin.settingsPage.addCurrency') }}</el-button>
        </div>
        <div class="g-responsive-table">
          <el-table :data="currencies" stripe v-loading="curLoading">
            <el-table-column prop="code" :label="$t('admin.settingsPage.code')" width="80" />
            <el-table-column prop="name" :label="$t('admin.settingsPage.name')" />
            <el-table-column prop="symbol" :label="$t('admin.settingsPage.symbol')" width="60" />
            <el-table-column :label="$t('admin.settingsPage.exchangeRate')" width="120">
              <template #default="{row}">{{ row.exchangeRate }}</template>
            </el-table-column>
            <el-table-column :label="$t('admin.settingsPage.default')" width="70">
              <template #default="{row}"><el-tag v-if="row.isDefault" type="success" size="small">{{ $t('admin.settingsPage.default') }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="$t('admin.settingsPage.status')" width="70">
              <template #default="{row}"><el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? $t('admin.settingsPage.active') : $t('admin.settingsPage.inactive') }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="$t('admin.settingsPage.actions')" width="150">
              <template #default="{row}">
                <el-button size="small" @click="showCurrencyForm(row)">{{ $t('admin.settingsPage.edit') }}</el-button>
                <el-button size="small" type="danger" @click="delCurrency(row)">{{ $t('admin.settingsPage.delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Seller" name="seller">
        <div class="settings-section">
          <h3>Seller Level & Credit Score Settings</h3>
          <el-form label-position="top" style="max-width:500px">
            <el-form-item label="Default Credit Score">
              <el-input-number v-model="seller.defaultCreditScore" :min="0" :max="1000" style="width:100%" />
              <div style="font-size:12px;color:#999;margin-top:4px">Default credit score assigned to new sellers</div>
            </el-form-item>
            <el-form-item label="Auto Calculate Credit Score">
              <el-switch v-model="seller.autoCreditScore" />
              <div style="font-size:12px;color:#999;margin-top:4px">Automatically calculate credit score based on order completion rate</div>
            </el-form-item>
            <el-form-item label="Credit Score Level Thresholds">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%">
                <div><label style="font-size:12px;color:#999">Bronze</label><el-input-number v-model="seller.levelThresholds.bronze" :min="0" :max="100" style="width:100%" /></div>
                <div><label style="font-size:12px;color:#999">Silver</label><el-input-number v-model="seller.levelThresholds.silver" :min="0" :max="100" style="width:100%" /></div>
                <div><label style="font-size:12px;color:#999">Gold</label><el-input-number v-model="seller.levelThresholds.gold" :min="0" :max="100" style="width:100%" /></div>
                <div><label style="font-size:12px;color:#999">Platinum</label><el-input-number v-model="seller.levelThresholds.platinum" :min="0" :max="100" style="width:100%" /></div>
              </div>
              <div style="font-size:12px;color:#999;margin-top:4px">Minimum credit score required for each seller level</div>
            </el-form-item>
            <el-button type="primary" @click="saveSellerSettings" :loading="sellerLoading">Save Seller Settings</el-button>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="$t('admin.settingsPage.shipping')" name="shipping">
        <div class="admin-cms-header">
          <h3>{{ $t('admin.settingsPage.shippingMethods') }}</h3>
          <el-button type="primary" size="small" @click="showShippingForm(null)">{{ $t('admin.settingsPage.addMethod') }}</el-button>
        </div>
        <div class="g-responsive-table">
          <el-table :data="shippingMethods" stripe v-loading="shipLoading">
            <el-table-column prop="name" :label="$t('admin.settingsPage.name')" />
            <el-table-column prop="carrier" :label="$t('admin.settingsPage.carrier')" />
            <el-table-column prop="type" :label="$t('admin.settingsPage.type')" width="110" />
            <el-table-column :label="$t('admin.settingsPage.rate')" width="80"><template #default="{row}">${{ row.rate }}</template></el-table-column>
            <el-table-column :label="$t('admin.settingsPage.freeThreshold')" width="120"><template #default="{row}">${{ row.freeShippingThreshold }}</template></el-table-column>
            <el-table-column :label="$t('admin.settingsPage.estimatedDays')" width="80"><template #default="{row}">{{ row.estimatedDays }}</template></el-table-column>
            <el-table-column :label="$t('admin.settingsPage.status')" width="70">
              <template #default="{row}"><el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? $t('admin.settingsPage.active') : $t('admin.settingsPage.inactive') }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="$t('admin.settingsPage.actions')" width="150">
              <template #default="{row}">
                <el-button size="small" @click="showShippingForm(row)">{{ $t('admin.settingsPage.edit') }}</el-button>
                <el-button size="small" type="danger" @click="delShipping(row)">{{ $t('admin.settingsPage.delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="taxDialog" :title="editingTax ? $t('admin.settingsPage.editTaxRate') : $t('admin.settingsPage.addTaxRateTitle')" width="450px">
      <el-form :model="taxForm" label-position="top">
        <el-form-item :label="$t('admin.settingsPage.name')" required><el-input v-model="taxForm.name" /></el-form-item>
        <el-form-item :label="$t('admin.settingsPage.rate')" required><el-input-number v-model="taxForm.rate" :min="0" :max="100" :precision="2" style="width:100%" /></el-form-item>
        <el-form-item :label="$t('admin.settingsPage.type')"><el-select v-model="taxForm.type" style="width:100%"><el-option :label="$t('admin.settingsPage.percentage')" value="percentage" /><el-option :label="$t('admin.settingsPage.fixed')" value="fixed" /></el-select></el-form-item>
        <el-form-item :label="$t('admin.settingsPage.region')"><el-input v-model="taxForm.region" /></el-form-item>
        <el-form-item :label="$t('admin.settingsPage.default')"><el-switch v-model="taxForm.isDefault" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="taxDialog=false">{{ $t('admin.settingsPage.cancel') }}</el-button><el-button type="primary" @click="saveTax" :loading="taxSaving">{{ $t('admin.settingsPage.save') }}</el-button></template>
    </el-dialog>

    <el-dialog v-model="curDialog" :title="editingCur ? $t('admin.settingsPage.editCurrency') : $t('admin.settingsPage.addCurrencyTitle')" width="450px">
      <el-form :model="curForm" label-position="top">
        <el-form-item :label="$t('admin.settingsPage.code')" required><el-input v-model="curForm.code" :disabled="!!editingCur" /></el-form-item>
        <el-form-item :label="$t('admin.settingsPage.name')" required><el-input v-model="curForm.name" /></el-form-item>
        <el-form-item :label="$t('admin.settingsPage.symbol')" required><el-input v-model="curForm.symbol" /></el-form-item>
        <el-form-item :label="$t('admin.settingsPage.exchangeRate')"><el-input-number v-model="curForm.exchangeRate" :min="0.0001" :precision="4" style="width:100%" /></el-form-item>
        <el-form-item :label="$t('admin.settingsPage.default')"><el-switch v-model="curForm.isDefault" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="curDialog=false">{{ $t('admin.settingsPage.cancel') }}</el-button><el-button type="primary" @click="saveCurrency" :loading="curSaving">{{ $t('admin.settingsPage.save') }}</el-button></template>
    </el-dialog>

    <el-dialog v-model="shipDialog" :title="editingShip ? $t('admin.settingsPage.editShipping') : $t('admin.settingsPage.addShippingTitle')" width="500px">
      <el-form :model="shipForm" label-position="top">
        <el-form-item :label="$t('admin.settingsPage.name')" required><el-input v-model="shipForm.name" /></el-form-item>
        <el-form-item :label="$t('admin.settingsPage.carrier')"><el-input v-model="shipForm.carrier" /></el-form-item>
        <el-form-item :label="$t('admin.settingsPage.type')"><el-select v-model="shipForm.type" style="width:100%"><el-option :label="$t('admin.settingsPage.flatRate')" value="flat" /><el-option :label="$t('admin.settingsPage.freeShipping')" value="free" /></el-select></el-form-item>
        <el-form-item :label="$t('admin.settingsPage.rate') + ' ($)'" v-if="shipForm.type !== 'free'"><el-input-number v-model="shipForm.rate" :min="0" :precision="2" style="width:100%" /></el-form-item>
        <el-form-item :label="$t('admin.settingsPage.freeThreshold') + ' ($)'"><el-input-number v-model="shipForm.freeShippingThreshold" :min="0" :precision="2" style="width:100%" /></el-form-item>
        <el-form-item :label="$t('admin.settingsPage.estimatedDays')"><el-input v-model="shipForm.estimatedDays" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="shipDialog=false">{{ $t('admin.settingsPage.cancel') }}</el-button><el-button type="primary" @click="saveShipping" :loading="shipSaving">{{ $t('admin.settingsPage.save') }}</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminGet, adminPost, adminPut, adminDel } from '@/api/adminRequest'
import { ElMessage, ElMessageBox } from 'element-plus'

const { t } = useI18n()
const activeTab = ref('general')

const langOptions = [
  { label: 'English', value: 'en' },
  { label: 'Chinese (Simplified)', value: 'zh-cn' },
  { label: 'Chinese (Traditional)', value: 'zh-tw' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Arabic', value: 'ar' },
]

// General settings
const gen = reactive({
  siteName: '', siteDescription: '', supportEmail: '', supportPhone: '',
  timezone: 'UTC', defaultLang: 'en', itemsPerPage: 20, maintenanceMode: 0,
})
const genLoading = ref(false)
const timezones = Intl.supportedValuesOf?.('timeZone') || ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland']

// Seller settings
const seller = reactive({
  defaultCreditScore: 100,
  autoCreditScore: true,
  levelThresholds: { bronze: 25, silver: 50, gold: 75, platinum: 100 },
})
const sellerLoading = ref(false)

const loadSellerSettings = async () => {
  const res = await adminGet('/home/admin/settings/seller')
  if (res?.code === 0 && res?.data) {
    seller.defaultCreditScore = res.data.defaultCreditScore ?? 100
    seller.autoCreditScore = res.data.autoCreditScore ?? true
    seller.levelThresholds = res.data.levelThresholds || { bronze: 25, silver: 50, gold: 75, platinum: 100 }
  }
}

const saveSellerSettings = async () => {
  sellerLoading.value = true
  const res = await adminPut('/home/admin/settings/seller', {
    defaultCreditScore: seller.defaultCreditScore,
    autoCreditScore: seller.autoCreditScore,
    levelThresholds: seller.levelThresholds,
  })
  sellerLoading.value = false
  if (res?.code === 0) ElMessage.success('Seller settings saved')
  else ElMessage.error(res?.msg || 'Failed to save seller settings')
}

const loadGeneral = async () => {
  const res = await adminGet('/home/admin/settings/settings')
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
  const res = await adminPost('/home/admin/settings/settings/bulk', { settings })
  genLoading.value = false
  if (res?.code === 0) ElMessage.success(t('admin.settingsPage.saved'))
  else ElMessage.error(res?.msg || t('admin.settingsPage.saveFailed'))
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
  const res = await adminGet('/home/admin/settings/tax-rates')
  if (res?.code === 0) taxRates.value = res.data || []
  taxLoading.value = false
}

const showTaxForm = (row) => {
  editingTax.value = row?._id || null
  taxForm.value = row ? { ...row } : { name: '', rate: 0, type: 'percentage', region: '', isDefault: false }
  taxDialog.value = true
}

const saveTax = async () => {
  if (!taxForm.value.name) { ElMessage.warning(t('admin.settingsPage.nameRequired')); return }
  taxSaving.value = true
  let res
  if (editingTax.value) res = await adminPut(`/home/admin/settings/tax-rates/${editingTax.value}`, taxForm.value)
  else res = await adminPost('/home/admin/settings/tax-rates', taxForm.value)
  taxSaving.value = false
  if (res?.code === 0) { ElMessage.success(res.msg || t('admin.settingsPage.saved')); taxDialog.value = false; loadTax() }
  else ElMessage.error(res?.msg || t('admin.settingsPage.saveFailed'))
}

const delTax = async (row) => {
  try { await ElMessageBox.confirm(t('admin.settingsPage.deleteConfirm'), t('admin.settingsPage.confirmTitle'), { type: 'warning' })
    const res = await adminDel(`/home/admin/settings/tax-rates/${row._id}`)
    if (res?.code === 0) { ElMessage.success(t('admin.settingsPage.deleted')); loadTax() }
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
  const res = await adminGet('/home/admin/settings/currencies')
  if (res?.code === 0) currencies.value = res.data || []
  curLoading.value = false
}

const showCurrencyForm = (row) => {
  editingCur.value = row?._id || null
  curForm.value = row ? { ...row } : { code: '', name: '', symbol: '', exchangeRate: 1, isDefault: false }
  curDialog.value = true
}

const saveCurrency = async () => {
  if (!curForm.value.code || !curForm.value.name || !curForm.value.symbol) { ElMessage.warning(t('admin.settingsPage.allFieldsRequired')); return }
  curSaving.value = true
  let res
  if (editingCur.value) res = await adminPut(`/home/admin/settings/currencies/${editingCur.value}`, curForm.value)
  else res = await adminPost('/home/admin/settings/currencies', curForm.value)
  curSaving.value = false
  if (res?.code === 0) { ElMessage.success(res.msg || t('admin.settingsPage.saved')); curDialog.value = false; loadCurrencies() }
  else ElMessage.error(res?.msg || t('admin.settingsPage.saveFailed'))
}

const delCurrency = async (row) => {
  try { await ElMessageBox.confirm(t('admin.settingsPage.deleteConfirm'), t('admin.settingsPage.confirmTitle'), { type: 'warning' })
    const res = await adminDel(`/home/admin/settings/currencies/${row._id}`)
    if (res?.code === 0) { ElMessage.success(t('admin.settingsPage.deleted')); loadCurrencies() }
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
  const res = await adminGet('/home/admin/settings/shipping-methods')
  if (res?.code === 0) shippingMethods.value = res.data || []
  shipLoading.value = false
}

const showShippingForm = (row) => {
  editingShip.value = row?._id || null
  shipForm.value = row ? { ...row } : { name: '', carrier: '', type: 'flat', rate: 0, freeShippingThreshold: 0, estimatedDays: '3-7' }
  shipDialog.value = true
}

const saveShipping = async () => {
  if (!shipForm.value.name) { ElMessage.warning(t('admin.settingsPage.nameRequired')); return }
  shipSaving.value = true
  let res
  if (editingShip.value) res = await adminPut(`/home/admin/settings/shipping-methods/${editingShip.value}`, shipForm.value)
  else res = await adminPost('/home/admin/settings/shipping-methods', shipForm.value)
  shipSaving.value = false
  if (res?.code === 0) { ElMessage.success(res.msg || t('admin.settingsPage.saved')); shipDialog.value = false; loadShipping() }
  else ElMessage.error(res?.msg || t('admin.settingsPage.saveFailed'))
}

const delShipping = async (row) => {
  try { await ElMessageBox.confirm(t('admin.settingsPage.deleteConfirm'), t('admin.settingsPage.confirmTitle'), { type: 'warning' })
    const res = await adminDel(`/home/admin/settings/shipping-methods/${row._id}`)
    if (res?.code === 0) { ElMessage.success(t('admin.settingsPage.deleted')); loadShipping() }
  } catch {}
}

onMounted(() => {
  loadGeneral()
  loadTax()
  loadCurrencies()
  loadShipping()
  loadSellerSettings()
})
</script>

<style scoped>
.admin-settings { padding: 20px; }
.admin-settings h2 { margin-bottom: 16px; }
.settings-section { max-width: 600px; }
.admin-cms-header { display: flex; align-items: center; justify-content: space-between; margin: 16px 0 12px; }
.admin-cms-header h3 { margin: 0; }
</style>
