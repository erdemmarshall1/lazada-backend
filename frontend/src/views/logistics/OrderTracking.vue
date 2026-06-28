<template>
  <div class="tracking-view">
    <div class="tracking-container">
      <div v-if="loading" v-loading="loading" style="min-height:300px" />
      <div v-else-if="shipping" class="tracking-card">
        <div class="tracking-head">
          <h2>Order Tracking</h2>
          <div class="order-ref">Order: {{ shipping.orderId?.orderNo || '—' }}</div>
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
          <div v-if="shipping.statusHistory?.length === 0" style="text-align:center;color:#999;padding:40px">
            No tracking events yet
          </div>
        </div>
      </div>
      <div v-else class="c-no-list">
        <span class="c-no-list-text">{{ error || 'Tracking information not found' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { get } from '@/api/request'
import { getSocket } from '@/socket'

const route = useRoute()
const shipping = ref(null)
const loading = ref(true)
const error = ref('')

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

onMounted(async () => {
  const orderId = route.query.orderId
  if (!orderId) { error.value = 'No order ID provided'; loading.value = false; return }
  const res = await get('/home/shipping/getInfo', { orderId })
  if (res?.data) {
    shipping.value = res.data
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
})
</script>

<style scoped>
.tracking-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.tracking-container { max-width: var(--g-main-width); margin: 0 auto; }
.tracking-card { background: var(--g-white); border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
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
