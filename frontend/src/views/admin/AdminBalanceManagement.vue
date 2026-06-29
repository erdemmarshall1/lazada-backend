<template>
  <div class="admin-balance">
    <h2>Balance Management</h2>

    <el-card class="search-card" shadow="never">
      <div class="g-flex" style="gap:12px;flex-wrap:wrap">
        <el-input v-model="keyword" placeholder="Search by username or email" style="width:300px" clearable @keyup.enter="searchUsers" />
        <el-button type="primary" @click="searchUsers">Search</el-button>
        <el-button @click="keyword = ''; users = []; selectedUser = null">Clear</el-button>
      </div>
      <div class="g-responsive-table" style="margin-top:12px" v-if="users.length > 0">
        <el-table :data="users" highlight-current-row @current-change="onUserSelect" style="width:100%">
          <el-table-column prop="username" label="Username" />
          <el-table-column prop="email" label="Email" />
          <el-table-column prop="role" label="Role" />
          <el-table-column label="Balance">
            <template #default="{row}">${{ row.balance.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="Action" width="120">
            <template #default="{row}">
              <el-button size="small" type="primary" plain @click="selectUser(row)">Select</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pagination-wrap" v-if="userTotal > 0">
        <el-pagination background layout="prev, pager, next" :total="userTotal" :page-size="userPageSize" v-model:current-page="userPage" @current-change="searchUsers" />
      </div>
    </el-card>

    <template v-if="selectedUser">
      <el-card class="user-info-card" shadow="never">
        <div class="user-info-bar g-flex-align-center" style="gap:16px;flex-wrap:wrap">
          <div><strong>{{ selectedUser.username }}</strong> — <span class="text-muted">{{ selectedUser.email }}</span></div>
          <div class="balance-badge">Current Balance: <strong>${{ selectedUser.balance.toFixed(2) }}</strong></div>
        </div>
      </el-card>

      <div class="action-cards g-flex" style="gap:16px;flex-wrap:wrap">
        <el-card class="action-card" shadow="never">
          <h3>Credit (Add Funds)</h3>
          <el-form label-position="top" style="margin-top:12px">
            <el-form-item label="Amount (USD)">
              <el-input-number v-model="creditAmount" :min="0.01" :max="1000000" :precision="2" :step="10" style="width:100%" />
            </el-form-item>
            <el-form-item label="Description / Reason">
              <el-input v-model="creditDescription" type="textarea" :rows="2" placeholder="Reason for crediting this user..." />
            </el-form-item>
            <el-button type="success" :loading="crediting" @click="doCredit" :disabled="creditAmount <= 0">Credit ${{ creditAmount }}</el-button>
          </el-form>
        </el-card>

        <el-card class="action-card" shadow="never">
          <h3>Debit (Deduct Funds)</h3>
          <el-form label-position="top" style="margin-top:12px">
            <el-form-item label="Amount (USD)">
              <el-input-number v-model="debitAmount" :min="0.01" :max="selectedUser.balance" :precision="2" :step="10" style="width:100%" />
            </el-form-item>
            <el-form-item label="Description / Reason">
              <el-input v-model="debitDescription" type="textarea" :rows="2" placeholder="Reason for debiting this user..." />
            </el-form-item>
            <el-button type="danger" :loading="debiting" @click="doDebit" :disabled="debitAmount <= 0 || debitAmount > selectedUser.balance">Debit ${{ debitAmount }}</el-button>
          </el-form>
        </el-card>
      </div>

      <div style="margin-top:12px;color:var(--g-text-light);font-size:13px" v-if="lastActionMsg">
        Last action: {{ lastActionMsg }}
      </div>
    </template>

    <el-card class="history-card" shadow="never" style="margin-top:16px">
      <h3>Adjustment History</h3>
      <div class="g-responsive-table" style="margin-top:12px">
        <el-table :data="history" v-loading="loadingHistory" style="width:100%">
          <el-table-column prop="_id" label="ID" width="200" />
          <el-table-column label="User">
            <template #default="{row}">{{ row.userId?.username || row.userId?.email || 'Deleted' }}</template>
          </el-table-column>
          <el-table-column label="Type" width="100">
            <template #default="{row}">
              <el-tag :type="row.amount > 0 ? 'success' : 'danger'">{{ row.amount > 0 ? 'Credit' : 'Debit' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Amount">
            <template #default="{row}">
              <span :style="{ color: row.amount > 0 ? 'var(--g-success, #67c23a)' : 'var(--g-danger, #f56c6c)' }">
                ${{ Math.abs(row.amount).toFixed(2) }}
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
import { ref, onMounted } from 'vue'
import { get, post, qe } from '@/api/request'
import { ElMessage } from 'element-plus'

const keyword = ref('')
const users = ref([])
const userPage = ref(1)
const userPageSize = ref(20)
const userTotal = ref(0)

const selectedUser = ref(null)
const creditAmount = ref(100)
const creditDescription = ref('')
const debitAmount = ref(50)
const debitDescription = ref('')
const crediting = ref(false)
const debiting = ref(false)
const lastActionMsg = ref('')

const history = ref([])
const loadingHistory = ref(false)
const historyPage = ref(1)
const historyPageSize = ref(20)
const historyTotal = ref(0)

const searchUsers = async () => {
  const res = await qe(get(`/home/admin/balance/users?keyword=${encodeURIComponent(keyword.value || '')}&page=${userPage.value}&pageSize=${userPageSize.value}`))
  if (res) {
    users.value = res.data?.list || []
    userTotal.value = res.data?.total || 0
  }
}

const onUserSelect = (row) => {
  if (row) selectedUser.value = { ...row }
}

const selectUser = (row) => {
  selectedUser.value = { ...row }
}

const doCredit = async () => {
  if (!selectedUser.value || creditAmount.value <= 0) return
  crediting.value = true
  const res = await qe(post('/home/admin/balance/credit', {
    userId: selectedUser.value._id,
    amount: creditAmount.value,
    description: creditDescription.value,
  }))
  crediting.value = false
  if (res) {
    ElMessage.success(res.msg || 'Credit successful')
    selectedUser.value.balance = (selectedUser.value.balance || 0) + Number(creditAmount.value)
    lastActionMsg.value = `${new Date().toLocaleString()} — Credited $${creditAmount.value} (${creditDescription.value || 'no description'})`
    creditAmount.value = 100
    creditDescription.value = ''
    fetchHistory()
  }
}

const doDebit = async () => {
  if (!selectedUser.value || debitAmount.value <= 0) return
  if (debitAmount.value > selectedUser.value.balance) {
    ElMessage.warning('Debit amount exceeds user balance')
    return
  }
  debiting.value = true
  const res = await qe(post('/home/admin/balance/debit', {
    userId: selectedUser.value._id,
    amount: debitAmount.value,
    description: debitDescription.value,
  }))
  debiting.value = false
  if (res) {
    ElMessage.success(res.msg || 'Debit successful')
    selectedUser.value.balance = (selectedUser.value.balance || 0) - Number(debitAmount.value)
    lastActionMsg.value = `${new Date().toLocaleString()} — Debited $${debitAmount.value} (${debitDescription.value || 'no description'})`
    debitAmount.value = 50
    debitDescription.value = ''
    fetchHistory()
  }
}

const fetchHistory = async (userId) => {
  loadingHistory.value = true
  const uid = userId || selectedUser.value?._id || ''
  const res = await qe(get(`/home/admin/balance/history?userId=${uid}&page=${historyPage.value}&pageSize=${historyPageSize.value}`))
  if (res) {
    history.value = res.data?.list || []
    historyTotal.value = res.data?.total || 0
  }
  loadingHistory.value = false
}

onMounted(() => {
  fetchHistory()
})
</script>

<style scoped>
.admin-balance { padding: 20px; }
.admin-balance h2 { margin-bottom: 16px; }
.search-card { margin-bottom: 16px; }
.user-info-card { margin-bottom: 16px; }
.user-info-bar { padding: 8px 0; }
.balance-badge { background: var(--g-main_color, #ff6a00); color: #fff; padding: 4px 16px; border-radius: 20px; font-size: 14px; }
.text-muted { color: var(--g-text-light, #999); }
.action-cards { margin-bottom: 16px; }
.action-card { flex: 1; min-width: 320px; }
.action-card h3 { margin: 0 0 4px; }
.pagination-wrap { margin-top: 12px; display: flex; justify-content: center; }
@media (max-width: 768px) {
  .admin-balance { padding: 12px; }
  .action-card { min-width: 100%; }
}
</style>
