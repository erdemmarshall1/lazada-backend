<template>
  <div class="admin-platform-wallet">
    <h2>Platform Wallet Management</h2>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Balance</div>
        <div class="stat-value">{{ pw?.balance?.toFixed(2) || '0.00' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Escrow Balance</div>
        <div class="stat-value escrow">{{ pw?.escrowBalance?.toFixed(2) || '0.00' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Revenue</div>
        <div class="stat-value revenue">{{ pw?.totalRevenue?.toFixed(2) || '0.00' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Available (non-escrow)</div>
        <div class="stat-value available">{{ ((pw?.balance || 0) - (pw?.escrowBalance || 0)).toFixed(2) }}</div>
      </div>
    </div>

    <div class="action-cards g-flex" style="gap:16px;flex-wrap:wrap">
      <el-card class="action-card" shadow="never">
        <h3>Credit (Add Funds)</h3>
        <el-form label-position="top" style="margin-top:12px">
          <el-form-item label="Amount (USD)">
            <el-input-number v-model="creditAmount" :min="0.01" :max="10000000" :precision="2" :step="100" style="width:100%" />
          </el-form-item>
          <el-form-item label="Description / Reason">
            <el-input v-model="creditDescription" type="textarea" :rows="2" placeholder="Reason for crediting platform wallet..." />
          </el-form-item>
          <el-button type="success" :loading="crediting" @click="doCredit" :disabled="creditAmount <= 0">Credit ${{ creditAmount }}</el-button>
        </el-form>
      </el-card>

      <el-card class="action-card" shadow="never">
        <h3>Debit (Deduct Funds)</h3>
        <el-form label-position="top" style="margin-top:12px">
          <el-form-item label="Amount (USD)">
            <el-input-number v-model="debitAmount" :min="0.01" :max="maxDebit" :precision="2" :step="100" style="width:100%" />
          </el-form-item>
          <el-form-item label="Description / Reason">
            <el-input v-model="debitDescription" type="textarea" :rows="2" placeholder="Reason for debiting platform wallet..." />
          </el-form-item>
          <el-button type="danger" :loading="debiting" @click="doDebit" :disabled="debitAmount <= 0 || debitAmount > maxDebit">Debit ${{ debitAmount }}</el-button>
        </el-form>
      </el-card>
    </div>

    <div style="margin-top:12px;color:var(--g-text-light);font-size:13px" v-if="lastActionMsg">
      Last action: {{ lastActionMsg }}
    </div>

    <el-card class="history-card" shadow="never" style="margin-top:16px">
      <h3>Platform Wallet History</h3>
      <div class="g-responsive-table" style="margin-top:12px">
        <el-table :data="history" v-loading="loadingHistory" style="width:100%">
          <el-table-column label="Type" width="100">
            <template #default="{row}">
              <el-tag :type="row.type === 'credit' ? 'success' : 'danger'">{{ row.type === 'credit' ? 'Credit' : 'Debit' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Amount">
            <template #default="{row}">
              <span :style="{ color: row.type === 'credit' ? 'var(--g-success, #67c23a)' : 'var(--g-danger, #f56c6c)' }">
                ${{ row.amount.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Balance Before">
            <template #default="{row}">${{ row.balanceBefore?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="Balance After">
            <template #default="{row}">${{ row.balanceAfter?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="Description" min-width="200">
            <template #default="{row}">{{ row.description || '-' }}</template>
          </el-table-column>
          <el-table-column label="Performed By">
            <template #default="{row}">{{ row.performedBy?.username || row.performedBy?.email || '-' }}</template>
          </el-table-column>
          <el-table-column label="Date" width="180">
            <template #default="{row}">{{ new Date(row.createdAt).toLocaleString() }}</template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pagination-wrap" v-if="historyTotal > 0">
        <el-pagination background layout="prev, pager, next" :total="historyTotal" :page-size="historyPageSize" v-model:current-page="historyPage" @current-change="fetchHistory" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { get, post, qe } from '@/api/request'
import { ElMessage } from 'element-plus'

const pw = ref(null)
const creditAmount = ref(1000)
const creditDescription = ref('')
const debitAmount = ref(500)
const debitDescription = ref('')
const crediting = ref(false)
const debiting = ref(false)
const lastActionMsg = ref('')

const history = ref([])
const loadingHistory = ref(false)
const historyPage = ref(1)
const historyPageSize = ref(20)
const historyTotal = ref(0)

const maxDebit = computed(() => (pw.value?.balance || 0))

const fetchPlatformWallet = async () => {
  const res = await qe(get('/home/admin/platform-wallet'))
  if (res?.data) pw.value = res.data
}

const doCredit = async () => {
  if (creditAmount.value <= 0) return
  crediting.value = true
  const res = await qe(post('/home/admin/platform-wallet/credit', {
    amount: creditAmount.value,
    description: creditDescription.value,
  }))
  crediting.value = false
  if (res) {
    ElMessage.success(res.msg || 'Credit successful')
    lastActionMsg.value = `${new Date().toLocaleString()} — Credited $${creditAmount.value} (${creditDescription.value || 'no description'})`
    creditAmount.value = 1000
    creditDescription.value = ''
    fetchPlatformWallet()
    fetchHistory()
  }
}

const doDebit = async () => {
  if (debitAmount.value <= 0) return
  if (debitAmount.value > maxDebit.value) {
    ElMessage.warning('Debit amount exceeds platform balance')
    return
  }
  debiting.value = true
  const res = await qe(post('/home/admin/platform-wallet/debit', {
    amount: debitAmount.value,
    description: debitDescription.value,
  }))
  debiting.value = false
  if (res) {
    ElMessage.success(res.msg || 'Debit successful')
    lastActionMsg.value = `${new Date().toLocaleString()} — Debited $${debitAmount.value} (${debitDescription.value || 'no description'})`
    debitAmount.value = 500
    debitDescription.value = ''
    fetchPlatformWallet()
    fetchHistory()
  }
}

const fetchHistory = async () => {
  loadingHistory.value = true
  const res = await qe(get(`/home/admin/platform-wallet/history?page=${historyPage.value}&pageSize=${historyPageSize.value}`))
  if (res) {
    history.value = res.data?.list || []
    historyTotal.value = res.data?.total || 0
  }
  loadingHistory.value = false
}

onMounted(() => {
  fetchPlatformWallet()
  fetchHistory()
})
</script>

<style scoped>
.admin-platform-wallet { padding: 20px; }
.admin-platform-wallet h2 { margin-bottom: 16px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.stat-card { background: var(--g-bg, #f5f5f5); border-radius: 8px; padding: 20px; text-align: center; }
.stat-label { font-size: 13px; color: var(--g-text-light, #999); margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--g-main_color, #ff6a00); }
.stat-value.escrow { color: #e6a23c; }
.stat-value.revenue { color: #67c23a; }
.stat-value.available { color: #409eff; }
.action-cards { margin-bottom: 8px; }
.action-card { flex: 1; min-width: 320px; }
.action-card h3 { margin: 0 0 4px; }
.pagination-wrap { margin-top: 12px; display: flex; justify-content: center; }
@media (max-width: 768px) {
  .admin-platform-wallet { padding: 12px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .stat-value { font-size: 22px; }
  .action-card { min-width: 100%; }
}
</style>
