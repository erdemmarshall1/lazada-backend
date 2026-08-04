<template>
  <div class="admin-page">
    <div class="page-card">
      <div class="page-header">
        <i class="iconfont icon-tupian"></i>
        <h2>Banners</h2>
      </div>
      <div class="g-flex g-flex-justify-end" style="margin-bottom:16px">
        <el-button type="primary" @click="showAdd = true">+ Add Banner</el-button>
      </div>

    <el-table :data="banners" v-loading="loading" style="width:100%">
      <el-table-column label="Preview" width="180">
        <template #default="{ row }">
          <img :src="imgUrl(row.image)" style="width:160px;height:80px;object-fit:cover;border-radius:4px" @error="onImgError" />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="Title" />
      <el-table-column label="Position" width="110">
        <template #default="{ row }">
          <el-tag :type="row.position === 'popup' ? 'warning' : 'info'" size="small">{{ row.position }}</el-tag>
        </template>
      </el-table-column>
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
        <el-form-item label="Position">
          <el-select v-model="addForm.position" style="width:100%">
            <el-option label="Homepage" value="home" />
            <el-option label="Category" value="category" />
            <el-option label="Popup Advertisement" value="popup" />
          </el-select>
        </el-form-item>
        <template v-if="addForm.position === 'popup'">
          <el-form-item label="Display Duration (seconds)">
            <el-input-number v-model="addForm.popupDuration" :min="1" :max="600" style="width:100%" />
          </el-form-item>
          <el-form-item label="Delay Before Show (seconds)">
            <el-input-number v-model="addForm.popupDelay" :min="0" :max="3600" style="width:100%" />
          </el-form-item>
          <div class="g-flex" style="gap:12px;flex-wrap:wrap">
            <el-form-item label="Start At (optional)">
              <el-date-picker v-model="addForm.popupStartAt" type="datetime" placeholder="Start displaying" style="width:100%" value-format="YYYY-MM-DDTHH:mm:ss" />
            </el-form-item>
            <el-form-item label="End At (optional)">
              <el-date-picker v-model="addForm.popupEndAt" type="datetime" placeholder="Stop displaying" style="width:100%" value-format="YYYY-MM-DDTHH:mm:ss" />
            </el-form-item>
          </div>
          <el-form-item label="Show Frequency">
            <el-input-number v-model="addForm.popupFrequency" :min="1" :max="30" style="width:100%" />
            <div class="field-hint">How many times this popup may be shown to the same visitor (per 24h).</div>
          </el-form-item>
          <el-form-item label="Dismissible">
            <el-switch v-model="addForm.popupDismissible" />
            <span class="toggle-label">Allow users to close the popup</span>
          </el-form-item>
        </template>
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
        <el-form-item label="Position">
          <el-select v-model="editForm.position" style="width:100%">
            <el-option label="Homepage" value="home" />
            <el-option label="Category" value="category" />
            <el-option label="Popup Advertisement" value="popup" />
          </el-select>
        </el-form-item>
        <template v-if="editForm.position === 'popup'">
          <el-form-item label="Display Duration (seconds)">
            <el-input-number v-model="editForm.popupDuration" :min="1" :max="600" style="width:100%" />
          </el-form-item>
          <el-form-item label="Delay Before Show (seconds)">
            <el-input-number v-model="editForm.popupDelay" :min="0" :max="3600" style="width:100%" />
          </el-form-item>
          <div class="g-flex" style="gap:12px;flex-wrap:wrap">
            <el-form-item label="Start At (optional)">
              <el-date-picker v-model="editForm.popupStartAt" type="datetime" placeholder="Start displaying" style="width:100%" value-format="YYYY-MM-DDTHH:mm:ss" />
            </el-form-item>
            <el-form-item label="End At (optional)">
              <el-date-picker v-model="editForm.popupEndAt" type="datetime" placeholder="Stop displaying" style="width:100%" value-format="YYYY-MM-DDTHH:mm:ss" />
            </el-form-item>
          </div>
          <el-form-item label="Show Frequency">
            <el-input-number v-model="editForm.popupFrequency" :min="1" :max="30" style="width:100%" />
            <div class="field-hint">How many times this popup may be shown to the same visitor (per 24h).</div>
          </el-form-item>
          <el-form-item label="Dismissible">
            <el-switch v-model="editForm.popupDismissible" />
            <span class="toggle-label">Allow users to close the popup</span>
          </el-form-item>
        </template>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminGet, adminPost } from '@/api/adminRequest'
import { API_BASE } from '@/api/request'

const loading = ref(false)
const banners = ref([])
const showAdd = ref(false)
const showEdit = ref(false)
const adding = ref(false)
const saving = ref(false)

const IMG_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f4f2ee%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2212%22%3ENo Image%3C/text%3E%3C/svg%3E'

const getToken = () => localStorage.getItem('theoutnet_admin_token') || localStorage.getItem('theoutnet_token') || ''
const uploadUrl = `${API_BASE}/home/upload/file`
const uploadHeaders = computed(() => ({ token: getToken() }))

const imgUrl = (url) => {
  if (!url) return IMG_FALLBACK
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads/')) return (API_BASE || '') + url
  return url
}
const onImgError = (e) => { e.target.src = IMG_FALLBACK }

const addForm = reactive({
  image: '', title: '', link: '', sort: 0,
  position: 'home',
  popupDuration: 10, popupDelay: 0,
  popupStartAt: '', popupEndAt: '',
  popupFrequency: 1, popupDismissible: true,
})
const onAddUpload = (res) => { if (res.code === 0) addForm.image = res.data.url }

const editForm = reactive({
  _id: '', image: '', title: '', link: '', sort: 0,
  position: 'home',
  popupDuration: 10, popupDelay: 0,
  popupStartAt: '', popupEndAt: '',
  popupFrequency: 1, popupDismissible: true,
})
const onEditUpload = (res) => { if (res.code === 0) editForm.image = res.data.url }

const fetchBanners = async () => {
  loading.value = true
  const res = await adminGet('/home/admin/banners', { pageSize: 100 })
  if (res?.code === 0 && res.data?.list) banners.value = res.data.list
  loading.value = false
}

const doAdd = async () => {
  if (!addForm.image) return ElMessage.warning('Please upload an image')
  adding.value = true
  const res = await adminPost('/home/admin/banners/add', { ...addForm })
  adding.value = false
  if (res?.code !== 0) { if (res?.msg) ElMessage.error(res.msg); return }
  showAdd.value = false
  addForm.image = ''; addForm.title = ''; addForm.link = ''; addForm.sort = 0
  addForm.position = 'home'
  addForm.popupDuration = 10; addForm.popupDelay = 0
  addForm.popupStartAt = ''; addForm.popupEndAt = ''
  addForm.popupFrequency = 1; addForm.popupDismissible = true
  ElMessage.success('Banner added')
  await fetchBanners()
}

const editBanner = (b) => {
  editForm._id = b._id
  editForm.image = b.image
  editForm.title = b.title || ''
  editForm.link = b.link || ''
  editForm.sort = b.sort || 0
  editForm.position = b.position || 'home'
  editForm.popupDuration = b.popupDuration ?? 10
  editForm.popupDelay = b.popupDelay ?? 0
  editForm.popupStartAt = b.popupStartAt || ''
  editForm.popupEndAt = b.popupEndAt || ''
  editForm.popupFrequency = b.popupFrequency ?? 1
  editForm.popupDismissible = b.popupDismissible !== false
  showEdit.value = true
}

const doEdit = async () => {
  saving.value = true
  const res = await adminPost(`/home/admin/banners/update/${editForm._id}`, { ...editForm })
  saving.value = false
  if (res?.code !== 0) { if (res?.msg) ElMessage.error(res.msg); return }
  showEdit.value = false
  ElMessage.success('Banner updated')
  await fetchBanners()
}

const toggleStatus = async (b) => {
  const newStatus = b.status === 1 ? 0 : 1
  const res = await adminPost(`/home/admin/banners/update/${b._id}`, { status: newStatus })
  if (res?.code !== 0) { if (res?.msg) ElMessage.error(res.msg); return }
  ElMessage.success(newStatus === 1 ? 'Activated' : 'Deactivated')
  await fetchBanners()
}

const deleteBanner = async (b) => {
  await ElMessageBox.confirm('Delete this banner?', 'Confirm', { type: 'warning' })
  const res = await adminPost(`/home/admin/banners/delete/${b._id}`)
  if (res?.code !== 0) { if (res?.msg) ElMessage.error(res.msg); return }
  ElMessage.success('Deleted')
  await fetchBanners()
}

onMounted(() => fetchBanners())
</script>

<style scoped>
.field-hint {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
  margin-top: 4px;
}
.toggle-label {
  margin-left: 8px;
  font-size: 13px;
  color: #666;
}
</style>
