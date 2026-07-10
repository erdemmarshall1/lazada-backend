<template>
  <div class="admin-page admin-reports">
    <h2>Reports</h2>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="Overview" name="overview">
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-value">{{ overview.totalUsers || 0 }}</div><div class="stat-label">Total Users</div></div>
          <div class="stat-card"><div class="stat-value">{{ overview.totalProducts || 0 }}</div><div class="stat-label">Active Products</div></div>
          <div class="stat-card"><div class="stat-value">{{ overview.totalOrders || 0 }}</div><div class="stat-label">Total Orders</div></div>
          <div class="stat-card"><div class="stat-value">${{ (overview.totalRevenue || 0).toFixed(2) }}</div><div class="stat-label">Total Revenue</div></div>
          <div class="stat-card"><div class="stat-value">${{ (overview.platformBalance || 0).toFixed(2) }}</div><div class="stat-label">Platform Balance</div></div>
          <div class="stat-card"><div class="stat-value">${{ (overview.platformRevenue || 0).toFixed(2) }}</div><div class="stat-label">Platform Revenue</div></div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Sales" name="sales">
        <div class="report-filters">
          <el-date-picker v-model="salesDateRange" type="daterange" range-separator="to" start-placeholder="Start" end-placeholder="End" value-format="YYYY-MM-DD" style="width:260px" />
          <el-select v-model="salesGroupBy" style="width:100px;margin-left:8px">
            <el-option label="Day" value="day" />
            <el-option label="Month" value="month" />
            <el-option label="Year" value="year" />
          </el-select>
          <el-button type="primary" @click="loadSales" style="margin-left:8px">Load</el-button>
        </div>
        <div class="stats-grid" v-if="salesData.overview">
          <div class="stat-card"><div class="stat-value">${{ salesData.overview.totalRevenue?.toFixed(2) }}</div><div class="stat-label">Revenue</div></div>
          <div class="stat-card"><div class="stat-value">{{ salesData.overview.orderCount }}</div><div class="stat-label">Orders</div></div>
          <div class="stat-card"><div class="stat-value">${{ salesData.overview.avgOrderValue?.toFixed(2) }}</div><div class="stat-label">Avg Order</div></div>
          <div class="stat-card"><div class="stat-value">${{ salesData.overview.totalDiscount?.toFixed(2) }}</div><div class="stat-label">Discounts</div></div>
          <div class="stat-card"><div class="stat-value">${{ salesData.overview.totalShipping?.toFixed(2) }}</div><div class="stat-label">Shipping</div></div>
        </div>

        <h3>Revenue Trend</h3>
        <div class="g-responsive-table">
          <el-table :data="salesData.timeSeries" stripe max-height="400" v-if="salesData.timeSeries?.length">
            <el-table-column prop="_id" label="Period" width="120" />
            <el-table-column label="Orders"><template #default="{row}">{{ row.orders }}</template></el-table-column>
            <el-table-column label="Revenue"><template #default="{row}">${{ row.revenue?.toFixed(2) }}</template></el-table-column>
            <el-table-column label="Discount"><template #default="{row}">${{ row.discount?.toFixed(2) }}</template></el-table-column>
          </el-table>
        </div>

        <h3>Top Products</h3>
        <div class="g-responsive-table">
          <el-table :data="salesData.topProducts" stripe max-height="400" v-if="salesData.topProducts?.length">
            <el-table-column label="Product" min-width="200" show-overflow-tooltip>
              <template #default="{row}">{{ row.productName || row._id }}</template>
            </el-table-column>
            <el-table-column label="Sold"><template #default="{row}">{{ row.totalSold }}</template></el-table-column>
            <el-table-column label="Revenue"><template #default="{row}">${{ row.totalRevenue?.toFixed(2) }}</template></el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Customers" name="customers">
        <div class="report-filters">
          <el-date-picker v-model="custDateRange" type="daterange" range-separator="to" start-placeholder="Start" end-placeholder="End" value-format="YYYY-MM-DD" style="width:260px" />
          <el-button type="primary" @click="loadCustomers" style="margin-left:8px">Load</el-button>
        </div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-value">{{ custData.totalUsers }}</div><div class="stat-label">Total Users</div></div>
          <div class="stat-card"><div class="stat-value">{{ custData.activeUsers }}</div><div class="stat-label">Active Users</div></div>
        </div>
        <h3>Users by Role</h3>
        <div class="g-responsive-table">
          <el-table :data="custData.roleBreakdown" stripe v-if="custData.roleBreakdown?.length">
            <el-table-column prop="_id" label="Role" />
            <el-table-column prop="count" label="Count" />
          </el-table>
        </div>
        <h3>Top Customers</h3>
        <div class="g-responsive-table">
          <el-table :data="custData.topCustomers" stripe v-if="custData.topCustomers?.length">
            <el-table-column label="Customer"><template #default="{row}">{{ row.user?.username || row._id }}</template></el-table-column>
            <el-table-column label="Orders"><template #default="{row}">{{ row.orderCount }}</template></el-table-column>
            <el-table-column label="Total Spent"><template #default="{row}">${{ row.totalSpent?.toFixed(2) }}</template></el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Inventory" name="inventory">
        <div class="report-filters">
          <el-input-number v-model="lowStockThreshold" :min="1" :max="100" size="small" />
          <span style="margin:0 8px">Low stock threshold</span>
          <el-button type="primary" @click="loadInventory" size="small">Load</el-button>
        </div>
        <div class="stats-grid" v-if="invData.overview">
          <div class="stat-card"><div class="stat-value">{{ invData.overview.totalStock }}</div><div class="stat-label">Total Stock</div></div>
          <div class="stat-card"><div class="stat-value">${{ invData.overview.totalValue?.toFixed(2) }}</div><div class="stat-label">Inventory Value</div></div>
          <div class="stat-card"><div class="stat-value">{{ invData.overview.lowStockCount }}</div><div class="stat-label">Low Stock Items</div></div>
          <div class="stat-card"><div class="stat-value">{{ invData.overview.outOfStockCount }}</div><div class="stat-label">Out of Stock</div></div>
        </div>
        <h3>Products</h3>
        <div class="g-responsive-table">
          <el-table :data="invData.products" stripe v-loading="invLoading">
            <el-table-column prop="name" label="Product" min-width="180" show-overflow-tooltip />
            <el-table-column prop="category" label="Category" width="120" />
            <el-table-column prop="totalStock" label="Stock" width="80" />
            <el-table-column label="Value" width="100"><template #default="{row}">${{ row.totalValue?.toFixed(2) }}</template></el-table-column>
            <el-table-column prop="minSkuStock" label="Min SKU" width="80">
              <template #default="{row}">
                <el-tag :type="row.minSkuStock <= lowStockThreshold ? 'danger' : 'success'" size="small">{{ row.minSkuStock }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div class="g-flex-center g-mgt-16" v-if="invData.total > pageSize">
            <el-pagination layout="prev, pager, next" :total="invData.total" :page-size="pageSize" v-model:current-page="invPage" @current-change="loadInventory" />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Financial" name="financial">
        <div class="report-filters">
          <el-date-picker v-model="finDateRange" type="daterange" range-separator="to" start-placeholder="Start" end-placeholder="End" value-format="YYYY-MM-DD" style="width:260px" />
          <el-button type="primary" @click="loadFinancial" style="margin-left:8px">Load</el-button>
        </div>
        <div class="stats-grid" v-if="finData.revenue">
          <div class="stat-card"><div class="stat-value">${{ finData.revenue.grossRevenue?.toFixed(2) }}</div><div class="stat-label">Gross Revenue</div></div>
          <div class="stat-card"><div class="stat-value">${{ finData.revenue.netRevenue?.toFixed(2) }}</div><div class="stat-label">Net Revenue</div></div>
          <div class="stat-card"><div class="stat-value">${{ finData.revenue.totalDiscount?.toFixed(2) }}</div><div class="stat-label">Discounts</div></div>
          <div class="stat-card"><div class="stat-value">${{ finData.revenue.totalShipping?.toFixed(2) }}</div><div class="stat-label">Shipping</div></div>
          <div class="stat-card"><div class="stat-value">${{ finData.estimatedProfit?.toFixed(2) }}</div><div class="stat-label">Est. Profit</div></div>
          <div class="stat-card"><div class="stat-value">${{ finData.netProfit?.toFixed(2) }}</div><div class="stat-label">Net Profit</div></div>
          <div class="stat-card" v-if="finData.refunds"><div class="stat-value">{{ finData.refunds.refundCount }}</div><div class="stat-label">Refunds</div></div>
          <div class="stat-card" v-if="finData.refunds"><div class="stat-value">${{ finData.refunds.totalRefunded?.toFixed(2) }}</div><div class="stat-label">Refunded Amount</div></div>
        </div>
        <h3 v-if="finData.platformWallet">Platform Wallet</h3>
        <div class="stats-grid" v-if="finData.platformWallet">
          <div class="stat-card"><div class="stat-value">${{ finData.platformWallet.balance?.toFixed(2) }}</div><div class="stat-label">Balance</div></div>
          <div class="stat-card"><div class="stat-value">${{ finData.platformWallet.escrowBalance?.toFixed(2) }}</div><div class="stat-label">Escrow</div></div>
          <div class="stat-card"><div class="stat-value">${{ finData.platformWallet.totalRevenue?.toFixed(2) }}</div><div class="stat-label">Revenue</div></div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '@/api/request'

const activeTab = ref('overview')

const overview = ref({})

const salesDateRange = ref(null)
const salesGroupBy = ref('day')
const salesData = ref({})

const custDateRange = ref(null)
const custData = ref({})

const invData = ref({})
const invLoading = ref(false)
const invPage = ref(1)
const lowStockThreshold = ref(10)
const pageSize = 20

const finDateRange = ref(null)
const finData = ref({})

const loadOverview = async () => {
  const res = await get('/home/report/dashboard')
  if (res?.code === 0 && res?.data) overview.value = res.data
}

const loadSales = async () => {
  const params = { groupBy: salesGroupBy.value }
  if (salesDateRange.value) {
    params.startDate = salesDateRange.value[0]
    params.endDate = salesDateRange.value[1]
  }
  const res = await get('/home/report/sales', params)
  if (res?.code === 0 && res?.data) salesData.value = res.data
}

const loadCustomers = async () => {
  const params = {}
  if (custDateRange.value) {
    params.startDate = custDateRange.value[0]
    params.endDate = custDateRange.value[1]
  }
  const res = await get('/home/report/customers', params)
  if (res?.code === 0 && res?.data) custData.value = res.data
}

const loadInventory = async () => {
  invLoading.value = true
  const res = await get('/home/report/inventory', { page: invPage.value, pageSize, lowStock: lowStockThreshold.value })
  if (res?.code === 0 && res?.data) invData.value = res.data
  invLoading.value = false
}

const loadFinancial = async () => {
  const params = {}
  if (finDateRange.value) {
    params.startDate = finDateRange.value[0]
    params.endDate = finDateRange.value[1]
  }
  const res = await get('/home/report/financial', params)
  if (res?.code === 0 && res?.data) finData.value = res.data
}

onMounted(() => {
  loadOverview()
  loadSales()
  loadCustomers()
  loadInventory()
  loadFinancial()
})
</script>

<style scoped>
.admin-reports { padding: 20px; }
.admin-reports h2 { margin-bottom: 16px; }
.report-filters { display: flex; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 4px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }
.stat-card { background: #f9f8f4; border: 1px solid #e8e6e2; border-radius: 8px; padding: 16px; text-align: center; }
.stat-value { font-size: 22px; font-weight: 700; color: #222; }
.stat-label { font-size: 12px; color: #888; margin-top: 4px; }
.admin-reports :deep(.el-table) { margin-bottom: 12px; }
</style>
