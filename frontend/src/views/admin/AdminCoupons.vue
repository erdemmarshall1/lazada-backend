<template>
  <div class="admin-coupons">
    <h2>Coupon Management</h2>
    <el-button type="primary" style="margin-bottom:16px" @click="showCreate = true">+ Create Coupon</el-button>
    <div class="g-responsive-table">
      <el-table :data="coupons" v-loading="loading" style="width:100%">
        <el-table-column prop="code" label="Code" width="140" />
        <el-table-column label="Type" width="100">
          <template #default="{row}">{{ row.type === 'percentage' ? `${row.value}%` : `$${row.value}` }}</template>
        </el-table-column>
        <el-table-column label="Min Order" width="120">
          <template #default="{row}">${{ row.minOrderAmount?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column label="Max Discount" width="120">
          <template #default="{row}">{{ row.maxDiscount ? `$${row.maxDiscount.toFixed(2)}` : 'No limit' }}</template>
        </el-table-column>
        <el-table-column label="Uses" width="100">
          <template #default="{row}">{{ row.usedCount }}{{ row.maxUses ? ` / ${row.maxUses}` : '' }}</template>
        </el-table-column>
        <el-table-column label="Expires" width="120">
          <template #default="{row}">{{ row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : 'Never' }}</template>
        </el-table-column>
        <el-table-column label="Status" width="90">
          <template #default="{row}">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? 'Active' : 'Inactive' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Description" min-width="180">
          <template #default="{row}">{{ row.description || '-' }}</template>
        </el-table-column>
        <el-table-column label="Action" width="160" fixed="right">
          <template #default="{row}">
            <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row._id)">
              {{ row.status === 1 ? 'Deactivate' : 'Activate' }}
            </el-button>
            <el-button size="small" type="danger" @click="removeCoupon(row._id)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showCreate" title="Create Coupon" width="500px">
      <el-form :model="form" label-position="top">
        <el-form-item label="Coupon Code" required>
          <el-input v-model="form.code" placeholder="e.g. SAVE20" />
        </el-form-item>
        <el-form-item label="Type" required>
          <el-radio-group v-model="form.type">
            <el-radio value="percentage">Percentage (%)</el-radio>
            <el-radio value="fixed">Fixed Amount ($)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Value" required>
          <el-input-number v-model="form.value" :min="1" :max="form.type === 'percentage' ? 100 : 99999" />
          <span style="margin-left:8px">{{ form.type === 'percentage' ? '%' : '$' }}</span>
        </el-form-item>
        <el-form-item label="Min Order Amount (0 = no minimum)">
          <el-input-number v-model="form.minOrderAmount" :min="0" />
        </el-form-item>
        <el-form-item label="Max Discount (0 = no limit, only for percentage)">
          <el-input-number v-model="form.maxDiscount" :min="0" />
        </el-form-item>
        <el-form-item label="Max Uses (0 = unlimited)">
          <el-input-number v-model="form.maxUses" :min="0" />
        </el-form-item>
        <el-form-item label="Expires At (optional)">
          <el-date-picker v-model="form.expiresAt" type="date" placeholder="Pick a date" style="width:100%" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">Cancel</el-button>
        <el-button type="primary" :loading="creating" @click="createCoupon">Create</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, post, qe } from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const coupons = ref([])
const loading = ref(false)
const showCreate = ref(false)
const creating = ref(false)
const form = ref({ code: '', type: 'percentage', value: 10, minOrderAmount: 0, maxDiscount: 0, maxUses: 0, expiresAt: null, description: '' })

const fetchCoupons = async () => {
  loading.value = true
  const res = await qe(get('/home/admin/coupons/list'))
  if (res?.data) coupons.value = res.data.list || []
  loading.value = false
}

const toggleStatus = async (id) => {
  const res = await qe(post(`/home/admin/coupons/${id}/toggle`))
  if (res) { ElMessage.success(res.msg); fetchCoupons() }
}

const removeCoupon = async (id) => {
  try {
    await ElMessageBox.confirm('Delete this coupon?', 'Confirm', { type: 'warning' })
    const res = await qe(fetch(`/home/admin/coupons/${id}`, { method: 'DELETE' }).then(r => r.json()))
    if (res) { ElMessage.success(res.msg); fetchCoupons() }
  } catch {}
}

const createCoupon = async () => {
  if (!form.value.code) return ElMessage.warning('Code is required')
  creating.value = true
  const res = await qe(post('/home/admin/coupons/create', form.value))
  creating.value = false
  if (res) {
    ElMessage.success(res.msg)
    showCreate.value = false
    form.value = { code: '', type: 'percentage', value: 10, minOrderAmount: 0, maxDiscount: 0, maxUses: 0, expiresAt: null, description: '' }
    fetchCoupons()
  }
}

onMounted(fetchCoupons)
</script>

<style scoped>
.admin-coupons { padding: 20px; }
.admin-coupons h2 { margin-bottom: 16px; }
</style>
