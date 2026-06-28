<template>
  <div>
    <div class="g-flex-align-center g-flex-justify-between" style="margin-bottom:12px">
      <h3>Store Order Management</h3>
      <el-button size="small" @click="$router.push('/sellerlogistics')">Logistics Center</el-button>
    </div>

    <div v-if="store.newOrderCount > 0" class="new-order-alert">
      <i class="iconfont icon-tixing" style="margin-right:8px"></i>
      <span>You have <strong>{{ store.newOrderCount }}</strong> new order{{ store.newOrderCount > 1 ? 's' : '' }}!</span>
      <el-button size="small" type="primary" style="margin-left:auto" @click="dismissNotif">Refresh & Dismiss</el-button>
      <el-button size="small" @click="dismissNotif">Dismiss</el-button>
    </div>

    <div class="stats-row" v-if="totalInfo">
      <div class="stat-card stat-daily">
        <div class="stat-label">Today's Orders</div>
        <div class="stat-value">{{ totalInfo.todayOrderCount || 0 }}</div>
      </div>
      <div class="stat-card stat-daily">
        <div class="stat-label">Today's Revenue</div>
        <div class="stat-value">${{ (totalInfo.todayRevenue || 0).toFixed(2) }}</div>
      </div>
      <div class="stat-card stat-profit">
        <div class="stat-label">Today's Profit</div>
        <div class="stat-value">${{ (totalInfo.todayProfit || 0).toFixed(2) }}</div>
      </div>
      <div class="stat-card stat-profit">
        <div class="stat-label">Total Profit</div>
        <div class="stat-value">${{ (totalInfo.totalProfit || 0).toFixed(2) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Orders</div>
        <div class="stat-value">{{ totalInfo.orderCount || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Revenue</div>
        <div class="stat-value">${{ (totalInfo.totalSales || 0).toFixed(2) }}</div>
      </div>
      <div class="stat-card stat-highlight">
        <div class="stat-label">Pending Shipment</div>
        <div class="stat-value">{{ totalInfo.pendingShipmentCount || 0 }}</div>
      </div>
      <div class="stat-card stat-warning">
        <div class="stat-label">Refund Requests</div>
        <div class="stat-value">{{ totalInfo.refundRequestCount || 0 }}</div>
      </div>
      <div class="stat-card stat-credit">
        <div class="stat-label">Store Credit Score</div>
        <div class="stat-value">{{ totalInfo.creditScore || 100 }}%</div>
        <div class="credit-bar"><div class="credit-fill" :style="{ width: (totalInfo.creditScore || 100) + '%' }"></div></div>
      </div>
    </div>

    <div class="g-flex" style="gap:8px;margin:12px 0;flex-wrap:wrap">
      <el-button :type="activeStatus === '' ? 'primary' : 'default'" size="small" @click="filterByStatus('')">All</el-button>
      <el-button :type="activeStatus === '0' ? 'primary' : 'default'" size="small" @click="filterByStatus('0')">Pending</el-button>
      <el-button :type="activeStatus === '1' ? 'primary' : 'default'" size="small" @click="filterByStatus('1')">Paid</el-button>
      <el-button :type="activeStatus === '2' ? 'primary' : 'default'" size="small" @click="filterByStatus('2')">Shipped</el-button>
      <el-button :type="activeStatus === '3' ? 'primary' : 'default'" size="small" @click="filterByStatus('3')">Completed</el-button>
      <el-button :type="activeStatus === '6' ? 'primary' : 'default'" size="small" @click="filterByStatus('6')">Cancelled</el-button>
      <el-button :type="activeStatus === 'refund' ? 'primary' : 'default'" size="small" @click="filterByStatus('refund')">Refunds</el-button>
    </div>

    <template v-if="orders.length > 0">
      <div class="g-responsive-table">
        <el-table :data="orders" style="width:100%" v-loading="loading" empty-text="No orders found">
          <el-table-column label="Order No" width="170">
            <template #default="{row}"><span style="font-size:12px;font-family:monospace">{{ row.orderNo }}</span></template>
          </el-table-column>
          <el-table-column label="Date" width="140">
            <template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}<br><small style="color:#999">{{ new Date(row.createdAt).toLocaleTimeString() }}</small></template>
          </el-table-column>
          <el-table-column label="Customer" width="130">
            <template #default="{row}"><small style="color:#999">{{ row.shippingAddress?.name || 'N/A' }}</small></template>
          </el-table-column>
          <el-table-column label="Items" min-width="180">
            <template #default="{row}">
              <div v-for="item in (row.items||[]).slice(0,2)" :key="item.skuId" class="item-cell">
                <span>{{ item.productName }} x{{ item.quantity }}</span>
              </div>
              <span v-if="(row.items||[]).length > 2" style="color:#999;font-size:12px">+{{ row.items.length - 2 }} more</span>
            </template>
          </el-table-column>
          <el-table-column label="Amount" width="100" align="right">
            <template #default="{row}">${{ (row.finalAmount || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="Status" width="110">
            <template #default="{row}">
              <el-tag :type="statusTagType(row)" size="small">{{ statusLabel(row) }}</el-tag>
              <el-tag v-if="row.refundStatus === 1" type="warning" size="small" style="margin-left:4px">Refund</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="220">
            <template #default="{row}">
              <el-button v-if="row.status===1" size="small" type="primary" @click="openShipDialog(row)">Ship</el-button>
              <el-button v-if="row.status===2" size="small" @click="$router.push(`/sellerlogistics`)">Track</el-button>
              <el-button v-if="row.refundStatus===1" size="small" type="success" @click="handleRefund(row,'agree')">Approve</el-button>
              <el-button v-if="row.refundStatus===1" size="small" type="danger" @click="handleRefund(row,'reject')">Reject</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="g-flex-center" style="margin-top:16px" v-if="total > pageSize">
        <el-pagination background layout="prev,pager,next" :total="total" :page-size="pageSize" :current-page="currentPage" @current-change="changePage" />
      </div>
    </template>
    <div v-else-if="!loading" class="c-no-list"><span class="c-no-list-text">No orders found</span></div>

    <el-dialog v-model="shipDialogVisible" title="Ship Order" width="550px">
      <el-form :model="shipForm" label-position="top" v-if="selectedOrder">
        <p style="margin-bottom:16px">
          <strong>Order:</strong> {{ selectedOrder.orderNo }} |
          <strong>Total:</strong> ${{ selectedOrder.finalAmount?.toFixed(2) }}
        </p>
        <el-alert type="warning" :closable="false" show-icon style="margin-bottom:16px">
          <template #title>
            Wholesale cost will be auto-deducted from your wallet upon shipping
          </template>
        </el-alert>
        <el-form-item label="Carrier">
          <el-select v-model="shipForm.carrier" placeholder="Select carrier" style="width:100%">
            <el-option v-for="c in carriers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Tracking Number (leave empty to auto-generate)">
          <el-input v-model="shipForm.trackingNo" placeholder="Auto-generate if empty" />
        </el-form-item>
        <div class="g-flex" style="gap:12px">
          <el-form-item label="Shipping Cost ($)">
            <el-input-number v-model="shipForm.shippingCost" :min="0" :step="0.5" :precision="2" style="width:120px" />
          </el-form-item>
          <el-form-item label="Weight (kg)">
            <el-input-number v-model="shipForm.packageWeight" :min="0" :step="0.1" style="width:120px" />
          </el-form-item>
          <el-form-item label="Length (cm)">
            <el-input-number v-model="shipForm.packageLength" :min="0" style="width:120px" />
          </el-form-item>
          <el-form-item label="Width (cm)">
            <el-input-number v-model="shipForm.packageWidth" :min="0" style="width:120px" />
          </el-form-item>
          <el-form-item label="Height (cm)">
            <el-input-number v-model="shipForm.packageHeight" :min="0" style="width:120px" />
          </el-form-item>
        </div>
        <el-form-item label="Notes">
          <el-input v-model="shipForm.notes" type="textarea" :rows="2" placeholder="Optional notes" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="shipping" @click="submitShip">Confirm Ship</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { get, post, qe } from '@/api/request'
import { getSocket } from '@/socket'
import { useAppStore } from '@/stores/app'

const router = useRouter()

const store = useAppStore()
const orders = ref([])
const loading = ref(false)
const totalInfo = ref(null)
const total = ref(0)
const currentPage = ref(1)
const pageSize = 20
const activeStatus = ref('')
let pollTimer = null

const shipDialogVisible = ref(false)
const selectedOrder = ref(null)
const shipping = ref(false)
const carriers = ref([])
const shipForm = ref({ carrier: '', trackingNo: '', packageWeight: 0, packageLength: 0, packageWidth: 0, packageHeight: 0, notes: '' })

const statusLabel = (row) => {
  if (row.refundStatus === 2) return 'Refunded'
  if (row.refundStatus === 3) return 'Rejected'
  const map = { 0:'Pending',1:'Paid',2:'Shipped',3:'Completed',4:'Processing',5:'Completed',6:'Cancelled' }
  return map[row.status] || 'Unknown'
}

const statusTagType = (row) => {
  if ([3,5].includes(row.status)) return 'success'
  if (row.status === 1) return 'primary'
  if (row.status === 2) return 'warning'
  if (row.status === 6) return 'info'
  if (row.refundStatus === 2) return 'success'
  if (row.refundStatus === 1) return 'danger'
  return ''
}

const filterByStatus = (status) => {
  activeStatus.value = status
  currentPage.value = 1
  loadOrders()
}

const changePage = (p) => {
  currentPage.value = p
  loadOrders()
}

const loadOrders = async () => {
  loading.value = true
  const params = { page: currentPage.value, pageSize }
  if (activeStatus.value === 'refund') params.refundStatus = 1
  else if (activeStatus.value) params.status = activeStatus.value
  const [orderRes, statsRes] = await Promise.all([
    get('/home/userOrder/getShopOrderList', params),
    get('/home/userShop/getTotalInfo'),
  ])
  if (orderRes?.data) {
    orders.value = orderRes.data.list || []
    total.value = orderRes.data.total || 0
  }
  if (statsRes?.data) totalInfo.value = statsRes.data
  loading.value = false
}

const openShipDialog = async (row) => {
  selectedOrder.value = row
  shipForm.value = { carrier: '', trackingNo: '', shippingCost: 0, packageWeight: 0, packageLength: 0, packageWidth: 0, packageHeight: 0, notes: '' }
  if (carriers.value.length === 0) {
    const res = await get('/home/shipping/getCarriers')
    if (res?.data) carriers.value = res.data
  }
  if (carriers.value.length > 0) {
    const idx = Math.floor(Math.random() * carriers.value.length)
    shipForm.value.carrier = carriers.value[idx].id
  }
  shipDialogVisible.value = true
}

const submitShip = async () => {
  if (!shipForm.value.carrier) return ElMessage.warning('Please select a carrier')
  shipping.value = true
  try {
    const res = await post('/home/shipping/create', {
      orderId: selectedOrder.value._id,
      carrier: shipForm.value.carrier,
      trackingNo: shipForm.value.trackingNo,
      shippingCost: shipForm.value.shippingCost || 0,
      packageWeight: shipForm.value.packageWeight,
      packageLength: shipForm.value.packageLength,
      packageWidth: shipForm.value.packageWidth,
      packageHeight: shipForm.value.packageHeight,
      notes: shipForm.value.notes,
    })
    shipping.value = false
    if (res.code < 0) {
      if (res.data && res.data.shortfall > 0) {
        shipDialogVisible.value = false
        ElMessageBox.confirm(
          `You need <strong>$${res.data.required.toFixed(2)}</strong> to ship this order (wholesale cost + shipping).<br><br>Your current balance is <strong>$${res.data.balance.toFixed(2)}</strong>.<br>Shortfall: <strong>$${res.data.shortfall.toFixed(2)}</strong>.<br><br>Please top up your balance first, then try shipping again.`,
          'Insufficient Balance',
          {
            confirmButtonText: 'Recharge Now',
            cancelButtonText: 'Cancel',
            type: 'warning',
            dangerouslyUseHTMLString: true,
          }
        ).then(() => {
          router.push('/balance?recharge=true')
        }).catch(() => {})
      } else {
        ElMessage.error(res.msg || 'Failed to ship order')
      }
      return
    }
    ElMessage.success('Order shipped successfully')
    shipDialogVisible.value = false
    await loadOrders()
  } catch (e) {
    shipping.value = false
    ElMessage.error(e?.msg || e?.message || 'Failed to ship order')
  }
}

const handleRefund = async (row, action) => {
  const label = action === 'agree' ? 'Approve' : 'Reject'
  try { await ElMessageBox.confirm(`${label} this refund?`, 'Confirm') } catch { return }
  await qe(post(`/home/userOrder/${action}`, { orderId: row._id })); await loadOrders()
}

const dismissNotif = () => {
  store.resetNewOrderCount()
  loadOrders()
}

onMounted(() => {
  store.resetNewOrderCount()
  loadOrders()
  const socket = getSocket()
  if (socket) {
    socket.on('newOrder', loadOrders)
    socket.on('orderPaid', loadOrders)
    socket.on('orderCancelled', loadOrders)
    socket.on('orderCompleted', loadOrders)
    socket.on('refundRequested', loadOrders)
  }
  pollTimer = setInterval(loadOrders, 30000)
})
onBeforeUnmount(() => {
  const socket = getSocket()
  if (socket) {
    socket.off('newOrder', loadOrders)
    socket.off('orderPaid', loadOrders)
    socket.off('orderCancelled', loadOrders)
    socket.off('orderCompleted', loadOrders)
    socket.off('refundRequested', loadOrders)
  }
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.stats-row { display: grid; grid-template-columns: repeat(9, 1fr); gap: 10px; margin-bottom: 12px; }
.stat-card { background: var(--g-bg); border-radius: 8px; padding: 14px 10px; text-align: center; border: 1px solid var(--g-border); }
.stat-card.stat-daily { background: #e6f7ff; border-color: #91d5ff; }
.stat-card.stat-highlight { border-color: #1890ff; }
.stat-card.stat-warning { border-color: #fa8c16; }
.stat-card.stat-credit { background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: #fff; }
.stat-card.stat-credit .stat-label { color: rgba(255,255,255,0.85); }
.stat-card.stat-credit .stat-value { color: #fff; }
.stat-card.stat-profit { background: #f6ffed; border-color: #b7eb8f; }
.new-order-alert { display:flex; align-items:center; gap:8px; padding:12px 16px; background:#fff7e6; border:1px solid #ffd591; border-radius:8px; margin-bottom:12px; font-size:14px; color:#d46b08; }
.new-order-alert strong { font-weight:700; }
.stat-label { font-size: 11px; color: var(--g-text-light); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.stat-value { font-size: 20px; font-weight: 700; color: var(--g-text); }
.credit-bar { height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin-top: 6px; overflow: hidden; }
.credit-fill { height: 100%; background: #fff; border-radius: 2px; transition: width 0.5s ease; }
.item-cell { font-size: 12px; line-height: 1.4; color: var(--g-text); }
.item-cell + .item-cell { margin-top: 2px; }
@media (max-width: 1200px) {
  .stats-row { grid-template-columns: repeat(5, 1fr); }
  .stat-card.stat-credit { grid-column: span 2; }
  .stat-card.stat-profit { grid-column: span 1; }
}
@media (max-width: 1024px) {
  .stats-row { grid-template-columns: repeat(4, 1fr); }
  .stat-card.stat-credit { grid-column: span 2; }
}
@media (max-width: 768px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .stat-card.stat-credit { grid-column: span 2; }
  .stat-value { font-size: 16px; }
  .g-responsive-table { overflow-x: auto; }
  .g-responsive-table :deep(.el-table) { min-width: 800px; }
  :deep(.el-dialog) { width: 90% !important; max-width: 450px; }
  :deep(.el-dialog .g-flex) { flex-wrap: wrap; }
  :deep(.el-dialog .g-flex .el-form-item) { width: 100%; }
}
</style>
