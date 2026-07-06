<template>
  <div class="admin-platform-wallet">
    <h2>Platform Wallet Management</h2>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Platform Balance</div>
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

    <el-card class="search-card" shadow="never">
      <h3>Select Seller Recipient</h3>
      <div class="g-flex" style="gap:12px;flex-wrap:wrap;margin-top:8px">
        <el-input v-model="keyword" placeholder="Search seller by username or email" style="width:300px" clearable @keyup.enter="searchSellers" />
        <el-button type="primary" @click="searchSellers">Search</el-button>
        <el-button @click="clearSearch">Clear</el-button>
      </div>
      <div class="g-responsive-table" style="margin-top:12px" v-if="sellers.length > 0">
        <el-table :data="sellers" highlight-current-row style="width:100%">
          <el-table-column prop="username" label="Username" />
          <el-table-column prop="email" label="Email" />
          <el-table-column prop="role" label="Role" />
          <el-table-column label="Balance">
            <template #default="{row}">${{ row.balance.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="Action" width="120">
            <template #default="{row}">
              <el-button size="small" type="primary" plain :disabled="selectedSeller?._id === row._id" @click="selectSeller(row)">Select</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pagination-wrap" v-if="sellerTotal > 0">
        <el-pagination background layout="prev, pager, next" :total="sellerTotal" :page-size="sellerPageSize" v-model:current-page="sellerPage" @current-change="searchSellers" />
      </div>
    </el-card>

    <template v-if="selectedSeller">
      <el-card class="seller-info-card" shadow="never">
        <div class="seller-info-bar g-flex-align-center" style="gap:16px;flex-wrap:wrap">
          <div><strong>{{ selectedSeller.username }}</strong> — <span class="text-muted">{{ selectedSeller.email }}</span></div>
          <div class="balance-badge">Seller Balance: <strong>${{ selectedSeller.balance.toFixed(2) }}</strong></div>
          <el-button size="small" type="info" plain @click="selectedSeller = null">Change Seller</el-button>
        </div>
      </el-card>

      <div class="action-cards g-flex" style="gap:16px;flex-wrap:wrap">
        <el-card class="action-card" shadow="never">
          <h3>Credit Seller <span class="flow-hint">(Platform → Seller)</span></h3>
          <p class="flow-desc">Transfer funds from platform wallet to seller's wallet</p>
          <el-form label-position="top" style="margin-top:12px">
            <el-form-item label="Amount (USD)">
              <el-input-number v-model="creditAmount" :min="0.01" :max="maxCredit" :precision="2" :step="10" style="width:100%" />
            </el-form-item>
            <el-form-item label="Title">
              <el-input v-model="creditTitle" placeholder="e.g. Bonus, Commission, Promotion..." />
            </el-form-item>
            <el-form-item label="Description">
              <el-input v-model="creditDescription" type="textarea" :rows="2" placeholder="Additional details for this credit..." />
            </el-form-item>
            <el-button type="success" :loading="crediting" @click="doCredit" :disabled="creditAmount <= 0 || creditAmount > maxCredit">Transfer ${{ creditAmount }} to Seller</el-button>
          </el-form>
        </el-card>

        <el-card class="action-card" shadow="never">
          <h3>Debit Seller <span class="flow-hint">(Seller → Platform)</span></h3>
          <p class="flow-desc">Deduct funds from seller's wallet back to platform</p>
          <el-form label-position="top" style="margin-top:12px">
            <el-form-item label="Amount (USD)">
              <el-input-number v-model="debitAmount" :min="0.01" :max="maxDebitSeller" :precision="2" :step="10" style="width:100%" />
            </el-form-item>
            <el-form-item label="Title">
              <el-input v-model="debitTitle" placeholder="e.g. Fee, Adjustment, Penalty..." />
            </el-form-item>
            <el-form-item label="Description">
              <el-input v-model="debitDescription" type="textarea" :rows="2" placeholder="Additional details for this debit..." />
            </el-form-item>
            <el-button type="danger" :loading="debiting" @click="doDebit" :disabled="debitAmount <= 0 || debitAmount > maxDebitSeller">Transfer ${{ debitAmount }} from Seller</el-button>
          </el-form>
        </el-card>
      </div>

      <div style="margin-top:12px;color:var(--g-text-light);font-size:13px" v-if="lastActionMsg">
        Last action: {{ lastActionMsg }}
      </div>
    </template>

    <el-card class="history-card" shadow="never" style="margin-top:16px">
      <h3>Platform Wallet Transfer History</h3>
      <div class="g-responsive-table" style="margin-top:12px">
        <el-table :data="history" v-loading="loadingHistory" style="width:100%">
          <el-table-column label="Type" width="100">
            <template #default="{row}">
              <el-tag :type="row.type === 'credit' ? 'success' : 'danger'">{{ row.type === 'credit' ? 'Credit' : 'Debit' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Direction" width="140">
            <template #default="{row}">
              <span v-if="row.type === 'credit'">Platform → Seller</span>
              <span v-else>Seller → Platform</span>
            </template>
          </el-table-column>
          <el-table-column label="Amount">
            <template #default="{row}">
              <span :style="{ color: row.type === 'credit' ? '#f56c6c' : '#67c23a' }">
                ${{ row.amount.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Recipient / Source">
            <template #default="{row}">{{ row.recipientId?.username || row.recipientId?.email || '-' }}</template>
          </el-table-column>
          <el-table-column label="Title" min-width="140">
            <template #default="{row}">{{ row.title || '-' }}</template>
          </el-table-column>
          <el-table-column label="Platform Balance">
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

// Seller search
const keyword = ref('')
const sellers = ref([])
const sellerPage = ref(1)
const sellerPageSize = ref(20)
const sellerTotal = ref(0)
const selectedSeller = ref(null)

// Credit form
const creditAmount = ref(100)
const creditTitle = ref('')
const creditDescription = ref('')
const crediting = ref(false)

// Debit form
const debitAmount = ref(50)
const debitTitle = ref('')
const debitDescription = ref('')
const debiting = ref(false)

const lastActionMsg = ref('')

// History
const history = ref([])
const loadingHistory = ref(false)
const historyPage = ref(1)
const historyPageSize = ref(20)
const historyTotal = ref(0)

const maxCredit = computed(() => (pw.value?.balance || 0))
const maxDebitSeller = computed(() => (selectedSeller.value?.balance || 0))

const fetchPlatformWallet = async () => {
  const res = await qe(get('/home/admin/platform-wallet'))
  if (res?.data) pw.value = res.data
}

const searchSellers = async () => {
  const res = await qe(get(`/home/admin/balance/users?keyword=${encodeURIComponent(keyword.value || '')}&page=${sellerPage.value}&pageSize=${sellerPageSize.value}`))
  if (res) {
    sellers.value = res.data?.list || []
    sellerTotal.value = res.data?.total || 0
  } else {
    ElMessage.warning('Failed to fetch users')
  }
}

const clearSearch = () => {
  keyword.value = ''
  sellers.value = []
  selectedSeller.value = null
  sellerPage.value = 1
  sellerTotal.value = 0
}

const selectSeller = (row) => {
  selectedSeller.value = { ...row }
}

const doCredit = async () => {
  if (!selectedSeller.value || creditAmount.value <= 0) return
  if (creditAmount.value > maxCredit.value) {
    ElMessage.warning('Amount exceeds platform balance')
    return
  }
  crediting.value = true
  const res = await qe(post('/home/admin/platform-wallet/credit', {
    userId: selectedSeller.value._id,
    amount: creditAmount.value,
    title: creditTitle.value,
    description: creditDescription.value,
  }))
  crediting.value = false
  if (res) {
    ElMessage.success(res.msg || 'Credit successful')
    selectedSeller.value.balance = (selectedSeller.value.balance || 0) + Number(creditAmount.value)
    const titleTag = creditTitle.value ? `[${creditTitle.value}] ` : ''
    lastActionMsg.value = `${new Date().toLocaleString()} — ${titleTag}Credited $${creditAmount.value} to ${selectedSeller.value.username}`
    creditAmount.value = 100
    creditTitle.value = ''
    creditDescription.value = ''
    fetchPlatformWallet()
    fetchHistory()
  }
}

const doDebit = async () => {
  if (!selectedSeller.value || debitAmount.value <= 0) return
  if (debitAmount.value > maxDebitSeller.value) {
    ElMessage.warning('Amount exceeds seller balance')
    return
  }
  debiting.value = true
  const res = await qe(post('/home/admin/platform-wallet/debit', {
    userId: selectedSeller.value._id,
    amount: debitAmount.value,
    title: debitTitle.value,
    description: debitDescription.value,
  }))
  debiting.value = false
  if (res) {
    ElMessage.success(res.msg || 'Debit successful')
    selectedSeller.value.balance = (selectedSeller.value.balance || 0) - Number(debitAmount.value)
    const titleTag = debitTitle.value ? `[${debitTitle.value}] ` : ''
    lastActionMsg.value = `${new Date().toLocaleString()} — ${titleTag}Debited $${debitAmount.value} from ${selectedSeller.value.username}`
    debitAmount.value = 50
    debitTitle.value = ''
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
  searchSellers()
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
.search-card { margin-bottom: 16px; }
.search-card h3 { margin: 0; }
.seller-info-card { margin-bottom: 16px; }
.seller-info-bar { padding: 8px 0; }
.balance-badge { background: var(--g-main_color, #ff6a00); color: #fff; padding: 4px 16px; border-radius: 20px; font-size: 14px; }
.text-muted { color: var(--g-text-light, #999); }
.action-cards { margin-bottom: 8px; }
.action-card { flex: 1; min-width: 340px; }
.action-card h3 { margin: 0 0 2px; }
.flow-hint { font-size: 12px; font-weight: 400; color: var(--g-text-light, #999); }
.flow-desc { font-size: 12px; color: var(--g-text-light, #999); margin: 0 0 4px; }
.pagination-wrap { margin-top: 12px; display: flex; justify-content: center; }
@media (max-width: 768px) {
  .admin-platform-wallet { padding: 12px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .stat-value { font-size: 22px; }
  .action-card { min-width: 100%; }
}
</style>
