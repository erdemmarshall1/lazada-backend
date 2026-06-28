<template>
  <div class="admin-products">
    <div class="g-flex-align-center g-flex-justify-between" style="margin-bottom:16px">
      <h2 style="margin:0">Products</h2>
      <el-button type="primary" style="background:var(--g-main_color);border-color:var(--g-main_color)" @click="openAdd">+ Add Product</el-button>
    </div>
    <div class="g-responsive-table">
    <el-table :data="products" v-loading="loading" style="width:100%">
      <el-table-column label="Image" width="80">
        <template #default="{row}"><img :src="$imgUrl(row.images?.[0] || row.image || row.img)" style="width:50px;height:50px;object-fit:cover;border-radius:4px" loading="lazy" @error="$imgFallback" /></template>
      </el-table-column>
      <el-table-column prop="name" label="Name" min-width="200" />
      <el-table-column label="Price" width="100">
        <template #default="{row}">${{ row.minPrice || row.price }}</template>
      </el-table-column>
      <el-table-column prop="salesCount" label="Sales" width="80" />
      <el-table-column label="Status" width="100">
        <template #default="{row}">{{ row.status === 1 ? 'Active' : 'Inactive' }}</template>
      </el-table-column>
      <el-table-column label="Actions" width="240" fixed="right">
        <template #default="{row}">
          <el-button size="small" type="primary" @click="openEdit(row)">Edit</el-button>
          <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">{{ row.status === 1 ? 'Deactivate' : 'Activate' }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>
    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="fetch" />
    </div>

    <el-dialog v-model="showEdit" :title="editItem ? 'Edit Product' : 'Add Product'" width="720px" destroy-on-close>
      <el-form :model="editForm" label-position="top">
        <el-form-item label="Product Images">
          <div class="edit-img-list">
            <div class="edit-img-item" v-for="(img, idx) in editForm.images" :key="idx">
              <img :src="$imgUrl(img)" style="width:100px;height:100px;object-fit:cover;border-radius:6px" @error="$imgFallback" />
              <el-button size="small" circle type="danger" class="img-remove-btn" @click="removeImage(idx)">x</el-button>
            </div>
            <el-upload :show-file-list="false" :before-upload="handleImageUpload" accept="image/*">
              <div class="edit-img-add">
                <span style="font-size:24px;color:#999">+</span>
                <span style="font-size:12px;color:#999;margin-top:4px">Add Image</span>
              </div>
            </el-upload>
          </div>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Title">
              <el-input v-model="editForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Brand">
              <el-input v-model="editForm.brand" placeholder="Product brand" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Price">
              <el-input-number v-model="editForm.price" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Stock">
              <el-input-number v-model="editForm.stock" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Category">
          <el-select v-model="editForm.categoryId" style="width:100%" filterable>
            <el-option v-for="cat in categories" :key="cat._id" :label="cat.name" :value="cat._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Shop" v-if="!editItem">
          <el-select v-model="editForm.shopId" style="width:100%" filterable>
            <el-option v-for="shop in shops" :key="shop._id" :label="shop.name" :value="shop._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="editForm.description" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="saveProduct">{{ editItem ? 'Save Changes' : 'Add Product' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { get, post, qe, uploadFile } from '@/api/request'

const products = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const categories = ref([])
const shops = ref([])
const showEdit = ref(false)
const saving = ref(false)
const editItem = ref(null)
const editForm = ref({
  name: '', brand: '', description: '', categoryId: '', price: 0, stock: 100, images: [], shopId: '',
})

const fetch = async () => {
  loading.value = true
  const res = await qe(get(`/home/admin/products?page=${page.value}&pageSize=${pageSize.value}`))
  if (res) { products.value = res.data?.list || []; total.value = res.data?.total || 0 }
  loading.value = false
}

const openEdit = (row) => {
  editItem.value = row
  editForm.value = {
    name: row.name || '',
    brand: row.brand || '',
    description: row.description || '',
    categoryId: row.categoryId || '',
    price: row.minPrice || row.price || 0,
    stock: row.skus?.[0]?.stock || 0,
    images: row.images?.length > 0 ? [...row.images] : (row.image ? [row.image] : row.img ? [row.img] : []),
    shopId: '',
  }
  showEdit.value = true
}

const openAdd = () => {
  editItem.value = null
  editForm.value = { name: '', brand: '', description: '', categoryId: '', price: 0, stock: 100, images: [], shopId: '' }
  showEdit.value = true
}

const toggleStatus = async (row) => {
  await qe(post('/home/admin/toggle-product-status', { productId: row._id, status: row.status === 1 ? 0 : 1 }))
  ElMessage.success('Status updated')
  await fetch()
}

const removeImage = (idx) => {
  editForm.value.images.splice(idx, 1)
}

const handleImageUpload = async (file) => {
  const res = await qe(uploadFile(file))
  if (res?.data?.url) editForm.value.images.push(res.data.url)
  else ElMessage.error('Upload failed')
  return false
}

const saveProduct = async () => {
  saving.value = true
  const payload = {
    name: editForm.value.name,
    brand: editForm.value.brand,
    description: editForm.value.description,
    categoryId: editForm.value.categoryId,
    images: editForm.value.images,
    skus: [{ price: editForm.value.price, stock: editForm.value.stock, attrs: [] }],
  }
  let res
  if (editItem.value) {
    payload.id = editItem.value._id
    res = await qe(post('/home/admin/update-product', payload))
  } else {
    payload.shopId = editForm.value.shopId
    res = await qe(post('/home/admin/add-product', payload))
  }
  saving.value = false
  if (res) {
    ElMessage.success(editItem.value ? 'Product updated!' : 'Product added!')
    showEdit.value = false
    await fetch()
  }
}

onMounted(async () => {
  await fetch()
  const catRes = await get('/main/goodsCategory/getList')
  if (catRes?.data) categories.value = catRes.data
  const shopRes = await get('/home/admin/shops', { pageSize: 100 })
  if (shopRes?.data?.list) shops.value = shopRes.data.list
})
</script>

<style scoped>
.admin-products { padding: 20px; }
.pagination-wrap { margin-top: 20px; display: flex; justify-content: center; }
.edit-img-list { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; }
.edit-img-item { position: relative; width: 100px; height: 100px; border-radius: 6px; overflow: hidden; border: 1px solid var(--g-border); flex-shrink: 0; }
.edit-img-item img { width: 100%; height: 100%; object-fit: cover; }
.img-remove-btn { position: absolute; top: -6px; right: -6px; width: 22px; height: 22px; min-width: auto; padding: 0; font-size: 12px; line-height: 1; }
.edit-img-add { width: 100px; height: 100px; border: 1px dashed var(--g-border); border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.edit-img-add:hover { border-color: var(--g-main_color); }
@media (max-width: 768px) { .admin-products { padding: 12px; } }
</style>
