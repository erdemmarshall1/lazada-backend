<template>
  <div class="admin-transactions">
    <h2>All Transactions</h2>
    <div class="g-responsive-table">
    <el-table :data="list" v-loading="loading" style="width:100%">
      <el-table-column prop="_id" label="ID" width="200" />
      <el-table-column prop="userId.username" label="User" />
      <el-table-column prop="type" label="Type" />
      <el-table-column prop="amount" label="Amount" />
      <el-table-column prop="paymentMethod" label="Method" />
      <el-table-column label="Status">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'">
            {{ row.status === 1 ? 'Approved' : row.status === 2 ? 'Rejected' : 'Pending' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Date"><template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}</template></el-table-column>
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

const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const fetch = async () => {
  loading.value = true
  const res = await qe(get(`/home/admin/transactions?page=${page.value}&pageSize=${pageSize.value}`))
  if (res) { list.value = res.data?.list || []; total.value = res.data?.total || 0 }
  loading.value = false
}

onMounted(fetch)
</script>

<style scoped>
.admin-transactions { padding: 20px; }
.pagination-wrap { margin-top: 20px; display: flex; justify-content: center; }
@media (max-width: 768px) { .admin-transactions { padding: 12px; } }
</style>
