<template>
  <div class="admin-page user-detail" v-loading="loading">
    <h3>User Detail</h3>
    <div v-if="user" class="user-card">
      <div class="user-info">
        <div class="avatar-wrap" v-if="user.avatar">
          <img :src="$imgUrl(user.avatar)" @error="$imgFallback" />
        </div>
        <div class="fields">
          <p><strong>Username:</strong> {{ user.username }}</p>
          <p><strong>Full Name:</strong> {{ user.fullName || '-' }}</p>
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p><strong>Phone:</strong> {{ user.phone || '-' }}</p>
          <p><strong>Role:</strong> <el-tag size="small">{{ user.role }}</el-tag></p>
          <p><strong>Status:</strong> <el-tag :type="user.status === 1 ? 'success' : 'danger'" size="small">{{ user.status === 1 ? 'Active' : 'Disabled' }}</el-tag></p>
          <p><strong>Gender:</strong> {{ user.gender || '-' }}</p>
          <p><strong>Date of Birth:</strong> {{ user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '-' }}</p>
          <p><strong>Country:</strong> {{ user.country || '-' }}</p>
          <p><strong>City:</strong> {{ user.city || '-' }}</p>
          <p><strong>Postal Code:</strong> {{ user.postalCode || '-' }}</p>
          <p><strong>Bio:</strong> {{ user.bio || '-' }}</p>
          <p><strong>Registered:</strong> {{ new Date(user.createdAt).toLocaleDateString() }}</p>
          <p><strong>Last Login:</strong> {{ user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-' }}</p>
          <p><strong>Wallet Balance:</strong> ${{ user.walletBalance?.toFixed(2) || '0.00' }}</p>
          <p><strong>Orders:</strong> {{ user.orderCount || 0 }}</p>
          <p><strong>Inquiries:</strong> {{ user.submissionCount || 0 }}</p>
        </div>
      </div>
    </div>
    <el-tabs v-model="activeTab" style="margin-top:20px">
      <el-tab-pane label="Orders" name="orders">
        <el-table :data="orders" v-loading="ordersLoading" size="small" style="width:100%">
          <el-table-column label="ID" prop="_id" width="200" show-overflow-tooltip />
          <el-table-column label="Total" width="100">
            <template #default="{row}">${{ row.totalAmount?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="Status" width="100">
            <template #default="{row}"><el-tag size="small">{{ row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column label="Date" width="120">
            <template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}</template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrap" v-if="orderTotal > 0">
          <el-pagination background layout="prev, pager, next" :total="orderTotal" :page-size="20" v-model:current-page="orderPage" @current-change="fetchOrders" small />
        </div>
      </el-tab-pane>
      <el-tab-pane label="Inquiries" name="inquiries">
        <el-table :data="submissions" v-loading="subsLoading" size="small" style="width:100%">
          <el-table-column label="Date" width="120">
            <template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}</template>
          </el-table-column>
          <el-table-column prop="subject" label="Subject" min-width="180" show-overflow-tooltip />
          <el-table-column label="Category" width="100">
            <template #default="{row}"><el-tag size="small">{{ row.category }}</el-tag></template>
          </el-table-column>
          <el-table-column label="Status" width="90">
            <template #default="{row}">
              <el-tag :type="{ new: 'info', read: 'primary', replied: 'success', closed: 'warning' }[row.status] || 'info'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrap" v-if="subTotal > 0">
          <el-pagination background layout="prev, pager, next" :total="subTotal" :page-size="20" v-model:current-page="subPage" @current-change="fetchSubmissions" small />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { get } from '@/api/request'

const route = useRoute()
const userId = route.params.id
const loading = ref(false)
const user = ref(null)
const activeTab = ref('orders')

const orders = ref([])
const ordersLoading = ref(false)
const orderPage = ref(1)
const orderTotal = ref(0)

const submissions = ref([])
const subsLoading = ref(false)
const subPage = ref(1)
const subTotal = ref(0)

const fetchUser = async () => {
  loading.value = true
  try {
    const res = await get(`/home/admin/users/${userId}/detail`)
    if (res?.code === 0) user.value = res.data
  } catch {} finally { loading.value = false }
}

const fetchOrders = async () => {
  ordersLoading.value = true
  try {
    const res = await get(`/home/admin/users/${userId}/orders?page=${orderPage.value}&pageSize=20`)
    if (res?.code === 0) {
      orders.value = res.data.list || []
      orderTotal.value = res.data.total || 0
    }
  } catch {} finally { ordersLoading.value = false }
}

const fetchSubmissions = async () => {
  subsLoading.value = true
  try {
    const res = await get(`/home/admin/users/${userId}/submissions?page=${subPage.value}&pageSize=20`)
    if (res?.code === 0) {
      submissions.value = res.data.list || []
      subTotal.value = res.data.total || 0
    }
  } catch {} finally { subsLoading.value = false }
}

onMounted(() => { fetchUser(); fetchOrders(); fetchSubmissions() })
</script>

<style scoped>
.user-card { background: #f9f9f9; padding: 20px; border-radius: 8px; }
.user-info { display: flex; gap: 24px; }
.avatar-wrap { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
.avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }
.fields { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
.fields p { font-size: 14px; margin: 0; }
.pagination-wrap { margin-top: 12px; display: flex; justify-content: center; }
</style>