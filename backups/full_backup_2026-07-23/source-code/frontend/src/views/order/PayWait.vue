<template>
  <div class="pay-view">
    <div class="pay-container" v-loading="loading">
      <div class="pay-box" v-if="order">
        <div class="pay-status g-flex-center">
          <i class="iconfont icon-zhengquewancheng" style="font-size:48px;color:var(--g-success)"></i>
        </div>
        <h2>Order Placed Successfully</h2>
        <div class="pay-info">
          <p>Order No: <strong>{{ order.orderNo }}</strong></p>
          <p>Total Amount: <strong class="total-price">${{ order.finalAmount.toFixed(2) }}</strong></p>
        </div>
        <div class="pay-or">or</div>
        <div class="pay-actions g-flex-center" style="gap:16px">
          <el-button type="primary" size="large" style="background:var(--g-main_color);border-color:var(--g-main_color)" :loading="paying" @click="openPasswordDialog">Pay with Wallet</el-button>
          <el-button size="large" @click="showStripe = true">Pay with Card</el-button>
          <el-button size="large" @click="$router.push('/myorder')">View Orders</el-button>
        </div>
      </div>
    </div>

    <TransactionPasswordDialog
      :visible="showPasswordDialog"
      title="Confirm Payment"
      :description="`Pay for order ${order?.orderNo || ''}`"
      :amount="order?.finalAmount || 0"
      :api-func="apiFunc"
      @close="showPasswordDialog = false"
      @success="onSuccess"
    />

    <StripePaymentForm
      :visible="showStripe"
      :order-id="route.query.orderId"
      :amount="order?.finalAmount || 0"
      @close="showStripe = false"
      @success="onStripeSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { get, post } from '@/api/request'
import TransactionPasswordDialog from '@/components/TransactionPasswordDialog.vue'
import StripePaymentForm from '@/components/StripePaymentForm.vue'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(true)
const paying = ref(false)
const showPasswordDialog = ref(false)
const showStripe = ref(false)

const openPasswordDialog = () => {
  showPasswordDialog.value = true
}

const apiFunc = async (fundPassword) => {
  try {
    return await post('/home/userOrder/pay', { orderId: route.query.orderId, fundPassword })
  } catch (e) {
    return { code: -2, msg: e?.msg || e?.message || 'Payment failed' }
  }
}

const onSuccess = () => {
  showPasswordDialog.value = false
  ElMessage.success('Payment successful!')
  router.push('/myorder')
}

const onStripeSuccess = () => {
  showStripe.value = false
  router.push('/myorder')
}

onMounted(async () => {
  const res = await get('/home/userOrder/getInfo', { id: route.query.orderId })
  if (res?.data) order.value = res.data
  loading.value = false
})
</script>

<style scoped>
.pay-view { flex: 1; display: flex; align-items: center; justify-content: center; background: var(--g-bg); padding: 40px 0; }
.pay-container { max-width: 600px; margin: 0 auto; }
.pay-box { background: var(--g-white); border-radius: 8px; padding: 40px; text-align: center; }
.pay-status { margin-bottom: 16px; }
.pay-box h2 { font-size: 20px; margin-bottom: 16px; }
.pay-info { font-size: 14px; color: #666; }
.pay-info p { margin: 8px 0; }
.total-price { color: var(--g-main_color); font-size: 18px; }
.pay-or { color: #999; font-size: 13px; margin: 12px 0; position: relative; text-align: center; }
.pay-or::before, .pay-or::after { content: ''; position: absolute; top: 50%; width: 35%; height: 1px; background: var(--g-border); }
.pay-or::before { left: 0; } .pay-or::after { right: 0; }
@media (max-width: 768px) {
  .pay-box { padding: 24px 16px; }
  .pay-box h2 { font-size: 17px; }
  .pay-actions { flex-direction: column; }
  .pay-actions .el-button { width: 100%; }
}
</style>
