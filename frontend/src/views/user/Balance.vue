<template>
  <div>
    <h3>Balance</h3>
    <div class="balance-card g-flex-center">
      <div class="balance-amount">${{ balance.toFixed(2) }}</div>
      <div class="balance-label">Available Balance</div>
    </div>
    <div class="balance-actions g-flex" style="gap:12px;margin-top:16px">
      <el-button type="primary" style="background:var(--g-main_color);border-color:var(--g-main_color)" @click="showRecharge = true">Recharge</el-button>
      <el-button @click="showWithdraw = true">Withdraw</el-button>
    </div>

    <el-dialog v-model="showRecharge" title="Recharge" width="520px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item label="Amount" prop="rechargeAmount">
          <el-input-number v-model="formData.rechargeAmount" :min="1" :max="100000" style="width:100%" />
        </el-form-item>
        <el-form-item label="Payment Method" prop="rechargePaymentMethod">
          <el-select v-model="formData.rechargePaymentMethod" placeholder="Select payment method" style="width:100%" @change="onPaymentMethodChange">
            <el-option v-for="m in paymentMethods" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Upload Payment Receipt" prop="receipt">
          <el-upload
            ref="uploadRef"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :on-success="onUploadSuccess"
            :on-error="onUploadError"
            :before-upload="beforeUpload"
            :limit="1"
            :file-list="receiptFileList"
            accept="image/*,.pdf"
          >
            <el-button size="small" type="primary">Click to Upload</el-button>
            <template #tip><div style="font-size:12px;color:#999;margin-top:4px">JPG/PNG/PDF, max 10MB</div></template>
          </el-upload>
        </el-form-item>
        <el-form-item v-if="selectedWallet" label="Wallet Address">
          <el-input :model-value="selectedWallet" readonly>
            <template #append>
              <el-button @click="copyAddress">Copy</el-button>
            </template>
          </el-input>
        </el-form-item>
        <div class="qr-section" v-if="qrDataUrl">
          <img :src="qrDataUrl" alt="Payment QR Code" />
          <p>Scan to pay</p>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showRecharge = false">Cancel</el-button>
        <el-button type="primary" :loading="submitting" @click="doRecharge">Confirm</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showWithdraw" title="Withdraw" width="480px">
      <el-form label-position="top">
        <el-form-item label="Amount">
          <el-input-number v-model="withdrawAmount" :min="1" :max="balance" style="width:100%" />
        </el-form-item>
        <el-form-item label="Payment Method">
          <el-select v-model="withdrawPaymentMethod" placeholder="Select payment method" style="width:100%">
            <el-option v-for="m in paymentMethods" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Withdrawal Details">
          <el-input v-model="withdrawalDetails" type="textarea" :rows="3" placeholder="Enter your wallet address, bank account details, or other withdrawal information" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWithdraw = false">Cancel</el-button>
        <el-button type="primary" @click="openWithdrawPasswordDialog">Confirm</el-button>
      </template>
    </el-dialog>

    <TransactionPasswordDialog
      :visible="showPasswordDialog"
      title="Confirm Withdrawal"
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
import { get, post, qe, API_BASE } from '@/api/request'
import QRCode from 'qrcode'
import TransactionPasswordDialog from '@/components/TransactionPasswordDialog.vue'

const balance = ref(0)
const showRecharge = ref(false)
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
  rechargeAmount: 100,
  rechargePaymentMethod: '',
  receipt: '',
})

const rules = {
  rechargeAmount: [{ required: true, message: 'Amount is required', trigger: 'blur' }],
  rechargePaymentMethod: [{ required: true, message: 'Payment method is required', trigger: 'change' }],
  receipt: [{ required: true, message: 'Please upload a payment receipt', trigger: 'change' }],
}

const getToken = () => localStorage.getItem('lazada_token') || ''
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
  if (!isImageOrPdf) { ElMessage.error('Only JPG/PNG/PDF allowed'); return false }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) { ElMessage.error('File must be less than 10MB'); return false }
  return true
}

const onUploadSuccess = (res) => {
  if (res.code === 0 && res.data?.url) {
    receiptUrl.value = res.data.url
    ElMessage.success('Receipt uploaded')
  } else {
    ElMessage.error(res.msg || 'Upload failed')
  }
}

const onUploadError = () => {
  ElMessage.error('Upload failed')
}

const doRecharge = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  await qe(post('/home/userRecharge/add', {
    amount: formData.rechargeAmount,
    paymentMethod: formData.rechargePaymentMethod,
    receipt: receiptUrl.value,
  }))
  submitting.value = false
  showRecharge.value = false
  receiptUrl.value = ''
  receiptFileList.value = []
  formData.rechargeAmount = 100
  formData.rechargePaymentMethod = ''
  formData.receipt = ''
  selectedWallet.value = ''
  qrDataUrl.value = ''
  ElMessage.success('Recharge submitted for admin review')
  await loadBalance()
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

const DEFAULT_WALLET = 'lv2939dhH93j299jd20Ooo92jj3j8dj!88jd'

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
  if (route.query.recharge === 'true') {
    await nextTick()
    showRecharge.value = true
  }
})
</script>

<style scoped>
.balance-card { flex-direction: column; padding: 40px; background: linear-gradient(135deg, var(--g-main_color), #ff8c38); border-radius: 12px; color: #fff; }
.balance-amount { font-size: 48px; font-weight: 700; }
.balance-label { font-size: 14px; opacity: 0.8; margin-top: 8px; }
.qr-section { text-align: center; margin-top: 16px; padding: 16px; border: 1px dashed var(--g-border); border-radius: 8px; }
.qr-section img { width: 200px; height: 200px; }
.qr-section p { font-size: 12px; color: var(--g-text-light); margin-top: 8px; }
@media (max-width: 768px) {
  .balance-card { padding: 20px; }
}
</style>
