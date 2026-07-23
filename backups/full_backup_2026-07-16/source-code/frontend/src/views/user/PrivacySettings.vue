<template>
  <div class="privacy-settings">
    <h3 class="page-title">Privacy & Security</h3>
    <el-tabs v-model="activeTab" class="privacy-tabs">
      <el-tab-pane label="Security" name="security">
        <div class="tab-section">
          <h4>Password</h4>
          <p class="tab-desc">Change your account password</p>
          <el-button @click="$router.push('/changepassword')">Update Password</el-button>
        </div>
        <div class="tab-section">
          <h4>Two-Factor Authentication</h4>
          <p class="tab-desc">Add an extra layer of security to your account</p>
          <div class="status-row">
            <el-tag :type="twoFactorEnabled ? 'success' : 'info'" size="small">
              {{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}
            </el-tag>
            <el-button size="small" @click="$router.push('/2fa')">
              {{ twoFactorEnabled ? 'Manage' : 'Enable' }}
            </el-button>
          </div>
        </div>
        <div class="tab-section">
          <h4>Login Alerts</h4>
          <p class="tab-desc">Get notified when a new device logs into your account</p>
          <el-switch v-model="loginAlerts" @change="saveSettings" />
        </div>
        <div class="tab-section">
          <h4>Active Sessions</h4>
          <p class="tab-desc">View and manage your active login sessions</p>
          <el-button size="small" @click="logoutAll">Log Out All Sessions</el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Notifications" name="notifications">
        <p class="tab-intro">Choose which email notifications you receive</p>
        <div class="notif-list">
          <div class="notif-item" v-for="notif in notificationOptions" :key="notif.key">
            <div class="notif-info">
              <span class="notif-label">{{ notif.label }}</span>
              <span class="notif-desc">{{ notif.desc }}</span>
            </div>
            <el-switch v-model="notifPrefs[notif.key]" @change="saveNotifPrefs" />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Privacy" name="privacy">
        <div class="tab-section">
          <h4>Profile Visibility</h4>
          <p class="tab-desc">Control who can see your profile information</p>
          <el-radio-group v-model="profileVisibility" @change="saveSettings" class="vis-group">
            <el-radio value="private">Private — Only me</el-radio>
            <el-radio value="members_only">Members Only — Logged-in users</el-radio>
            <el-radio value="public">Public — Anyone</el-radio>
          </el-radio-group>
        </div>
        <div class="tab-section">
          <h4>Profile Fields</h4>
          <p class="tab-desc">Choose which contact details are visible on your profile</p>
          <div class="toggle-row">
            <span>Show email on profile</span>
            <el-switch v-model="showEmail" @change="saveSettings" />
          </div>
          <div class="toggle-row">
            <span>Show phone on profile</span>
            <el-switch v-model="showPhone" @change="saveSettings" />
          </div>
        </div>
        <div class="tab-section">
          <h4>Cookie Consent</h4>
          <p class="tab-desc">Manage your cookie preferences</p>
          <div class="status-row">
            <el-tag :type="cookieConsent === 'accepted' ? 'success' : cookieConsent === 'rejected' ? 'danger' : 'info'" size="small">
              {{ cookieConsent === 'accepted' ? 'Accepted' : cookieConsent === 'rejected' ? 'Rejected' : 'Not Set' }}
            </el-tag>
            <el-button size="small" v-if="cookieConsent !== 'accepted'" @click="cookieConsent = 'accepted'; saveSettings()">Accept</el-button>
            <el-button size="small" v-if="cookieConsent !== 'rejected'" @click="cookieConsent = 'rejected'; saveSettings()">Reject</el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Login History" name="sessions">
        <p class="tab-intro">Review recent login activity on your account</p>
        <el-table :data="loginHistory" v-loading="historyLoading" style="width:100%" size="small">
          <el-table-column label="Date" width="160">
            <template #default="{row}">{{ new Date(row.createdAt).toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="method" label="Method" width="110">
            <template #default="{row}">
              <el-tag :type="row.method === 'password' ? '' : row.method === '2fa' ? 'success' : row.method === 'backup_code' ? 'warning' : 'info'" size="small">
                {{ row.method }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="ip" label="IP Address" width="140" />
          <el-table-column prop="location" label="Location" />
          <el-table-column prop="userAgent" label="Device" show-overflow-tooltip />
        </el-table>
        <div class="pagination-wrap" v-if="historyTotal > 0">
          <el-pagination background layout="prev, pager, next" :total="historyTotal" :page-size="20" v-model:current-page="historyPage" @current-change="fetchHistory" small />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Account" name="account">
        <div class="tab-section">
          <h4>Download My Data</h4>
          <p class="tab-desc">Export all your account data including orders, transactions, and profile information</p>
          <el-button :loading="exportLoading" @click="exportData">Download Data</el-button>
        </div>
        <div class="tab-section tab-section--danger">
          <h4>Delete Account</h4>
          <p class="tab-desc">Permanently deactivate your account and anonymize your data. This cannot be undone.</p>
          <el-button type="danger" :loading="deleteLoading" @click="confirmDelete">Delete My Account</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, post, qe } from '@/api/request'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const store = useAppStore()

const activeTab = ref('security')
const twoFactorEnabled = ref(false)
const loginAlerts = ref(true)
const profileVisibility = ref('private')
const showEmail = ref(false)
const showPhone = ref(false)
const cookieConsent = ref(null)

const notifPrefs = reactive({
  orderUpdates: true,
  promotions: true,
  shipping: true,
  payments: true,
})

const notificationOptions = [
  { key: 'orderUpdates', label: 'Order Updates', desc: 'Order confirmation, status changes' },
  { key: 'promotions', label: 'Promotions & Offers', desc: 'Sales, new arrivals, exclusive deals' },
  { key: 'shipping', label: 'Shipping Alerts', desc: 'Tracking updates, delivery notifications' },
  { key: 'payments', label: 'Payment Confirmations', desc: 'Payment receipts, refund notifications' },
]

const loginHistory = ref([])
const historyLoading = ref(false)
const historyPage = ref(1)
const historyTotal = ref(0)

const exportLoading = ref(false)
const deleteLoading = ref(false)

const saveSettings = async () => {
  const res = await qe(post('/home/user/privacy-settings', {
    loginAlerts: loginAlerts.value,
    profileVisibility: profileVisibility.value,
    showEmail: showEmail.value,
    showPhone: showPhone.value,
    cookieConsent: cookieConsent.value,
  }))
  if (res) ElMessage.success('Settings saved')
}

const saveNotifPrefs = async () => {
  const res = await qe(post('/home/user/notification-preferences', {
    orderUpdates: notifPrefs.orderUpdates,
    promotions: notifPrefs.promotions,
    shipping: notifPrefs.shipping,
    payments: notifPrefs.payments,
  }))
  if (res) ElMessage.success('Notification preferences saved')
}

const fetchHistory = async () => {
  historyLoading.value = true
  const res = await qe(get(`/home/user/login-history?page=${historyPage.value}&pageSize=20`))
  if (res?.data) {
    loginHistory.value = res.data.list || []
    historyTotal.value = res.data.total || 0
  }
  historyLoading.value = false
}

const exportData = async () => {
  exportLoading.value = true
  try {
    const res = await get('/home/user/export-data')
    if (res?.data) {
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `theoutnet-account-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      ElMessage.success('Data exported successfully')
    } else {
      ElMessage.error(res?.msg || 'Export failed')
    }
  } catch (err) {
    ElMessage.error('Export failed')
  } finally {
    exportLoading.value = false
  }
}

const confirmDelete = async () => {
  try {
    await ElMessageBox.prompt(
      'This will permanently deactivate your account and anonymize all your personal data. Enter your password to confirm.',
      'Delete Account',
      { confirmButtonText: 'Delete', cancelButtonText: 'Cancel', inputType: 'password', inputPlaceholder: 'Enter your password', inputValidator: (v) => v ? true : 'Password is required' }
    )
    const { value: password } = await ElMessageBox.prompt(
      'This will permanently deactivate your account and anonymize all your personal data. Enter your password to confirm.',
      'Delete Account',
      { confirmButtonText: 'Delete', cancelButtonText: 'Cancel', inputType: 'password', inputPlaceholder: 'Enter your password' }
    )
    deleteLoading.value = true
    const res = await post('/home/user/delete-account', { password })
    if (res?.code === 0 || res?.data) {
      ElMessage.success('Account deactivated')
      store.logout()
      router.push('/login')
    } else {
      ElMessage.error(res?.msg || 'Failed to delete account')
    }
  } catch {
    // user cancelled
  } finally {
    deleteLoading.value = false
  }
}

const logoutAll = async () => {
  try {
    await ElMessageBox.confirm('This will log you out of all devices. Continue?', 'Log Out All Sessions', { confirmButtonText: 'Yes', cancelButtonText: 'Cancel', type: 'warning' })
    const res = await post('/home/user/logout-all')
    if (res?.code === 0 || res?.data) {
      ElMessage.success('Logged out of all sessions')
      store.logout()
      router.push('/login')
    }
  } catch {
    // cancelled
  }
}

onMounted(async () => {
  const res = await qe(get('/home/user/privacy-settings'))
  if (res?.data) {
    twoFactorEnabled.value = !!res.data.twoFactorEnabled
    loginAlerts.value = res.data.loginAlerts ?? true
    profileVisibility.value = res.data.profileVisibility || 'private'
    showEmail.value = !!res.data.showEmail
    showPhone.value = !!res.data.showPhone
    cookieConsent.value = res.data.cookieConsent ?? null
    if (res.data.emailNotifications) {
      Object.keys(notifPrefs).forEach(k => {
        if (res.data.emailNotifications[k] !== undefined) {
          notifPrefs[k] = res.data.emailNotifications[k]
        }
      })
    }
  }
  fetchHistory()
})
</script>

<style scoped>
.privacy-settings { max-width: 800px; }
.page-title { font-size: 18px; font-weight: 600; margin-bottom: 24px; }
.privacy-tabs { min-height: 400px; }
.tab-section { padding: 16px 0; border-bottom: 1px solid #e8e6e2; }
.tab-section:last-child { border-bottom: none; }
.tab-section--danger { background: #fff5f5; margin: 0 -16px; padding: 16px; border-radius: 8px; }
.tab-section h4 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.tab-desc { font-size: 13px; color: #666; margin-bottom: 12px; }
.tab-intro { font-size: 13px; color: #666; margin-bottom: 16px; }
.status-row { display: flex; align-items: center; gap: 12px; }
.notif-list { display: flex; flex-direction: column; gap: 4px; }
.notif-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f4f2ee; }
.notif-info { display: flex; flex-direction: column; }
.notif-label { font-size: 14px; font-weight: 500; }
.notif-desc { font-size: 12px; color: #888; }
.vis-group { display: flex; flex-direction: column; gap: 8px; }
.toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; font-size: 14px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: center; }
</style>
