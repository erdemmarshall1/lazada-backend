<template>
  <div class="admin-page">
    <div class="page-card">
      <div class="page-header">
        <i class="iconfont icon-anquan"></i>
        <h2>Maintenance Mode</h2>
        <span class="subtitle">
          <el-tag :type="maintenance.enabled ? 'danger' : 'success'" size="small">
            {{ maintenance.enabled ? 'MAINTENANCE ACTIVE' : 'SITE ONLINE' }}
          </el-tag>
        </span>
      </div>

      <el-alert
        v-if="maintenance.enabled"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom:16px"
        title="Maintenance mode is ON"
        description="Public visitors will see the maintenance page and public APIs will return 503. The admin panel (/admin) remains fully accessible."
      />

      <el-form label-position="top" style="max-width:640px">
        <el-form-item label="Enable Maintenance Mode">
          <el-switch v-model="maintenance.enabled" />
          <div class="field-hint">Block the public site while you work. You will stay logged in here.</div>
        </el-form-item>
        <el-form-item label="Maintenance Message">
          <el-input v-model="maintenance.message" type="textarea" :rows="3" placeholder="We are currently performing scheduled maintenance..." />
        </el-form-item>
        <el-form-item label="Expected Back (optional)">
          <el-date-picker v-model="maintenance.until" type="datetime" placeholder="When do you expect to be back?" style="width:100%" value-format="YYYY-MM-DDTHH:mm:ss" />
        </el-form-item>
        <el-button type="primary" :loading="savingMaintenance" @click="saveMaintenance">
          {{ maintenance.enabled ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode' }}
        </el-button>
      </el-form>
    </div>

    <div class="page-card">
      <div class="page-header">
        <i class="iconfont icon-shangchuanbeifen"></i>
        <h2>Backup</h2>
        <span class="subtitle">{{ backupCollections }} collections tracked</span>
      </div>

      <div class="backup-actions">
        <div class="backup-action">
          <h3>Download Full Backup (ZIP)</h3>
          <p>All {{ backupCollections }} database collections + environment files as a single zip.</p>
          <el-button type="primary" :loading="downloadingZip" @click="downloadZip">
            <i class="iconfont icon-xiazai" style="margin-right:6px"></i> Download ZIP
          </el-button>
        </div>
        <div class="backup-action">
          <h3>Download JSON Dump</h3>
          <p>Raw JSON per collection. This exact file can be re-uploaded for restore.</p>
          <el-button :loading="downloadingJson" @click="downloadJson">
            <i class="iconfont icon-xiazai" style="margin-right:6px"></i> Download JSON
          </el-button>
        </div>
      </div>

      <template v-if="backupList.length > 0">
        <el-divider />
        <h3 style="margin-bottom:12px">Recent Backups on Server</h3>
        <div class="g-responsive-table">
          <el-table :data="backupList" size="small" style="width:100%">
            <el-table-column prop="name" label="Name" min-width="220" show-overflow-tooltip />
            <el-table-column label="Type" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.isDir ? 'info' : 'primary'">{{ row.isDir ? 'Folder' : 'File' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Size" width="110">
              <template #default="{ row }">{{ row.sizeMB !== null ? row.sizeMB + ' MB' : '—' }}</template>
            </el-table-column>
            <el-table-column label="Modified" width="180">
              <template #default="{ row }">{{ new Date(row.modifiedAt).toLocaleString() }}</template>
            </el-table-column>
            <el-table-column label="Actions" width="140">
              <template #default="{ row }">
                <el-button v-if="!row.isDir" size="small" type="primary" plain :loading="downloadingName === row.name" @click="downloadBackupFile(row)">
                  <i class="iconfont icon-xiazai" style="margin-right:4px"></i> Download
                </el-button>
                <el-tag v-else size="small" type="info">Folder</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </div>

    <div class="page-card">
      <div class="page-header">
        <i class="iconfont icon-shijian"></i>
        <h2>Activities History</h2>
        <span class="subtitle">All backup, restore and maintenance actions</span>
      </div>
      <div class="activity-filter" style="margin-bottom:12px">
        <el-select v-model="activityAction" placeholder="All actions" clearable style="width:200px" @change="loadActivities">
          <el-option label="Backup (ZIP)" value="backup_zip" />
          <el-option label="Backup (JSON)" value="backup_json" />
          <el-option label="Server Backup" value="backup_server" />
          <el-option label="Restore" value="restore" />
          <el-option label="Maintenance ON" value="maintenance_on" />
          <el-option label="Maintenance OFF" value="maintenance_off" />
        </el-select>
      </div>
      <div class="g-responsive-table">
        <el-table :data="activities" v-loading="activitiesLoading" size="small" style="width:100%">
          <el-table-column label="Date" width="170">
            <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="Action" width="150">
            <template #default="{ row }">
              <el-tag size="small" :type="actionTagType(row.action)">{{ actionLabel(row.action) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="actor" label="Admin" width="120" />
          <el-table-column prop="filename" label="File" min-width="180" show-overflow-tooltip />
          <el-table-column label="Size" width="90">
            <template #default="{ row }">{{ row.sizeMB !== null ? row.sizeMB + ' MB' : '—' }}</template>
          </el-table-column>
          <el-table-column label="Status" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="row.status === 'ok' ? 'success' : 'danger'">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="140">
            <template #default="{ row }">
              <el-button v-if="row.filename && (row.action === 'backup_zip' || row.action === 'backup_json') && backupExists(row.filename)" size="small" type="primary" plain :loading="downloadingName === row.filename" @click="downloadBackupFile({ name: row.filename })">
                <i class="iconfont icon-xiazai" style="margin-right:4px"></i> Download
              </el-button>
              <span v-else-if="row.error" style="font-size:12px;color:#f56c6c">{{ row.error }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pagination-wrap" style="margin-top:16px;display:flex;justify-content:flex-end" v-if="activityTotal > activityPageSize">
        <el-pagination background layout="prev, pager, next" :total="activityTotal" :page-size="activityPageSize" v-model:current-page="activityPage" @current-change="loadActivities" small />
      </div>
    </div>

    <div class="page-card restore-card">
      <div class="page-header">
        <i class="iconfont icon-huifu"></i>
        <h2 style="color:#f56c6c">Restore</h2>
        <span class="subtitle" style="color:#f56c6c">DANGER ZONE — super admin only</span>
      </div>

      <el-alert
        type="error"
        :closable="false"
        show-icon
        style="margin-bottom:16px"
        title="This will REPLACE existing data"
        description="Uploading a backup and confirming will delete the current contents of every collection present in the backup and insert the backup's documents. This cannot be undone. Always take a fresh backup first."
      />

      <el-form label-position="top" style="max-width:640px">
        <el-form-item label="Backup File (.zip or .json)">
          <el-upload
            drag
            :auto-upload="false"
            :limit="1"
            accept=".zip,.json,application/zip,application/json"
            :on-change="onFileChange"
            :on-remove="() => restoreFile = null"
            style="width:100%"
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">Drop the backup file here or <em>click to browse</em></div>
          </el-upload>
        </el-form-item>
        <el-form-item label="Confirm Replacement">
          <el-checkbox v-model="restoreConfirm">I understand this replaces all data in the backed-up collections.</el-checkbox>
        </el-form-item>
        <el-button type="danger" :disabled="!restoreFile || !restoreConfirm" :loading="restoring" @click="confirmRestore">
          <i class="iconfont icon-huifu" style="margin-right:6px"></i> Restore From Backup
        </el-button>
      </el-form>

      <template v-if="restoreResult">
        <el-divider />
        <h3 style="margin-bottom:12px">Restore Result</h3>
        <div class="g-responsive-table">
          <el-table :data="restoreResultRows" size="small" style="width:100%">
            <el-table-column prop="collection" label="Collection" min-width="200" />
            <el-table-column prop="status" label="Status" width="110">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 'ok' ? 'success' : row.status === 'skipped' ? 'info' : 'danger'">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deleted" label="Deleted" width="100" />
            <el-table-column prop="inserted" label="Inserted" width="100" />
          </el-table>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import { adminGet, adminPut, adminPost, API_BASE } from '@/api/adminRequest'
import { ElMessage, ElMessageBox } from 'element-plus'

const maintenance = reactive({ enabled: false, message: '', until: null })
const savingMaintenance = ref(false)

const backupCollections = ref(0)
const backupList = ref([])

const downloadingZip = ref(false)
const downloadingJson = ref(false)

const restoreFile = ref(null)
const restoreConfirm = ref(false)
const restoring = ref(false)
const restoreResult = ref(null)

const activities = ref([])
const activitiesLoading = ref(false)
const activityAction = ref('')
const activityPage = ref(1)
const activityPageSize = ref(50)
const activityTotal = ref(0)
const downloadingName = ref('')

const ACTION_LABELS = {
  backup_zip: 'Backup (ZIP)',
  backup_json: 'Backup (JSON)',
  backup_server: 'Server Backup',
  restore: 'Restore',
  maintenance_on: 'Maintenance ON',
  maintenance_off: 'Maintenance OFF',
}
const actionLabel = (a) => ACTION_LABELS[a] || a
const actionTagType = (a) => {
  if (a === 'maintenance_on') return 'danger'
  if (a === 'maintenance_off') return 'warning'
  if (a === 'restore') return 'primary'
  return 'success'
}
const backupExists = (name) => backupList.value.some((b) => b.name === name && !b.isDir)

const loadActivities = async () => {
  activitiesLoading.value = true
  const res = await adminGet('/home/admin/backup/activity', {
    page: activityPage.value,
    pageSize: activityPageSize.value,
    action: activityAction.value || undefined,
  })
  if (res?.code === 0 && res?.data) {
    activities.value = res.data.list || []
    activityTotal.value = res.data.total || 0
  }
  activitiesLoading.value = false
}

const downloadBackupFile = async (row) => {
  if (!row?.name) return
  downloadingName.value = row.name
  try {
    const token = getToken()
    const res = await axios.get(`${API_BASE}/home/admin/backup/download`, {
      params: { name: row.name },
      headers: {
        token,
        Authorization: `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      responseType: 'blob',
      timeout: 120000,
    })
    downloadBlob(res.data, row.name)
    ElMessage.success('Backup downloaded')
    loadActivities()
  } catch (err) {
    ElMessage.error(err?.response?.data?.msg || 'Failed to download backup')
  } finally {
    downloadingName.value = ''
  }
}

const restoreResultRows = computed(() => {
  if (!restoreResult.value) return []
  return Object.entries(restoreResult.value).map(([collection, info]) => ({
    collection,
    status: info.status || 'ok',
    deleted: info.deleted ?? '—',
    inserted: info.inserted ?? (info.reason || ''),
  }))
})

const loadStatus = async () => {
  const res = await adminGet('/home/admin/backup/status')
  if (res?.code === 0 && res?.data) {
    maintenance.enabled = !!res.data.maintenance?.enabled
    maintenance.message = res.data.maintenance?.message || ''
    maintenance.until = res.data.maintenance?.until || null
    backupCollections.value = res.data.backupCollections || 0
  }
}

const loadBackupList = async () => {
  const res = await adminGet('/home/admin/backup/list')
  if (res?.code === 0) backupList.value = res.data || []
}

const saveMaintenance = async () => {
  savingMaintenance.value = true
  try {
    const res = await adminPut('/home/admin/maintenance', {
      enabled: maintenance.enabled,
      message: maintenance.message,
      until: maintenance.until || '',
    })
    if (res?.code === 0) {
      ElMessage.success(res.msg || 'Maintenance settings saved')
      await loadStatus()
      loadActivities()
    } else {
      ElMessage.error(res?.msg || 'Failed to save maintenance settings')
    }
  } catch (err) {
    ElMessage.error(err?.response?.data?.msg || 'Failed to save maintenance settings')
  } finally {
    savingMaintenance.value = false
  }
}

const getToken = () => {
  try { return localStorage.getItem('theoutnet_admin_token') || '' } catch { return '' }
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const downloadZip = async () => {
  downloadingZip.value = true
  try {
    const token = getToken()
    const res = await axios.post(`${API_BASE}/home/admin/backup`, {}, {
      headers: {
        token,
        Authorization: `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      responseType: 'blob',
      timeout: 120000,
    })
    const date = new Date().toISOString().slice(0, 10)
    downloadBlob(res.data, `full_backup_${date}.zip`)
    ElMessage.success('Backup downloaded')
    loadActivities()
  } catch (err) {
    ElMessage.error(err?.response?.data?.msg || 'Failed to download backup')
  } finally {
    downloadingZip.value = false
  }
}

const downloadJson = async () => {
  downloadingJson.value = true
  try {
    const res = await adminPost('/home/admin/backup/d')
    if (res?.success && res?.data) {
      const payload = JSON.stringify({ success: true, data: res.data, manifest: res.manifest }, null, 2)
      const date = new Date().toISOString().slice(0, 10)
      downloadBlob(new Blob([payload], { type: 'application/json' }), `full_backup_${date}.json`)
      ElMessage.success('JSON dump downloaded')
      loadActivities()
    } else {
      ElMessage.error('Failed to generate JSON dump')
    }
  } catch (err) {
    ElMessage.error(err?.message || 'Failed to download JSON dump')
  } finally {
    downloadingJson.value = false
  }
}

const onFileChange = (file) => {
  restoreFile.value = file.raw || null
}

const confirmRestore = async () => {
  try {
    await ElMessageBox.confirm(
      'This permanently replaces data in every collection found in the backup. Proceed?',
      'Confirm Restore',
      { type: 'warning', confirmButtonText: 'Yes, restore', cancelButtonText: 'Cancel' }
    )
  } catch {
    return
  }
  restoring.value = true
  try {
    const fd = new FormData()
    fd.append('file', restoreFile.value)
    fd.append('confirm', 'true')
    const res = await adminPost('/home/admin/backup/restore', fd)
    if (res?.code === 0) {
      restoreResult.value = res.data
      ElMessage.success(res.msg || 'Restore complete')
      loadActivities()
    } else {
      ElMessage.error(res?.msg || 'Restore failed')
    }
  } catch (err) {
    ElMessage.error(err?.response?.data?.msg || err?.message || 'Restore failed')
  } finally {
    restoring.value = false
  }
}

onMounted(() => {
  loadStatus()
  loadBackupList()
  loadActivities()
})
</script>

<style scoped>
.field-hint { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 4px; }
.backup-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.backup-action {
  background: var(--g-white, #ffffff);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 18px;
}
.backup-action h3 { font-size: 15px; font-weight: 600; margin: 0 0 6px; }
.backup-action p { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0 0 14px; }
.restore-card { border: 1px solid rgba(245,108,108,0.35); }
@media (max-width: 720px) {
  .backup-actions { grid-template-columns: 1fr; }
}
</style>
