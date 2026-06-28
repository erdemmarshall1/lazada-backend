<template>
  <div class="admin-payment-settings">
    <h2>Payment Settings</h2>
    <el-button type="primary" style="margin-bottom:16px" @click="openAddDialog">+ Add Payment Method</el-button>
    <div class="g-responsive-table">
      <el-table :data="list" v-loading="loading" style="width:100%">
        <el-table-column prop="method" label="Method" width="140" />
        <el-table-column prop="label" label="Label" width="160" />
        <el-table-column prop="walletAddress" label="Wallet Address" min-width="280">
          <template #default="{row}">
            <span v-if="row.walletAddress" style="font-family:monospace;font-size:12px">{{ row.walletAddress }}</span>
            <span v-else style="color:#999">-</span>
          </template>
        </el-table-column>
        <el-table-column label="Active" width="80" align="center">
          <template #default="{row}">
            <el-switch :model-value="row.isActive" @change="toggleActive(row)" />
          </template>
        </el-table-column>
        <el-table-column label="Sort" width="70" align="center">
          <template #default="{row}">{{ row.sort }}</template>
        </el-table-column>
        <el-table-column label="Action" width="160" fixed="right">
          <template #default="{row}">
            <el-button size="small" type="primary" @click="openEditDialog(row)">Edit</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row._id)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? 'Edit Payment Method' : 'Add Payment Method'" width="520px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top">
        <el-form-item label="Method Key" prop="method">
          <el-input v-model="form.method" placeholder="e.g. USDT_TRC20, BTC, ETH" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="Display Label" prop="label">
          <el-input v-model="form.label" placeholder="e.g. USDT TRC20" />
        </el-form-item>
        <el-form-item label="Wallet Address">
          <el-input v-model="form.walletAddress" type="textarea" :rows="2" placeholder="Wallet address for receiving payments" />
        </el-form-item>
        <el-form-item label="Sort Order">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="Active">
          <el-switch v-model="form.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? 'Update' : 'Create' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, post, $http } from '@/api/request'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const editId = ref('')
const formRef = ref(null)

const form = reactive({
  method: '',
  label: '',
  walletAddress: '',
  isActive: true,
  sort: 0,
})

const formRules = {
  method: [{ required: true, message: 'Method key is required', trigger: 'blur' }],
  label: [{ required: true, message: 'Display label is required', trigger: 'blur' }],
}

const loadList = async () => {
  loading.value = true
  const res = await get('/home/admin/payment-settings', { page: 1, pageSize: 100 })
  if (res?.code === 0) list.value = res.data.list || []
  loading.value = false
}

const openAddDialog = () => {
  isEdit.value = false
  editId.value = ''
  form.method = ''
  form.label = ''
  form.walletAddress = ''
  form.isActive = true
  form.sort = 0
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  editId.value = row._id
  form.method = row.method
  form.label = row.label
  form.walletAddress = row.walletAddress || ''
  form.isActive = row.isActive
  form.sort = row.sort ?? 0
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  const url = isEdit.value
    ? `/home/admin/payment-settings/${editId.value}`
    : '/home/admin/payment-settings'
  let res
  if (isEdit.value) {
    res = await $http.put(url, form)
  } else {
    res = await post(url, form)
  }
  saving.value = false
  if (res?.code === 0) {
    ElMessage.success(isEdit.value ? 'Updated' : 'Created')
    dialogVisible.value = false
    await loadList()
  } else {
    ElMessage.error(res?.msg || 'Failed')
  }
}

const toggleActive = async (row) => {
  const res = await $http.put(`/home/admin/payment-settings/${row._id}`, { isActive: !row.isActive })
  if (res?.code === 0) {
    row.isActive = !row.isActive
    ElMessage.success('Updated')
  } else {
    ElMessage.error(res?.msg || 'Failed')
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('Are you sure?', 'Confirm', { type: 'warning' })
  } catch { return }
  const res = await $http.delete(`/home/admin/payment-settings/${id}`)
  if (res?.code === 0) {
    ElMessage.success('Deleted')
    await loadList()
  } else {
    ElMessage.error(res?.msg || 'Failed')
  }
}

onMounted(loadList)
</script>

<style scoped>
.admin-payment-settings { padding: 20px; }
.admin-payment-settings h2 { margin-bottom: 16px; }
</style>
