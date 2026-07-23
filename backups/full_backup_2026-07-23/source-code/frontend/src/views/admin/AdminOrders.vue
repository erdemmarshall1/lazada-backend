<template>
  <div class="admin-page admin-orders">
    <div class="page-card">
      <div class="page-header">
        <i class="iconfont icon-jiaoyi"></i>
        <h2>Orders</h2>
      </div>
      <div class="g-responsive-table">
        <el-table :data="orders" v-loading="loading" style="width:100%">
          <el-table-column prop="orderNo" label="Order No" width="200" />
          <el-table-column label="User" width="140"><template #default="{row}">{{ row.userId?.username || row.userId?.email || row.userId?._id }}</template></el-table-column>
          <el-table-column label="Shop" width="140"><template #default="{row}">{{ row.shopId?.name || row.shopId?._id }}</template></el-table-column>
          <el-table-column prop="finalAmount" label="Amount" width="100" />
          <el-table-column label="Status" width="100">
            <template #default="{row}">
              <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="paymentMethod" label="Payment" width="100" />
          <el-table-column label="Date" width="120"><template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}</template></el-table-column>
        </el-table>
      </div>
      <div class="pagination-wrap" v-if="total > 0">
        <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="fetch" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, qe } from '@/api/request'

const orders = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const statusLabel = (s) => ['Pending', 'Paid', 'Shipped', 'Delivered', 'Completed', 'Cancelled', 'Refunded'][s] || 'Unknown'
const statusType = (s) => ['warning', 'primary', 'info', '', 'success', 'danger', 'danger'][s] || 'info'

const fetch = async () => {
  loading.value = true
  const res = await qe(get(`/home/admin/orders?page=${page.value}&pageSize=${pageSize.value}`))
  if (res) { orders.value = res.data?.list || []; total.value = res.data?.total || 0 }
  loading.value = false
}

onMounted(fetch)
</script>

<style scoped>
.admin-orders { padding: 20px; }
.pagination-wrap { margin-top: 20px; display: flex; justify-content: center; }
@media (max-width: 768px) { .admin-orders { padding: 12px; } }
</style>
