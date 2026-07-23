<template>
  <div class="admin-page admin-homepage-sections">
    <div class="admin-cms-header">
      <h2>Homepage Sections</h2>
      <el-button type="primary" @click="showForm(null)">+ Add Section</el-button>
    </div>

    <div class="g-responsive-table">
      <el-table :data="sections" stripe v-loading="loading" row-key="_id">
        <el-table-column label="Order" width="60">
          <template #default="{ row, $index }">
            <span class="drag-handle" @click="moveUp($index)" v-if="$index > 0">▲</span>
            <span class="drag-handle" @click="moveDown($index)" v-if="$index < sections.length - 1">▼</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="Sort" width="60" />
        <el-table-column prop="name" label="Name" min-width="140" />
        <el-table-column prop="type" label="Type" width="130">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.type)" size="small">{{ row.type.replace('_', ' ') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="Title" min-width="180" show-overflow-tooltip />
        <el-table-column label="Status" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? 'Active' : 'Inactive' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showForm(row)">Edit</el-button>
            <el-button size="small" type="danger" @click="doDelete(row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editing ? 'Edit Section' : 'Add Section'" width="600px">
      <el-form :model="form" label-position="top">
        <el-form-item label="Name" required>
          <el-input v-model="form.name" placeholder="Internal name" />
        </el-form-item>
        <el-form-item label="Type" required>
          <el-select v-model="form.type" style="width:100%">
            <el-option label="Banner Carousel" value="banner" />
            <el-option label="Product Grid" value="product_grid" />
            <el-option label="Category Grid" value="category_grid" />
            <el-option label="Featured" value="featured" />
            <el-option label="Promo Bar" value="promo_bar" />
            <el-option label="Custom HTML" value="custom_html" />
          </el-select>
        </el-form-item>
        <el-form-item label="Title">
          <el-input v-model="form.title" placeholder="Section heading" />
        </el-form-item>
        <el-form-item label="Subtitle">
          <el-input v-model="form.subtitle" placeholder="Optional subtitle" />
        </el-form-item>
        <el-form-item label="Sort Order">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="Status">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="Config (JSON)">
          <el-input v-model="form.configStr" type="textarea" :rows="6" placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}" />
          <div style="font-size:11px;color:#999;margin-top:4px">
            <b>banner:</b> &#123; "images": ["url1","url2"] &#125; |
            <b>product_grid:</b> &#123; "productIds": ["id1","id2"] &#125; |
            <b>category_grid:</b> &#123; "categoryIds": ["id1"] &#125; |
            <b>promo_bar:</b> &#123; "text": "Sale!", "link": "/sale" &#125;
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="doSave" :loading="saving">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, post, put, del } from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const sections = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const editing = ref(null)
const form = ref({
  name: '', type: 'banner', title: '', subtitle: '',
  sort: 0, status: 1, configStr: '{}',
})

const typeTag = (t) => {
  const map = { banner: '', product_grid: 'success', category_grid: 'warning', featured: 'primary', promo_bar: 'info', custom_html: '' }
  return map[t] || ''
}

const load = async () => {
  loading.value = true
  const res = await get('/home/cms/admin/homepage-sections')
  if (res?.code === 0 && res?.data) sections.value = res.data
  loading.value = false
}

const showForm = (section) => {
  if (section) {
    editing.value = section._id
    form.value = {
      name: section.name,
      type: section.type,
      title: section.title || '',
      subtitle: section.subtitle || '',
      sort: section.sort || 0,
      status: section.status,
      configStr: JSON.stringify(section.config || {}, null, 2),
    }
  } else {
    editing.value = null
    form.value = { name: '', type: 'banner', title: '', subtitle: '', sort: 0, status: 1, configStr: '{}' }
  }
  dialogVisible.value = true
}

const doSave = async () => {
  if (!form.value.name || !form.value.type) { ElMessage.warning('Name and type required'); return }
  let config = {}
  try { config = JSON.parse(form.value.configStr) } catch { ElMessage.warning('Invalid JSON in config'); return }
  saving.value = true
  const payload = { ...form.value, config }
  delete payload.configStr
  let res
  if (editing.value) {
    res = await put(`/home/cms/admin/homepage-sections/${editing.value}`, payload)
  } else {
    res = await post('/home/cms/admin/homepage-sections', payload)
  }
  saving.value = false
  if (res?.code === 0) {
    ElMessage.success(res.msg || 'Saved')
    dialogVisible.value = false
    load()
  } else {
    ElMessage.error(res?.msg || 'Save failed')
  }
}

const doDelete = async (section) => {
  try {
    await ElMessageBox.confirm(`Delete "${section.name}"?`, 'Confirm', { type: 'warning' })
    const res = await del(`/home/cms/admin/homepage-sections/${section._id}`)
    if (res?.code === 0) {
      ElMessage.success(res.msg || 'Deleted')
      load()
    }
  } catch {}
}

const moveUp = async (idx) => {
  if (idx <= 0) return
  const arr = [...sections.value]
  ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
  sections.value = arr
  await post('/home/cms/admin/homepage-sections/reorder', { ids: arr.map(s => s._id) })
}

const moveDown = async (idx) => {
  if (idx >= sections.value.length - 1) return
  const arr = [...sections.value]
  ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
  sections.value = arr
  await post('/home/cms/admin/homepage-sections/reorder', { ids: arr.map(s => s._id) })
}

onMounted(load)
</script>

<style scoped>
.admin-homepage-sections { padding: 20px; }
.admin-homepage-sections h2 { margin-bottom: 16px; }
.drag-handle { cursor: pointer; padding: 2px 4px; font-size: 12px; user-select: none; }
.drag-handle:hover { color: var(--g-main_color); }
</style>
