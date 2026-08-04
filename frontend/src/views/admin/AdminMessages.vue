<template>
  <div class="admin-page admin-messages">
    <div class="page-card">
      <div class="page-header">
        <i class="iconfont icon-xiaoxi"></i>
        <h2>Send Message</h2>
        <span class="subtitle">Send an internal message to users — single or bulk</span>
      </div>

      <el-tabs v-model="mode">
        <el-tab-pane label="Single User" name="single">
          <el-form label-position="top" style="max-width:640px">
            <el-form-item label="Recipient">
              <el-select
                v-model="form.userId"
                filterable
                remote
                clearable
                reserve-keyword
                :remote-method="searchUsers"
                :loading="searching"
                placeholder="Search by username, email or phone"
                style="width:100%"
              >
                <el-option v-for="u in recipientOptions" :key="u._id" :value="u._id" :label="`${u.username} (${u.email || u.phone || u.role})`" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="Bulk Message" name="bulk">
          <el-form label-position="top" style="max-width:640px">
            <el-form-item label="Send To">
              <el-radio-group v-model="bulkMode">
                <el-radio-button label="all">All Users</el-radio-button>
                <el-radio-button label="role">By Role</el-radio-button>
                <el-radio-button label="selected">Select Users</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item v-if="bulkMode === 'role'" label="Role">
              <el-select v-model="form.role" style="width:100%">
                <el-option label="Buyers (Customers)" value="buyer" />
                <el-option label="Sellers (Merchants)" value="seller" />
                <el-option label="Admin" value="admin" />
                <el-option label="Manager" value="manager" />
                <el-option label="Staff" value="staff" />
                <el-option label="Super Admin" value="super_admin" />
              </el-select>
            </el-form-item>

            <el-form-item v-if="bulkMode === 'selected'" label="Select Users">
              <el-select
                v-model="form.userIds"
                multiple
                filterable
                remote
                reserve-keyword
                :remote-method="searchUsers"
                :loading="searching"
                placeholder="Search and select users"
                style="width:100%"
              >
                <el-option v-for="u in recipientOptions" :key="u._id" :value="u._id" :label="`${u.username} (${u.email || u.phone || u.role})`" />
              </el-select>
            </el-form-item>

            <el-form-item v-if="bulkMode === 'role'" label="Recipient Preview">
              <el-button size="small" @click="previewRoleCount">
                <i class="iconfont icon-sousuo" style="margin-right:4px"></i> Preview Count
              </el-button>
              <span v-if="rolePreviewCount !== null" style="margin-left:12px;font-size:13px;color:rgba(255,255,255,0.6)">
                ~ {{ rolePreviewCount }} users will receive this message
              </span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <el-form label-position="top" style="max-width:640px">
        <el-form-item label="Message">
          <el-input v-model="form.content" type="textarea" :rows="5" maxlength="2000" show-word-limit placeholder="Type the internal message to send to the user(s)..." />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="sending" :disabled="!canSend" @click="sendMessage">
            <i class="iconfont icon-fasong" style="margin-right:6px"></i> Send Message
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-card">
      <div class="page-header">
        <i class="iconfont icon-jiaoyi"></i>
        <h2>Sent Messages</h2>
        <span class="subtitle">Recent internal messages sent from the admin panel</span>
      </div>
      <div class="g-responsive-table">
        <el-table :data="sentMessages" v-loading="historyLoading" size="small" style="width:100%">
          <el-table-column label="Sent" width="170">
            <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="Recipients" width="110">
            <template #default="{ row }">{{ row.details?.recipients || '—' }}</template>
          </el-table-column>
          <el-table-column prop="content" label="Message" min-width="260" show-overflow-tooltip />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminGet, adminPost } from '@/api/adminRequest'

const mode = ref('single')
const bulkMode = ref('all')
const form = reactive({ userId: null, role: 'buyer', userIds: [], content: '' })
const recipientOptions = ref([])
const searching = ref(false)
const sending = ref(false)
const rolePreviewCount = ref(null)

const sentMessages = ref([])
const historyLoading = ref(false)

const canSend = computed(() => {
  if (!form.content.trim()) return false
  if (mode.value === 'single') return !!form.userId
  if (bulkMode.value === 'selected') return form.userIds.length > 0
  return true
})

const searchUsers = async (query) => {
  searching.value = true
  const res = await adminGet('/home/admin/messages/recipients', { search: query || '', pageSize: 50 })
  if (res?.code === 0 && res?.data) recipientOptions.value = res.data
  searching.value = false
}

const previewRoleCount = async () => {
  const res = await adminGet('/home/admin/messages/recipients', { role: form.role, pageSize: 1 })
  if (res?.code === 0 && res?.data) {
    rolePreviewCount.value = Array.isArray(res.data) ? res.data.length : (res.data.length ?? 0)
  }
}

const sendMessage = async () => {
  sending.value = true
  rolePreviewCount.value = null
  const payload = { content: form.content.trim(), mode: mode.value === 'single' ? 'single' : bulkMode.value }
  if (payload.mode === 'single') payload.userId = form.userId
  if (payload.mode === 'role') payload.role = form.role
  if (payload.mode === 'selected') payload.userIds = form.userIds
  try {
    const res = await adminPost('/home/admin/messages/send', payload)
    if (res?.code === 0) {
      ElMessage.success(res.msg || 'Message sent')
      form.content = ''
      form.userId = null
      form.userIds = []
      loadHistory()
    } else {
      ElMessage.error(res?.msg || 'Failed to send message')
    }
  } catch (err) {
    ElMessage.error(err?.response?.data?.msg || err?.message || 'Failed to send message')
  } finally {
    sending.value = false
  }
}

const loadHistory = async () => {
  historyLoading.value = true
  const res = await adminGet('/home/admin/messages/history')
  if (res?.code === 0 && res?.data) sentMessages.value = res.data.list || []
  historyLoading.value = false
}

onMounted(() => {
  searchUsers('')
  loadHistory()
})
</script>

<style scoped>
.admin-messages { padding: 20px; }
.page-header { margin-bottom: 16px; }
</style>
