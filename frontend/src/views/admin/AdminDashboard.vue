<template>
  <div class="admin-dashboard" v-loading="loading">
    <!-- Welcome Banner -->
    <div class="welcome-banner">
      <div class="welcome-text">
        <h2>Welcome back, {{ store.userInfo?.username || 'Admin' }}</h2>
        <p>{{ today }} &middot; {{ summaryText }}</p>
      </div>
      <div class="welcome-actions">
        <el-button type="primary" @click="quickGenerate" :loading="generating">+ Generate Code</el-button>
        <el-button plain @click="$router.push('/admin-transactions')">All Transactions</el-button>
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="metric-grid">
      <div v-for="card in metricCards" :key="card.label" class="metric-card" :style="{ '--accent': card.color }" @click="$router.push(card.link)">
        <div class="mc-icon"><i :class="card.icon"></i></div>
        <div class="mc-value">{{ card.value }}</div>
        <div class="mc-label">{{ card.label }}</div>
      </div>
    </div>

    <!-- Quick Access -->
    <div class="quick-grid">
      <div v-for="q in quickLinks" :key="q.label" class="quick-card" @click="$router.push(q.link)">
        <i :class="q.icon"></i>
        <span>{{ q.label }}</span>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="chart-row">
      <div class="page-card">
        <div class="chart-head">
          <h3>Revenue (Weekly)</h3>
          <el-radio-group v-model="revenueWeeks" size="small" @change="fetchSalesData">
            <el-radio-button value="4">4w</el-radio-button>
            <el-radio-button value="8">8w</el-radio-button>
            <el-radio-button value="12">12w</el-radio-button>
          </el-radio-group>
        </div>
        <div class="chart-box">
          <Line v-if="lineData" :data="lineData" :options="lineOpts" />
          <el-empty v-else description="No data" :image-size="72" />
        </div>
      </div>
      <div class="page-card">
        <div class="chart-head"><h3>Category Sales</h3></div>
        <div class="chart-box doughnut-box">
          <Doughnut v-if="doughnutData" :data="doughnutData" :options="doughnutOpts" />
          <el-empty v-else description="No data" :image-size="72" />
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="page-card">
      <div class="page-header">
        <i class="iconfont icon-dingdan"></i>
        <h2>Recent Activity</h2>
        <span class="subtitle">Latest pending items</span>
      </div>
      <el-table :data="recentActivity" style="width:100%" size="small" max-height="320" v-if="recentActivity.length">
        <el-table-column prop="type" label="Type" width="100">
          <template #default="{row}">
            <el-tag :type="row.type === 'order' ? 'warning' : row.type === 'refund' ? 'danger' : 'info'" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ref" label="ID" width="160" />
        <el-table-column prop="user" label="User" min-width="120" />
        <el-table-column prop="amount" label="Amount" width="100">
          <template #default="{row}">${{ row.amount?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="Date" width="100">
          <template #default="{row}">{{ new Date(row.date).toLocaleDateString() }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="All clear — no pending items" :image-size="72" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '@/stores/app'
import { get, post, qe } from '@/api/request'
import { ElMessage } from 'element-plus'
import { getSocket } from '@/socket'
import { Line, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

const store = useAppStore()
const loading = ref(true)
const generating = ref(false)
const revenueWeeks = ref('8')
const lineData = ref(null)
const lineOpts = ref(null)
const doughnutData = ref(null)
const doughnutOpts = ref(null)
const recentActivity = ref([])

const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const now = new Date()
const today = computed(() => `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`)
const summaryText = ref('Loading dashboard...')

const metricCards = ref([
  { label: 'Users', value: 0, icon: 'iconfont icon-yonghu', color: 'var(--g-blue)', link: '/admin-users' },
  { label: 'Shops', value: 0, icon: 'iconfont icon-dianpu', color: 'var(--g-green)', link: '/admin-sellers' },
  { label: 'Products', value: 0, icon: 'iconfont icon-shangpin', color: 'var(--g-purple)', link: '/admin-products' },
  { label: 'Transactions', value: 0, icon: 'iconfont icon-jiaoyi', color: 'var(--g-yellow)', link: '/admin-transactions' },
  { label: 'Revenue', value: '$0.00', icon: 'iconfont icon-qianbao', color: 'var(--g-red)', link: '/admin-transactions' },
  { label: 'Active Codes', value: 0, icon: 'iconfont icon-anquan', color: 'var(--g-info)', link: '/admin-invitation-codes' },
])

const quickLinks = [
  { label: 'Sellers', icon: 'iconfont icon-dianpu', link: '/admin-sellers' },
  { label: 'Users', icon: 'iconfont icon-yonghu', link: '/admin-users' },
  { label: 'Products', icon: 'iconfont icon-shangpin', link: '/admin-products' },
  { label: 'Transactions', icon: 'iconfont icon-jiaoyi', link: '/admin-transactions' },
  { label: 'Reports', icon: 'iconfont icon-baobiao', link: '/admin-reports' },
  { label: 'Settings', icon: 'iconfont icon-shezhi', link: '/admin-settings' },
]

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
  if (w?.data) metricCards.value[4].value = '$' + (w.data.totalRevenue?.toFixed(2) ?? '0.00')
  metricCards.value[5].value = ic?.data?.total ?? 0
  summaryText.value = `${u?.data?.total ?? 0} users · ${s?.data?.total ?? 0} shops · ${t?.data?.total ?? 0} transactions`
}

const fetchSalesData = async () => {
  const weeks = parseInt(revenueWeeks.value)
  const res = await qe(get('/home/report/sales', { params: { days: weeks * 7 } }))
  if (!res?.data) return
  const d = res.data
  buildLineChart(d.timeSeries)
  buildDoughnutChart(d.categorySales)
  recentActivity.value = (d.recentOrders || []).slice(0, 10).map(o => ({
    type: o.status === 'pending' ? 'order' : 'completed',
    ref: o._id?.slice(-8),
    user: o.userId?.username || '—',
    amount: o.amount || 0,
    date: o.createdAt,
  }))
  const pendRefunds = (d.pendingRefunds || []).slice(0, 5).map(r => ({
    type: 'refund',
    ref: r._id?.slice(-8),
    user: r.userId?.username || '—',
    amount: r.amount || 0,
    date: r.createdAt,
  }))
  recentActivity.value = [...recentActivity.value, ...pendRefunds].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
}

const buildLineChart = (timeSeries) => {
  if (!timeSeries?.length) { lineData.value = null; return }
  lineData.value = {
    labels: timeSeries.map(i => i.label || i.date),
    datasets: [{
      label: 'Revenue',
      data: timeSeries.map(i => i.revenue || i.total || 0),
      borderColor: '#2980b9',
      backgroundColor: 'rgba(41,128,185,0.08)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#2980b9',
      pointRadius: 3,
      borderWidth: 2,
    }],
  }
  lineOpts.value = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, grid: { drawBorder: false }, ticks: { callback: v => '$' + v, font: { size: 11 } } },
    },
  }
}

const buildDoughnutChart = (categorySales) => {
  if (!categorySales?.length) { doughnutData.value = null; return }
  const colors = ['#2980b9','#27ae60','#8e44ad','#b8922a','#c0392b','#1abc9c','#e67e22','#34495e']
  doughnutData.value = {
    labels: categorySales.map(i => i.name || i.category),
    datasets: [{
      data: categorySales.map(i => i.total || i.count || 0),
      backgroundColor: categorySales.map((_, i) => colors[i % colors.length]),
      borderWidth: 2, borderColor: '#fff',
    }],
  }
  doughnutOpts.value = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10, font: { size: 10 } } },
    },
  }
}

const quickGenerate = async () => {
  generating.value = true
  const res = await post('/home/admin/invitation-codes/generate')
  generating.value = false
  if (res) { ElMessage.success(res.msg || 'Code generated'); fetchStats() }
}

onMounted(async () => {
  await Promise.all([fetchStats(), fetchSalesData()])
  loading.value = false
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
.admin-dashboard { padding: 8px; min-height: 80vh; }

.welcome-banner {
  background: linear-gradient(135deg, var(--g-primary, #2980b9), var(--g-blue, #3498db));
  border-radius: 14px; padding: 24px 32px; margin-bottom: 24px;
  display: flex; align-items: center; justify-content: space-between; color: #fff;
}
.welcome-text h2 { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
.welcome-text p { margin: 0; font-size: 14px; opacity: 0.85; }
.welcome-actions { display: flex; gap: 10px; }
.welcome-actions .el-button { --el-button-bg-color: rgba(255,255,255,0.2); --el-button-border-color: rgba(255,255,255,0.4); --el-button-text-color: #fff; --el-button-hover-bg-color: rgba(255,255,255,0.35); --el-button-hover-border-color: #fff; }

.metric-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; margin-bottom: 24px; }
.metric-card {
  background: var(--g-white); border-radius: 12px; padding: 18px 20px;
  border-left: 4px solid var(--accent); cursor: pointer;
  transition: all 0.25s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.metric-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.mc-icon { font-size: 24px; color: var(--accent); margin-bottom: 6px; }
.mc-value { font-size: 24px; font-weight: 800; color: var(--g-text); line-height: 1.2; }
.mc-label { font-size: 13px; color: var(--g-text-light); margin-top: 2px; }

.quick-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-bottom: 24px; }
.quick-card {
  background: var(--g-white); border-radius: 10px; padding: 18px 12px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  border: 1px solid var(--g-border, #eee);
}
.quick-card:hover { border-color: var(--g-primary, #2980b9); box-shadow: 0 4px 16px rgba(41,128,185,0.12); transform: translateY(-2px); }
.quick-card i { font-size: 28px; color: var(--g-primary, #2980b9); }
.quick-card span { font-size: 13px; font-weight: 600; color: var(--g-text); }

.chart-row { display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px; margin-bottom: 24px; }
.chart-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.chart-head h3 { margin: 0; font-size: 15px; font-weight: 700; }
.chart-box { position: relative; height: 260px; }
.doughnut-box { display: flex; align-items: center; justify-content: center; }

.page-card { background: var(--g-white); border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 24px; }
.page-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.page-header i { font-size: 20px; color: var(--g-primary, #2980b9); }
.page-header h2 { margin: 0; font-size: 16px; font-weight: 700; }
.page-header .subtitle { font-size: 12px; color: var(--g-text-light); margin-left: auto; }

@media (max-width: 1024px) {
  .metric-grid { grid-template-columns: repeat(3, 1fr); }
  .quick-grid { grid-template-columns: repeat(3, 1fr); }
  .chart-row { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .metric-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .quick-grid { grid-template-columns: repeat(2, 1fr); }
  .welcome-banner { flex-direction: column; align-items: flex-start; gap: 12px; }
  .metric-card { padding: 14px; }
  .mc-value { font-size: 20px; }
  .chart-box { height: 200px; }
}
</style>
