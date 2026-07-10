<template>
  <div class="admin-page admin-cms">
    <div class="admin-cms-header">
      <h2>Navigation Menus</h2>
      <el-button type="primary" @click="openDialog()">New Menu</el-button>
    </div>

    <el-table :data="menus" stripe v-loading="loading" style="width:100%">
      <el-table-column prop="name" label="Name" width="160" />
      <el-table-column prop="key" label="Key" width="140" />
      <el-table-column label="Items" width="80">
        <template #default="{ row }">{{ row.items?.length || 0 }}</template>
      </el-table-column>
      <el-table-column label="Status" width="80">
        <template #default="{ row }"><el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? 'Active' : 'Inactive' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="Actions" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">Edit</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? 'Edit Menu' : 'New Menu'" width="700px">
      <el-form :model="dialog.form" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Name" required>
              <el-input v-model="dialog.form.name" placeholder="Main Navigation" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Key" required>
              <el-input v-model="dialog.form.key" placeholder="main-nav" :disabled="dialog.isEdit" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Status">
          <el-switch v-model="dialog.form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="Menu Items">
          <div v-for="(item, i) in dialog.form.items" :key="i" class="menu-item-row">
            <el-input v-model="item.label" placeholder="Label" style="width:160px;margin-right:8px" />
            <el-input v-model="item.url" placeholder="/path" style="width:200px;margin-right:8px" />
            <el-select v-model="item.target" style="width:90px;margin-right:8px">
              <el-option label="Same tab" value="_self" />
              <el-option label="New tab" value="_blank" />
            </el-select>
            <el-button size="small" type="danger" @click="dialog.form.items.splice(i, 1)">X</el-button>
          </div>
          <el-button size="small" style="margin-top:8px" @click="dialog.form.items.push({ label: '', url: '', target: '_self', children: [] })">+ Add Item</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">Cancel</el-button>
        <el-button type="primary" :loading="dialog.loading" @click="save">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { get, post, put, del } from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const menus = ref([])
const loading = ref(false)
const dialog = reactive({
  visible: false, isEdit: false, loading: false,
  form: { name: '', key: '', items: [], status: 1 },
})

const loadData = async () => {
  loading.value = true
  const res = await get('/home/cms/admin/menus')
  loading.value = false
  if (res?.code === 0) menus.value = res.data || []
}

const openDialog = (row) => {
  if (row) { dialog.isEdit = true; dialog.form = JSON.parse(JSON.stringify(row)) }
  else { dialog.isEdit = false; dialog.form = { name: '', key: '', items: [], status: 1 } }
  dialog.visible = true
}

const save = async () => {
  dialog.loading = true
  const fn = dialog.isEdit ? put(`/home/cms/admin/menus/${dialog.form._id}`) : post('/home/cms/admin/menus')
  const res = await fn({ name: dialog.form.name, key: dialog.form.key, items: dialog.form.items, status: dialog.form.status })
  dialog.loading = false
  if (res?.code === 0) { ElMessage.success(dialog.isEdit ? 'Updated' : 'Created'); dialog.visible = false; loadData() }
  else ElMessage.error(res?.msg || 'Failed to save')
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`Delete menu "${row.name}"?`, 'Confirm', { type: 'warning' }).then(async () => {
    const res = await del(`/home/cms/admin/menus/${row._id}`)
    if (res?.code === 0) { ElMessage.success('Deleted'); loadData() }
  }).catch(() => {})
}

onMounted(loadData)
</script>

<style scoped>
.admin-cms { padding: 20px; }
.admin-cms-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.admin-cms-header h2 { margin: 0; font-size: 20px; }
.menu-item-row { display: flex; align-items: center; margin-bottom: 6px; }
</style>