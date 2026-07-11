<template>
  <div class="admin-page">
    <div class="page-card">
      <div class="page-header">
        <i class="iconfont icon-shezhi"></i>
        <h2>Seller ID Settings</h2>
      </div>

      <div class="counter-section">
        <h3>Auto-Increment Counter</h3>
        <p class="section-desc">New sellers get the next sequential Seller ID (e.g. S171911, S171912...).</p>
        <div class="counter-display">
          <div class="counter-field">
            <label>Next Seller ID</label>
            <div class="next-id-badge">S{{ counter.seq + 1 }}</div>
          </div>
          <div class="counter-field">
            <label>Current Counter Value</label>
            <el-input-number v-model="counter.seq" :min="1" :max="9999999" style="width:160px" />
          </div>
          <div class="counter-field">
            <label>ID Format</label>
            <code class="format-sample">S{{ counter.seq }} → S{{ counter.seq + 1 }}</code>
          </div>
        </div>
        <el-button type="primary" :loading="savingCounter" @click="saveCounter" style="margin-top:12px">
          Update Starting Number
        </el-button>
      </div>

      <el-divider />

      <div class="sellers-section">
        <h3>All Seller IDs</h3>
        <p class="section-desc">View and manually override any seller's ID.</p>
        <div class="g-responsive-table">
          <el-table :data="sellers" v-loading="loading" style="width:100%" size="small">
            <el-table-column prop="sellerId" label="Seller ID" width="110" />
            <el-table-column prop="username" label="Username" width="140" />
            <el-table-column prop="email" label="Email" min-width="200" show-overflow-tooltip />
            <el-table-column prop="role" label="Role" width="90" />
            <el-table-column label="Actions" width="160" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="openOverride(row)">Override ID</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <el-dialog v-model="overrideDialog" title="Override Seller ID" width="420px">
        <el-form label-position="top">
          <el-form-item label="User">
            <el-input :model-value="overrideUser?.username" disabled />
          </el-form-item>
          <el-form-item label="Current Seller ID">
            <el-input :model-value="overrideUser?.sellerId" disabled />
          </el-form-item>
          <el-form-item label="New Seller ID">
            <el-input v-model="overrideNewId" placeholder="e.g. S999999" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="overrideDialog = false">Cancel</el-button>
          <el-button type="primary" :loading="savingOverride" @click="doOverride">Save</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { get, post as postReq, put as putReq } from '@/api/request'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const savingCounter = ref(false)
const savingOverride = ref(false)
const overrideDialog = ref(false)
const overrideUser = ref(null)
const overrideNewId = ref('')

const counter = reactive({ seq: 171910 })
const sellers = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const res = await get('/home/admin/seller-id-settings')
    if (res?.code === 0 && res?.data) {
      counter.seq = res.data.counter?.seq ?? 171910
      sellers.value = res.data.sellers || []
    }
  } catch {} finally { loading.value = false }
}

const saveCounter = async () => {
  savingCounter.value = true
  try {
    const res = await putReq('/home/admin/seller-id-settings', { startingNumber: counter.seq })
    if (res?.code === 0 || res?.data) {
      ElMessage.success(res.msg || 'Counter updated')
      await fetchData()
    } else {
      ElMessage.error(res?.msg || 'Failed to update counter')
    }
  } catch (err) {
    ElMessage.error(err?.response?.data?.msg || 'Failed to update counter')
  } finally { savingCounter.value = false }
}

const openOverride = (user) => {
  overrideUser.value = user
  overrideNewId.value = user.sellerId || ''
  overrideDialog.value = true
}

const doOverride = async () => {
  if (!overrideNewId.value.trim()) {
    ElMessage.warning('Enter a Seller ID')
    return
  }
  savingOverride.value = true
  try {
    const res = await postReq('/home/admin/seller-id-override', {
      userId: overrideUser.value._id,
      sellerId: overrideNewId.value.trim()
    })
    if (res?.code === 0 || res?.data) {
      ElMessage.success(res.msg || 'Seller ID updated')
      overrideDialog.value = false
      await fetchData()
    } else {
      ElMessage.error(res?.msg || 'Failed to update')
    }
  } catch (err) {
    ElMessage.error(err?.response?.data?.msg || 'Failed to update')
  } finally { savingOverride.value = false }
}

onMounted(fetchData)
</script>

<style scoped>
.counter-section { margin-bottom: 8px; }
.counter-section h3, .sellers-section h3 { font-size: 15px; font-weight: 600; margin: 0 0 4px; color: rgba(255,255,255,0.85); }
.section-desc { font-size: 13px; color: rgba(255,255,255,0.4); margin: 0 0 16px; }
.counter-display { display: flex; gap: 32px; flex-wrap: wrap; align-items: flex-end; }
.counter-field label { display: block; font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 6px; }
.next-id-badge { font-size: 28px; font-weight: 700; color: #667eea; }
.format-sample { font-size: 14px; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.06); padding: 8px 12px; border-radius: 6px; }
@media (max-width: 600px) {
  .counter-display { flex-direction: column; gap: 16px; }
}
</style>
