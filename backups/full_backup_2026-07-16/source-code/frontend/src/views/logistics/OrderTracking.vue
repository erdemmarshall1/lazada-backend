<template>
  <div class="tracking-view">
    <div class="tracking-container">
      <div v-if="!shipping && !loading && !error" class="tracking-search-card">
        <h2>{{ store.isLogin ? 'Track Your Order' : 'Track Your Order' }}</h2>
        <p class="tracking-search-desc">Enter your order number to track your shipment.</p>
        <div class="tracking-search-input g-flex" style="gap:8px;max-width:500px;margin:16px auto 0">
          <el-input v-model="orderNoInput" placeholder="Enter order number" size="large" @keyup.enter="doTrack" />
          <el-button type="primary" size="large" :loading="loading" @click="doTrack">Track</el-button>
        </div>
      </div>

      <div v-if="loading" v-loading="loading" style="min-height:300px" />
      <div v-else-if="shipping" class="tracking-card">
        <div class="tracking-head">
          <h2>Order Tracking</h2>
          <div class="order-ref">Order: {{ shipping.orderNo || shipping.orderId?.orderNo || '—' }}</div>
        </div>

        <div class="tracking-summary">
          <div class="summary-item">
            <span class="summary-label">Carrier</span>
            <span class="summary-value">{{ carrierName(shipping.carrier) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Tracking No</span>
            <span class="summary-value">{{ shipping.trackingNo }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Status</span>
            <el-tag :type="statusTagType(shipping.status)" size="small">{{ shipping.statusLabel }}</el-tag>
          </div>
          <div class="summary-item">
            <span class="summary-label">Estimated Delivery</span>
            <span class="summary-value">{{ formatDate(shipping.estimatedDelivery) }}</span>
          </div>
        </div>

        <div class="delivery-address">
          <strong>Delivering to:</strong>
          <p>{{ shipping.receiverName }} — {{ shipping.receiverPhone }}</p>
          <p>{{ shipping.receiverAddress }}</p>
        </div>

        <div class="tracking-timeline">
          <h3>Tracking History</h3>
          <el-timeline>
            <el-timeline-item
              v-for="evt in reversedHistory"
              :key="evt._id"
              :timestamp="formatDate(evt.timestamp)"
              placement="top"
              :color="evt.status === 4 ? '#67C23A' : '#409EFF'"
              :hollow="evt.status !== shipping.status"
            >
              <p><strong>{{ evt.statusLabel }}</strong></p>
              <p v-if="evt.location" class="evt-location">{{ evt.location }}</p>
              <p v-if="evt.description" class="evt-desc">{{ evt.description }}</p>
            </el-timeline-item>
          </el-timeline>
          <div v-if="!shipping.statusHistory?.length" style="text-align:center;color:#999;padding:40px">
            No tracking events yet
          </div>

          <div v-if="store.isLogin" style="margin-top:20px;text-align:center">
            <el-button @click="resetSearch">Track Another Order</el-button>
          </div>
        </div>
      </div>
      <div v-else-if="!loading && error" class="c-no-list">
        <span class="c-no-list-text">{{ error }}</span>
        <div style="margin-top:16px">
          <el-button @click="resetSearch">Try Again</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { get } from '@/api/request'
import { getSocket } from '@/socket'

const route = useRoute()
const store = useAppStore()
const shipping = ref(null)
const loading = ref(false)
const error = ref('')
const orderNoInput = ref('')

const carrierMap = { sf:'SF Express', yto:'YTO Express', zto:'ZTO Express', sto:'STO Express', yd:'Yunda Express', ems:'EMS', ups:'UPS', fedex:'FedEx', dhl:'DHL', tnt:'TNT' }
const carrierName = (id) => carrierMap[id] || id || '—'
const statusTagType = (s) => {
  if (s === 4) return 'success'
  if (s === 5 || s === 6) return 'danger'
  if (s === 3) return 'warning'
  if (s === 2) return 'primary'
  return 'info'
}
const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}
const reversedHistory = computed(() => {
  if (!shipping.value?.statusHistory) return []
  return [...shipping.value.statusHistory].reverse()
})

const resetSearch = () => {
  shipping.value = null
  error.value = ''
  orderNoInput.value = ''
}

const doTrack = async () => {
  const orderNo = orderNoInput.value.trim()
  if (!orderNo) return
  loading.value = true
  error.value = ''
  shipping.value = null
  const res = await get('/home/shipping/public/track', { orderNo })
  if (res?.data) {
    shipping.value = res.data
  } else {
    error.value = res?.msg || 'Tracking information not found'
  }
  loading.value = false
}

onMounted(async () => {
  const orderId = route.query.orderId
  if (orderId && store.isLogin) {
    loading.value = true
    const res = await get('/home/shipping/getInfo', { orderId })
    if (res?.data) {
      shipping.value = res.data
      orderNoInput.value = shipping.value.orderNo || ''
    } else {
      error.value = res?.msg || 'Tracking not available'
    }
    loading.value = false

    const socket = getSocket()
    if (socket && orderId) {
      socket.on('trackingUpdated', (data) => {
        if (data.orderId === orderId) {
          get('/home/shipping/getInfo', { orderId }).then(r => {
            if (r?.data) shipping.value = r.data
          })
        }
      })
    }
  }
})
</script>

<style scoped>
.tracking-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.tracking-container { max-width: var(--g-main-width); margin: 0 auto; }
.tracking-card, .tracking-search-card { background: var(--g-white); border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.tracking-search-card { text-align: center; padding: 60px 24px; }
.tracking-search-card h2 { font-size: 24px; margin-bottom: 8px; }
.tracking-search-desc { color: #999; font-size: 14px; }
.tracking-head { margin-bottom: 20px; }
.tracking-head h2 { font-size: 20px; margin-bottom: 4px; }
.order-ref { color: #999; font-size: 13px; }
.tracking-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: var(--g-bg); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.summary-item { display: flex; flex-direction: column; }
.summary-label { font-size: 12px; color: #999; margin-bottom: 4px; }
.summary-value { font-size: 14px; font-weight: 600; }
.delivery-address { background: #fff7e6; border: 1px solid #ffd591; border-radius: 6px; padding: 12px; margin-bottom: 20px; font-size: 13px; }
.delivery-address p { margin: 4px 0; color: #666; }
.tracking-timeline h3 { font-size: 16px; margin-bottom: 12px; }
.evt-location { color: #666; font-size: 13px; }
.evt-desc { color: #999; font-size: 12px; }
@media (max-width: 768px) {
  .tracking-summary { grid-template-columns: repeat(2, 1fr); }
}
</style>
