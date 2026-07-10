<template>
  <div class="admin-page admin-sellers">
    <div class="page-card">
      <div class="page-header">
        <i class="iconfont icon-dianpu"></i>
        <h2>Sellers</h2>
      </div>
      <div class="toolbar">
        <el-button type="warning" size="small" @click="migrateSellerIds" :loading="migrating">
          <i class="iconfont icon-anquan"></i> Migrate Seller IDs
        </el-button>
      </div>
    <div class="g-responsive-table">
    <el-table :data="shops" v-loading="loading" style="width:100%">
      <el-table-column prop="_id" label="ID" width="200" />
      <el-table-column prop="storeNumber" label="Store #" width="100" />
      <el-table-column prop="name" label="Store Name" />
      <el-table-column label="Seller ID" width="120">
        <template #default="{row}">{{ row.userId?.sellerId || '—' }}</template>
      </el-table-column>
      <el-table-column label="Docs" width="80" align="center">
        <template #default="{row}">
          <el-tag :type="docCount(row) === 4 ? 'success' : 'warning'" size="small">
            {{ docCount(row) }}/4
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="fullName" label="Owner" />
      <el-table-column prop="email" label="Email" />
      <el-table-column label="Status" width="110">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'">
            {{ row.status === 1 ? 'Approved' : row.status === 2 ? 'Rejected' : 'Pending' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Action" width="400">
        <template #default="{row}">
          <el-button type="primary" size="small" @click="$router.push('/admin-shop-detail/' + row._id)">View</el-button>
          <el-button type="success" size="small" @click="approve(row._id)" :disabled="row.status === 1">Approve</el-button>
          <el-button type="danger" size="small" @click="reject(row._id)" :disabled="row.status === 2">Reject</el-button>
          <el-button v-if="row.status === 1 && !row.userId?.sellerId" type="warning" size="small" @click="generateSellerId(row)">Generate ID</el-button>
          <el-button v-if="row.status === 1 && row.userId?.sellerId" type="info" size="small" @click="loginAsSeller(row)">Login as Seller</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>
    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="fetchShops" />
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, post, qe } from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const shops = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const docCount = (row) => {
  let count = 0
  if (row.logo) count++
  if (row.idFrontImage) count++
  if (row.idBackImage) count++
  if (row.utilityBill) count++
  return count
}

const fetchShops = async () => {
  loading.value = true
  const res = await qe(get(`/home/admin/shops?page=${page.value}&pageSize=${pageSize.value}`))
  if (res) { shops.value = res.data?.list || []; total.value = res.data?.total || 0 }
  loading.value = false
}
const approve = async (id) => {
  const res = await qe(post('/home/admin/approve-shop', { id }))
  if (res) { ElMessage.success(res.msg); fetchShops() }
}
const reject = async (id) => {
  const res = await qe(post('/home/admin/reject-shop', { id }))
  if (res) { ElMessage.success(res.msg); fetchShops() }
}
const migrateSellerIds = async () => {
  try {
    await ElMessageBox.confirm('Assign seller IDs to all approved sellers missing them?', 'Migrate Seller IDs', { confirmButtonText: 'Migrate', cancelButtonText: 'Cancel', type: 'warning' })
  } catch { return }
  const res = await qe(post('/home/admin/migrate-seller-ids'))
  if (res) { ElMessage.success(res.msg); fetchShops() }
}
const generateSellerId = async (row) => {
  const res = await qe(post('/home/admin/generate-seller-id', { id: row._id }))
  if (res) { ElMessage.success(res.msg); fetchShops() }
}
const loginAsSeller = async (row) => {
  const res = await qe(post(`/home/admin/login-as-seller/${row.userId?._id || row.userId}`))
  if (res?.data?.token) {
    localStorage.setItem('seller_temp_token', res.data.token)
    window.open(`/mystore?temp_token=${res.data.token}`, '_blank')
  }
}

onMounted(fetchShops)
</script>

<style scoped>
.admin-sellers { padding: 20px; }
.toolbar { margin-bottom: 12px; display: flex; gap: 8px; }
.pagination-wrap { margin-top: 20px; display: flex; justify-content: center; }
@media (max-width: 768px) { .admin-sellers { padding: 12px; } }
</style>