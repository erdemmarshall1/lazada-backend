<template>
  <div class="admin-dashboard">
    <h2>Admin Dashboard</h2>
    <div class="stats-grid">
      <div class="stat-card" v-for="s in stats" :key="s.label">
        <div class="stat-value">{{ s.value }}</div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card stat-card-notif" :class="{ 'has-notif': store.newOrderCount > 0 }" @click="$router.push('/admin-transactions')">
        <div class="stat-value">{{ store.newOrderCount }}</div>
        <div class="stat-label">New Orders (unread)</div>
      </div>
      <div class="stat-card stat-card-notif" :class="{ 'has-notif': store.refundRequestCount > 0 }" @click="$router.push('/admin-transactions')">
        <div class="stat-value">{{ store.refundRequestCount }}</div>
        <div class="stat-label">Refund Requests</div>
      </div>
      <div class="stat-card" @click="$router.push('/admin-transactions')">
        <div class="stat-value" v-if="platformWallet">${{ platformWallet.totalRevenue?.toFixed(2) }}</div>
        <div class="stat-value" v-else>---</div>
        <div class="stat-label">Platform Revenue</div>
      </div>
      <div class="stat-card" @click="$router.push('/admin-transactions')">
        <div class="stat-value" v-if="platformWallet">${{ platformWallet.balance?.toFixed(2) }}</div>
        <div class="stat-value" v-else>---</div>
        <div class="stat-label">Platform Balance</div>
      </div>
      <div class="stat-card" @click="$router.push('/admin-invitation-codes')">
        <div class="stat-value">{{ invitationCodeCount }}</div>
        <div class="stat-label">Active Codes</div>
      </div>
    </div>
    <div class="action-bar g-flex-align-center" style="gap:12px;margin:12px 0">
      <el-button size="small" type="primary" @click="quickGenerate" :loading="generating">+ Generate Code</el-button>
      <el-button size="small" @click="resetNotifs" v-if="store.newOrderCount > 0 || store.refundRequestCount > 0">Clear Notifications</el-button>
      <el-button size="small" type="primary" plain @click="$router.push('/admin-transactions')">View All Transactions</el-button>
      <el-button size="small" plain @click="$router.push('/admin-payment-settings')">Payment Settings</el-button>
    </div>
    <div class="pending-section">
      <h3>Pending Recharges</h3>
      <div class="g-responsive-table">
      <el-table :data="pendingRecharges" style="width:100%" v-loading="loadingRecharge">
        <el-table-column prop="_id" label="ID" width="200" />
        <el-table-column prop="userId.username" label="User" />
        <el-table-column prop="amount" label="Amount" />
        <el-table-column prop="paymentMethod" label="Method" />
        <el-table-column label="Date"><template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}</template></el-table-column>
        <el-table-column label="Action">
          <template #default="{row}">
            <el-button type="success" size="small" @click="approveTx(row._id)">Approve</el-button>
            <el-button type="danger" size="small" @click="rejectTx(row._id)">Reject</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>
      <h3 style="margin-top:24px">Pending Withdrawals</h3>
      <div class="g-responsive-table">
      <el-table :data="pendingWithdraws" style="width:100%" v-loading="loadingWithdraw">
        <el-table-column prop="_id" label="ID" width="200" />
        <el-table-column prop="userId.username" label="User" />
        <el-table-column prop="amount" label="Amount" />
        <el-table-column prop="paymentMethod" label="Method" />
        <el-table-column label="Date"><template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}</template></el-table-column>
        <el-table-column label="Action">
          <template #default="{row}">
            <el-button type="success" size="small" @click="approveTx(row._id)">Approve</el-button>
            <el-button type="danger" size="small" @click="rejectTx(row._id)">Reject</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '@/stores/app'
import { get, post, qe } from '@/api/request'
import { ElMessage } from 'element-plus'
import { getSocket } from '@/socket'

const store = useAppStore()
const stats = ref([
  { label: 'Total Users', value: 0 },
  { label: 'Total Shops', value: 0 },
  { label: 'Total Products', value: 0 },
  { label: 'Total Transactions', value: 0 },
])
const pendingRecharges = ref([])
const pendingWithdraws = ref([])
const platformWallet = ref(null)
const loadingRecharge = ref(false)
const loadingWithdraw = ref(false)
const invitationCodeCount = ref(0)
const generating = ref(false)

const fetchStats = async () => {
  const [u, s, p, t, w] = await Promise.all([
    qe(get('/home/admin/users?pageSize=1')),
    qe(get('/home/admin/shops?pageSize=1')),
    qe(get('/home/admin/products?pageSize=1')),
    qe(get('/home/admin/transactions?pageSize=1')),
    qe(get('/home/admin/platform-wallet')),
  ])
  stats.value = [
    { label: 'Total Users', value: u?.data?.total ?? 0 },
    { label: 'Total Shops', value: s?.data?.total ?? 0 },
    { label: 'Total Products', value: p?.data?.total ?? 0 },
    { label: 'Total Transactions', value: t?.data?.total ?? 0 },
  ]
  if (w?.data) platformWallet.value = w.data
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
const fetchInvitationCodeCount = async () => {
  const res = await qe(get('/home/admin/invitation-codes?pageSize=1'))
  if (res?.data) invitationCodeCount.value = res.data.total || 0
}
const quickGenerate = async () => {
  generating.value = true
  const res = await post('/home/admin/invitation-codes/generate')
  generating.value = false
  if (res) {
    ElMessage.success(res.msg || 'Code generated')
    fetchInvitationCodeCount()
  }
}

onMounted(() => {
  fetchStats(); fetchPendingRecharges(); fetchPendingWithdraws(); fetchInvitationCodeCount()
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
.admin-dashboard { padding: 20px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
.stat-card { background: var(--g-bg); border-radius: 8px; padding: 24px; text-align: center; cursor: pointer; transition: transform 0.2s; }
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.stat-value { font-size: 32px; font-weight: 700; color: var(--g-main_color); }
.stat-label { font-size: 14px; color: var(--g-text-light); margin-top: 8px; }
.stat-card-notif.has-notif { border: 2px solid #e74c3c; animation: pulse-notif 2s infinite; }
@keyframes pulse-notif { 0%,100% { box-shadow: 0 0 0 0 rgba(231,76,60,0.4); } 50% { box-shadow: 0 0 0 8px rgba(231,76,60,0); } }
.pending-section { margin-top: 24px; }
@media (max-width: 768px) {
  .admin-dashboard { padding: 16px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .stat-card { padding: 16px; }
  .stat-value { font-size: 24px; }
}
@media (max-width: 480px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
}
</style>
