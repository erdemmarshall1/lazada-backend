<template>
  <div class="admin-page admin-sessions">
    <h2>Sessions & Audit Logs</h2>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="Active Sessions" name="sessions">
        <div class="g-responsive-table">
          <el-table :data="sessions" stripe v-loading="sessLoading">
            <el-table-column label="User" width="140">
              <template #default="{row}">{{ row.userId?.username || row.userId }}</template>
            </el-table-column>
            <el-table-column label="Device" min-width="200" show-overflow-tooltip>
              <template #default="{row}">{{ row.device || 'N/A' }}</template>
            </el-table-column>
            <el-table-column prop="ip" label="IP" width="130" />
            <el-table-column label="Last Activity" width="160">
              <template #default="{row}">{{ new Date(row.lastActivity).toLocaleString() }}</template>
            </el-table-column>
            <el-table-column label="Since" width="140">
              <template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}</template>
            </el-table-column>
            <el-table-column label="Actions" width="100">
              <template #default="{row}">
                <el-button size="small" type="danger" @click="revokeSession(row)">Revoke</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="g-flex-center g-mgt-16" v-if="sessTotal > sessPageSize">
            <el-pagination layout="prev, pager, next" :total="sessTotal" :page-size="sessPageSize" v-model:current-page="sessPage" @current-change="loadSessions" />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Audit Log" name="audit">
        <div class="report-filters">
          <el-input v-model="auditFilterAction" placeholder="Filter action..." style="width:160px" clearable @clear="loadAudit" @keyup.enter="loadAudit" />
          <el-date-picker v-model="auditDateRange" type="daterange" range-separator="to" start-placeholder="Start" end-placeholder="End" value-format="YYYY-MM-DD" style="width:240px;margin-left:8px" />
          <el-button type="primary" @click="loadAudit" style="margin-left:8px">Filter</el-button>
        </div>
        <div class="g-responsive-table">
          <el-table :data="auditLogs" stripe v-loading="auditLoading" max-height="600">
            <el-table-column label="User" width="130">
              <template #default="{row}">{{ row.userId?.username || row.userId }}</template>
            </el-table-column>
            <el-table-column prop="action" label="Action" width="160" />
            <el-table-column prop="resource" label="Resource" width="120" />
            <el-table-column label="Resource ID" width="160" show-overflow-tooltip>
              <template #default="{row}">{{ row.resourceId || '-' }}</template>
            </el-table-column>
            <el-table-column label="Details" min-width="200" show-overflow-tooltip>
              <template #default="{row}">{{ JSON.stringify(row.details) }}</template>
            </el-table-column>
            <el-table-column prop="ip" label="IP" width="120" />
            <el-table-column label="Date" width="150">
              <template #default="{row}">{{ new Date(row.createdAt).toLocaleString() }}</template>
            </el-table-column>
          </el-table>
          <div class="g-flex-center g-mgt-16" v-if="auditTotal > auditPageSize">
            <el-pagination layout="prev, pager, next" :total="auditTotal" :page-size="auditPageSize" v-model:current-page="auditPage" @current-change="loadAudit" />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('sessions')

const sessions = ref([])
const sessLoading = ref(false)
const sessPage = ref(1)
const sessPageSize = 20
const sessTotal = ref(0)

const auditLogs = ref([])
const auditLoading = ref(false)
const auditPage = ref(1)
const auditPageSize = 50
const auditTotal = ref(0)
const auditFilterAction = ref('')
const auditDateRange = ref(null)

const loadSessions = async () => {
  sessLoading.value = true
  const res = await get('/home/session/admin/sessions', { page: sessPage.value, pageSize: sessPageSize })
  if (res?.code === 0 && res?.data) {
    sessions.value = res.data.list || []
    sessTotal.value = res.data.total || 0
  }
  sessLoading.value = false
}

const revokeSession = async (row) => {
  try {
    await ElMessageBox.confirm(`Revoke this session for ${row.userId?.username || 'user'}?`, 'Confirm', { type: 'warning' })
    const res = await post(`/home/session/admin/sessions/${row._id}/revoke`)
    if (res?.code === 0) { ElMessage.success('Session revoked'); loadSessions() }
  } catch {}
}

const loadAudit = async () => {
  auditLoading.value = true
  const params = { page: auditPage.value, pageSize: auditPageSize }
  if (auditFilterAction.value) params.action = auditFilterAction.value
  if (auditDateRange.value) {
    params.startDate = auditDateRange.value[0]
    params.endDate = auditDateRange.value[1]
  }
  const res = await get('/home/session/admin/audit-logs', params)
  if (res?.code === 0 && res?.data) {
    auditLogs.value = res.data.list || []
    auditTotal.value = res.data.total || 0
  }
  auditLoading.value = false
}

onMounted(() => {
  loadSessions()
  loadAudit()
})
</script>

<style scoped>
.admin-sessions { padding: 20px; }
.admin-sessions h2 { margin-bottom: 16px; }
.report-filters { display: flex; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 4px; }
</style>
