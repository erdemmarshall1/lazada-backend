<template>
  <div class="admin-page admin-transactions">
    <div class="page-card">
      <div class="page-header">
        <i class="iconfont icon-jiaoyi"></i>
        <h2>Transactions</h2>
      </div>
    <div class="g-responsive-table">
    <el-table :data="list" v-loading="loading" style="width:100%">
      <el-table-column prop="_id" label="ID" width="180" />
      <el-table-column prop="userId.username" label="User" />
      <el-table-column prop="type" label="Type" width="100" />
      <el-table-column prop="amount" label="Amount" width="100" />
      <el-table-column prop="paymentMethod" label="Method" width="130" />
      <el-table-column label="Receipt" width="100">
        <template #default="{row}">
          <el-button v-if="row.receipt" size="small" link type="primary" @click="viewReceipt(row.receipt)">View</el-button>
          <span v-else style="color:var(--g-text-light);font-size:12px">—</span>
        </template>
      </el-table-column>
      <el-table-column label="Status" width="110">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'">
            {{ row.status === 1 ? 'Approved' : row.status === 2 ? 'Rejected' : 'Pending' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Date" width="120"><template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}</template></el-table-column>
      <el-table-column label="Actions" width="160" v-if="showActions">
        <template #default="{row}">
          <el-button v-if="row.status === 0" size="small" type="success" @click="approve(row._id)" :loading="actionLoading === row._id">Approve</el-button>
          <el-button v-if="row.status === 0" size="small" type="danger" @click="reject(row._id)" :loading="actionLoading === row._id">Reject</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>
    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="fetch" />
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { get, post, qe, imgUrl, API_BASE } from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const actionLoading = ref('')

const showActions = computed(() => store.isAdmin)

const fetch = async () => {
  loading.value = true
  const res = await qe(get(`/home/admin/transactions?page=${page.value}&pageSize=${pageSize.value}`))
  if (res) { list.value = res.data?.list || []; total.value = res.data?.total || 0 }
  loading.value = false
}

const viewReceipt = (url) => {
  if (url) window.open(url.startsWith('http') ? url : `${API_BASE}${url}`, '_blank')
}

const approve = async (id) => {
  try {
    await ElMessageBox.confirm('Approve this transaction? The user balance will be updated.', 'Confirm', { type: 'warning' })
  } catch { return }
  actionLoading.value = id
  const res = await qe(post('/home/admin/approve-transaction', { transactionId: id }))
  actionLoading.value = ''
  if (res?.code === 0) {
    ElMessage.success('Transaction approved')
    await fetch()
  }
}

const reject = async (id) => {
  try {
    await ElMessageBox.confirm('Reject this transaction? The user will be notified.', 'Confirm', { type: 'warning' })
  } catch { return }
  actionLoading.value = id
  const res = await qe(post('/home/admin/reject-transaction', { transactionId: id }))
  actionLoading.value = ''
  if (res?.code === 0) {
    ElMessage.success('Transaction rejected')
    await fetch()
  }
}

onMounted(fetch)
</script>

<style scoped>
.admin-transactions { padding: 20px; }
.pagination-wrap { margin-top: 20px; display: flex; justify-content: center; }
@media (max-width: 768px) { .admin-transactions { padding: 12px; } }
</style>
