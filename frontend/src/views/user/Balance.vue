<template>
  <div>
    <h3>{{ $t('user.balance.title') }}</h3>
    <div class="balance-card">
      <div class="balance-row">
        <span class="balance-label">{{ $t('user.balance.accountBalance') }}</span>
        <span class="balance-amount">${{ balance.toFixed(2) }}</span>
      </div>
      <div class="balance-divider"></div>
      <div class="balance-row">
        <span class="balance-label">{{ $t('user.balance.available') }}</span>
        <span class="balance-amount">${{ balance.toFixed(2) }}</span>
      </div>
    </div>
    <div class="balance-actions g-flex" style="gap:12px;margin-top:16px">
      <el-button type="primary" style="background:var(--g-main_color);border-color:var(--g-main_color)" @click="showDeposit = true">{{ $t('user.balance.deposit') }}</el-button>
      <el-button @click="showWithdraw = true">{{ $t('user.balance.withdraw') }}</el-button>
    </div>

    <el-dialog v-model="showDeposit" :title="$t('user.balance.deposit')" width="520px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item :label="$t('user.balance.amountLabel')" prop="depositAmount">
          <el-input-number v-model="formData.depositAmount" :min="1" :max="100000" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('user.balance.paymentMethodLabel')" prop="depositPaymentMethod">
          <el-select v-model="formData.depositPaymentMethod" :placeholder="$t('user.balance.paymentPlaceholder')" style="width:100%" @change="onPaymentMethodChange">
            <el-option v-for="m in paymentMethods" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('user.balance.receiptLabel')" prop="receipt">
          <el-upload
            ref="uploadRef"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :on-success="onUploadSuccess"
            :on-error="onUploadError"
            :on-remove="onUploadRemove"
            :before-upload="beforeUpload"
            :limit="1"
            :file-list="receiptFileList"
            accept="image/*,.pdf"
            list-type="picture"
          >
            <el-button size="small" type="primary" v-if="!receiptUrl">{{ $t('user.balance.clickUpload') }}</el-button>
            <template #tip><div style="font-size:12px;color:#999;margin-top:4px">{{ $t('user.balance.receiptHint') }}</div></template>
          </el-upload>
          <div v-if="receiptUrl" class="receipt-preview">
            <img :src="imgUrl(receiptUrl)" :alt="$t('user.balance.receiptAlt')" @click="previewReceipt" />
            <span class="receipt-preview-label">{{ $t('user.balance.receiptUploaded') }}</span>
          </div>
        </el-form-item>
        <el-form-item v-if="selectedWallet" :label="$t('user.balance.walletAddressLabel')">
          <el-input :model-value="selectedWallet" readonly>
            <template #append>
              <el-button @click="copyAddress">{{ $t('user.balance.copy') }}</el-button>
            </template>
          </el-input>
        </el-form-item>
        <div class="qr-section" v-if="qrDataUrl">
          <img :src="qrDataUrl" :alt="$t('user.balance.qrCodeAlt')" />
          <p>{{ $t('user.balance.scanToPay') }}</p>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showDeposit = false">{{ $t('user.balance.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="doDeposit">{{ $t('user.balance.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showWithdraw" :title="$t('user.balance.withdraw')" width="480px">
      <el-form label-position="top">
        <el-form-item :label="$t('user.balance.amountLabel')">
          <el-input-number v-model="withdrawAmount" :min="1" :max="balance" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('user.balance.paymentMethodLabel')">
          <el-select v-model="withdrawPaymentMethod" :placeholder="$t('user.balance.paymentPlaceholder')" style="width:100%">
            <el-option v-for="m in paymentMethods" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('user.balance.withdrawalDetailsLabel')">
          <el-input v-model="withdrawalDetails" type="textarea" :rows="3" :placeholder="$t('user.balance.withdrawalPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWithdraw = false">{{ $t('user.balance.cancel') }}</el-button>
        <el-button type="primary" @click="openWithdrawPasswordDialog">{{ $t('user.balance.confirm') }}</el-button>
      </template>
    </el-dialog>

    <TransactionPasswordDialog
      :visible="showPasswordDialog"
      :title="$t('user.balance.confirmWithdrawalTitle')"
      :description="`Withdraw $${withdrawAmount} via ${withdrawPaymentMethod || 'selected method'}`"
      :amount="withdrawAmount"
      :api-func="apiFunc"
      @close="showPasswordDialog = false"
      @success="onWithdrawSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { get, post, qe, API_BASE, imgUrl } from '@/api/request'
import QRCode from 'qrcode'
import TransactionPasswordDialog from '@/components/TransactionPasswordDialog.vue'

const balance = ref(0)
const showDeposit = ref(false)
const showWithdraw = ref(false)
const withdrawAmount = ref(100)
const withdrawPaymentMethod = ref('')
const withdrawalDetails = ref('')
const showPasswordDialog = ref(false)
const submitting = ref(false)
const receiptUrl = ref('')
const receiptFileList = ref([])
const uploadRef = ref(null)
const formRef = ref(null)
const qrDataUrl = ref('')
const settings = ref([])
const selectedWallet = ref('')

const route = useRoute()

const formData = reactive({
  depositAmount: 100,
  depositPaymentMethod: '',
  receipt: '',
})

const rules = {
  depositAmount: [{ required: true, message: 'Amount is required', trigger: 'blur' }],
  depositPaymentMethod: [{ required: true, message: 'Payment method is required', trigger: 'change' }],
  receipt: [{ required: true, message: 'Please upload a payment receipt', trigger: 'change' }],
}

const getToken = () => localStorage.getItem('theoutnet_token') || ''
const uploadUrl = `${API_BASE}/home/upload/file`
const uploadHeaders = computed(() => ({ token: getToken() }))

const paymentMethods = computed(() => {
  return settings.value
    .filter(s => s.isActive)
    .map(s => ({ value: s.method, label: s.label }))
})

const copyAddress = async () => {
  if (!selectedWallet.value) return
  try {
    await navigator.clipboard.writeText(selectedWallet.value)
    ElMessage.success('Wallet address copied!')
  } catch {
    ElMessage.error('Failed to copy. Please copy manually.')
  }
}

const beforeUpload = (file) => {
  const isImageOrPdf = file.type.startsWith('image/') || file.type === 'application/pdf'
  if (!isImageOrPdf) { ElMessage.error('Only JPG/PNG/PDF files are allowed'); return false }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) { ElMessage.error('File size must be less than 10MB'); return false }
  return true
}

const onUploadSuccess = (res) => {
  if (res.code === 0 && res.data?.url) {
    receiptUrl.value = res.data.url
    formData.receipt = res.data.url
    nextTick(() => formRef.value?.validateField('receipt'))
    ElMessage.success('Receipt uploaded successfully')
  } else {
    receiptFileList.value = []
    ElMessage.error(res.msg || 'Upload failed — please try again')
  }
}

const onUploadError = (err) => {
  receiptFileList.value = []
  receiptUrl.value = ''
  formData.receipt = ''
  ElMessage.error(err?.message?.includes('413') ? 'File too large for server' : 'Upload failed — please try again')
}

const onUploadRemove = () => {
  receiptUrl.value = ''
  formData.receipt = ''
  receiptFileList.value = []
  nextTick(() => formRef.value?.validateField('receipt'))
}

const previewReceipt = () => {
  if (receiptUrl.value) {
    window.open(imgUrl(receiptUrl.value), '_blank')
  }
}

const doDeposit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  const res = await post('/home/userRecharge/add', {
    amount: formData.depositAmount,
    paymentMethod: formData.depositPaymentMethod,
    receipt: formData.receipt,
  })
  submitting.value = false
  if (res?.code === 0) {
    showDeposit.value = false
    receiptUrl.value = ''
    receiptFileList.value = []
    formData.depositAmount = 100
    formData.depositPaymentMethod = ''
    formData.receipt = ''
    selectedWallet.value = ''
    qrDataUrl.value = ''
    ElMessage.success(res.msg || 'Deposit submitted for review')
    await loadBalance()
  } else {
    ElMessage.error(res?.msg || 'Deposit failed')
  }
}

const openWithdrawPasswordDialog = () => {
  if (!withdrawPaymentMethod.value) return ElMessage.warning('Please select a payment method')
  if (!withdrawAmount.value || withdrawAmount.value <= 0) return ElMessage.warning('Please enter a valid amount')
  showPasswordDialog.value = true
}

const apiFunc = async (fundPassword) => {
  try {
    return await post('/home/userWithdraw/add', {
      amount: withdrawAmount.value,
      paymentMethod: withdrawPaymentMethod.value,
      withdrawalDetails: withdrawalDetails.value,
      fundPassword,
    })
  } catch (e) {
    return { code: -2, msg: e?.msg || e?.message || 'Withdrawal failed' }
  }
}

const onWithdrawSuccess = async () => {
  showPasswordDialog.value = false
  showWithdraw.value = false
  ElMessage.success('Withdrawal submitted')
  await loadBalance()
}

const loadBalance = async () => {
  const res = await get('/home/userWallet/getList')
  if (res?.data && res.data.length > 0) balance.value = res.data[0].balance || 0
}

const updateQR = async (address) => {
  if (!address) { qrDataUrl.value = ''; return }
  try {
    qrDataUrl.value = await QRCode.toDataURL(address, { width: 200, margin: 2 })
  } catch {
    qrDataUrl.value = ''
  }
}

const DEFAULT_WALLET = ''

const onPaymentMethodChange = (method) => {
  const setting = settings.value.find(s => s.method === method)
  selectedWallet.value = setting?.walletAddress || DEFAULT_WALLET
  updateQR(selectedWallet.value)
}

const loadSettings = async () => {
  const res = await get('/home/payment-settings')
  if (res?.code === 0 && res?.data) {
    settings.value = res.data
  }
}

onMounted(async () => {
  await loadSettings()
  await loadBalance()
  if (route.query.deposit === 'true') {
    await nextTick()
    showDeposit.value = true
  }
})
</script>

<style scoped>
.balance-card { padding: 32px 40px; background: linear-gradient(135deg, var(--g-main_color), #ff8c38); border-radius: 12px; color: #fff; }
.balance-row { display: flex; justify-content: space-between; align-items: center; }
.balance-row .balance-label { font-size: 14px; opacity: 0.85; }
.balance-row .balance-amount { font-size: 28px; font-weight: 700; }
.balance-divider { height: 1px; background: rgba(255,255,255,0.25); margin: 12px 0; }
.qr-section { text-align: center; margin-top: 16px; padding: 16px; border: 1px dashed var(--g-border); border-radius: 8px; }
.qr-section img { width: 200px; height: 200px; }
.qr-section p { font-size: 12px; color: var(--g-text-light); margin-top: 8px; }
.receipt-preview { display: flex; align-items: center; gap: 12px; margin-top: 8px; padding: 8px 12px; background: var(--g-off-white); border-radius: 8px; cursor: pointer; }
.receipt-preview img { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; border: 1px solid var(--g-border); }
.receipt-preview .receipt-preview-label { font-size: 13px; color: var(--g-text); }
@media (max-width: 768px) {
  .balance-card { padding: 20px; }
}
</style>



