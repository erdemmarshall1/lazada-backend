<template>
  <div class="admin-shop-detail">
    <div class="detail-header">
      <el-button text @click="$router.push('/admin-sellers')">&larr; Back to Sellers</el-button>
      <h2>Shop Application Detail</h2>
    </div>

    <div v-loading="loading">
      <template v-if="shop">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Store Name" :span="2">{{ shop.name }}</el-descriptions-item>
          <el-descriptions-item label="Store #">{{ shop.storeNumber || 'Not assigned' }}</el-descriptions-item>
          <el-descriptions-item label="Status">
            <el-tag :type="shop.status === 1 ? 'success' : shop.status === 2 ? 'danger' : 'warning'">
              {{ shop.status === 1 ? 'Approved' : shop.status === 2 ? 'Rejected' : 'Pending' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Full Name">{{ shop.fullName }}</el-descriptions-item>
          <el-descriptions-item label="Email">{{ shop.email }}</el-descriptions-item>
          <el-descriptions-item label="Phone">{{ shop.phone }}</el-descriptions-item>
          <el-descriptions-item label="Address" :span="2">{{ shop.address }}</el-descriptions-item>
          <el-descriptions-item label="ID / SSN">{{ shop.idNumber }}</el-descriptions-item>
          <el-descriptions-item label="Invitation Code">{{ shop.invitationCode }}</el-descriptions-item>
          <el-descriptions-item label="Owner Account">{{ shop.userId?.username || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="Seller ID">{{ shop.userId?.sellerId || 'Not assigned' }}</el-descriptions-item>
          <el-descriptions-item label="Owner Role">{{ shop.userId?.role || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="Created">{{ formatDate(shop.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="Updated">{{ formatDate(shop.updatedAt) }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">Uploaded Documents</el-divider>

        <div class="documents-grid">
          <div class="doc-card" v-if="shop.logo">
            <h4>Store Logo</h4>
            <a :href="$imgUrl(shop.logo)" target="_blank">
              <img :src="$imgUrl(shop.logo)" @error="$imgFallback" />
            </a>
          </div>
          <div class="doc-card" v-if="shop.idFrontImage">
            <h4>ID Front</h4>
            <a :href="$imgUrl(shop.idFrontImage)" target="_blank">
              <img :src="$imgUrl(shop.idFrontImage)" @error="$imgFallback" />
            </a>
          </div>
          <div class="doc-card" v-if="shop.idBackImage">
            <h4>ID Back</h4>
            <a :href="$imgUrl(shop.idBackImage)" target="_blank">
              <img :src="$imgUrl(shop.idBackImage)" @error="$imgFallback" />
            </a>
          </div>
          <div class="doc-card" v-if="shop.utilityBill">
            <h4>Utility Bill</h4>
            <a :href="$imgUrl(shop.utilityBill)" target="_blank">
              <img :src="$imgUrl(shop.utilityBill)" @error="$imgFallback" />
            </a>
          </div>
        </div>

        <div class="action-bar" v-if="shop.status === 0">
          <el-button type="success" :loading="approving" @click="handleApprove">Approve Application</el-button>
          <el-button type="danger" :loading="rejecting" @click="handleReject">Reject Application</el-button>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="Shop not found" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get, post, qe } from '@/api/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const shop = ref(null)
const loading = ref(false)
const approving = ref(false)
const rejecting = ref(false)

const formatDate = (d) => d ? new Date(d).toLocaleDateString() : ''

const fetchDetail = async () => {
  loading.value = true
  const res = await get(`/home/admin/shops/${route.params.id}`)
  if (res?.code === 0) shop.value = res.data
  loading.value = false
}

const handleApprove = async () => {
  approving.value = true
  const res = await qe(post('/home/admin/approve-shop', { id: shop.value._id }))
  approving.value = false
  if (res) { ElMessage.success(res.msg); fetchDetail() }
}

const handleReject = async () => {
  rejecting.value = true
  const res = await qe(post('/home/admin/reject-shop', { id: shop.value._id }))
  rejecting.value = false
  if (res) { ElMessage.success(res.msg); fetchDetail() }
}

onMounted(fetchDetail)
</script>

<style scoped>
.admin-shop-detail { padding: 20px; max-width: 900px; }
.detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.detail-header h2 { margin: 0; }
.documents-grid { display: flex; flex-wrap: wrap; gap: 16px; margin: 16px 0; }
.doc-card { border: 1px solid #eee; border-radius: 8px; padding: 12px; width: 200px; }
.doc-card h4 { margin: 0 0 8px; font-size: 13px; color: #666; }
.doc-card img { width: 100%; height: 140px; object-fit: cover; border-radius: 4px; cursor: pointer; }
.doc-card img:hover { opacity: 0.85; }
.action-bar { margin-top: 24px; display: flex; gap: 12px; }
</style>
