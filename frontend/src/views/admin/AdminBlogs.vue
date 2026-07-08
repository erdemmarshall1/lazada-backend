<template>
  <div class="admin-cms">
    <div class="admin-cms-header">
      <h2>Blog Posts</h2>
      <el-button type="primary" @click="openDialog()">New Post</el-button>
    </div>

    <el-table :data="blogs" stripe v-loading="loading" style="width:100%">
      <el-table-column prop="title" label="Title" min-width="180" />
      <el-table-column prop="slug" label="Slug" width="140" />
      <el-table-column prop="category" label="Category" width="100" />
      <el-table-column prop="author" label="Author" width="100" />
      <el-table-column label="Status" width="80">
        <template #default="{ row }"><el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? 'Published' : 'Draft' }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="'Date'" width="100">
        <template #default="{ row }">{{ (row.publishedAt || row.createdAt || '').slice(0, 10) }}</template>
      </el-table-column>
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

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? 'Edit Post' : 'New Post'" width="700px">
      <el-form :model="dialog.form" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Title" required>
              <el-input v-model="dialog.form.title" placeholder="Post title" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Slug" required>
              <el-input v-model="dialog.form.slug" placeholder="post-url-slug" :disabled="dialog.isEdit" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Summary">
          <el-input v-model="dialog.form.summary" type="textarea" :rows="2" placeholder="Brief excerpt" />
        </el-form-item>
        <el-form-item label="Content (HTML)">
          <el-input v-model="dialog.form.content" type="textarea" :rows="12" placeholder="HTML content" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="Category">
              <el-input v-model="dialog.form.category" placeholder="e.g. Fashion" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Author">
              <el-input v-model="dialog.form.author" placeholder="Author name" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Published">
              <el-switch v-model="dialog.form.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Tags (comma separated)">
          <el-input v-model="tagsStr" placeholder="tag1, tag2, tag3" />
        </el-form-item>
        <el-form-item label="Image URL">
          <el-input v-model="dialog.form.image" placeholder="https://..." />
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
import { ref, reactive, onMounted, watch } from 'vue'
import { get, post, put, del } from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const blogs = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const tagsStr = ref('')

const dialog = reactive({
  visible: false, isEdit: false, loading: false,
  form: { title: '', slug: '', content: '', summary: '', image: '', category: '', tags: [], author: '', status: 1 },
})

watch(() => dialog.visible, (v) => { if (v) tagsStr.value = (dialog.form.tags || []).join(', ') })

const loadData = async () => {
  loading.value = true
  const res = await get('/home/cms/admin/blogs', { page: page.value, pageSize })
  loading.value = false
  if (res?.code === 0 && res?.data) {
    blogs.value = res.data.list || []
    total.value = res.data.total || 0
  }
}

const openDialog = (row) => {
  if (row) {
    dialog.isEdit = true
    dialog.form = { ...row, tags: row.tags || [] }
    tagsStr.value = (row.tags || []).join(', ')
  } else {
    dialog.isEdit = false
    dialog.form = { title: '', slug: '', content: '', summary: '', image: '', category: '', tags: [], author: '', status: 1 }
    tagsStr.value = ''
  }
  dialog.visible = true
}

const save = async () => {
  const payload = { ...dialog.form, tags: tagsStr.value.split(',').map(t => t.trim()).filter(Boolean) }
  dialog.loading = true
  const fn = dialog.isEdit ? put(`/home/cms/admin/blogs/${dialog.form._id}`) : post('/home/cms/admin/blogs')
  const res = await fn(payload)
  dialog.loading = false
  if (res?.code === 0) {
    ElMessage.success(dialog.isEdit ? 'Post updated' : 'Post created')
    dialog.visible = false
    loadData()
  } else {
    ElMessage.error(res?.msg || 'Failed to save')
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`Delete "${row.title}"?`, 'Confirm', { type: 'warning' }).then(async () => {
    const res = await del(`/home/cms/admin/blogs/${row._id}`)
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