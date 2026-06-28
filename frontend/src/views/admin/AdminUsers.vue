<template>
  <div class="admin-users">
    <h2>Users</h2>
    <div class="g-responsive-table">
    <el-table :data="users" v-loading="loading" style="width:100%">
      <el-table-column prop="_id" label="ID" width="200" />
      <el-table-column prop="username" label="Username" />
      <el-table-column prop="email" label="Email" />
      <el-table-column prop="phone" label="Phone" />
      <el-table-column prop="role" label="Role" />
      <el-table-column label="Registered"><template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}</template></el-table-column>
    </el-table>
    </div>
    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="fetch" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, qe } from '@/api/request'

const users = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const fetch = async () => {
  loading.value = true
  const res = await qe(get(`/home/admin/users?page=${page.value}&pageSize=${pageSize.value}`))
  if (res) { users.value = res.data?.list || []; total.value = res.data?.total || 0 }
  loading.value = false
}

onMounted(fetch)
</script>

<style scoped>
.admin-users { padding: 20px; }
.pagination-wrap { margin-top: 20px; display: flex; justify-content: center; }
@media (max-width: 768px) { .admin-users { padding: 12px; } }
</style>
