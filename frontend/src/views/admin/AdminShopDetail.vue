<template>
  <div class="admin-page admin-shop-detail">
    <div class="detail-header">
      <el-button text @click="$router.push('/admin-sellers')">&larr; Back to Sellers</el-button>
      <h2>Seller Application Dashboard</h2>
    </div>

    <div v-loading="loading">
      <template v-if="shop">
        <div class="detail-summary">
          <div class="summary-left">
            <h3>{{ shop.name }}</h3>
            <div class="summary-tags">
              <el-tag :type="shop.status === 1 ? 'success' : shop.status === 2 ? 'danger' : 'warning'" size="large">
                {{ shop.status === 1 ? 'Approved' : shop.status === 2 ? 'Rejected' : 'Pending' }}
              </el-tag>
              <el-tag v-if="shop.storeNumber" type="info" size="large">Store #{{ shop.storeNumber }}</el-tag>
              <el-tag v-if="shop.userId?.sellerId" type="info" size="large">Seller ID: {{ shop.userId?.sellerId }}</el-tag>
            </div>
          </div>
          <div class="summary-right">
            <el-button v-if="shop.status === 0" type="success" :loading="approving" @click="handleApprove" size="large">Approve</el-button>
            <el-button v-if="shop.status === 0" type="danger" :loading="rejecting" @click="handleReject" size="large">Reject</el-button>
            <el-button v-if="shop.status === 1 && !shop.userId?.sellerId" type="warning" size="large" :loading="generating" @click="handleGenerateSellerId">
              <i class="iconfont icon-anquan"></i> Generate Seller ID
            </el-button>
            <el-button v-if="shop.userId?.sellerId" type="primary" size="large" @click="loginAsSeller">
              <i class="iconfont icon-dianpu"></i> Login to Seller Portal
            </el-button>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-section">
            <h4 class="section-title">Application Info</h4>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="Full Name">{{ shop.fullName || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Email">{{ shop.email || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Phone">{{ shop.phone || '—' }}</el-descriptions-item>
              <el-descriptions-item label="ID / SSN">{{ shop.idNumber || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Invitation Code">{{ shop.invitationCode || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Owner Account">{{ shop.userId?.username || 'N/A' }}</el-descriptions-item>
              <el-descriptions-item label="Owner Role">{{ shop.userId?.role || 'N/A' }}</el-descriptions-item>
              <el-descriptions-item label="Address" :span="2">{{ shop.address || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Store Description" :span="2">{{ shop.description || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Created">{{ formatDate(shop.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="Updated">{{ formatDate(shop.updatedAt) }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="detail-section">
            <h4 class="section-title">Uploaded Documents</h4>
            <div class="documents-grid">
              <div class="doc-card" v-if="shop.logo">
                <h4>Store Logo</h4>
                <div class="doc-preview" @click="previewImage(shop.logo)">
                  <img :src="$imgUrl(shop.logo)" @error="$imgFallback" />
                  <div class="doc-overlay"><i class="iconfont icon-yanjing"></i> View</div>
                </div>
              </div>
              <div class="doc-card" v-if="shop.idFrontImage">
                <h4>ID Front</h4>
                <div class="doc-preview" @click="previewImage(shop.idFrontImage)">
                  <img :src="$imgUrl(shop.idFrontImage)" @error="$imgFallback" />
                  <div class="doc-overlay"><i class="iconfont icon-yanjing"></i> View</div>
                </div>
              </div>
              <div class="doc-card" v-if="shop.idBackImage">
                <h4>ID Back</h4>
                <div class="doc-preview" @click="previewImage(shop.idBackImage)">
                  <img :src="$imgUrl(shop.idBackImage)" @error="$imgFallback" />
                  <div class="doc-overlay"><i class="iconfont icon-yanjing"></i> View</div>
                </div>
              </div>
              <div class="doc-card" v-if="shop.utilityBill">
                <h4>Utility Bill</h4>
                <div class="doc-preview" @click="previewImage(shop.utilityBill)">
                  <img :src="$imgUrl(shop.utilityBill)" @error="$imgFallback" />
                  <div class="doc-overlay"><i class="iconfont icon-yanjing"></i> View</div>
                </div>
              </div>
              <el-empty v-if="!shop.logo && !shop.idFrontImage && !shop.idBackImage && !shop.utilityBill" description="No documents uploaded" :image-size="60" />
            </div>
          </div>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="Shop not found" />
    </div>

    <el-dialog v-model="previewVisible" :title="previewTitle" width="60%" top="5vh" destroy-on-close>
      <img :src="previewUrl" style="width:100%;max-height:80vh;object-fit:contain;border-radius:4px;" @error="$imgFallback" />
    </el-dialog>
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
const generating = ref(false)
const previewVisible = ref(false)
const previewUrl = ref('')
const previewTitle = ref('')

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

const handleGenerateSellerId = async () => {
  generating.value = true
  const res = await qe(post('/home/admin/generate-seller-id', { id: shop.value._id }))
  generating.value = false
  if (res) { ElMessage.success(res.msg); fetchDetail() }
}

const previewImage = (url) => {
  previewUrl.value = url
  previewTitle.value = 'Document Preview'
  previewVisible.value = true
}

const loginAsSeller = async () => {
  const userId = shop.value.userId?._id
  if (!userId) { ElMessage.warning('No user associated with this shop'); return }
  const res = await qe(post(`/home/admin/login-as-seller/${userId}`))
  if (res?.data?.token) {
    localStorage.setItem('seller_temp_token', res.data.token)
    window.open(`/mystore?temp_token=${res.data.token}`, '_blank')
  }
}

onMounted(fetchDetail)
</script>

<style scoped>
.admin-shop-detail { padding: 20px; max-width: 1100px; }
.detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.detail-header h2 { margin: 0; font-size: 20px; }
.detail-summary { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; padding: 20px; background: linear-gradient(135deg, #f0f2ff, #fff); border: 1px solid #e8e8e8; border-radius: 12px; margin-bottom: 24px; }
.summary-left { display: flex; flex-direction: column; gap: 8px; }
.summary-left h3 { margin: 0; font-size: 22px; }
.summary-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.summary-right { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.detail-grid { display: flex; flex-direction: column; gap: 24px; }
.section-title { font-size: 15px; font-weight: 600; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid var(--g-main_color, #e67e22); display: inline-block; }
.documents-grid { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 8px; }
.doc-card { border: 1px solid #eee; border-radius: 10px; padding: 12px; width: 200px; background: #fafafa; transition: box-shadow 0.2s; }
.doc-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.doc-card h4 { margin: 0 0 8px; font-size: 13px; color: #666; }
.doc-preview { position: relative; cursor: pointer; border-radius: 6px; overflow: hidden; }
.doc-preview img { width: 100%; height: 140px; object-fit: cover; display: block; }
.doc-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; gap: 4px; opacity: 0; transition: opacity 0.2s; }
.doc-preview:hover .doc-overlay { opacity: 1; }

@media (max-width: 768px) {
  .admin-shop-detail { padding: 12px; }
  .documents-grid { justify-content: center; }
  .doc-card { width: 160px; }
  .detail-summary { flex-direction: column; align-items: flex-start; }
  .summary-right { width: 100%; }
  .summary-right .el-button { flex: 1; }
}
</style>