<template>
  <div class="admin-cms">
    <div class="admin-cms-header">
      <h2>CMS Pages</h2>
      <el-button type="primary" @click="openDialog()">New Page</el-button>
    </div>

    <el-table :data="pages" stripe v-loading="loading" style="width:100%">
      <el-table-column prop="title" label="Title" min-width="160" />
      <el-table-column prop="slug" label="Slug" width="150" />
      <el-table-column prop="summary" label="Summary" min-width="200" show-overflow-tooltip />
      <el-table-column prop="status" label="Status" width="80">
        <template #default="{ row }"><el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? 'Active' : 'Draft' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="sort" label="Sort" width="60" />
      <el-table-column label="Actions" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">Edit</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="g-flex-center g-mgt-16" v-if="total > pageSize">
      <el-pagination layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="loadData" />
    </div>

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? 'Edit Page' : 'New Page'" width="700px">
      <el-form :model="dialog.form" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Title" required>
              <el-input v-model="dialog.form.title" placeholder="Page title" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Slug" required>
              <el-input v-model="dialog.form.slug" placeholder="page-url-slug" :disabled="dialog.isEdit" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Summary">
          <el-input v-model="dialog.form.summary" type="textarea" :rows="2" placeholder="Brief description" />
        </el-form-item>
        <el-form-item label="Content (HTML)">
          <el-input v-model="dialog.form.content" type="textarea" :rows="12" placeholder="HTML content" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="Status">
              <el-switch v-model="dialog.form.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Sort Order">
              <el-input-number v-model="dialog.form.sort" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Image URL">
              <el-input v-model="dialog.form.image" placeholder="https://..." />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Meta Title">
          <el-input v-model="dialog.form.metaTitle" placeholder="SEO title" />
        </el-form-item>
        <el-form-item label="Meta Description">
          <el-input v-model="dialog.form.metaDescription" type="textarea" :rows="2" placeholder="SEO description" />
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

const pages = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const dialog = reactive({
  visible: false, isEdit: false, loading: false,
  form: { title: '', slug: '', content: '', summary: '', image: '', metaTitle: '', metaDescription: '', status: 1, sort: 0 },
})

const loadData = async () => {
  loading.value = true
  const res = await get('/home/cms/admin/pages', { page: page.value, pageSize })
  loading.value = false
  if (res?.code === 0 && res?.data) {
    pages.value = res.data.list || []
    total.value = res.data.total || 0
  }
}

const openDialog = (row) => {
  if (row) {
    dialog.isEdit = true
    dialog.form = { ...row }
  } else {
    dialog.isEdit = false
    dialog.form = { title: '', slug: '', content: '', summary: '', image: '', metaTitle: '', metaDescription: '', status: 1, sort: 0 }
  }
  dialog.visible = true
}

const save = async () => {
  dialog.loading = true
  const fn = dialog.isEdit ? put(`/home/cms/admin/pages/${dialog.form._id}`) : post('/home/cms/admin/pages')
  const res = await fn(dialog.form)
  dialog.loading = false
  if (res?.code === 0) {
    ElMessage.success(dialog.isEdit ? 'Page updated' : 'Page created')
    dialog.visible = false
    loadData()
  } else {
    ElMessage.error(res?.msg || 'Failed to save')
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`Delete page "${row.title}"?`, 'Confirm', { type: 'warning' }).then(async () => {
    const res = await del(`/home/cms/admin/pages/${row._id}`)
    if (res?.code === 0) {
      ElMessage.success('Page deleted')
      loadData()
    }
  }).catch(() => {})
}

onMounted(loadData)
</script>

<style scoped>
.admin-cms { padding: 20px; }
.admin-cms-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.admin-cms-header h2 { margin: 0; font-size: 20px; }
</style>