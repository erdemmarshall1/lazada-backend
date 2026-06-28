<template>
  <div class="admin-invitation-codes">
    <h2>Invitation Codes</h2>
    <el-button type="primary" style="margin-bottom:16px" :loading="generating" @click="generateCode">+ Generate Code</el-button>
    <div class="g-responsive-table">
      <el-table :data="codes" v-loading="loading" style="width:100%">
        <el-table-column prop="code" label="Code" width="160" />
        <el-table-column label="Status" width="110">
          <template #default="{row}">
            <el-tag v-if="row.usedBy" type="info" size="small">Used</el-tag>
            <el-tag v-else-if="!row.isActive" type="danger" size="small">Deactivated</el-tag>
            <el-tag v-else type="success" size="small">Active</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Created" width="160">
          <template #default="{row}">{{ new Date(row.createdAt).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="Created By" width="140">
          <template #default="{row}">{{ row.createdBy?.username || '-' }}</template>
        </el-table-column>
        <el-table-column label="Used By" min-width="160">
          <template #default="{row}">{{ row.usedBy?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="Used At" width="160">
          <template #default="{row}">{{ row.usedAt ? new Date(row.usedAt).toLocaleString() : '-' }}</template>
        </el-table-column>
        <el-table-column label="Action" width="120" fixed="right">
          <template #default="{row}">
            <el-button size="small" type="warning" :disabled="!row.isActive || row.usedBy" @click="deactivate(row._id)">
              Deactivate
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const codes = ref([])
const loading = ref(false)
const generating = ref(false)

const fetchCodes = async () => {
  loading.value = true
  const res = await get('/home/admin/invitation-codes')
  if (res?.data?.list) codes.value = res.data.list
  else if (res?.data) codes.value = Array.isArray(res.data) ? res.data : []
  loading.value = false
}

const generateCode = async () => {
  generating.value = true
  const res = await post('/home/admin/invitation-codes/generate')
  generating.value = false
  if (res) {
    ElMessage.success(res.msg || 'Code generated')
    fetchCodes()
  }
}

const deactivate = async (id) => {
  try {
    await ElMessageBox.confirm('Deactivate this invitation code?', 'Confirm', { type: 'warning' })
    const res = await fetch(`/home/admin/invitation-codes/${id}/deactivate`, { method: 'PATCH' }).then(r => r.json())
    if (res) {
      ElMessage.success(res.msg || 'Code deactivated')
      fetchCodes()
    }
  } catch {}
}

onMounted(fetchCodes)
</script>

<style scoped>
.admin-invitation-codes { padding: 20px; }
.admin-invitation-codes h2 { margin-bottom: 16px; }
</style>
