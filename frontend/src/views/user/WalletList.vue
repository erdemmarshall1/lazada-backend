<template>
  <div class="wallet-page" v-loading="loading">
    <div class="balance-section">
      <div class="balance-card">
        <div class="balance-label">{{ $t('user.wallet.title') }}</div>
        <div class="balance-amount">${{ balance.toFixed(2) }}</div>
      </div>
    </div>

    <div class="methods-section">
      <div class="methods-header">{{ $t('user.wallet.acceptedMethods') }}</div>
      <div class="methods-list">
        <span class="method-badge method-usdt">{{ $t('user.wallet.usdt') }}</span>
        <span class="method-badge method-btc">{{ $t('user.wallet.bitcoin') }}</span>
        <span class="method-badge method-eth">{{ $t('user.wallet.ethereum') }}</span>
        <span class="method-badge method-paypal">{{ $t('user.wallet.paypal') }}</span>
      </div>
    </div>

    <div class="address-section">
      <div class="address-header">
        <h3>{{ $t('user.wallet.walletAddresses') }}</h3>
        <el-button type="primary" size="small" @click="openAdd">{{ $t('user.wallet.addWallet') }}</el-button>
      </div>

      <div v-if="addresses.length === 0" class="empty-state">
        <span>{{ $t('user.wallet.empty') }}</span>
      </div>

      <div v-for="w in addresses" :key="w._id" class="address-card">
        <div class="address-info">
          <div class="address-row">
            <span class="address-label">{{ w.label }}</span>
            <span v-if="w.isDefault" class="badge-default">{{ $t('user.wallet.default') }}</span>
          </div>
          <div class="address-value">{{ w.address }}</div>
          <div class="address-type">{{ typeLabel(w.type) }}</div>
        </div>
        <div class="address-actions">
          <el-button link type="primary" size="small" @click="openEdit(w)">{{ $t('user.wallet.edit') }}</el-button>
          <el-button link type="danger" size="small" @click="delWallet(w._id)">{{ $t('user.wallet.delete') }}</el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="showDialog" :title="editing ? $t('user.wallet.editTitle') : $t('user.wallet.addTitle')" width="420px">
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item :label="$t('user.wallet.labelLabel')" prop="label">
          <el-input v-model="form.label" :placeholder="$t('user.wallet.labelPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('user.wallet.addressLabel')" prop="address">
          <el-input v-model="form.address" :placeholder="$t('user.wallet.addressPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('user.wallet.typeLabel')">
          <el-select v-model="form.type" style="width:100%">
            <el-option :label="$t('user.wallet.usdt')" value="usdt_trc20" />
            <el-option :label="$t('user.wallet.bitcoin')" value="bitcoin" />
            <el-option :label="$t('user.wallet.ethereum')" value="ethereum" />
            <el-option :label="$t('user.wallet.paypal')" value="paypal" />
            <el-option :label="$t('user.wallet.otherOption')" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('user.wallet.setDefaultLabel')">
          <el-checkbox v-model="form.isDefault" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">{{ $t('user.wallet.cancel') }}</el-button>
        <el-button type="primary" @click="saveWallet">{{ $t('user.wallet.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, post, qe } from '@/api/request'

const loading = ref(true)
const balance = ref(0)
const addresses = ref([])
const showDialog = ref(false)
const editing = ref(null)
const formRef = ref(null)
const form = ref({ label: '', address: '', type: 'other', isDefault: false })
const rules = {
  label: [{ required: true, message: 'Label is required', trigger: 'blur' }],
  address: [{ required: true, message: 'Address is required', trigger: 'blur' }],
}

const typeLabel = (type) => {
  const map = { usdt_trc20: 'USDT TRC-20', bitcoin: 'Bitcoin', ethereum: 'Ethereum', paypal: 'PayPal', other: 'Other' }
  return map[type] || 'Other'
}

const loadBalance = async () => {
  try {
    const res = await get('/home/userWallet/getList')
    if (res?.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data.list || [])
      if (list.length > 0) balance.value = list[0].balance || 0
    }
  } catch {}
}

const loadAddresses = async () => {
  try {
    const res = await get('/home/userWallet/getAddressList')
    if (res?.data) addresses.value = Array.isArray(res.data) ? res.data : []
  } catch {}
}

const openAdd = () => {
  editing.value = null
  form.value = { label: '', address: '', type: 'other', isDefault: false }
  showDialog.value = true
}

const openEdit = (w) => {
  editing.value = w
  form.value = { label: w.label, address: w.address, type: w.type, isDefault: w.isDefault }
  showDialog.value = true
}

const saveWallet = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    if (editing.value) {
      await qe(post('/home/userWallet/update', { id: editing.value._id, ...form.value }))
    } else {
      await qe(post('/home/userWallet/add', form.value))
    }
    showDialog.value = false
    await loadAddresses()
  } catch {}
}

const delWallet = async (id) => {
  try {
    await ElMessageBox.confirm('Delete this wallet address?', 'Confirm')
  } catch { return }
  try {
    await qe(post('/home/userWallet/del', { id }))
    await loadAddresses()
  } catch {}
}

onMounted(async () => {
  loading.value = true
  await Promise.all([loadBalance(), loadAddresses()])
  loading.value = false
})
</script>

<style scoped>
.wallet-page { padding: 0; }

.balance-section { margin-bottom: 24px; }
.balance-card { background: var(--g-white); border: 1px solid var(--g-border); border-radius: 8px; padding: 24px; }
.balance-label { font-size: 14px; color: var(--g-text-light); margin-bottom: 4px; }
.balance-amount { font-size: 28px; font-weight: 700; color: var(--g-text); }

.methods-section { margin-bottom: 24px; background: var(--g-white); border: 1px solid var(--g-border); border-radius: 8px; padding: 20px 24px; }
.methods-header { font-size: 14px; font-weight: 600; color: var(--g-text); margin-bottom: 12px; }
.methods-list { display: flex; flex-wrap: wrap; gap: 10px; }
.method-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 500; color: #fff; }
.method-usdt { background: #26a17b; }
.method-btc { background: #f7931a; }
.method-eth { background: #627eea; }
.method-paypal { background: #003087; }

.address-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.address-header h3 { margin: 0; font-size: 16px; color: var(--g-text); }
.address-header .el-button { background: var(--g-main_color); border-color: var(--g-main_color); }

.empty-state { text-align: center; padding: 40px 20px; color: var(--g-text-light); font-size: 14px; }

.address-card { background: var(--g-white); border: 1px solid var(--g-border); border-radius: 8px; padding: 16px 20px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
.address-info { flex: 1; min-width: 0; }
.address-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.address-label { font-size: 15px; font-weight: 600; color: var(--g-text); }
.badge-default { font-size: 11px; background: var(--g-main_color); color: #fff; padding: 2px 8px; border-radius: 10px; }
.address-value { font-size: 13px; color: var(--g-text-light); word-break: break-all; }
.address-type { font-size: 12px; color: var(--g-text-light); margin-top: 4px; }

.address-actions { display: flex; gap: 8px; flex-shrink: 0; margin-left: 16px; }

@media (max-width: 768px) {
  .methods-list { gap: 8px; }
  .address-card { flex-direction: column; align-items: flex-start; gap: 12px; }
  .address-actions { margin-left: 0; }
  :deep(.el-dialog) { width: 90% !important; max-width: 420px; }
}
</style>
