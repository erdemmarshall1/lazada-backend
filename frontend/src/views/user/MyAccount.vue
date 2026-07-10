<template>
  <div>
    <div class="dash-grid-4" style="margin-bottom:24px">
      <div v-for="(m, i) in metrics" :key="m.label" class="dash-dark-card">
        <div class="dash-illustration">
          <svg v-if="i===0" viewBox="0 0 80 80" fill="none">
            <path d="M40 10L66 25L40 40L14 25L40 10Z" fill="#667eea" opacity="0.85"/>
            <path d="M14 25V49L40 64V40L14 25Z" fill="#667eea" opacity="0.5"/>
            <path d="M66 25V49L40 64V40L66 25Z" fill="#667eea" opacity="0.65"/>
          </svg>
          <svg v-else-if="i===1" viewBox="0 0 80 80" fill="none">
            <rect x="8" y="30" width="42" height="24" rx="3" fill="#667eea" opacity="0.7"/>
            <path d="M50 34L62 34L70 46V54H50V34Z" fill="#667eea" opacity="0.85"/>
            <circle cx="20" cy="58" r="6" fill="#667eea" opacity="0.45"/>
            <circle cx="60" cy="58" r="6" fill="#667eea" opacity="0.45"/>
          </svg>
          <svg v-else-if="i===2" viewBox="0 0 80 80" fill="none">
            <path d="M40 66C40 66 16 48 16 32C16 22 24 14 34 14C39 14 40 18 40 18C40 18 41 14 46 14C56 14 64 22 64 32C64 48 40 66 40 66Z" fill="#667eea" opacity="0.8"/>
          </svg>
          <svg v-else viewBox="0 0 80 80" fill="none">
            <rect x="10" y="28" width="54" height="34" rx="6" fill="#667eea" opacity="0.7"/>
            <rect x="10" y="20" width="54" height="14" rx="6" fill="#667eea" opacity="0.85"/>
            <circle cx="54" cy="46" r="8" fill="#667eea" opacity="0.4"/>
          </svg>
        </div>
        <div class="dc-value">{{ m.value }}</div>
        <div class="dc-label">{{ m.label }}</div>
      </div>
    </div>

    <div class="page-card" style="margin-top:20px">
      <div class="page-header">
        <i class="iconfont icon-yonghu"></i>
        <h2>My Profile</h2>
      </div>
      <el-form :model="form" label-position="top" style="max-width:500px;margin-top:20px">
        <el-form-item label="Username"><el-input v-model="form.username" disabled /></el-form-item>
        <el-form-item label="Full Name"><el-input v-model="form.fullName" placeholder="Your full name" /></el-form-item>
        <el-form-item label="Email"><el-input v-model="form.email" /></el-form-item>
        <el-form-item label="Phone"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="Bio"><el-input v-model="form.bio" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="Tell us about yourself" /></el-form-item>
        <el-form-item label="Date of Birth">
          <el-date-picker v-model="form.dateOfBirth" type="date" placeholder="Select date" style="width:100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="Gender">
          <el-select v-model="form.gender" placeholder="Select gender" style="width:100%">
            <el-option label="Male" value="male" />
            <el-option label="Female" value="female" />
            <el-option label="Other" value="other" />
            <el-option label="Prefer not to say" value="prefer_not_to_say" />
          </el-select>
        </el-form-item>
        <el-form-item label="Country"><el-input v-model="form.country" placeholder="Country" /></el-form-item>
        <el-form-item label="City"><el-input v-model="form.city" placeholder="City" /></el-form-item>
        <el-form-item label="Postal Code"><el-input v-model="form.postalCode" placeholder="Postal code" /></el-form-item>
        <el-form-item>
          <el-button type="primary" style="background:var(--g-main_color);border-color:var(--g-main_color)" @click="saveProfile">Save</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-card" style="margin-top:20px" v-if="recentOrders.length">
      <div class="page-header">
        <i class="iconfont icon-dingdan"></i>
        <h2>Recent Orders</h2>
      </div>
      <el-table :data="recentOrders" style="width:100%;margin-top:16px" size="small" v-loading="ordersLoading">
        <el-table-column prop="orderId" label="Order #" width="160" />
        <el-table-column label="Total" width="100">
          <template #default="{ row }">${{ row.totalAmount || row.totalPrice || 0 }}</template>
        </el-table-column>
        <el-table-column label="Status" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Date" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="Action" width="80">
          <template #default="{ row }">
            <el-button size="small" link @click="$router.push('/myorder')">View</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'
import { get, post, qe } from '@/api/request'

const router = useRouter()
const store = useAppStore()

const ordersLoading = ref(false)
const totalOrders = ref(0)
const pendingOrders = ref(0)
const wishlistCount = ref(0)
const walletBalance = ref(0)
const recentOrders = ref([])

const form = reactive({
  username: '', email: '', phone: '', fullName: '', bio: '', dateOfBirth: null,
  gender: 'prefer_not_to_say', country: '', city: '', postalCode: '',
})

const metrics = computed(() => [
  { label: 'Total Orders', value: totalOrders.value, icon: 'iconfont icon-dingdan', color: '#667eea', bg: 'rgba(102,126,234,0.1)' },
  { label: 'Active Orders', value: pendingOrders.value, icon: 'iconfont icon-wuliu', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { label: 'Wishlist', value: wishlistCount.value, icon: 'iconfont icon-xingxing', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
  { label: 'Balance', value: '$' + Number(walletBalance.value).toFixed(2), icon: 'iconfont icon-qianbao', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
])

const statusLabel = (s) => ({ 0: 'Pending', 1: 'Paid', 2: 'Shipped', 3: 'Completed', 6: 'Cancelled' }[s] || 'Unknown')
const statusTag = (s) => ({ 0: 'warning', 1: 'primary', 2: 'info', 3: 'success', 6: 'danger' }[s] || 'info')

const formatDate = (d) => {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const loadStats = async () => {
  const [orderRes, walletRes, wishRes] = await Promise.all([
    get('/home/userOrder/getList', { pageSize: 5 }).catch(() => ({ data: null })),
    get('/home/userWallet/getList').catch(() => ({ data: null })),
    get('/home/userCollect/getProductList', { pageSize: 1 }).catch(() => ({ data: null })),
  ])

  if (orderRes?.data) {
    recentOrders.value = orderRes.data.list || []
    totalOrders.value = orderRes.data.total || 0
    pendingOrders.value = recentOrders.value.filter(o => [0, 1, 2].includes(o.status)).length
  }
  if (walletRes?.data && walletRes.data.length > 0) {
    walletBalance.value = walletRes.data[0].balance || 0
  }
  if (wishRes?.data) {
    wishlistCount.value = wishRes.data.total || 0
  }
}

const saveProfile = async () => {
  const res = await qe(post('/home/user/edit', {
    email: form.email,
    phone: form.phone,
    fullName: form.fullName,
    bio: form.bio,
    dateOfBirth: form.dateOfBirth,
    gender: form.gender,
    country: form.country,
    city: form.city,
    postalCode: form.postalCode,
  }))
  if (res) {
    store.setUserInfo(res.data)
    ElMessage.success('Profile updated')
  }
}

onMounted(async () => {
  await loadStats()
  if (store.userInfo) {
    const u = store.userInfo
    form.username = u.username || ''
    form.email = u.email || ''
    form.phone = u.phone || ''
    form.fullName = u.fullName || ''
    form.bio = u.bio || ''
    form.dateOfBirth = u.dateOfBirth || null
    form.gender = u.gender || 'prefer_not_to_say'
    form.country = u.country || ''
    form.city = u.city || ''
    form.postalCode = u.postalCode || ''
  }
})
</script>

<style scoped>
.page-card { background: var(--dash-dark-card); border-radius: var(--dash-card-radius); padding: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); border: 1px solid rgba(255,255,255,0.04); margin-bottom: 24px; }
.page-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.page-header i { font-size: 20px; color: #667eea; }
.page-header h2 { margin: 0; font-size: 16px; font-weight: 700; color: #fff; }
.el-form { --el-text-color-regular: rgba(255,255,255,0.6); }
</style>
