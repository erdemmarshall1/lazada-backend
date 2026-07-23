<template>
  <div class="privacy-settings">
    <h3 class="page-title">{{ $t('user.privacy.title') }}</h3>
    <el-tabs v-model="activeTab" class="privacy-tabs">
      <el-tab-pane :label="$t('user.privacy.securityTab')" name="security">
        <div class="tab-section">
          <h4>{{ $t('user.privacy.password') }}</h4>
          <p class="tab-desc">{{ $t('user.privacy.passwordDesc') }}</p>
          <el-button @click="$router.push('/changepassword')">{{ $t('user.privacy.updatePassword') }}</el-button>
        </div>
        <div class="tab-section">
          <h4>{{ $t('user.privacy.twoFactor') }}</h4>
          <p class="tab-desc">{{ $t('user.privacy.twoFactorDesc') }}</p>
          <div class="status-row">
            <el-tag :type="twoFactorEnabled ? 'success' : 'info'" size="small">
              {{ twoFactorEnabled ? $t('user.privacy.enabledStatus') : $t('user.privacy.disabledStatus') }}
            </el-tag>
            <el-button size="small" @click="$router.push('/2fa')">
              {{ twoFactorEnabled ? $t('user.privacy.manage') : $t('user.privacy.enable') }}
            </el-button>
          </div>
        </div>
        <div class="tab-section">
          <h4>{{ $t('user.privacy.loginAlerts') }}</h4>
          <p class="tab-desc">{{ $t('user.privacy.loginAlertsDesc') }}</p>
          <el-switch v-model="loginAlerts" @change="saveSettings" />
        </div>
        <div class="tab-section">
          <h4>{{ $t('user.privacy.activeSessions') }}</h4>
          <p class="tab-desc">{{ $t('user.privacy.activeSessionsDesc') }}</p>
          <el-button size="small" @click="logoutAll">{{ $t('user.privacy.logoutAllSessions') }}</el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="$t('user.privacy.notificationsTab')" name="notifications">
        <p class="tab-intro">{{ $t('user.privacy.notificationsDesc') }}</p>
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

      <el-tab-pane :label="$t('user.privacy.privacyTab')" name="privacy">
        <div class="tab-section">
          <h4>{{ $t('user.privacy.profileVisibility') }}</h4>
          <p class="tab-desc">{{ $t('user.privacy.profileVisibilityDesc') }}</p>
          <el-radio-group v-model="profileVisibility" @change="saveSettings" class="vis-group">
            <el-radio value="private">{{ $t('user.privacy.private') }}</el-radio>
            <el-radio value="members_only">{{ $t('user.privacy.membersOnly') }}</el-radio>
            <el-radio value="public">{{ $t('user.privacy.public') }}</el-radio>
          </el-radio-group>
        </div>
        <div class="tab-section">
          <h4>{{ $t('user.privacy.profileFields') }}</h4>
          <p class="tab-desc">{{ $t('user.privacy.profileFieldsDesc') }}</p>
          <div class="toggle-row">
            <span>{{ $t('user.privacy.showEmail') }}</span>
            <el-switch v-model="showEmail" @change="saveSettings" />
          </div>
          <div class="toggle-row">
            <span>{{ $t('user.privacy.showPhone') }}</span>
            <el-switch v-model="showPhone" @change="saveSettings" />
          </div>
        </div>
        <div class="tab-section">
          <h4>{{ $t('user.privacy.cookieConsent') }}</h4>
          <p class="tab-desc">{{ $t('user.privacy.cookieConsentDesc') }}</p>
          <div class="status-row">
            <el-tag :type="cookieConsent === 'accepted' ? 'success' : cookieConsent === 'rejected' ? 'danger' : 'info'" size="small">
              {{ cookieConsent === 'accepted' ? $t('user.privacy.accepted') : cookieConsent === 'rejected' ? $t('user.privacy.rejected') : $t('user.privacy.notSet') }}
            </el-tag>
            <el-button size="small" v-if="cookieConsent !== 'accepted'" @click="cookieConsent = 'accepted'; saveSettings()">{{ $t('user.privacy.accept') }}</el-button>
            <el-button size="small" v-if="cookieConsent !== 'rejected'" @click="cookieConsent = 'rejected'; saveSettings()">{{ $t('user.privacy.reject') }}</el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="$t('user.privacy.loginHistoryTab')" name="sessions">
        <p class="tab-intro">{{ $t('user.privacy.loginHistoryDesc') }}</p>
        <el-table :data="loginHistory" v-loading="historyLoading" style="width:100%" size="small">
          <el-table-column :label="$t('user.privacy.dateLabel')" width="160">
            <template #default="{row}">{{ new Date(row.createdAt).toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="method" :label="$t('user.privacy.methodLabel')" width="110">
            <template #default="{row}">
              <el-tag :type="row.method === 'password' ? '' : row.method === '2fa' ? 'success' : row.method === 'backup_code' ? 'warning' : 'info'" size="small">
                {{ row.method }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="ip" :label="$t('user.privacy.ipLabel')" width="140" />
          <el-table-column prop="location" :label="$t('user.privacy.locationLabel')" />
          <el-table-column prop="userAgent" :label="$t('user.privacy.deviceLabel')" show-overflow-tooltip />
        </el-table>
        <div class="pagination-wrap" v-if="historyTotal > 0">
          <el-pagination background layout="prev, pager, next" :total="historyTotal" :page-size="20" v-model:current-page="historyPage" @current-change="fetchHistory" small />
        </div>
      </el-tab-pane>

      <el-tab-pane :label="$t('user.privacy.accountTab')" name="account">
        <div class="tab-section">
          <h4>{{ $t('user.privacy.downloadData') }}</h4>
          <p class="tab-desc">{{ $t('user.privacy.downloadDataDesc') }}</p>
          <el-button :loading="exportLoading" @click="exportData">{{ $t('user.privacy.downloadDataButton') }}</el-button>
        </div>
        <div class="tab-section tab-section--danger">
          <h4>{{ $t('user.privacy.deleteAccount') }}</h4>
          <p class="tab-desc">{{ $t('user.privacy.deleteAccountDesc') }}</p>
          <el-button type="danger" :loading="deleteLoading" @click="confirmDelete">{{ $t('user.privacy.deleteAccountButton') }}</el-button>
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
