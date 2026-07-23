<template>
  <div class="myorder-view">
    <div class="myorder-container">
      <h2>My Orders</h2>
      <div class="order-tabs">
        <div class="tab" v-for="tab in tabs" :key="tab.key" :class="{ active: currentTab === tab.key }" @click="switchTab(tab.key)">{{ tab.label }}</div>
      </div>
      <div class="order-list" v-if="orders.length > 0" v-loading="loading">
        <div class="order-card" v-for="order in orders" :key="order._id">
          <div class="order-header g-flex-align-center g-flex-justify-between">
            <span>Order No: {{ order.orderNo }}</span>
            <span class="order-status" :class="'status-' + order.status">{{ statusMap[order.status] }}</span>
          </div>
          <div class="order-item" v-for="item in order.items" :key="item._id">
            <div class="item-img"><img :src="$imgUrl(item.productImage)" @error="$imgFallback" /></div>
            <div class="item-info">
              <h4>{{ item.productName }}</h4>
              <p>${{ item.price }} x {{ item.quantity }}</p>
            </div>
            <div class="item-total">${{ item.subtotal.toFixed(2) }}</div>
          </div>
          <div class="order-footer g-flex-align-center g-flex-justify-between">
            <span>Total: <strong class="price">${{ order.finalAmount.toFixed(2) }}</strong></span>
            <div class="order-actions g-flex" style="gap:8px">
              <el-button v-if="order.status === 0" type="primary" size="small" @click="openPayDialog(order)">Pay Now</el-button>
              <el-button v-if="order.status === 0" size="small" @click="cancelOrder(order._id)">Cancel</el-button>
              <el-button v-if="order.status === 2" size="small" type="success" @click="$router.push(`/ordertracking?orderId=${order._id}`)">Track</el-button>
              <el-button v-if="order.status === 2" size="small" @click="confirmOrder(order._id)">Confirm</el-button>
              <el-button v-if="order.status === 3 && !order.items.every(i=>i.isReviewed)" size="small" @click="$router.push(`/gooddetail?id=${order.items[0]?.productId}`)">Review</el-button>
              <el-button v-if="order.trackingNo" size="small" link type="primary" @click="$router.push(`/ordertracking?orderId=${order._id}`)">Track</el-button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="c-no-list"><span class="c-no-list-text">No orders</span></div>
    </div>

    <TransactionPasswordDialog
      :visible="showPayDialog"
      title="Confirm Payment"
      :description="`Pay for order ${payingOrder?.orderNo || ''}`"
      :amount="payingOrder?.finalAmount || 0"
      :api-func="payApiFunc"
      @close="showPayDialog = false"
      @success="onPaySuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { get, post, qe } from '@/api/request'
import TransactionPasswordDialog from '@/components/TransactionPasswordDialog.vue'

const currentTab = ref('-1')
const orders = ref([])
const loading = ref(false)
const tabs = [{ key: '-1', label: 'All' }, { key: '0', label: 'Pending' }, { key: '1', label: 'Paid' }, { key: '2', label: 'Shipped' }, { key: '3', label: 'Completed' }, { key: '6', label: 'Cancelled' }]
const statusMap = { 0: 'Pending Payment', 1: 'Paid', 2: 'Shipped', 3: 'Completed', 4: 'Processing', 5: 'Completed', 6: 'Cancelled' }
const showPayDialog = ref(false)
const payingOrder = ref(null)

const switchTab = (tab) => { currentTab.value = tab; loadOrders() }
const loadOrders = async () => {
  loading.value = true
  const res = await get('/home/userOrder/getList', { status: currentTab.value, pageSize: 20 })
  if (res?.data) orders.value = res.data.list || []
  loading.value = false
}
const openPayDialog = (order) => {
  payingOrder.value = order
  showPayDialog.value = true
}
const payApiFunc = async (fundPassword) => {
  try {
    return await post('/home/userOrder/pay', { orderId: payingOrder.value._id, fundPassword })
  } catch (e) {
    return { code: -2, msg: e?.msg || e?.message || 'Payment failed' }
  }
}
const onPaySuccess = () => {
  showPayDialog.value = false
  payingOrder.value = null
  ElMessage.success('Payment successful')
  loadOrders()
}
const cancelOrder = async (id) => {
  try { await ElMessageBox.confirm('Cancel this order?', 'Confirm') } catch { return }
  const res = await qe(post('/home/userOrder/cancel', { orderId: id })); if (res) await loadOrders()
}
const confirmOrder = async (id) => { const res = await qe(post('/home/userOrder/confirmArrival', { orderId: id })); if (res) await loadOrders() }

onMounted(loadOrders)
</script>

<style scoped>
.myorder-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.myorder-container { max-width: var(--g-main-width); margin: 0 auto; }
.order-tabs { display: flex; gap: 4px; margin: 16px 0; }
.tab { padding: 8px 20px; background: var(--g-white); border-radius: 4px; cursor: pointer; font-size: 14px; }
.tab.active { background: var(--g-main_color); color: #fff; }
.order-card { background: var(--g-white); border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
.order-header { padding: 12px 16px; background: #fafafa; font-size: 13px; }
.order-status { font-weight: 600; }
.status-0 { color: var(--g-danger); } .status-1 { color: var(--g-info); } .status-2 { color: var(--g-warning); } .status-3 { color: var(--g-success); } .status-6 { color: #999; }
.order-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--g-border); }
.item-img { width: 64px; height: 64px; border-radius: 4px; overflow: hidden; }
.item-img img { width: 100%; height: 100%; object-fit: cover; }
.item-info { flex: 1; }
.item-info h4 { font-size: 14px; }
.item-info p { font-size: 13px; color: #999; }
.item-total { font-size: 14px; font-weight: 600; color: var(--g-main_color); }
.order-footer { padding: 12px 16px; }
.price { color: var(--g-main_color); font-size: 16px; }
@media (max-width: 768px) {
  .order-tabs { overflow-x: auto; white-space: nowrap; gap: 2px; }
  .tab { padding: 6px 12px; font-size: 13px; }
  .order-item { flex-wrap: wrap; gap: 8px; }
  .item-img { width: 48px; height: 48px; }
  .item-info h4 { font-size: 13px; }
  .order-header { flex-direction: column; align-items: flex-start; gap: 4px; font-size: 12px; }
  .order-footer { flex-direction: column; align-items: flex-start; gap: 8px; }
  .order-actions { flex-wrap: wrap; }
}
</style>
