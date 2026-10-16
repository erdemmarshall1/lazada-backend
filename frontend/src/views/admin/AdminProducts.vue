<template>
  <div class="admin-page">
  <div class="admin-products">
    <div class="page-card">
      <div class="page-header">
        <i class="iconfont icon-shangpin"></i>
        <h2>Products</h2>
      </div>
      <div class="g-flex-align-center g-flex-justify-end" style="margin-bottom:16px">
        <div class="g-flex-align-center" style="gap:8px">
          <el-select v-model="imageFilter" placeholder="Image Source" size="small" style="width:140px" @change="page=1;fetch()">
            <el-option label="All Products" value="" />
            <el-option label="Remote CDN Images" value="remote" />
            <el-option label="Local Uploaded" value="local" />
            <el-option label="No Images" value="none" />
          </el-select>
          <el-button type="primary" style="background:var(--g-main_color);border-color:var(--g-main_color)" @click="openAdd">+ Add Product</el-button>
        </div>
      </div>
    <div class="g-responsive-table">
    <el-table :data="filteredProducts" v-loading="loading" style="width:100%">
      <el-table-column label="Image" width="80">
        <template #default="{row}">
          <div style="position:relative">
            <img :src="$imgUrl(row.images?.[0] || row.image || row.img)" style="width:50px;height:50px;object-fit:cover;border-radius:4px" loading="lazy" @error="handleImgError($event,row)" />
            <el-tag v-if="row._imgStatus === 'broken'" size="small" type="danger" effect="dark" style="position:absolute;top:-4px;right:-4px;padding:0 4px;font-size:10px;line-height:16px;height:16px">!</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="Name" min-width="200" />
      <el-table-column label="Price" width="100">
        <template #default="{row}">${{ row.minPrice || row.price }}</template>
      </el-table-column>
      <el-table-column prop="salesCount" label="Sales" width="80" />
      <el-table-column label="Images" width="80" align="center">
        <template #default="{row}">
          <el-tag v-if="isRemoteImage(row)" size="small" type="warning">CDN</el-tag>
          <el-tag v-else-if="row.images?.length" size="small" type="success">Local</el-tag>
          <el-tag v-else size="small" type="danger">None</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Distributed" width="100" align="center">
        <template #default="{row}">
          <el-tag v-if="row.isDistributed" size="small" type="success">Distributed</el-tag>
          <el-tag v-else size="small" type="info">Source</el-tag>
        </template>
      </el-table-column>
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

    <el-dialog v-model="showEdit" :title="editItem ? 'Edit Product' : 'Add Product'" width="min(760px, 94vw)" top="6vh" destroy-on-close>
      <el-form :model="editForm" label-position="top">
        <el-form-item label="Product Images">
          <div class="edit-img-list">
            <div class="edit-img-item" v-for="(img, idx) in editForm.images" :key="idx">
              <img :src="$imgUrl(img)" style="width:100px;height:100px;object-fit:cover;border-radius:6px" @error="$imgFallback" />
              <el-button size="small" circle type="danger" class="img-remove-btn" @click="removeImage(idx)">x</el-button>
            </div>
            <el-upload :show-file-list="false" :before-upload="handleImageUpload" accept="image/*" multiple drag>
              <div class="edit-img-add">
                <span style="font-size:24px;color:#999">+</span>
                <span style="font-size:12px;color:#999;margin-top:4px">Select / Drop images</span>
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
        <el-form-item label="Categories (select one or more)">
          <el-select v-model="editForm.categoryIds" multiple filterable collapse-tags collapse-tags-tooltip placeholder="Select categories" style="width:100%">
            <el-option v-for="cat in categories" :key="cat._id" :label="cat.name" :value="cat._id" />
          </el-select>
        </el-form-item>

        <div v-if="showSizes" class="size-block">
          <div class="size-title">Sizes</div>
          <div class="size-group" v-for="group in sizeGroups" :key="group.label">
            <div class="size-group-label">{{ group.label }}</div>
            <div class="size-values">
              <span
                v-for="opt in group.options"
                :key="group.label + opt"
                class="size-chip"
                :class="{ active: editForm.sizes.includes(opt) }"
                @click="toggleSize(opt)"
              >{{ opt }}</span>
            </div>
          </div>
          <div class="size-custom">
            <el-input v-model="customSize" size="small" placeholder="Add custom size" style="width:160px" @keyup.enter="addCustomSize" />
            <el-button size="small" @click="addCustomSize">Add</el-button>
            <span v-if="editForm.sizes.length" class="size-selected">Selected: {{ editForm.sizes.join(', ') }}</span>
          </div>
        </div>

        <el-form-item label="Shop" v-if="!editItem">
          <el-select v-model="editForm.shopId" style="width:100%" filterable>
            <el-option v-for="shop in shops" :key="shop._id" :label="shop.name" :value="shop._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Description">
          <HtmlEditor v-model="editForm.description" height="200px" placeholder="Write the product description…" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="saveProduct">{{ editItem ? 'Save Changes' : 'Add Product' }}</el-button>
      </template>
    </el-dialog>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminGet, adminPost } from '@/api/adminRequest'
import { get as publicGet, uploadFile, qe } from '@/api/request'
import HtmlEditor from '@/components/HtmlEditor.vue'

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
const imageFilter = ref('')
const customSize = ref('')
const editForm = ref({
  name: '', brand: '', description: '', categoryIds: [], price: 0, stock: 100, images: [], shopId: '', sizes: [],
})

const CLOTHING_KEYWORDS = ['clothing', 'apparel', 'fashion', 'dress', 'shirt', 'top', 'jeans', 'coat', 'jacket', 'suit', 'skirt', 'hoodie', 'sweater', 'outfit', 'wear']
const SHOE_KEYWORDS = ['shoe', 'sneaker', 'boot', 'sandal', 'footwear', 'heel', 'loafer', 'slipper']
const BAG_KEYWORDS = ['bag', 'handbag', 'tote', 'purse', 'backpack', 'luggage', 'wallet', 'clutch']

const selectedCatNames = computed(() => {
  const ids = editForm.value.categoryIds || []
  return categories.value
    .filter(c => ids.includes(c._id))
    .map(c => (c.name || '').toLowerCase())
})

const sizeGroups = computed(() => {
  const names = selectedCatNames.value
  const has = (kws) => names.some(n => kws.some(k => n.includes(k)))
  const groups = []
  if (has(CLOTHING_KEYWORDS)) {
    groups.push({ label: 'Clothing sizes', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] })
  }
  if (has(SHOE_KEYWORDS)) {
    groups.push({ label: 'Shoe sizes (EU)', options: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'] })
  }
  if (has(BAG_KEYWORDS)) {
    groups.push({ label: 'Bag sizes', options: ['Mini', 'Small', 'Medium', 'Large', 'One Size'] })
  }
  return groups
})

const showSizes = computed(() => sizeGroups.value.length > 0)

const toggleSize = (size) => {
  const list = editForm.value.sizes
  const i = list.indexOf(size)
  if (i >= 0) list.splice(i, 1)
  else list.push(size)
}

const addCustomSize = () => {
  const s = customSize.value.trim()
  if (!s) return
  if (!editForm.value.sizes.includes(s)) editForm.value.sizes.push(s)
  customSize.value = ''
}

const isRemoteImage = (row) => {
  const src = row.images?.[0] || row.image || row.img
  return src && (src.includes('popularity1.shop') || src.includes('s3.amazonaws.com') || src.startsWith('http'))
}

const handleImgError = (e, row) => {
  row._imgStatus = 'broken'
}

const filteredProducts = computed(() => {
  if (!imageFilter.value) return products.value
  return products.value.filter(p => {
    const src = p.images?.[0] || p.image || p.img
    if (imageFilter.value === 'remote') return src && (src.includes('popularity1.shop') || src.includes('s3.amazonaws.com'))
    if (imageFilter.value === 'local') return src && !src.includes('popularity1.shop') && !src.includes('s3.amazonaws.com')
    if (imageFilter.value === 'none') return !src
    return true
  })
})

const fetch = async () => {
  loading.value = true
  const res = await adminGet('/home/admin/products', { page: page.value, pageSize: pageSize.value })
  if (res?.code === 0) { products.value = res.data?.list || []; total.value = res.data?.total || 0 }
  loading.value = false
}

const openEdit = (row) => {
  editItem.value = row
  const catIds = Array.isArray(row.categoryIds) && row.categoryIds.length
    ? [...row.categoryIds]
    : (row.categoryId ? [row.categoryId] : [])
  const sizes = []
  ;(row.skus || []).forEach(sku => {
    ;(sku.attrs || []).forEach(a => {
      if ((a.name || '').toLowerCase() === 'size' && a.value && !sizes.includes(a.value)) sizes.push(a.value)
    })
  })
  editForm.value = {
    name: row.name || '',
    brand: row.brand || '',
    description: row.description || '',
    categoryIds: catIds,
    price: row.minPrice || row.price || 0,
    stock: row.skus?.[0]?.stock || 0,
    images: row.images?.length > 0 ? [...row.images] : (row.image ? [row.image] : row.img ? [row.img] : []),
    shopId: '',
    sizes,
  }
  customSize.value = ''
  showEdit.value = true
}

const openAdd = () => {
  editItem.value = null
  editForm.value = { name: '', brand: '', description: '', categoryIds: [], price: 0, stock: 100, images: [], shopId: '', sizes: [] }
  customSize.value = ''
  showEdit.value = true
}

const toggleStatus = async (row) => {
  await adminPost('/home/admin/toggle-product-status', { productId: row._id, status: row.status === 1 ? 0 : 1 })
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
  if (!editForm.value.name) { ElMessage.warning('Product title is required'); return }
  if (!editForm.value.categoryIds.length) { ElMessage.warning('Please select at least one category'); return }
  saving.value = true
  const skus = editForm.value.sizes.length > 0
    ? editForm.value.sizes.map(size => ({ price: editForm.value.price, stock: editForm.value.stock, attrs: [{ name: 'Size', value: size }] }))
    : [{ price: editForm.value.price, stock: editForm.value.stock, attrs: [] }]
  const payload = {
    name: editForm.value.name,
    brand: editForm.value.brand,
    description: editForm.value.description,
    categoryId: editForm.value.categoryIds[0],
    categoryIds: editForm.value.categoryIds,
    images: editForm.value.images,
    skus,
  }
  let res
  if (editItem.value) {
    payload.id = editItem.value._id
    res = await adminPost('/home/admin/update-product', payload)
  } else {
    payload.shopId = editForm.value.shopId
    res = await adminPost('/home/admin/add-product', payload)
  }
  saving.value = false
  if (res?.code === 0) {
    ElMessage.success(editItem.value ? 'Product updated!' : 'Product added!')
    showEdit.value = false
    await fetch()
  } else if (res?.msg) ElMessage.error(res.msg)
}

onMounted(async () => {
  await fetch()
  const catRes = await publicGet('/main/goodsCategory/getList')
  if (catRes?.data) categories.value = catRes.data
  const shopRes = await adminGet('/home/admin/shops', { pageSize: 100 })
  if (shopRes?.code === 0 && shopRes.data?.list) shops.value = shopRes.data.list
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
.size-block { margin: 4px 0 18px; padding: 12px 14px; border: 1px solid var(--g-border); border-radius: 8px; background: #fafbfc; }
.size-title { font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #333; }
.size-group { margin-bottom: 10px; }
.size-group-label { font-size: 12px; color: #888; margin-bottom: 6px; }
.size-values { display: flex; flex-wrap: wrap; gap: 8px; }
.size-chip { padding: 5px 14px; border: 1px solid var(--g-border); border-radius: 20px; font-size: 13px; cursor: pointer; user-select: none; background: #fff; }
.size-chip:hover { border-color: var(--g-main_color); }
.size-chip.active { background: var(--g-main_color); color: #fff; border-color: var(--g-main_color); }
.size-custom { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
.size-selected { font-size: 12px; color: #666; }
@media (max-width: 768px) { .admin-products { padding: 12px; } }
</style>
