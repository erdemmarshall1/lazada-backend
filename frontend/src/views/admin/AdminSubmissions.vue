<template>
  <div class="admin-page">
    <h3>Inquiries & Submissions</h3>
    <div class="filters">
      <el-select v-model="filterStatus" placeholder="Status" clearable style="width:120px" @change="fetchList">
        <el-option label="New" value="new" />
        <el-option label="Read" value="read" />
        <el-option label="Replied" value="replied" />
        <el-option label="Closed" value="closed" />
      </el-select>
      <el-select v-model="filterCategory" placeholder="Category" clearable style="width:140px" @change="fetchList">
        <el-option label="General" value="general" />
        <el-option label="Order" value="order" />
        <el-option label="Product" value="product" />
        <el-option label="Shipping" value="shipping" />
        <el-option label="Refund" value="refund" />
        <el-option label="Partnership" value="partnership" />
        <el-option label="Press" value="press" />
        <el-option label="Other" value="other" />
      </el-select>
      <el-input v-model="search" placeholder="Search name/email/subject" clearable style="width:240px" @clear="fetchList" @keyup.enter="fetchList" />
      <el-button @click="fetchList" type="primary" size="default">Filter</el-button>
    </div>
    <el-table :data="list" v-loading="loading" style="width:100%;margin-top:12px" size="small" @row-click="openDetail">
      <el-table-column label="Date" width="120">
        <template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}</template>
      </el-table-column>
      <el-table-column label="Name" width="130" prop="name" />
      <el-table-column label="Email" width="180" prop="email" show-overflow-tooltip />
      <el-table-column label="Subject" min-width="180" prop="subject" show-overflow-tooltip />
      <el-table-column label="Category" width="100">
        <template #default="{row}"><el-tag size="small">{{ row.category }}</el-tag></template>
      </el-table-column>
      <el-table-column label="Status" width="90">
        <template #default="{row}">
          <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="fetchList" small />
    </div>
    <el-dialog v-model="dialogVisible" title="Inquiry Detail" width="600px">
      <div v-if="view" class="detail-wrap">
        <div class="detail-section">
          <p><strong>From:</strong> {{ view.name }} ({{ view.email }})</p>
          <p v-if="view.phone"><strong>Phone:</strong> {{ view.phone }}</p>
          <p v-if="view.userId"><strong>User:</strong> {{ view.userId?.username || view.userId?.email }} ({{ view.userId?.role }})</p>
          <p><strong>Subject:</strong> {{ view.subject }}</p>
          <p><strong>Category:</strong> {{ view.category }}</p>
          <p><strong>Date:</strong> {{ new Date(view.createdAt).toLocaleString() }}</p>
          <p><strong>Status:</strong> <el-tag :type="statusType(view.status)" size="small">{{ view.status }}</el-tag></p>
        </div>
        <el-divider />
        <div class="detail-section">
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap;background:#f9f9f9;padding:12px;border-radius:4px">{{ view.message }}</p>
        </div>
        <div class="detail-section">
          <p><strong>Admin Notes / Reply:</strong></p>
          <el-input v-model="notes" type="textarea" :rows="4" placeholder="Enter admin response or internal notes..." />
        </div>
        <div class="detail-actions">
          <el-select v-model="newStatus" placeholder="Change status" style="width:140px">
            <el-option label="Mark as Read" value="read" />
            <el-option label="Mark as Replied" value="replied" />
            <el-option label="Close" value="closed" />
          </el-select>
          <el-button type="primary" :loading="saving" @click="saveChanges">Save</el-button>
          <el-button type="danger" plain :loading="deleting" @click="handleDelete">Delete</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, put, del } from '@/api/request'

const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const statusFilter = ref('')
const categoryFilter = ref('')
const search = ref('')
const dialogVisible = ref(false)
const view = ref(null)
const notes = ref('')
const newStatus = ref('read')
const saving = ref(false)
const deleting = ref(false)

const statusType = (s) => ({ new: 'info', read: 'primary', replied: 'success', closed: 'warning' })[s] || 'info'

const fetchList = async () => {
  loading.value = true
  try {
    let url = `/home/admin/submissions?page=${page.value}&pageSize=${pageSize}`
    if (statusFilter.value) url += `&status=${statusFilter.value}`
    if (categoryFilter.value) url += `&category=${categoryFilter.value}`
    if (search.value) url += `&search=${encodeURIComponent(search.value)}`
    const res = await get(url)
    if (res?.code === 0 && res?.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch {} finally { loading.value = false }
}

const openDetail = async (row) => {
  try {
    const res = await get(`/home/admin/submissions/${row._id}`)
    if (res?.code === 0 && res?.data) {
      view.value = res.data
      notes.value = res.data.adminNotes || ''
      newStatus.value = res.data.status === 'closed' ? 'closed' : 'replied'
      dialogVisible.value = true
    }
  } catch {}
}

const saveChanges = async () => {
  saving.value = true
  try {
    const statusRes = await put(`/home/admin/submissions/${view.value._id}/status`, { status: newStatus.value })
    const notesRes = await put(`/home/admin/submissions/${view.value._id}/notes`, { adminNotes: notes.value })
    if (statusRes?.code === 0 && notesRes?.code === 0) {
      ElMessage.success('Updated')
      dialogVisible.value = false
      fetchList()
    } else {
      ElMessage.error(statusRes?.msg || notesRes?.msg || 'Save failed')
    }
  } catch {} finally { saving.value = false }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('Delete this inquiry permanently?', 'Confirm', { type: 'warning' })
    deleting.value = true
    const res = await del(`/home/admin/submissions/${view.value._id}`)
    if (res?.code === 0) {
      ElMessage.success('Deleted')
      dialogVisible.value = false
      fetchList()
    } else { ElMessage.error(res?.msg || 'Delete failed') }
  } catch {} finally { deleting.value = false }
}

onMounted(fetchList)
</script>

<style scoped>
.filters { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: center; }
.detail-wrap { max-height: 60vh; overflow-y: auto; }
.detail-section { margin-bottom: 12px; }
.detail-actions { display: flex; gap: 8px; margin-top: 16px; }
</style>