<template>
  <div class="admin-reviews">
    <div class="admin-cms-header">
      <h2>Review Moderation</h2>
      <div>
        <el-select v-model="filterStatus" style="width:140px;margin-right:8px" @change="loadData">
          <el-option label="All" value="" />
          <el-option label="Approved" value="approved" />
          <el-option label="Pending" value="pending" />
          <el-option label="Rejected" value="rejected" />
          <el-option label="Spam" value="spam" />
        </el-select>
        <el-button @click="loadData" type="primary">Refresh</el-button>
      </div>
    </div>

    <el-table :data="reviews" stripe v-loading="loading" style="width:100%">
      <el-table-column label="User" width="120">
        <template #default="{ row }">{{ row.userId?.username || row.userId }}</template>
      </el-table-column>
      <el-table-column label="Product" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.productId?.name || row.productId }}</template>
      </el-table-column>
      <el-table-column label="Rating" width="80">
        <template #default="{ row }"><el-rate :model-value="row.rating" disabled size="small" /></template>
      </el-table-column>
      <el-table-column label="Content" min-width="250" show-overflow-tooltip>
        <template #default="{ row }">{{ row.content || '(no text)' }}</template>
      </el-table-column>
      <el-table-column label="Status" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Date" width="90">
        <template #default="{ row }">{{ (row.createdAt || '').slice(0, 10) }}</template>
      </el-table-column>
      <el-table-column label="Actions" width="280" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="success" :disabled="row.status === 'approved'" @click="moderate(row, 'approved')">Approve</el-button>
          <el-button size="small" type="warning" :disabled="row.status === 'pending'" @click="moderate(row, 'pending')">Pending</el-button>
          <el-button size="small" type="danger" :disabled="row.status === 'rejected'" @click="moderate(row, 'rejected')">Reject</el-button>
          <el-button size="small" type="info" :disabled="row.status === 'spam'" @click="moderate(row, 'spam')">Spam</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="g-flex-center g-mgt-16" v-if="total > pageSize">
      <el-pagination layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="loadData" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, put } from '@/api/request'
import { ElMessage } from 'element-plus'

const reviews = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const filterStatus = ref('')

const statusTagType = (s) => {
  const map = { approved: 'success', pending: 'warning', rejected: 'danger', spam: 'info' }
  return map[s] || 'info'
}

const loadData = async () => {
  loading.value = true
  const params = { page: page.value, pageSize }
  if (filterStatus.value) params.status = filterStatus.value
  const res = await get('/home/goodsReviews/admin/list', params)
  loading.value = false
  if (res?.code === 0 && res?.data) {
    reviews.value = res.data.list || []
    total.value = res.data.total || 0
  }
}

const moderate = async (row, status) => {
  const res = await put(`/home/goodsReviews/admin/${row._id}/moderate`, { status })
  if (res?.code === 0) {
    ElMessage.success(`Review ${status}`)
    loadData()
  } else {
    ElMessage.error(res?.msg || 'Failed')
  }
}

onMounted(loadData)
</script>

<style scoped>
.admin-reviews { padding: 20px; }
.admin-cms-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.admin-cms-header h2 { margin: 0; font-size: 20px; }
</style>