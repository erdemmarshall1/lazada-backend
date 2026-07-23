<template>
  <div class="admin-page">
    <div class="page-card">
      <div class="page-header">
        <i class="iconfont icon-daifahuo"></i>
        <h2>Logistics Management</h2>
      </div>

      <div class="stats-row" v-if="stats">
        <div class="stat-card" v-for="(count, key) in stats.stats" :key="key">
          <div class="stat-value">{{ count }}</div>
          <div class="stat-label">{{ stats.labels[key] || 'Total' }}</div>
        </div>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="Shipments" name="shipments">
          <div class="g-flex-align-center g-flex-justify-between" style="margin-bottom:16px">
            <div class="g-flex" style="gap:8px;flex-wrap:wrap">
              <el-select v-model="filter.status" placeholder="Status" clearable style="width:140px" @change="fetchShipments">
                <el-option label="All" value="" />
                <el-option v-for="(label, key) in statusLabels" :key="key" :label="label" :value="parseInt(key)" />
              </el-select>
              <el-select v-model="filter.carrier" placeholder="Carrier" clearable style="width:140px" @change="fetchShipments">
                <el-option label="All" value="" />
                <el-option v-for="c in carriers" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
              <el-input v-model="filter.search" placeholder="Search order no..." clearable style="width:200px" @clear="fetchShipments" @keyup.enter="fetchShipments" />
              <el-button type="primary" @click="fetchShipments">Search</el-button>
            </div>
          </div>

          <div class="g-responsive-table">
            <el-table :data="shipments" v-loading="loading" style="width:100%" empty-text="No shipments found">
              <el-table-column prop="orderId?.orderNo" label="Order No" width="170" />
              <el-table-column label="Carrier" width="110">
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
              <el-table-column label="Estimated" width="110">
                <template #default="{row}">{{ row.estimatedDelivery ? formatDate(row.estimatedDelivery) : '-' }}</template>
              </el-table-column>
              <el-table-column label="Created" width="140">
                <template #default="{row}">{{ formatDate(row.createdAt) }}</template>
              </el-table-column>
              <el-table-column label="Actions" width="160" fixed="right">
                <template #default="{row}">
                  <el-button size="small" @click="openTrackingDialog(row)">Update</el-button>
                  <el-button size="small" type="primary" @click="viewDetail(row)">Detail</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="g-flex-center" style="margin-top:16px" v-if="total > pageSize">
            <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" :current-page="page" @current-change="onPageChange" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="Shipping Methods" name="methods">
          <div class="admin-cms-header">
            <h3>Shipping Methods</h3>
            <el-button type="primary" size="small" @click="showMethodForm(null)">+ Add Method</el-button>
          </div>
          <div class="g-responsive-table">
            <el-table :data="methods" v-loading="methodsLoading" style="width:100%" empty-text="No shipping methods">
              <el-table-column prop="name" label="Name" width="160" />
              <el-table-column label="Carrier" width="130">
                <template #default="{row}">{{ carrierName(row.carrier) || row.carrier }}</template>
              </el-table-column>
              <el-table-column prop="type" label="Type" width="90" />
              <el-table-column label="Rate" width="100">
                <template #default="{row}">{{ row.type === 'free' ? 'Free' : '$' + (row.rate || 0).toFixed(2) }}</template>
              </el-table-column>
              <el-table-column label="Free Threshold" width="120">
                <template #default="{row}">{{ row.freeShippingThreshold ? '$' + row.freeShippingThreshold : '-' }}</template>
              </el-table-column>
              <el-table-column prop="estimatedDays" label="Est. Days" width="100" />
              <el-table-column label="Sort" width="60" prop="sort" />
              <el-table-column label="Status" width="80">
                <template #default="{row}">
                  <el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? 'Active' : 'Inactive' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Actions" width="160" fixed="right">
                <template #default="{row}">
                  <el-button size="small" @click="showMethodForm(row)">Edit</el-button>
                  <el-button size="small" type="danger" @click="deleteMethod(row._id)">Delete</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="trackingDialog" title="Update Tracking" width="550px">
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

    <el-dialog v-model="detailDialog" title="Shipment Detail" width="600px">
      <div v-if="detailShipment" class="detail-section">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Order No">{{ detailShipment.orderId?.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="Tracking No">{{ detailShipment.trackingNo }}</el-descriptions-item>
          <el-descriptions-item label="Carrier">{{ carrierName(detailShipment.carrier) }}</el-descriptions-item>
          <el-descriptions-item label="Status">
            <el-tag :type="statusTagType(detailShipment.status)" size="small">{{ detailShipment.statusLabel }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Receiver Name">{{ detailShipment.receiverName }}</el-descriptions-item>
          <el-descriptions-item label="Receiver Phone">{{ detailShipment.receiverPhone }}</el-descriptions-item>
          <el-descriptions-item label="Address" :span="2">{{ detailShipment.receiverAddress }}</el-descriptions-item>
          <el-descriptions-item label="Estimated Delivery">{{ detailShipment.estimatedDelivery ? formatDate(detailShipment.estimatedDelivery) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="Delivered At">{{ detailShipment.deliveredAt ? formatDate(detailShipment.deliveredAt) : '-' }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin-top:20px">Tracking History</h4>
        <el-timeline>
          <el-timeline-item v-for="evt in detailShipment.statusHistory" :key="evt._id" :timestamp="formatDate(evt.timestamp)" placement="top">
            <p><strong>{{ evt.statusLabel }}</strong></p>
            <p v-if="evt.location">{{ evt.location }}</p>
            <p v-if="evt.description" style="color:#666;font-size:13px">{{ evt.description }}</p>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>

    <el-dialog v-model="methodDialog" :title="editMethodId ? 'Edit Shipping Method' : 'Add Shipping Method'" width="500px">
      <el-form :model="methodForm" label-position="top">
        <el-form-item label="Name" required>
          <el-input v-model="methodForm.name" placeholder="e.g. Standard Shipping" />
        </el-form-item>
        <el-form-item label="Carrier">
          <el-select v-model="methodForm.carrier" placeholder="Select carrier" style="width:100%" clearable>
            <el-option v-for="c in carriers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Type">
          <el-radio-group v-model="methodForm.type">
            <el-radio value="flat">Flat Rate</el-radio>
            <el-radio value="free">Free</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Rate ($)" v-if="methodForm.type === 'flat'">
          <el-input-number v-model="methodForm.rate" :min="0" :step="0.5" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="Free Shipping Threshold ($, 0 = no threshold)">
          <el-input-number v-model="methodForm.freeShippingThreshold" :min="0" :step="10" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="Estimated Days">
          <el-input v-model="methodForm.estimatedDays" placeholder="e.g. 3-7" />
        </el-form-item>
        <el-form-item label="Sort Order">
          <el-input-number v-model="methodForm.sort" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="Active">
          <el-switch v-model="methodForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="methodDialog = false">Cancel</el-button>
        <el-button type="primary" :loading="savingMethod" @click="saveMethod">{{ editMethodId ? 'Update' : 'Create' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, post, put, del, qe } from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('shipments')

const stats = ref(null)
const statusLabels = { 0: 'Pending Pickup', 1: 'Picked Up', 2: 'In Transit', 3: 'Out for Delivery', 4: 'Delivered', 5: 'Delivery Failed', 6: 'Returned' }

const carriers = ref([])
const filter = ref({ status: '', carrier: '', search: '' })
const shipments = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const trackingDialog = ref(false)
const selectedShipment = ref(null)
const trackingForm = ref({ newStatus: undefined, location: '', description: '' })
const updating = ref(false)

const detailDialog = ref(false)
const detailShipment = ref(null)

const methods = ref([])
const methodsLoading = ref(false)
const methodDialog = ref(false)
const editMethodId = ref(null)
const savingMethod = ref(false)
const methodForm = ref({ name: '', carrier: '', type: 'flat', rate: 0, freeShippingThreshold: 0, estimatedDays: '3-7', sort: 0, status: 1 })

const carrierName = (id) => {
  const c = carriers.value.find(c => c.id === id)
  return c ? c.name : id || '-'
}

const statusTagType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'primary', 3: 'warning', 4: 'success', 5: 'danger', 6: 'info' }
  return map[status] || 'info'
}

const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const fetchStats = async () => {
  const res = await qe(get('/home/admin/logistics/stats'))
  if (res?.data) stats.value = res.data
}

const fetchCarriers = async () => {
  const res = await qe(get('/home/admin/logistics/carriers'))
  if (res?.data) carriers.value = res.data
}

const fetchShipments = async () => {
  loading.value = true
  const params = { page: page.value, pageSize: pageSize.value }
  if (filter.value.status !== '') params.status = filter.value.status
  if (filter.value.carrier) params.carrier = filter.value.carrier
  if (filter.value.search) params.search = filter.value.search
  const res = await qe(get('/home/admin/logistics', params))
  if (res?.data) {
    shipments.value = res.data.list || []
    total.value = res.data.total || 0
    page.value = res.data.page || 1
  }
  loading.value = false
}

const onPageChange = (p) => {
  page.value = p
  fetchShipments()
}

const openTrackingDialog = (row) => {
  selectedShipment.value = { ...row }
  trackingForm.value = { newStatus: undefined, location: '', description: '' }
  trackingDialog.value = true
}

const updateTracking = async () => {
  if (trackingForm.value.newStatus === undefined) {
    ElMessage.warning('Please select a new status')
    return
  }
  updating.value = true
  const res = await qe(put(`/home/admin/logistics/${selectedShipment.value._id}/tracking`, trackingForm.value))
  if (res?.code === 0) {
    ElMessage.success('Tracking updated')
    trackingDialog.value = false
    fetchStats()
    fetchShipments()
  }
  updating.value = false
}

const viewDetail = async (row) => {
  const res = await qe(get(`/home/admin/logistics/${row._id}`))
  if (res?.data) {
    detailShipment.value = res.data
    detailDialog.value = true
  }
}

const fetchMethods = async () => {
  methodsLoading.value = true
  const res = await qe(get('/home/admin/logistics/shipping-methods'))
  if (res?.data) methods.value = res.data
  methodsLoading.value = false
}

const showMethodForm = (row) => {
  if (row) {
    editMethodId.value = row._id
    methodForm.value = { name: row.name, carrier: row.carrier || '', type: row.type || 'flat', rate: row.rate || 0, freeShippingThreshold: row.freeShippingThreshold || 0, estimatedDays: row.estimatedDays || '3-7', sort: row.sort || 0, status: row.status !== undefined ? row.status : 1 }
  } else {
    editMethodId.value = null
    methodForm.value = { name: '', carrier: '', type: 'flat', rate: 0, freeShippingThreshold: 0, estimatedDays: '3-7', sort: 0, status: 1 }
  }
  methodDialog.value = true
}

const saveMethod = async () => {
  if (!methodForm.value.name) {
    ElMessage.warning('Name is required')
    return
  }
  savingMethod.value = true
  let res
  if (editMethodId.value) {
    res = await qe(put(`/home/admin/logistics/shipping-methods/${editMethodId.value}`, methodForm.value))
  } else {
    res = await qe(post('/home/admin/logistics/shipping-methods', methodForm.value))
  }
  if (res?.code === 0) {
    ElMessage.success(editMethodId.value ? 'Method updated' : 'Method created')
    methodDialog.value = false
    fetchMethods()
  }
  savingMethod.value = false
}

const deleteMethod = async (id) => {
  try {
    await ElMessageBox.confirm('Delete this shipping method?', 'Confirm', { type: 'warning' })
    const res = await qe(del(`/home/admin/logistics/shipping-methods/${id}`))
    if (res?.code === 0) {
      ElMessage.success('Method deleted')
      fetchMethods()
    }
  } catch {}
}

onMounted(async () => {
  await Promise.all([fetchStats(), fetchCarriers()])
  fetchShipments()
  fetchMethods()
})
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.stat-card {
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  border-radius: 8px;
  padding: 16px 12px;
  text-align: center;
  transition: transform .15s, box-shadow .15s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,.08);
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-color-primary, #409eff);
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
.detail-section h4 {
  font-size: 15px;
  margin-bottom: 8px;
  color: var(--el-text-color-primary, #303133);
}
</style>
