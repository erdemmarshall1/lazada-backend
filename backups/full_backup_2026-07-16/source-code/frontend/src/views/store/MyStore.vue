<template>
  <div class="seller-dashboard">
    <div class="dashboard-header">
      <h3>My Store Dashboard</h3>
      <div class="dashboard-header-actions">
        <el-button size="small" type="primary" @click="goToOrders">
          Orders
          <span v-if="store.newOrderCount > 0" class="notif-badge">{{ store.newOrderCount }}</span>
        </el-button>
      </div>
    </div>

    <div v-if="store.newOrderCount > 0" class="new-order-alert">
      <i class="iconfont icon-tixing"></i>
      <span>You have <strong>{{ store.newOrderCount }}</strong> new order{{ store.newOrderCount > 1 ? 's' : '' }} waiting!</span>
      <div class="new-order-actions">
        <el-button size="small" type="primary" @click="goToOrders">View Orders</el-button>
        <el-button size="small" @click="store.resetNewOrderCount()">Dismiss</el-button>
      </div>
    </div>

    <div v-if="!shop" class="empty-state">
      <span class="empty-text">You don't have a store yet</span>
      <el-button type="primary" @click="$router.push('/applystore')">Apply Now</el-button>
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
      <div class="shop-details-card">
        <h4 class="section-title">SHOP DETAILS</h4>
        <div class="shop-details-grid">
          <div class="shop-detail-item">
            <span class="detail-label">Store Name</span>
            <span class="detail-value">{{ shop.name }}</span>
          </div>
          <div class="shop-detail-item">
            <span class="detail-label">Store #</span>
            <span class="detail-value">{{ shop.storeNumber || 'Pending' }}</span>
          </div>
          <div class="shop-detail-item">
            <span class="detail-label">Shop Level</span>
            <span class="detail-value level-value">{{ shopLevel }}</span>
          </div>
          <div class="shop-detail-item">
            <span class="detail-label">Account Balance</span>
            <span class="detail-value balance-value">${{ store.walletBalance.toFixed(2) }}</span>
          </div>
          <div class="shop-detail-item">
            <span class="detail-label">Store Rating</span>
            <span class="detail-value rating-value">5.0 <span class="rating-total">/ 5.0</span></span>
          </div>
        </div>
      </div>

      <div class="store-info-card">
        <img :src="$imgUrl(shop.logo)" alt="store logo" class="store-logo" @error="$imgFallback" />
        <div class="store-info-body">
          <h4>{{ shop.name }}</h4>
          <p class="store-desc">{{ shop.description }}</p>
        </div>
        <div class="store-info-actions">
          <el-button size="small" type="primary" @click="$router.push('/storegoodcontrol')">Products</el-button>
          <el-button size="small" @click="goToOrders">
            Orders
            <span v-if="store.newOrderCount > 0" class="notif-badge-sm">{{ store.newOrderCount }}</span>
          </el-button>
        </div>
      </div>

      <div class="store-metrics-grid" v-if="totalInfo" style="margin-bottom:24px">
        <div class="store-metric-card" @click="$router.push('/storeordercontrol')">
          <div class="dash-illustration">
            <svg viewBox="0 0 80 80" fill="none">
              <rect x="10" y="28" width="54" height="34" rx="6" fill="#667eea" opacity="0.7"/>
              <rect x="10" y="20" width="54" height="14" rx="6" fill="#667eea" opacity="0.85"/>
              <circle cx="54" cy="46" r="8" fill="#667eea" opacity="0.4"/>
            </svg>
          </div>
          <div class="dc-value">${{ (totalInfo.totalSales || 0).toFixed(2) }}</div>
          <div class="dc-label">Total Revenue</div>
        </div>
        <div class="store-metric-card" @click="$router.push('/storeordercontrol')">
          <div class="dash-illustration">
            <svg viewBox="0 0 80 80" fill="none">
              <rect x="14" y="48" width="12" height="20" rx="2" fill="#667eea" opacity="0.65"/>
              <rect x="34" y="32" width="12" height="36" rx="2" fill="#667eea" opacity="0.85"/>
              <rect x="54" y="20" width="12" height="48" rx="2" fill="#667eea" opacity="0.5"/>
              <path d="M12 64L68 64" stroke="#667eea" stroke-width="2" opacity="0.35"/>
            </svg>
          </div>
          <div class="dc-value">${{ (totalInfo.totalProfit || 0).toFixed(2) }}</div>
          <div class="dc-label">Total Profit</div>
        </div>
        <div class="store-metric-card" @click="$router.push('/storeordercontrol')">
          <div class="dash-illustration">
            <svg viewBox="0 0 80 80" fill="none">
              <path d="M40 10L66 25L40 40L14 25L40 10Z" fill="#667eea" opacity="0.85"/>
              <path d="M14 25V49L40 64V40L14 25Z" fill="#667eea" opacity="0.5"/>
              <path d="M66 25V49L40 64V40L66 25Z" fill="#667eea" opacity="0.65"/>
            </svg>
          </div>
          <div class="dc-value">{{ totalInfo.orderCount || 0 }}</div>
          <div class="dc-label">Total Orders</div>
        </div>
        <div class="store-metric-card" @click="$router.push('/storeordercontrol')">
          <div class="dash-illustration">
            <svg viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="28" fill="#667eea" opacity="0.7"/>
              <path d="M40 22V40L52 48" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.55"/>
              <circle cx="40" cy="40" r="3" fill="#fff" opacity="0.4"/>
            </svg>
          </div>
          <div class="dc-value">{{ totalInfo.todayOrderCount || 0 }}</div>
          <div class="dc-label">Today's Orders</div>
        </div>
        <div class="store-metric-card" @click="$router.push('/storeordercontrol')">
          <div class="dash-illustration">
            <svg viewBox="0 0 80 80" fill="none">
              <ellipse cx="40" cy="32" rx="24" ry="10" fill="#667eea" opacity="0.7"/>
              <ellipse cx="40" cy="52" rx="24" ry="10" fill="#667eea" opacity="0.4"/>
              <rect x="16" y="30" width="48" height="22" fill="#667eea" opacity="0.55"/>
            </svg>
          </div>
          <div class="dc-value">${{ (totalInfo.todayRevenue || 0).toFixed(2) }}</div>
          <div class="dc-label">Today's Revenue</div>
        </div>
        <div class="store-metric-card" @click="$router.push('/storeordercontrol')">
          <div class="dash-illustration">
            <svg viewBox="0 0 80 80" fill="none">
              <rect x="8" y="30" width="42" height="24" rx="3" fill="#667eea" opacity="0.7"/>
              <path d="M50 34L62 34L70 46V54H50V34Z" fill="#667eea" opacity="0.85"/>
              <circle cx="20" cy="58" r="6" fill="#667eea" opacity="0.45"/>
              <circle cx="60" cy="58" r="6" fill="#667eea" opacity="0.45"/>
            </svg>
          </div>
          <div class="dc-value">{{ totalInfo.pendingShipmentCount || 0 }}</div>
          <div class="dc-label">Pending Shipment</div>
        </div>
        <div class="store-metric-card" @click="$router.push('/storeordercontrol')">
          <div class="dash-illustration">
            <svg viewBox="0 0 80 80" fill="none">
              <path d="M40 12c-4 0-8 4-8 8v2C22 26 16 34 16 44v6l-4 6h56l-4-6v-6c0-10-6-18-16-22v-2c0-4-4-8-8-8z" fill="#667eea" opacity="0.75"/>
              <path d="M32 60c2 4 4 6 8 6s6-2 8-6" fill="#667eea" opacity="0.5"/>
            </svg>
          </div>
          <div class="dc-value">{{ totalInfo.refundRequestCount || 0 }}</div>
          <div class="dc-label">Refund Requests</div>
        </div>
        <div class="store-metric-card" @click="$router.push('/storeordercontrol')">
          <div class="dash-illustration">
            <svg viewBox="0 0 80 80" fill="none">
              <rect x="14" y="48" width="12" height="20" rx="2" fill="#667eea" opacity="0.65"/>
              <rect x="34" y="32" width="12" height="36" rx="2" fill="#667eea" opacity="0.85"/>
              <rect x="54" y="20" width="12" height="48" rx="2" fill="#667eea" opacity="0.5"/>
              <path d="M12 64L68 64" stroke="#667eea" stroke-width="2" opacity="0.35"/>
            </svg>
          </div>
          <div class="dc-value">${{ (totalInfo.todayProfit || 0).toFixed(2) }}</div>
          <div class="dc-label">Today's Profit</div>
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
                <div class="bar-fill" :style="{ width: item.pct + '%', background: '#667eea' }"></div>
              </div>
              <span class="bar-value">${{ item.value }}</span>
            </div>
          </div>
          <div v-if="monthlyBars.length === 0" class="chart-empty">No revenue data yet</div>
        </div>
      </div>

      <div class="charts-row" v-if="totalInfo">
        <div class="chart-box">
          <h4>Monthly Profits</h4>
          <div class="bar-chart">
            <div class="bar-row" v-for="item in monthlyProfitBars" :key="item.label">
              <span class="bar-label">{{ item.label }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: item.pct + '%', background: '#10b981' }"></div>
              </div>
              <span class="bar-value">${{ item.value }}</span>
            </div>
          </div>
          <div v-if="monthlyProfitBars.length === 0" class="chart-empty">No profit data yet</div>
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
          <div v-if="monthlyOrderBars.length === 0" class="chart-empty">No monthly order data yet</div>
        </div>
      </div>

      <div class="charts-row" v-if="totalInfo">
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

      <div class="charts-row" v-if="totalInfo">
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
        <div class="chart-box">
          <h4>Orders Over Time</h4>
          <SellerOrderChart :data="totalInfo?.monthlyOrders || []" />
          <div v-if="!totalInfo?.monthlyOrders?.length" class="chart-empty">No order data yet</div>
        </div>
      </div>

      <div class="quick-links">
        <el-button @click="$router.push('/storegoodcontrol')">Manage Goods ({{ totalInfo?.productCount || 0 }})</el-button>
        <el-button @click="goToOrders">
          Manage Orders
          <span v-if="store.newOrderCount > 0" class="notif-badge-sm">{{ store.newOrderCount }}</span>
        </el-button>
        <el-button v-if="store.isAdmin" type="success" @click="$router.push('/seller-logistics')">Logistics Center</el-button>
        <el-button @click="$router.push('/applystore')">Update Store Info</el-button>
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
import SellerOrderChart from '@/components/SellerOrderChart.vue'

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
.store-metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.store-metric-card { background: var(--g-white); border-radius: 8px; padding: 16px; border: 1px solid var(--g-border); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; }
.store-metric-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-2px); }
.store-metric-card .dc-value { font-size: 22px; font-weight: 700; color: var(--g-text); }
.store-metric-card .dc-label { font-size: 12px; color: var(--g-text-light); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.store-metric-card .dash-illustration { width: 48px; height: 48px; margin-bottom: 4px; }
.store-metric-card .dash-illustration svg { width: 100%; height: 100%; }

.seller-dashboard {
  padding: 0;
  background: transparent;
  min-height: 80vh;
  border-radius: 8px;
  padding: 16px;
}

.dashboard-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.dashboard-header h3 { margin: 0; font-size: 18px; color: var(--g-text); }
.dashboard-header-actions { position: relative; display: inline-block; }

.notif-badge { position: absolute; top: -8px; right: -8px; min-width: 20px; height: 20px; padding: 0 6px; background: #f56c6c; color: #fff; border-radius: 10px; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.notif-badge-sm { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 5px; background: #f56c6c; color: #fff; border-radius: 9px; font-size: 11px; font-weight: 700; margin-left: 4px; }

.new-order-alert { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #fff7e6; border: 1px solid #ffd591; border-radius: 8px; margin-bottom: 12px; font-size: 14px; color: #d46b08; flex-wrap: wrap; }
.new-order-alert strong { font-weight: 700; }
.iconfont { margin-right: 8px; }
.alert-actions { display: flex; gap: 8px; margin-left: auto; }

.empty-state { text-align: center; padding: 40px 20px; }
.empty-text { display: block; color: var(--g-text-light); margin-bottom: 16px; }

.status-awaiting-review { text-align: center; padding: 60px 20px; }
.status-awaiting-review .status-icon-wrapper { margin-bottom: 16px; }
.status-awaiting-review .status-icon-text { font-size: 48px; }
.status-awaiting-review h4 { font-size: 20px; margin: 0 0 8px; color: var(--g-text); }
.status-awaiting-review p { font-size: 14px; color: var(--g-text-light); margin: 0 0 24px; max-width: 400px; margin-left: auto; margin-right: auto; line-height: 1.6; }

.shop-details-card { background: var(--g-white); border-radius: 8px; padding: 20px; margin-bottom: 16px; border: 1px solid var(--g-border); border-left: 4px solid var(--g-main_color); transition: all 0.3s; }
.shop-details-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }

.section-title { font-size: 14px; letter-spacing: 1.5px; margin-bottom: 16px; color: var(--g-text-light); }

.shop-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.detail-label { display: block; font-size: 11px; color: var(--g-text-light); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.detail-value { display: block; font-size: 16px; font-weight: 600; color: var(--g-text); }
.balance-value { color: #52c41a; }
.rating-value { color: #fa8c16; }
.rating-total { font-size: 12px; color: #999; }

.store-info-card { display: flex; align-items: center; gap: 20px; padding: 20px; border-radius: 8px; margin-top: 16px; border: 1px solid var(--g-border); border-left: 4px solid var(--g-main_color); background: var(--g-white); transition: all 0.3s; }
.store-info-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.store-logo { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.store-info-body { flex: 1; min-width: 0; }
.store-info-body h4 { margin: 0 0 4px; word-break: break-word; color: var(--g-text); }
.store-desc { color: var(--g-text-light); font-size: 13px; margin: 0; word-break: break-word; }
.store-info-actions { display: flex; gap: 8px; flex-shrink: 0; }

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.chart-box { background: var(--g-white); border-radius: 8px; padding: 16px; border: 1px solid var(--g-border); transition: all 0.3s; }
.chart-box:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.chart-box h4 { font-size: 14px; margin: 0 0 12px; color: var(--g-text); }

.bar-chart { display: flex; flex-direction: column; gap: 8px; }
.bar-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.bar-label { width: 80px; flex-shrink: 0; text-align: right; color: var(--g-text-light); }
.bar-track { flex: 1; height: 18px; background: rgba(0,0,0,0.04); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; min-width: 2px; }
.bar-value { width: 60px; flex-shrink: 0; font-weight: 600; color: var(--g-text); }
.chart-empty { text-align: center; color: var(--g-text-light); padding: 20px; }

.credit-score-display { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 16px 0; }
.score-circle { display: flex; align-items: baseline; gap: 2px; }
.score-number { font-size: 48px; font-weight: 700; color: var(--g-text); }
.score-unit { font-size: 16px; color: var(--g-text-light); }
.score-track { width: 100%; height: 20px; background: rgba(0,0,0,0.04); border-radius: 10px; overflow: hidden; }
.score-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease; }

.quick-links { margin-top: 20px; display: flex; gap: 12px; flex-wrap: wrap; }

@media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } .shop-details-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 992px) { .stats-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; } }

@media (max-width: 768px) {
  .dashboard-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .stat-card { padding: 14px 10px; }
  .stat-value { font-size: 22px; }
  .charts-row { grid-template-columns: 1fr; }
  .store-info-card { flex-direction: column; align-items: flex-start; text-align: left; }
  .store-logo { width: 60px; height: 60px; }
  .store-info-actions { width: 100%; justify-content: flex-start; }
  .shop-details-grid { grid-template-columns: 1fr; gap: 12px; }
  .quick-links { flex-direction: column; }
  .quick-links .el-button { width: 100%; }
  .new-order-alert { flex-direction: column; align-items: flex-start; }
  .new-order-alert .alert-actions { margin-left: 0; width: 100%; justify-content: flex-end; }
  .bar-label { width: 60px; font-size: 12px; }
  .bar-value { width: 50px; font-size: 12px; }
  .status-awaiting-review { padding: 40px 16px; }
  .section-title { font-size: 13px; }
  .detail-value { font-size: 14px; }
}

@media (max-width: 480px) {
  .charts-row { gap: 10px; }
  .chart-box { padding: 12px; }
  .chart-box h4 { font-size: 13px; }
  .store-info-card { padding: 14px; gap: 12px; }
  .shop-details-card { padding: 14px; }
  .store-desc { font-size: 12px; }
}
</style>