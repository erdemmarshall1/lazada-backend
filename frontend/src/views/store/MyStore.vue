<template>
  <div>
    <div class="g-flex-align-center g-flex-justify-between" style="margin-bottom:12px">
      <h3>My Store Dashboard</h3>
      <div style="position:relative;display:inline-block">
        <el-button size="small" type="primary" @click="goToOrders">
          Orders
          <span v-if="store.newOrderCount > 0" class="notif-badge">{{ store.newOrderCount }}</span>
        </el-button>
      </div>
    </div>

    <div v-if="store.newOrderCount > 0" class="new-order-alert">
      <i class="iconfont icon-tixing" style="margin-right:8px"></i>
      <span>You have <strong>{{ store.newOrderCount }}</strong> new order{{ store.newOrderCount > 1 ? 's' : '' }} waiting!</span>
      <el-button size="small" type="primary" style="margin-left:auto" @click="goToOrders">View Orders</el-button>
      <el-button size="small" @click="store.resetNewOrderCount()">Dismiss</el-button>
    </div>

    <div v-if="!shop" class="c-no-list">
      <span class="c-no-list-text">You don't have a store yet</span>
      <el-button type="primary" style="margin-top:16px" @click="$router.push('/applystore')">Apply Now</el-button>
    </div>
    <div v-else-if="shop.status === 0" class="status-awaiting-review">
      <div class="status-icon-wrapper">
        <span class="status-icon-text">&#9203;</span>
      </div>
      <h4>Application Under Review</h4>
      <p>Your store application has been submitted and is currently under review. You will be notified once it is approved.</p>
      <div class="status-actions">
        <el-button type="primary" @click="$router.push('/applyconfirm')">View Application Status</el-button>
      </div>
    </div>
    <div v-else>
      <div class="store-info-card g-flex-align-center" style="gap:20px;padding:20px;border:1px solid var(--g-border);border-radius:8px;margin-top:16px">
        <img :src="$imgUrl(shop.logo)" style="width:80px;height:80px;border-radius:8px;object-fit:cover" @error="$imgFallback" />
        <div style="flex:1">
          <h4>{{ shop.name }}</h4>
          <p style="color:#666;font-size:13px">{{ shop.description }}</p>
        </div>
        <div class="store-actions g-flex" style="gap:8px">
          <el-button size="small" type="primary" @click="$router.push('/storegoodcontrol')">Products</el-button>
          <el-button size="small" @click="goToOrders">
            Orders
            <span v-if="store.newOrderCount > 0" class="notif-badge-sm">{{ store.newOrderCount }}</span>
          </el-button>
        </div>
      </div>

      <div class="stats-grid" v-if="totalInfo">
        <div class="stat-card" @click="$router.push('/storeordercontrol')">
          <div class="stat-value">${{ (totalInfo.totalSales || 0).toFixed(2) }}</div>
          <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-card stat-profit" @click="$router.push('/storeordercontrol')">
          <div class="stat-value">${{ (totalInfo.totalProfit || 0).toFixed(2) }}</div>
          <div class="stat-label">Total Profit</div>
        </div>
        <div class="stat-card" @click="$router.push('/storeordercontrol')">
          <div class="stat-value">{{ totalInfo.orderCount || 0 }}</div>
          <div class="stat-label">Total Orders</div>
        </div>
        <div class="stat-card stat-daily" @click="$router.push('/storeordercontrol')">
          <div class="stat-value">{{ totalInfo.todayOrderCount || 0 }}</div>
          <div class="stat-label">Today's Orders</div>
        </div>
        <div class="stat-card stat-revenue" @click="$router.push('/storeordercontrol')">
          <div class="stat-value">${{ (totalInfo.todayRevenue || 0).toFixed(2) }}</div>
          <div class="stat-label">Today's Revenue</div>
        </div>
        <div class="stat-card stat-highlight" @click="$router.push('/storeordercontrol')">
          <div class="stat-value">{{ totalInfo.pendingShipmentCount || 0 }}</div>
          <div class="stat-label">Pending Shipment</div>
        </div>
        <div class="stat-card stat-warning" @click="$router.push('/storeordercontrol')">
          <div class="stat-value">{{ totalInfo.refundRequestCount || 0 }}</div>
          <div class="stat-label">Refund Requests</div>
        </div>
        <div class="stat-card stat-profit" @click="$router.push('/storeordercontrol')">
          <div class="stat-value">${{ (totalInfo.todayProfit || 0).toFixed(2) }}</div>
          <div class="stat-label">Today's Profit</div>
        </div>
      </div>

      <div class="charts-row" v-if="totalInfo">
        <div class="chart-box">
          <h4>Orders by Status</h4>
          <div class="bar-chart">
            <div class="bar-row" v-for="item in orderStatusBars" :key="item.label">
              <span class="bar-label">{{ item.label }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: item.pct + '%', background: item.color }"></div>
              </div>
              <span class="bar-value">{{ item.count }}</span>
            </div>
          </div>
        </div>
        <div class="chart-box">
          <h4>Monthly Revenue</h4>
          <div class="bar-chart">
            <div class="bar-row" v-for="item in monthlyBars" :key="item.label">
              <span class="bar-label">{{ item.label }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: item.pct + '%', background: 'var(--g-main_color)' }"></div>
              </div>
              <span class="bar-value">${{ item.value }}</span>
            </div>
          </div>
          <div v-if="monthlyBars.length === 0" style="text-align:center;color:#999;padding:20px">No revenue data yet</div>
        </div>
      </div>
      <div class="charts-row" style="margin-top:16px" v-if="totalInfo">
        <div class="chart-box">
          <h4>Monthly Profits</h4>
          <div class="bar-chart">
            <div class="bar-row" v-for="item in monthlyProfitBars" :key="item.label">
              <span class="bar-label">{{ item.label }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: item.pct + '%', background: 'var(--g-success)' }"></div>
              </div>
              <span class="bar-value">${{ item.value }}</span>
            </div>
          </div>
          <div v-if="monthlyProfitBars.length === 0" style="text-align:center;color:#999;padding:20px">No profit data yet</div>
        </div>
        <div class="chart-box">
          <h4>Monthly Orders</h4>
          <div class="bar-chart">
            <div class="bar-row" v-for="item in monthlyOrderBars" :key="item.label">
              <span class="bar-label">{{ item.label }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: item.pct + '%', background: '#1890ff' }"></div>
              </div>
              <span class="bar-value">{{ item.count }}</span>
            </div>
          </div>
          <div v-if="monthlyOrderBars.length === 0" style="text-align:center;color:#999;padding:20px">No monthly order data yet</div>
        </div>
      </div>
      <div class="charts-row" style="margin-top:16px" v-if="totalInfo">
        <div class="chart-box">
          <h4>Credit Score</h4>
          <div class="credit-score-display">
            <div class="score-circle">
              <span class="score-number">{{ totalInfo.creditScore ?? 100 }}</span>
              <span class="score-unit">/100</span>
            </div>
            <div class="score-track">
              <div class="score-fill" :style="{ width: (totalInfo.creditScore ?? 100) + '%', background: scoreColor }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="quick-links" style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap">
        <el-button @click="$router.push('/storegoodcontrol')">Manage Goods ({{ totalInfo?.productCount || 0 }})</el-button>
        <el-button @click="goToOrders">
          Manage Orders
          <span v-if="store.newOrderCount > 0" class="notif-badge-sm">{{ store.newOrderCount }}</span>
        </el-button>
        <el-button v-if="store.isAdmin" type="success" @click="$router.push('/sellerlogistics')">Logistics Center</el-button>
        <el-button @click="$router.push('/applystore')">Update Store Info</el-button>
      </div>
      <div class="charts-row" style="margin-top:16px" v-if="shippingStats">
        <div class="chart-box">
          <h4>Shipping Status</h4>
          <div class="bar-chart">
            <div class="bar-row" v-for="(count, status) in shippingStats.stats" :key="status">
              <span class="bar-label">{{ shippingStats.labels[status] }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: ((count / shippingMax) * 100) + '%', background: shippingColor(status) }"></div>
              </div>
              <span class="bar-value">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { get, qe } from '@/api/request'
import { getSocket } from '@/socket'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const store = useAppStore()

const shop = ref(null)
const totalInfo = ref(null)
const shippingStats = ref(null)

const statusLabels = { 0:'Pending',1:'Paid',2:'Shipped',3:'Completed',6:'Cancelled' }
const statusColors = { 0:'#faad14',1:'#1890ff',2:'#722ed1',3:'#52c41a',6:'#999' }

const orderStatusBars = computed(() => {
  if (!totalInfo.value?.ordersByStatus) return []
  const map = totalInfo.value.ordersByStatus
  const max = Math.max(...Object.values(map), 1)
  return Object.entries(map).map(([k, v]) => ({
    label: statusLabels[k] || k,
    count: v,
    pct: (v / max) * 100,
    color: statusColors[k] || '#999',
  }))
})

const shippingMax = computed(() => {
  if (!shippingStats.value?.stats) return 1
  return Math.max(...Object.values(shippingStats.value.stats), 1)
})
const shippingColor = (s) => {
  const n = parseInt(s)
  if (n === 4) return '#52c41a'
  if (n === 5 || n === 6) return '#f56c6c'
  if (n === 3) return '#faad14'
  if (n === 2) return '#1890ff'
  if (n === 1) return '#722ed1'
  return '#999'
}

const monthlyBars = computed(() => {
  if (!totalInfo.value?.monthlyRevenue) return []
  const data = totalInfo.value.monthlyRevenue
  const max = Math.max(...data.map(d => d.total), 1)
  return data.map(d => ({
    label: d._id,
    value: d.total.toFixed(2),
    pct: (d.total / max) * 100,
  }))
})

const monthlyProfitBars = computed(() => {
  if (!totalInfo.value?.monthlyProfits) return []
  const data = totalInfo.value.monthlyProfits
  const max = Math.max(...data.map(d => d.total), 1)
  return data.map(d => ({
    label: d._id,
    value: d.total.toFixed(2),
    pct: (d.total / max) * 100,
  }))
})

const monthlyOrderBars = computed(() => {
  if (!totalInfo.value?.monthlyOrders) return []
  const data = totalInfo.value.monthlyOrders
  const max = Math.max(...data.map(d => d.count), 1)
  return data.map(d => ({
    label: d._id,
    count: d.count,
    pct: (d.count / max) * 100,
  }))
})

const scoreColor = computed(() => {
  const s = totalInfo.value?.creditScore ?? 100
  if (s >= 80) return '#52c41a'
  if (s >= 50) return '#faad14'
  return '#f56c6c'
})

const goToOrders = () => {
  store.resetNewOrderCount()
  router.push('/storeordercontrol')
}

const fetch = async () => {
  const [shopRes, infoRes, shippingRes] = await Promise.all([
    get('/home/userShop/getInfo'),
    get('/home/userShop/getTotalInfo'),
    get('/home/shipping/getStats'),
  ])
  if (shopRes?.data) shop.value = shopRes.data
  if (infoRes?.data) totalInfo.value = infoRes.data
  if (shippingRes?.data) shippingStats.value = shippingRes.data
}

onMounted(() => {
  fetch()
  const socket = getSocket()
  if (socket) {
    socket.on('newOrder', fetch)
    socket.on('orderPaid', fetch)
    socket.on('orderCancelled', fetch)
    socket.on('orderCompleted', fetch)
    socket.on('refundRequested', fetch)
    socket.on('refundProcessed', fetch)
  }
})
onBeforeUnmount(() => {
  const socket = getSocket()
  if (socket) {
    socket.off('newOrder', fetch)
    socket.off('orderPaid', fetch)
    socket.off('orderCancelled', fetch)
    socket.off('orderCompleted', fetch)
    socket.off('refundRequested', fetch)
    socket.off('refundProcessed', fetch)
  }
})
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
.stat-card { background: var(--g-bg); border-radius: 8px; padding: 20px; text-align: center; cursor: pointer; transition: transform 0.2s; border: 1px solid transparent; }
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.stat-card.stat-highlight { border-color: #1890ff; }
.stat-card.stat-warning { border-color: #fa8c16; }
.stat-card.stat-profit { border-color: #52c41a; }
.stat-profit .stat-value { color: #52c41a; }
.stat-card.stat-daily { background: #e6f7ff; border-color: #91d5ff; }
.stat-card.stat-daily .stat-value { color: #1890ff; }
.stat-card.stat-revenue { background: #f0e6ff; border-color: #b37feb; }
.stat-card.stat-revenue .stat-value { color: #722ed1; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--g-main_color); }
.new-order-alert { display:flex; align-items:center; gap:8px; padding:12px 16px; background:#fff7e6; border:1px solid #ffd591; border-radius:8px; margin-bottom:12px; font-size:14px; color:#d46b08; }
.new-order-alert strong { font-weight:700; }
.notif-badge { position:absolute; top:-8px; right:-8px; min-width:20px; height:20px; padding:0 6px; background:#f56c6c; color:#fff; border-radius:10px; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.notif-badge-sm { display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; padding:0 5px; background:#f56c6c; color:#fff; border-radius:9px; font-size:11px; font-weight:700; margin-left:4px; }
.stat-label { font-size: 13px; color: var(--g-text-light); margin-top: 4px; }
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.chart-box { background: var(--g-white); border: 1px solid var(--g-border); border-radius: 8px; padding: 16px; }
.chart-box h4 { font-size: 14px; margin-bottom: 12px; }
.bar-chart { display: flex; flex-direction: column; gap: 8px; }
.bar-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.bar-label { width: 80px; flex-shrink: 0; text-align: right; color: #666; }
.bar-track { flex: 1; height: 18px; background: var(--g-bg); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; min-width: 2px; }
.bar-value { width: 60px; flex-shrink: 0; font-weight: 600; color: var(--g-text); }
.credit-score-display { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 16px 0; }
.score-circle { display: flex; align-items: baseline; gap: 2px; }
.status-awaiting-review { text-align: center; padding: 60px 20px; }
.status-awaiting-review .status-icon-wrapper { margin-bottom: 16px; }
.status-awaiting-review .status-icon-text { font-size: 48px; }
.status-awaiting-review h4 { font-size: 20px; margin: 0 0 8px 0; }
.status-awaiting-review p { font-size: 14px; color: var(--g-text-light); margin: 0 0 24px 0; max-width: 400px; margin-left: auto; margin-right: auto; line-height: 1.6; }
.score-number { font-size: 48px; font-weight: 700; color: var(--g-text); }
.score-unit { font-size: 16px; color: #999; }
.score-track { width: 100%; height: 20px; background: var(--g-bg); border-radius: 10px; overflow: hidden; }
.score-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease; }
@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .charts-row { grid-template-columns: 1fr; }
  .stat-value { font-size: 22px; }
}
</style>
