<template>
  <div>
    <div class="g-flex g-flex-justify-between g-flex-align-center" style="margin-bottom:16px">
      <h3>Banner Management</h3>
      <el-button type="primary" @click="showAdd = true">+ Add Banner</el-button>
    </div>

    <el-table :data="banners" v-loading="loading" style="width:100%">
      <el-table-column label="Preview" width="180">
        <template #default="{ row }">
          <img :src="imgUrl(row.image)" style="width:160px;height:80px;object-fit:cover;border-radius:4px" @error="onImgError" />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="Title" />
      <el-table-column prop="link" label="Link" />
      <el-table-column prop="sort" label="Sort" width="80" />
      <el-table-column label="Status" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? 'Active' : 'Inactive' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="220">
        <template #default="{ row }">
          <el-button size="small" @click="editBanner(row)">Edit</el-button>
          <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">{{ row.status === 1 ? 'Deactivate' : 'Activate' }}</el-button>
          <el-button size="small" type="danger" @click="deleteBanner(row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showAdd" title="Add Banner" width="520px">
      <el-form label-position="top">
        <el-form-item label="Image">
          <el-upload :action="uploadUrl" :headers="uploadHeaders" :on-success="onAddUpload" :show-file-list="false" accept="image/*">
            <el-button>Upload</el-button>
          </el-upload>
          <img v-if="addForm.image" :src="imgUrl(addForm.image)" style="width:200px;height:100px;object-fit:cover;margin-top:8px;border-radius:4px" @error="onImgError" />
        </el-form-item>
        <el-form-item label="Title">
          <el-input v-model="addForm.title" />
        </el-form-item>
        <el-form-item label="Link">
          <el-input v-model="addForm.link" placeholder="/miaoshalist" />
        </el-form-item>
        <el-form-item label="Sort Order">
          <el-input-number v-model="addForm.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">Cancel</el-button>
        <el-button type="primary" :loading="adding" @click="doAdd">Add</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEdit" title="Edit Banner" width="520px">
      <el-form label-position="top">
        <el-form-item label="Image">
          <el-upload :action="uploadUrl" :headers="uploadHeaders" :on-success="onEditUpload" :show-file-list="false" accept="image/*">
            <el-button>Upload</el-button>
          </el-upload>
          <img v-if="editForm.image" :src="imgUrl(editForm.image)" style="width:200px;height:100px;object-fit:cover;margin-top:8px;border-radius:4px" @error="onImgError" />
        </el-form-item>
        <el-form-item label="Title">
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="Link">
          <el-input v-model="editForm.link" />
        </el-form-item>
        <el-form-item label="Sort Order">
          <el-input-number v-model="editForm.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="doEdit">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, post, qe, API_BASE } from '@/api/request'

const loading = ref(false)
const banners = ref([])
const showAdd = ref(false)
const showEdit = ref(false)
const adding = ref(false)
const saving = ref(false)

const IMG_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f4f2ee%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2212%22%3ENo Image%3C/text%3E%3C/svg%3E'

const getToken = () => localStorage.getItem('theoutnet_token') || ''
const uploadUrl = `${API_BASE}/home/upload/file`
const uploadHeaders = computed(() => ({ token: getToken() }))

const imgUrl = (url) => {
  if (!url) return IMG_FALLBACK
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads/')) return (API_BASE || '') + url
  return url
}
const onImgError = (e) => { e.target.src = IMG_FALLBACK }

const addForm = reactive({ image: '', title: '', link: '', sort: 0 })
const onAddUpload = (res) => { if (res.code === 0) addForm.image = res.data.url }

const editForm = reactive({ _id: '', image: '', title: '', link: '', sort: 0 })
const onEditUpload = (res) => { if (res.code === 0) editForm.image = res.data.url }

const fetchBanners = async () => {
  loading.value = true
  const res = await get('/home/admin/banners', { pageSize: 100 })
  if (res?.data?.list) banners.value = res.data.list
  loading.value = false
}

const doAdd = async () => {
  if (!addForm.image) return ElMessage.warning('Please upload an image')
  adding.value = true
  await qe(post('/home/admin/banners/add', { ...addForm }))
  adding.value = false
  showAdd.value = false
  addForm.image = ''; addForm.title = ''; addForm.link = ''; addForm.sort = 0
  ElMessage.success('Banner added')
  await fetchBanners()
}

const editBanner = (b) => {
  editForm._id = b._id
  editForm.image = b.image
  editForm.title = b.title || ''
  editForm.link = b.link || ''
  editForm.sort = b.sort || 0
  showEdit.value = true
}

const doEdit = async () => {
  saving.value = true
  await qe(post(`/home/admin/banners/update/${editForm._id}`, { ...editForm }))
  saving.value = false
  showEdit.value = false
  ElMessage.success('Banner updated')
  await fetchBanners()
}

const toggleStatus = async (b) => {
  const newStatus = b.status === 1 ? 0 : 1
  await qe(post(`/home/admin/banners/update/${b._id}`, { status: newStatus }))
  ElMessage.success(newStatus === 1 ? 'Activated' : 'Deactivated')
  await fetchBanners()
}

const deleteBanner = async (b) => {
  await ElMessageBox.confirm('Delete this banner?', 'Confirm', { type: 'warning' })
  await qe(post(`/home/admin/banners/delete/${b._id}`))
  ElMessage.success('Deleted')
  await fetchBanners()
}

onMounted(() => fetchBanners())
</script>
