<template>
  <div class="admin-dashboard">
    <!-- Metric Cards Row -->
    <div class="metric-grid">
      <div
        v-for="card in metricCards"
        :key="card.label"
        class="metric-card"
        :style="{ '--card-accent': card.color }"
        @click="card.link && $router.push(card.link)"
      >
        <div class="metric-icon"><i :class="card.icon"></i></div>
        <div class="metric-info">
          <div class="metric-value">{{ card.value }}</div>
          <div class="metric-label">{{ card.label }}</div>
        </div>
        <div class="metric-trend" v-if="card.trend !== undefined">
          <span :class="card.trend >= 0 ? 'up' : 'down'">
            {{ card.trend >= 0 ? '↑' : '↓' }} {{ Math.abs(card.trend) }}%
          </span>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="page-card actions-bar">
      <el-button size="default" type="primary" @click="quickGenerate" :loading="generating">+ Generate Invitation Code</el-button>
      <el-button size="default" @click="resetNotifs" v-if="store.newOrderCount > 0 || store.refundRequestCount > 0">Clear Notifications</el-button>
      <el-button size="default" plain @click="$router.push('/admin-transactions')">View All Transactions</el-button>
      <el-button size="default" plain @click="$router.push('/admin-payment-settings')">Payment Settings</el-button>
    </div>

    <!-- Charts Row -->
    <div class="chart-row">
      <!-- Revenue Chart -->
      <div class="page-card chart-card">
        <div class="chart-header">
          <h3>Revenue Overview</h3>
          <div class="chart-toggles">
          <el-radio-group v-model="revenueRange" size="small" @change="fetchSalesData">
            <el-radio-button value="week">Week</el-radio-button>
            <el-radio-button value="month">Month</el-radio-button>
            <el-radio-button value="year">Year</el-radio-button>
          </el-radio-group>
          </div>
        </div>
        <div class="chart-container">
          <Bar v-if="revenueChartData" :data="revenueChartData" :options="revenueChartOptions" />
          <el-empty v-else description="No revenue data" :image-size="80" />
        </div>
      </div>

      <!-- Category Doughnut -->
      <div class="page-card chart-card doughnut-card">
        <div class="chart-header">
          <h3>Sales by Category</h3>
        </div>
        <div class="chart-container doughnut-container">
          <Doughnut v-if="categoryChartData" :data="categoryChartData" :options="categoryChartOptions" />
          <el-empty v-else description="No category data" :image-size="80" />
        </div>
      </div>
    </div>

    <!-- Tables Row -->
    <div class="tables-row">
      <!-- Recent Orders -->
      <div class="page-card table-card">
        <div class="page-header">
          <i class="iconfont icon-dingdan"></i>
          <h2>Recent Orders</h2>
          <span class="subtitle">Latest 10 transactions</span>
        </div>
        <el-table :data="recentOrders" style="width:100%" size="small" v-if="recentOrders.length">
          <el-table-column prop="_id" label="ID" width="100" />
          <el-table-column prop="userId.username" label="User" min-width="120" />
          <el-table-column prop="amount" label="Amount" width="100">
            <template #default="{row}">${{ row.amount?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="paymentMethod" label="Method" width="100" />
          <el-table-column label="Date" width="110">
            <template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}</template>
          </el-table-column>
          <el-table-column label="Status" width="100">
            <template #default="{row}">
              <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'pending' ? 'warning' : 'info'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="No recent orders" :image-size="80" />
      </div>

      <!-- Top Products -->
      <div class="page-card table-card">
        <div class="page-header">
          <i class="iconfont icon-shangpin"></i>
          <h2>Top Products</h2>
          <span class="subtitle">Best sellers</span>
        </div>
        <el-table :data="topProducts" style="width:100%" size="small" v-if="topProducts.length">
          <el-table-column prop="name" label="Product" min-width="160" />
          <el-table-column prop="soldCount" label="Sold" width="80" />
          <el-table-column prop="revenue" label="Revenue" width="100">
            <template #default="{row}">${{ row.revenue?.toFixed(2) }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="No product data" :image-size="80" />
      </div>
    </div>

    <!-- Pending Approvals -->
    <div class="page-card">
      <div class="page-header">
        <i class="iconfont icon-anquan"></i>
        <h2>Pending Approvals</h2>
        <span class="subtitle">Recharges & Withdrawals</span>
      </div>
      <el-tabs v-model="pendingTab">
        <el-tab-pane label="Pending Recharges" value="recharge">
          <el-table :data="pendingRecharges" style="width:100%" v-loading="loadingRecharge" size="small" v-if="pendingRecharges.length">
            <el-table-column prop="_id" label="ID" width="180" />
            <el-table-column prop="userId.username" label="User" min-width="120" />
            <el-table-column prop="amount" label="Amount" width="100">
              <template #default="{row}">${{ row.amount?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="Date" width="110">
              <template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}</template>
            </el-table-column>
            <el-table-column label="Action" width="180">
              <template #default="{row}">
                <el-button type="success" size="small" @click="approveTx(row._id)">Approve</el-button>
                <el-button type="danger" size="small" @click="rejectTx(row._id)">Reject</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="No pending recharges" :image-size="80" />
        </el-tab-pane>
        <el-tab-pane label="Pending Withdrawals" value="withdrawals">
          <el-table :data="pendingWithdraws" style="width:100%" v-loading="loadingWithdraw" size="small" v-if="pendingWithdraws.length">
            <el-table-column prop="_id" label="ID" width="180" />
            <el-table-column prop="userId.username" label="User" min-width="120" />
            <el-table-column prop="amount" label="Amount" width="100">
              <template #default="{row}">${{ row.amount?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="Date" width="110">
              <template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}</template>
            </el-table-column>
            <el-table-column label="Action" width="180">
              <template #default="{row}">
                <el-button type="success" size="small" @click="approveTx(row._id)">Approve</el-button>
                <el-button type="danger" size="small" @click="rejectTx(row._id)">Reject</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="No pending withdrawals" :image-size="80" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '@/stores/app'
import { get, post, qe } from '@/api/request'
import { ElMessage } from 'element-plus'
import { getSocket } from '@/socket'
import { Bar, Doughnut } from 'vue-chartjs'
import { Chart, Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

const store = useAppStore()

const revenueRange = ref('month')
const revenueChartData = ref(null)
const revenueChartOptions = ref(null)
const categoryChartData = ref(null)
const categoryChartOptions = ref(null)
const recentOrders = ref([])
const topProducts = ref([])
const pendingRecharges = ref([])
const pendingWithdraws = ref([])
const platformWallet = ref(null)
const loadingRecharge = ref(false)
const loadingWithdraw = ref(false)
const invitationCodeCount = ref(0)
const generating = ref(false)
const pendingTab = ref('recharges')

const metricCards = ref([
  { label: 'Total Users', value: 0, icon: 'iconfont icon-yonghu', color: 'var(--g-blue)', link: '/admin-users' },
  { label: 'Total Shops', value: 0, icon: 'iconfont icon-dianpu', color: 'var(--g-green)', link: '/admin-sellers' },
  { label: 'Total Products', value: 0, icon: 'iconfont icon-shangpin', color: 'var(--g-purple)', link: '/admin-products' },
  { label: 'Total Transactions', value: 0, icon: 'iconfont icon-jiaoyi', color: 'var(--g-yellow)', link: '/admin-transactions' },
  { label: 'Platform Revenue', value: '$0.00', icon: 'iconfont icon-qianbao', color: 'var(--g-red)', link: '/admin-transactions' },
  { label: 'Active Codes', value: 0, icon: 'iconfont icon-anquan', color: 'var(--g-info)', link: '/admin-invitation-codes' },
])

const fetchStats = async () => {
  const [u, s, p, t, w, ic] = await Promise.all([
    qe(get('/home/admin/users?pageSize=1')),
    qe(get('/home/admin/shops?pageSize=1')),
    qe(get('/home/admin/products?pageSize=1')),
    qe(get('/home/admin/transactions?pageSize=1')),
    qe(get('/home/admin/platform-wallet')),
    qe(get('/home/admin/invitation-codes?pageSize=1')),
  ])
  metricCards.value[0].value = u?.data?.total ?? 0
  metricCards.value[1].value = s?.data?.total ?? 0
  metricCards.value[2].value = p?.data?.total ?? 0
  metricCards.value[3].value = t?.data?.total ?? 0
  if (w?.data) {
    platformWallet.value = w.data
    metricCards.value[4].value = '$' + (w.data.totalRevenue?.toFixed(2) ?? '0.00')
  }
  metricCards.value[5].value = ic?.data?.total ?? 0
}

const fetchSalesData = async () => {
  const days = revenueRange.value === 'week' ? 7 : revenueRange.value === 'month' ? 30 : 365
  const res = await qe(get('/home/report/sales', { params: { days } }))
  if (res?.data) {
    const data = res.data
    buildRevenueChart(data.timeSeries)
    buildCategoryChart(data.categorySales)
    recentOrders.value = (data.recentOrders || []).slice(0, 10)
    topProducts.value = (data.topProducts || []).slice(0, 5)
  }
}

const buildRevenueChart = (timeSeries) => {
  if (!timeSeries || !timeSeries.length) { revenueChartData.value = null; return }
  const labels = timeSeries.map(i => i.date || i.label)
  const revenues = timeSeries.map(i => i.revenue || i.total || 0)
  const orders = timeSeries.map(i => i.count || i.orders || 0)
  revenueChartData.value = {
    labels,
    datasets: [
      { type: 'bar', label: 'Revenue ($)', data: revenues, backgroundColor: 'rgba(41,128,185,0.7)', borderColor: '#2980b9', borderWidth: 1, yAxisID: 'y' },
      { type: 'line', label: 'Orders', data: orders, borderColor: '#27ae60', backgroundColor: 'rgba(39,174,96,0.1)', borderWidth: 2, pointBackgroundColor: '#27ae60', fill: true, tension: 0.4, yAxisID: 'y1' },
    ],
  }
  revenueChartOptions.value = {
    responsive: true, maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 16 } } },
    scales: {
      y: { type: 'linear', display: true, position: 'left', beginAtZero: true, grid: { drawBorder: false }, ticks: { callback: v => '$' + v } },
      y1: { type: 'linear', display: true, position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { precision: 0 } },
    },
  }
}

const buildCategoryChart = (categorySales) => {
  if (!categorySales || !categorySales.length) { categoryChartData.value = null; return }
  const colors = ['#2980b9','#27ae60','#8e44ad','#b8922a','#c0392b','#1abc9c','#e67e22','#34495e']
  categoryChartData.value = {
    labels: categorySales.map(i => i.name || i.category),
    datasets: [{
      data: categorySales.map(i => i.total || i.count || 0),
      backgroundColor: categorySales.map((_, idx) => colors[idx % colors.length]),
      borderWidth: 2, borderColor: '#fff',
    }],
  }
  categoryChartOptions.value = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
    },
  }
}

const fetchPendingRecharges = async () => {
  loadingRecharge.value = true
  const res = await qe(get('/home/admin/pending-recharges?pageSize=20'))
  if (res) pendingRecharges.value = res.data?.list || []
  loadingRecharge.value = false
}
const fetchPendingWithdraws = async () => {
  loadingWithdraw.value = true
  const res = await qe(get('/home/admin/pending-withdraws?pageSize=20'))
  if (res) pendingWithdraws.value = res.data?.list || []
  loadingWithdraw.value = false
}
const approveTx = async (id) => {
  const res = await qe(post('/home/admin/approve-transaction', { id }))
  if (res) ElMessage.success(res.msg); fetchPendingRecharges(); fetchPendingWithdraws()
}
const rejectTx = async (id) => {
  const res = await qe(post('/home/admin/reject-transaction', { id }))
  if (res) ElMessage.success(res.msg); fetchPendingRecharges(); fetchPendingWithdraws()
}
const resetNotifs = () => { store.resetNewOrderCount(); store.resetRefundRequestCount() }

const quickGenerate = async () => {
  generating.value = true
  const res = await post('/home/admin/invitation-codes/generate')
  generating.value = false
  if (res) {
    ElMessage.success(res.msg || 'Code generated')
    fetchStats()
  }
}

onMounted(() => {
  fetchStats()
  fetchSalesData()
  fetchPendingRecharges()
  fetchPendingWithdraws()
  const socket = getSocket()
  if (socket) {
    socket.on('newOrder', fetchStats)
    socket.on('refundRequested', fetchStats)
  }
})
onBeforeUnmount(() => {
  const socket = getSocket()
  if (socket) {
    socket.off('newOrder', fetchStats)
    socket.off('refundRequested', fetchStats)
  }
})
</script>

<style scoped>
.admin-dashboard { padding: 8px; }

/* Metric Cards */
.metric-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; margin-bottom: 24px; }
.metric-card { background: var(--g-white); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; position: relative; cursor: pointer; transition: all 0.3s cubic-bezier(0.25,0.46,0.45,0.94); border-left: 4px solid var(--card-accent); box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow: hidden; }
.metric-card::before { content: ''; position: absolute; top: 0; right: 0; width: 80px; height: 80px; border-radius: 50%; background: var(--card-accent); opacity: 0.06; transform: translate(20px, -20px); }
.metric-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
.metric-card:hover::before { opacity: 0.1; }
.metric-card .metric-icon { font-size: 28px; color: var(--card-accent); margin-bottom: 8px; }
.metric-card .metric-info { flex: 1; }
.metric-card .metric-value { font-size: 26px; font-weight: 800; color: var(--g-text); line-height: 1.2; }
.metric-card .metric-label { font-size: 13px; color: var(--g-text-light); margin-top: 4px; }
.metric-card .metric-trend { position: absolute; top: 12px; right: 12px; }
.metric-card .metric-trend .up { color: var(--g-green); font-size: 12px; font-weight: 600; }
.metric-card .metric-trend .down { color: var(--g-red); font-size: 12px; font-weight: 600; }

/* Actions */
.actions-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }

/* Charts */
.charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px; }
.chart-card .chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.chart-card .chart-header h3 { font-size: 16px; font-weight: 700; margin: 0; }
.chart-card .chart-container { position: relative; height: 280px; }
.chart-card.doughnut-card .doughnut-container { height: 260px; display: flex; align-items: center; justify-content: center; }

/* Tables Row */
.tables-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }

@media (max-width: 1024px) {
  .metric-grid { grid-template-columns: repeat(3, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
  .tables-row { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .metric-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .metric-card { padding: 14px; }
  .metric-card .metric-value { font-size: 20px; }
  .chart-card .chart-container { height: 200px; }
}
</style>
