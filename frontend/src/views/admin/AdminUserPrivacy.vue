<template>
  <div class="admin-user-privacy">
    <div class="g-flex g-flex-align-center g-gap12" style="margin-bottom:20px">
      <el-button size="small" @click="$router.push('/admin-users')">Back to Users</el-button>
      <h3 style="margin:0">User Privacy & Security</h3>
    </div>

    <div v-if="loading" v-loading="loading" style="min-height:200px" />

    <template v-else-if="user">
      <el-descriptions title="User Info" :column="2" border size="small" style="margin-bottom:24px">
        <el-descriptions-item label="Username">{{ user.username }}</el-descriptions-item>
        <el-descriptions-item label="Email">{{ user.email }}</el-descriptions-item>
        <el-descriptions-item label="Phone">{{ user.phone || '—' }}</el-descriptions-item>
        <el-descriptions-item label="Role">
          <el-tag :type="user.role === 'admin' ? 'danger' : user.role === 'seller' ? 'warning' : ''" size="small">{{ user.role }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Status">
          <el-tag :type="user.status === 1 ? 'success' : 'danger'" size="small">{{ user.status === 1 ? 'Active' : 'Disabled' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="2FA">
          <el-tag :type="user.twoFactorEnabled ? 'success' : 'info'" size="small">{{ user.twoFactorEnabled ? 'Enabled' : 'Disabled' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Registered">{{ new Date(user.createdAt).toLocaleDateString() }}</el-descriptions-item>
      </el-descriptions>

      <div class="admin-actions" style="margin-bottom:24px">
        <el-button :type="user.status === 1 ? 'danger' : 'success'" size="small" :loading="toggling" @click="toggleStatus">
          {{ user.status === 1 ? 'Disable Account' : 'Enable Account' }}
        </el-button>
      </div>

      <el-descriptions title="Privacy Settings" :column="2" border size="small" style="margin-bottom:24px" v-if="user.privacySettings">
        <el-descriptions-item label="Profile Visibility">{{ user.privacySettings.profileVisibility || 'private' }}</el-descriptions-item>
        <el-descriptions-item label="Show Email">{{ user.privacySettings.showEmail ? 'Yes' : 'No' }}</el-descriptions-item>
        <el-descriptions-item label="Show Phone">{{ user.privacySettings.showPhone ? 'Yes' : 'No' }}</el-descriptions-item>
        <el-descriptions-item label="Login Alerts">{{ user.privacySettings.loginAlerts ? 'Enabled' : 'Disabled' }}</el-descriptions-item>
        <el-descriptions-item label="Cookie Consent">{{ user.privacySettings.cookieConsent || 'Not set' }}</el-descriptions-item>
        <el-descriptions-item label="Notifications - Orders">{{ user.privacySettings.emailNotifications?.orderUpdates ? 'On' : 'Off' }}</el-descriptions-item>
        <el-descriptions-item label="Notifications - Promotions">{{ user.privacySettings.emailNotifications?.promotions ? 'On' : 'Off' }}</el-descriptions-item>
        <el-descriptions-item label="Notifications - Shipping">{{ user.privacySettings.emailNotifications?.shipping ? 'On' : 'Off' }}</el-descriptions-item>
        <el-descriptions-item label="Notifications - Payments">{{ user.privacySettings.emailNotifications?.payments ? 'On' : 'Off' }}</el-descriptions-item>
      </el-descriptions>

      <h4 style="margin-bottom:12px">Login History</h4>
      <el-table :data="loginHistory" v-loading="historyLoading" style="width:100%" size="small">
        <el-table-column label="Date" width="160">
          <template #default="{row}">{{ new Date(row.createdAt).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="method" label="Method" width="100" />
        <el-table-column prop="ip" label="IP" width="130" />
        <el-table-column prop="userAgent" label="Device" show-overflow-tooltip />
        <el-table-column label="Success" width="80">
          <template #default="{row}">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">{{ row.success ? 'Yes' : 'No' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <div v-else class="c-no-list">
      <span class="c-no-list-text">User not found</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { get, post, qe } from '@/api/request'

const route = useRoute()
const user = ref(null)
const loading = ref(true)
const toggling = ref(false)
const loginHistory = ref([])
const historyLoading = ref(false)

const toggleStatus = async () => {
  toggling.value = true
  const newStatus = user.value.status === 1 ? 0 : 1
  const res = await qe(post(`/home/admin/users/${route.params.id}/toggle-status`, { status: newStatus }))
  if (res?.data) {
    user.value.status = res.data.status
    ElMessage.success(newStatus === 1 ? 'User enabled' : 'User disabled')
  }
  toggling.value = false
}

onMounted(async () => {
  const res = await qe(get(`/home/admin/users/${route.params.id}/privacy`))
  if (res?.data) user.value = res.data
  loading.value = false

  historyLoading.value = true
  const histRes = await qe(get(`/home/admin/audit-log?userId=${route.params.id}`))
  if (histRes?.data) loginHistory.value = histRes.data.list || []
  historyLoading.value = false
})
</script>

<style scoped>
.admin-user-privacy { padding: 20px; }
</style>
