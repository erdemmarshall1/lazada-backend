<template>
  <div v-loading="loading">
    <!-- Welcome Banner -->
    <div class="dash-welcome">
      <div>
        <h2>Welcome back, {{ store.userInfo?.username || 'Admin' }}</h2>
        <p>{{ today }} &middot; {{ summaryText }}</p>
      </div>
      <div style="display:flex;gap:10px">
        <button class="dash-btn dash-btn-primary" @click="quickGenerate" :disabled="generating">+ Generate Code</button>
        <button class="dash-btn dash-btn-ghost" @click="$router.push('/admin/transactions')">All Transactions</button>
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="dash-grid-6" style="margin-bottom:24px">
      <div v-for="(card, i) in metricCards" :key="card.label" class="dash-dark-card" @click="$router.push(card.link)">
        <div class="dash-illustration">
          <svg v-if="i===0" viewBox="0 0 80 80" fill="none">
            <circle cx="30" cy="22" r="12" fill="#667eea" opacity="0.8"/>
            <circle cx="56" cy="28" r="10" fill="#667eea" opacity="0.6"/>
            <path d="M8 66c0-12 10-22 22-22s22 10 22 22" fill="#667eea" opacity="0.55"/>
            <path d="M40 64c0-10 8-18 18-18s18 8 18 18" fill="#667eea" opacity="0.4"/>
          </svg>
          <svg v-else-if="i===1" viewBox="0 0 80 80" fill="none">
            <path d="M8 36L40 12L72 36" fill="#667eea" opacity="0.7"/>
            <rect x="16" y="34" width="48" height="28" rx="2" fill="#667eea" opacity="0.85"/>
            <rect x="28" y="46" width="24" height="16" rx="2" fill="#667eea" opacity="0.5"/>
          </svg>
          <svg v-else-if="i===2" viewBox="0 0 80 80" fill="none">
            <rect x="18" y="28" width="44" height="36" rx="4" fill="#667eea" opacity="0.85"/>
            <path d="M28 28V20a12 12 0 0 1 24 0v8" fill="#667eea" opacity="0.55"/>
            <rect x="18" y="28" width="44" height="6" rx="2" fill="#667eea" opacity="0.5"/>
          </svg>
          <svg v-else-if="i===3" viewBox="0 0 80 80" fill="none">
            <path d="M56 14L72 30L56 46" fill="#667eea" opacity="0.7"/>
            <path d="M16 36L72 36" stroke="#667eea" stroke-width="4" opacity="0.5"/>
            <path d="M24 66L8 50L24 34" fill="#667eea" opacity="0.7"/>
            <path d="M64 44L8 44" stroke="#667eea" stroke-width="4" opacity="0.5"/>
          </svg>
          <svg v-else-if="i===4" viewBox="0 0 80 80" fill="none">
            <rect x="10" y="28" width="54" height="34" rx="6" fill="#667eea" opacity="0.7"/>
            <rect x="10" y="20" width="54" height="14" rx="6" fill="#667eea" opacity="0.85"/>
            <circle cx="54" cy="46" r="8" fill="#667eea" opacity="0.4"/>
          </svg>
          <svg v-else viewBox="0 0 80 80" fill="none">
            <path d="M40 10L66 22V40C66 54 40 70 40 70C40 70 14 54 14 40V22L40 10Z" fill="#667eea" opacity="0.8"/>
            <circle cx="40" cy="40" r="10" fill="#667eea" opacity="0.35"/>
            <path d="M36 40l2 2 4-6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
          </svg>
        </div>
        <div class="dc-value">{{ card.value }}</div>
        <div class="dc-label">{{ card.label }}</div>
      </div>
    </div>

    <!-- Quick Access -->
    <div class="dark-section">
      <div class="section-header"><h3>Quick Access</h3><span class="subtitle">Manage platform</span></div>
      <div class="qa-grid">
        <div v-for="q in quickLinks" :key="q.label" class="qa-item" @click="$router.push(q.link)">
          <i :class="q.icon"></i>
          <span>{{ q.label }}</span>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="chart-row">
      <div class="chart-main">
        <div class="dark-section" style="margin-bottom:0;height:100%">
          <div class="section-header">
            <h3>Revenue</h3>
            <el-radio-group v-model="revenueWeeks" size="small" @change="fetchSalesData">
              <el-radio-button value="4">4w</el-radio-button>
              <el-radio-button value="8">8w</el-radio-button>
              <el-radio-button value="12">12w</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-container-dark">
            <Line v-if="lineData" :data="lineData" :options="lineOpts" />
            <el-empty v-else description="No data" :image-size="72" />
          </div>
        </div>
      </div>
      <div class="chart-side">
        <div class="dark-section" style="margin-bottom:0;height:100%">
          <div class="section-header"><h3>Category</h3></div>
          <div class="chart-container-dark" style="height:260px">
            <Doughnut v-if="doughnutData" :data="doughnutData" :options="doughnutOpts" />
            <el-empty v-else description="No data" :image-size="72" />
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="dark-section">
      <div class="section-header">
        <h3>Recent Activity</h3>
        <span class="subtitle">Latest 10 events</span>
      </div>
      <el-table :data="recentActivity" style="width:100%" size="small" max-height="320" v-if="recentActivity.length">
        <el-table-column prop="type" label="Type" width="100">
          <template #default="{row}">
            <el-tag :type="row.type === 'order' ? 'warning' : row.type === 'refund' ? 'danger' : 'info'" size="small" style="text-transform:capitalize">{{ row.type }}</el-tag>
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
  { label: 'Users', value: 0, icon: 'iconfont icon-yonghu', color: 'var(--g-blue)', link: '/admin/users' },
  { label: 'Shops', value: 0, icon: 'iconfont icon-dianpu', color: 'var(--g-green)', link: '/admin/sellers' },
  { label: 'Products', value: 0, icon: 'iconfont icon-shangpin', color: 'var(--g-purple)', link: '/admin/products' },
  { label: 'Transactions', value: 0, icon: 'iconfont icon-jiaoyi', color: 'var(--g-yellow)', link: '/admin/transactions' },
  { label: 'Revenue', value: '$0.00', icon: 'iconfont icon-qianbao', color: 'var(--g-red)', link: '/admin/transactions' },
  { label: 'Active Codes', value: 0, icon: 'iconfont icon-anquan', color: 'var(--g-info)', link: '/admin/invitation-codes' },
])

const quickLinks = [
  { label: 'Sellers', icon: 'iconfont icon-dianpu', link: '/admin/sellers' },
  { label: 'Users', icon: 'iconfont icon-yonghu', link: '/admin/users' },
  { label: 'Products', icon: 'iconfont icon-shangpin', link: '/admin/products' },
  { label: 'Transactions', icon: 'iconfont icon-jiaoyi', link: '/admin/transactions' },
  { label: 'Reports', icon: 'iconfont icon-zhuzhuangtu', link: '/admin/reports' },
  { label: 'Settings', icon: 'iconfont icon-shezhi', link: '/admin/settings' },
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
.chart-row { display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px; margin-bottom: 24px; }
.qa-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
.qa-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px 8px; border-radius: 10px; cursor: pointer; transition: all 0.2s;
  border: 1px solid rgba(255,255,255,0.04); background: var(--dash-dark-card-alt);
}
.qa-item:hover { border-color: rgba(255,255,255,0.15); transform: translateY(-2px); }
.qa-item i { font-size: 24px; color: #667eea; }
.qa-item span { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); }

@media (max-width: 1024px) { .chart-row { grid-template-columns: 1fr; } .qa-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 600px) { .qa-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
