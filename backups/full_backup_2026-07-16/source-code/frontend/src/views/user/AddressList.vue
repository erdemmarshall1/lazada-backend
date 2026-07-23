<template>
  <div>
    <div class="g-flex-align-center g-flex-justify-between">
      <h3>Addresses</h3>
      <el-button type="primary" size="small" style="background:var(--g-main_color);border-color:var(--g-main_color)" @click="showDialog = true">+ Add</el-button>
    </div>
    <div class="address-list" v-if="list.length > 0">
      <div class="address-card" v-for="addr in list" :key="addr._id">
        <div><strong>{{ addr.name }}</strong> {{ addr.phone }}</div>
        <div>{{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detail }}</div>
        <div class="address-actions">
          <el-tag v-if="addr.isDefault" size="small" type="warning">Default</el-tag>
          <el-button link type="primary" size="small" @click="setDefault(addr._id)">Set Default</el-button>
          <el-button link type="danger" size="small" @click="delAddress(addr._id)">Delete</el-button>
        </div>
      </div>
    </div>
    <div v-else class="c-no-list"><span class="c-no-list-text">No addresses</span></div>
    <el-dialog v-model="showDialog" title="Add Address" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="Name" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="Phone" prop="phone"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="Province" prop="province"><el-input v-model="form.province" /></el-form-item>
        <el-form-item label="City" prop="city"><el-input v-model="form.city" /></el-form-item>
        <el-form-item label="Detail" prop="detail"><el-input v-model="form.detail" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">Cancel</el-button>
        <el-button type="primary" @click="addAddress">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { get, post, qe } from '@/api/request'
const list = ref([])
const showDialog = ref(false)
const formRef = ref(null)
const form = ref({ name: '', phone: '', province: '', city: '', district: '', detail: '' })
const rules = { name: [{ required: true, message: 'Please enter name', trigger: 'blur' }], phone: [{ required: true, message: 'Please enter phone', trigger: 'blur' }], province: [{ required: true, message: 'Please enter province', trigger: 'blur' }], city: [{ required: true, message: 'Please enter city', trigger: 'blur' }], detail: [{ required: true, message: 'Please enter detail', trigger: 'blur' }] }

const loadList = async () => { const res = await get('/home/userAddress/getList'); if (res?.data) list.value = res.data }
const addAddress = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  await qe(post('/home/userAddress/add', form.value)); showDialog.value = false; await loadList()
}
const setDefault = async (id) => { await qe(post('/home/userAddress/setDefault', { id })); await loadList() }
const delAddress = async (id) => {
  try { await ElMessageBox.confirm('Delete this address?', 'Confirm') } catch { return }
  await qe(post('/home/userAddress/del', { id })); await loadList()
}
onMounted(loadList)
</script>

<style scoped>
.address-card { padding: 12px; border: 1px solid var(--g-border); border-radius: 4px; margin-top: 12px; }
.address-card div { margin-bottom: 4px; font-size: 14px; }
.address-actions { margin-top: 8px; display: flex; gap: 8px; align-items: center; }
@media (max-width: 768px) {
  .address-card { padding: 10px; font-size: 13px; }
  .address-card div { font-size: 13px; }
  .address-actions { flex-wrap: wrap; }
  :deep(.el-dialog) { width: 90% !important; max-width: 400px; }
}
</style>
