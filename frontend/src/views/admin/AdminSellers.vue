<template>
  <div class="admin-sellers">
    <h2>Sellers / Shops</h2>
    <div class="g-responsive-table">
    <el-table :data="shops" v-loading="loading" style="width:100%">
      <el-table-column prop="_id" label="ID" width="200" />
      <el-table-column prop="name" label="Store Name" />
      <el-table-column prop="fullName" label="Owner" />
      <el-table-column prop="email" label="Email" />
      <el-table-column prop="phone" label="Phone" />
      <el-table-column label="Status">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'">
            {{ row.status === 1 ? 'Approved' : row.status === 2 ? 'Rejected' : 'Pending' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Action" width="200">
        <template #default="{row}">
          <el-button type="success" size="small" @click="approve(row._id)" :disabled="row.status === 1">Approve</el-button>
          <el-button type="danger" size="small" @click="reject(row._id)" :disabled="row.status === 2">Reject</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>
    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="fetchShops" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, post, qe } from '@/api/request'
import { ElMessage } from 'element-plus'

const shops = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

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

onMounted(fetchShops)
</script>

<style scoped>
.admin-sellers { padding: 20px; }
.pagination-wrap { margin-top: 20px; display: flex; justify-content: center; }
@media (max-width: 768px) { .admin-sellers { padding: 12px; } }
</style>
