<template>
  <div>
    <div class="g-flex-align-center g-flex-justify-between" style="margin-bottom:16px">
      <h3>Logistics Management</h3>
      <div class="g-flex" style="gap:8px">
        <el-select v-model="filterStatus" placeholder="Filter by status" clearable style="width:140px" @change="loadShipments">
          <el-option label="All" value="" />
          <el-option v-for="(label, key) in statusLabels" :key="key" :label="label" :value="parseInt(key)" />
        </el-select>
        <el-button type="primary" @click="loadShipments">Refresh</el-button>
      </div>
    </div>

    <div class="stats-row" v-if="stats">
      <div class="stat-chip" v-for="(count, status) in stats.stats" :key="status" :class="{ active: filterStatus === parseInt(status) }" @click="filterStatus = parseInt(status); loadShipments()">
        <span class="stat-num">{{ count }}</span>
        <span class="stat-lbl">{{ stats.labels[status] }}</span>
      </div>
    </div>

    <el-table :data="shipments" v-loading="loading" style="width:100%" empty-text="No shipments">
      <el-table-column prop="orderId?.orderNo" label="Order No" width="170" />
      <el-table-column label="Carrier" width="120">
        <template #default="{row}">{{ carrierName(row.carrier) }}</template>
      </el-table-column>
      <el-table-column prop="trackingNo" label="Tracking No" width="150" />
      <el-table-column label="Status" width="130">
        <template #default="{row}">
          <el-tag :type="statusTagType(row.status)" size="small">{{ row.statusLabel }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Receiver" min-width="120">
        <template #default="{row}">{{ row.receiverName }}<br><small style="color:#999">{{ row.receiverPhone }}</small></template>
      </el-table-column>
      <el-table-column label="Created" width="140">
        <template #default="{row}">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="Actions" width="200" fixed="right">
        <template #default="{row}">
          <el-button v-if="store.isAdmin" size="small" @click="openTrackingDialog(row)">Update</el-button>
          <el-button size="small" type="primary" @click="previewTracking(row)">Track</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="g-flex-center" style="margin-top:16px" v-if="totalPages > 1">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" @current-change="onPageChange" />
    </div>

    <el-dialog v-model="trackingDialog" title="Update Tracking" width="500px">
      <el-form :model="trackingForm" label-position="top" v-if="selectedShipment">
        <p><strong>Order:</strong> {{ selectedShipment.orderId?.orderNo }} | <strong>Tracking:</strong> {{ selectedShipment.trackingNo }}</p>
        <p><strong>Current Status:</strong> {{ selectedShipment.statusLabel }}</p>
        <el-timeline style="margin:16px 0;max-height:300px;overflow-y:auto">
          <el-timeline-item v-for="evt in selectedShipment.statusHistory" :key="evt._id" :timestamp="formatDate(evt.timestamp)" placement="top">
            <p><strong>{{ evt.statusLabel }}</strong></p>
            <p v-if="evt.location">{{ evt.location }}</p>
            <p v-if="evt.description" style="color:#666;font-size:13px">{{ evt.description }}</p>
          </el-timeline-item>
        </el-timeline>
        <el-form-item label="New Status">
          <el-select v-model="trackingForm.newStatus" placeholder="Select status" style="width:100%">
            <el-option v-for="(label, key) in statusLabels" :key="key" :label="label" :value="parseInt(key)" />
          </el-select>
        </el-form-item>
        <el-form-item label="Location">
          <el-input v-model="trackingForm.location" placeholder="e.g. Sorting Center, New York" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="trackingForm.description" type="textarea" :rows="2" placeholder="e.g. Package arrived at sorting facility" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="trackingDialog = false">Cancel</el-button>
        <el-button type="primary" :loading="updating" @click="updateTracking">Update</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewDialog" title="Tracking Details" width="550px">
      <div v-if="previewShipment" class="tracking-preview">
        <div class="tracking-header">
          <div><strong>Carrier:</strong> {{ carrierName(previewShipment.carrier) }}</div>
          <div><strong>Tracking No:</strong> {{ previewShipment.trackingNo }}</div>
          <div><strong>Estimated Delivery:</strong> {{ formatDate(previewShipment.estimatedDelivery) }}</div>
        </div>
        <el-timeline style="margin-top:16px">
          <el-timeline-item v-for="evt in previewShipment.statusHistory" :key="evt._id" :timestamp="formatDate(evt.timestamp)" placement="top" :color="evt.status === 4 ? '#67C23A' : '#409EFF'">
            <p><strong>{{ evt.statusLabel }}</strong></p>
            <p v-if="evt.location" style="color:#666;font-size:13px">{{ evt.location }}</p>
            <p v-if="evt.description" style="color:#999;font-size:12px">{{ evt.description }}</p>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { get, post, qe } from '@/api/request'
import { useAppStore } from '@/stores/app'

const shipments = ref([])
const loading = ref(false)
const total = ref(0)
const pageSize = ref(20)
const currentPage = ref(1)
const filterStatus = ref('')
const stats = ref(null)
const store = useAppStore()
const statusLabels = { 0:'Pending Pickup', 1:'Picked Up', 2:'In Transit', 3:'Out for Delivery', 4:'Delivered', 5:'Delivery Failed', 6:'Returned' }
const carrierMap = { sf:'SF Express', yto:'YTO Express', zto:'ZTO Express', sto:'STO Express', yd:'Yunda Express', ems:'EMS', ups:'UPS', fedex:'FedEx', dhl:'DHL', tnt:'TNT' }

const trackingDialog = ref(false)
const selectedShipment = ref(null)
const trackingForm = ref({ newStatus: 2, location: '', description: '' })
const updating = ref(false)

const previewDialog = ref(false)
const previewShipment = ref(null)

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

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

const loadShipments = async () => {
  loading.value = true
  const params = { page: currentPage.value, pageSize: pageSize.value }
  if (filterStatus.value !== '') params.status = filterStatus.value
  const [listRes, statsRes] = await Promise.all([
    get('/home/shipping/list', params),
    get('/home/shipping/getStats'),
  ])
  if (listRes?.data) {
    shipments.value = listRes.data.list || []
    total.value = listRes.data.total || 0
  }
  if (statsRes?.data) stats.value = statsRes.data
  loading.value = false
}

const openTrackingDialog = (shipment) => {
  selectedShipment.value = shipment
  trackingForm.value = { newStatus: Math.min(shipment.status + 1, 6), location: '', description: '' }
  trackingDialog.value = true
}

const updateTracking = async () => {
  updating.value = true
  const res = await qe(post('/home/shipping/updateTracking', {
    shippingId: selectedShipment.value._id,
    newStatus: trackingForm.value.newStatus,
    location: trackingForm.value.location,
    description: trackingForm.value.description,
  }))
  updating.value = false
  if (res) {
    ElMessage.success('Tracking updated')
    trackingDialog.value = false
    await loadShipments()
  }
}

const previewTracking = async (shipment) => {
  const res = await get('/home/shipping/getInfo', { orderId: shipment.orderId?._id })
  if (res?.data) {
    previewShipment.value = res.data
    previewDialog.value = true
  }
}

const onPageChange = (page) => { currentPage.value = page; loadShipments() }

import { computed } from 'vue'

onMounted(loadShipments)
</script>

<style scoped>
.stats-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.stat-chip { display: flex; flex-direction: column; align-items: center; padding: 8px 16px; background: var(--g-bg); border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; min-width: 80px; }
.stat-chip:hover, .stat-chip.active { border-color: var(--g-main_color); background: #f6ffed; }
.stat-num { font-size: 20px; font-weight: 700; color: var(--g-main_color); }
.stat-lbl { font-size: 11px; color: #999; margin-top: 2px; }
.tracking-header { background: var(--g-bg); padding: 12px; border-radius: 6px; }
.tracking-header div { margin: 4px 0; font-size: 13px; }
@media (max-width: 768px) {
  .g-flex-align-center.g-flex-justify-between { flex-direction: column; align-items: flex-start; gap: 8px; }
  .g-flex-align-center.g-flex-justify-between .g-flex { width: 100%; }
  .g-flex-align-center.g-flex-justify-between .el-select { width: 100% !important; }
  .stats-row { gap: 4px; }
  .stat-chip { padding: 6px 12px; min-width: 60px; }
  .stat-num { font-size: 16px; }
  :deep(.el-table) { min-width: 700px; }
  .g-responsive-table { overflow-x: auto; }
  :deep(.el-dialog) { width: 90% !important; max-width: 400px; }
}
</style>
