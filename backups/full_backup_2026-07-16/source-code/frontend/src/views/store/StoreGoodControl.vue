<template>
  <div>
    <div class="g-flex-align-center g-flex-justify-between"><h3>Product Management</h3><el-button type="primary" size="small" style="background:var(--g-main_color);border-color:var(--g-main_color)" @click="openAdd">+ Add Product</el-button></div>
    <template v-if="list.length>0">
    <div class="g-responsive-table">
    <el-table :data="list" style="width:100%;margin-top:16px">
      <el-table-column label="Product" min-width="200"><template #default="{row}"><div class="g-flex-align-center" style="gap:8px"><img :src="$imgUrl(row.images?.[0])" style="width:40px;height:40px;border-radius:4px;object-fit:cover" loading="lazy" @error="$imgFallback" /><span>{{ row.name }}</span></div></template></el-table-column>
      <el-table-column prop="minPrice" label="Price" width="100" />
      <el-table-column prop="salesCount" label="Sales" width="80" />
      <el-table-column prop="status" label="Status" width="100"><template #default="{row}">{{ row.status===1?'Active':'Inactive' }}</template></el-table-column>
      <el-table-column label="Actions" width="280">
        <template #default="{row}">
          <el-button size="small" @click="editItem=row;populateForm(row);showForm=true">Edit</el-button>
          <el-button size="small" :type="row.status===1?'warning':'success'" @click="toggleStatus(row)">{{ row.status===1?'Deactivate':'Activate' }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>
    </template>
    <div v-else class="c-no-list"><span class="c-no-list-text">No products</span></div>
    <el-dialog v-model="showForm" :title="editItem?'Edit Product':'Add Product'" width="600px" @closed="resetForm">
      <el-form :model="form" label-position="top">
        <el-form-item label="Product Images">
          <div class="image-list" v-if="form.images.length > 0">
            <div class="image-item" v-for="(img, idx) in form.images" :key="idx">
              <img :src="$imgUrl(img)" @error="$imgFallback" />
              <el-button size="small" circle type="danger" class="img-remove" @click="removeImage(idx)">X</el-button>
            </div>
          </div>
          <el-upload class="image-upload-btn" :show-file-list="false" :before-upload="handleImageUpload" accept="image/*">
            <el-button type="primary" size="small">+ Add Image</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="Name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="Description"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="Category">
          <el-select v-model="form.categoryId" style="width:100%">
            <el-option v-for="cat in categories" :key="cat._id" :label="cat.name" :value="cat._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Price"><el-input-number v-model="form.price" :min="0" :precision="2" style="width:100%" /></el-form-item>
        <el-form-item label="Stock"><el-input-number v-model="form.stock" :min="0" style="width:100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm=false">Cancel</el-button>
        <el-button type="primary" @click="saveProduct">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, post, qe } from '@/api/request'
import { ElMessage } from 'element-plus'

const list = ref([])
const showForm = ref(false)
const editItem = ref(null)
const categories = ref([])
const form = ref({ name: '', description: '', categoryId: '', price: 0, stock: 100, images: [] })

const loadList = async () => { const res = await get('/home/userGoods/getList', { pageSize: 50 }); if (res?.data) list.value = res.data.list || [] }

const toggleStatus = async (row) => { await qe(post('/home/userGoods/up', { id: row._id, status: row.status === 1 ? 0 : 1 })); await loadList() }

const openAdd = () => { editItem.value = null; form.value = { name: '', description: '', categoryId: '', price: 0, stock: 100, images: [] }; showForm.value = true }

const populateForm = (row) => {
  form.value = {
    name: row.name,
    description: row.description,
    categoryId: row.categoryId,
    price: row.minPrice || 0,
    stock: row.stock || 100,
    images: row.images ? [...row.images] : [],
  }
}

const resetForm = () => { if (!editItem.value) form.value = { name: '', description: '', categoryId: '', price: 0, stock: 100, images: [] } }

const handleImageUpload = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => { form.value.images.push(e.target.result) }
  reader.readAsDataURL(file)
  return false
}

const removeImage = (idx) => { form.value.images.splice(idx, 1) }

const saveProduct = async () => {
  const payload = {
    name: form.value.name,
    description: form.value.description,
    categoryId: form.value.categoryId,
    images: form.value.images,
    skus: [{ price: form.value.price, stock: form.value.stock, attrs: [] }],
  }
  if (editItem.value) { payload.id = editItem.value._id; await qe(post('/home/userGoods/edit', payload)) }
  else await qe(post('/home/userGoods/add', payload))
  showForm.value = false
  ElMessage.success(editItem.value ? 'Product updated' : 'Product added')
  await loadList()
}

onMounted(async () => {
  await loadList()
  const catRes = await get('/main/goodsCategory/getList')
  if (catRes?.data) categories.value = catRes.data
})
</script>

<style scoped>
.image-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.image-item { position: relative; width: 80px; height: 80px; border-radius: 4px; overflow: hidden; border: 1px solid var(--g-border); }
.image-item img { width: 100%; height: 100%; object-fit: cover; }
.img-remove { position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; padding: 0; min-width: unset; font-size: 10px; }
.image-upload-btn { display: inline-block; }
@media (max-width: 768px) {
  .g-responsive-table { overflow-x: auto; }
  .g-responsive-table :deep(.el-table) { min-width: 600px; }
  :deep(.el-dialog) { width: 90% !important; max-width: 400px; }
}
</style>
