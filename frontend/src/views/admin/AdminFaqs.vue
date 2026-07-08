<template>
  <div class="admin-cms">
    <div class="admin-cms-header">
      <h2>FAQs</h2>
      <el-button type="primary" @click="openDialog()">New FAQ</el-button>
    </div>

    <el-table :data="faqs" stripe v-loading="loading" style="width:100%">
      <el-table-column prop="question" label="Question" min-width="250" show-overflow-tooltip />
      <el-table-column prop="category" label="Category" width="120" />
      <el-table-column prop="sort" label="Sort" width="60" />
      <el-table-column label="Status" width="80">
        <template #default="{ row }"><el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? 'Active' : 'Hidden' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="Actions" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">Edit</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? 'Edit FAQ' : 'New FAQ'" width="600px">
      <el-form :model="dialog.form" label-position="top">
        <el-form-item label="Question" required>
          <el-input v-model="dialog.form.question" placeholder="Frequently asked question" />
        </el-form-item>
        <el-form-item label="Answer">
          <el-input v-model="dialog.form.answer" type="textarea" :rows="6" placeholder="Answer content (HTML)" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="Category">
              <el-input v-model="dialog.form.category" placeholder="e.g. Shipping" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Sort Order">
              <el-input-number v-model="dialog.form.sort" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Status">
              <el-switch v-model="dialog.form.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
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

const faqs = ref([])
const loading = ref(false)
const dialog = reactive({
  visible: false, isEdit: false, loading: false,
  form: { question: '', answer: '', category: '', sort: 0, status: 1 },
})

const loadData = async () => {
  loading.value = true
  const res = await get('/home/cms/admin/faqs')
  loading.value = false
  if (res?.code === 0) faqs.value = res.data || []
}

const openDialog = (row) => {
  if (row) { dialog.isEdit = true; dialog.form = { ...row } }
  else { dialog.isEdit = false; dialog.form = { question: '', answer: '', category: '', sort: 0, status: 1 } }
  dialog.visible = true
}

const save = async () => {
  dialog.loading = true
  const fn = dialog.isEdit ? put(`/home/cms/admin/faqs/${dialog.form._id}`) : post('/home/cms/admin/faqs')
  const res = await fn(dialog.form)
  dialog.loading = false
  if (res?.code === 0) { ElMessage.success(dialog.isEdit ? 'Updated' : 'Created'); dialog.visible = false; loadData() }
  else ElMessage.error(res?.msg || 'Failed to save')
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`Delete "${row.question}"?`, 'Confirm', { type: 'warning' }).then(async () => {
    const res = await del(`/home/cms/admin/faqs/${row._id}`)
    if (res?.code === 0) { ElMessage.success('Deleted'); loadData() }
  }).catch(() => {})
}

onMounted(loadData)
</script>

<style scoped>
.admin-cms { padding: 20px; }
.admin-cms-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.admin-cms-header h2 { margin: 0; font-size: 20px; }
</style>