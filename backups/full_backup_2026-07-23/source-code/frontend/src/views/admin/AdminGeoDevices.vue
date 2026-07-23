<template>
  <div class="admin-page admin-geo">
    <h2>Geo & Device Analytics</h2>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="Device Breakdown" name="devices">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="stat-card"><h4>Operating Systems</h4><el-table :data="summary.os" size="small" max-height="400"><el-table-column prop="name" label="OS" min-width="120" /><el-table-column prop="count" label="Sessions" width="100" /></el-table></div>
          </el-col>
          <el-col :span="8">
            <div class="stat-card"><h4>Browsers</h4><el-table :data="summary.browsers" size="small" max-height="400"><el-table-column prop="name" label="Browser" min-width="120" /><el-table-column prop="count" label="Sessions" width="100" /></el-table></div>
          </el-col>
          <el-col :span="8">
            <div class="stat-card"><h4>Device Types</h4><el-table :data="summary.devices" size="small" max-height="400"><el-table-column prop="name" label="Type" min-width="120" /><el-table-column prop="count" label="Sessions" width="100" /></el-table></div>
          </el-col>
        </el-row>
      </el-tab-pane>
      <el-tab-pane label="Locations" name="locations">
        <div class="stat-card">
          <h4>Countries / Regions</h4>
          <el-table :data="summary.locations" size="small" max-height="500"><el-table-column prop="name" label="Country" min-width="200" /><el-table-column prop="count" label="Sessions" width="120" /></el-table>
        </div>
      </el-tab-pane>
      <el-tab-pane label="Registration Locations" name="registration">
        <el-table :data="regUsers" v-loading="regLoading" size="small" max-height="600">
          <el-table-column label="User" min-width="140">
            <template #default="{row}">{{ row.username || row.email }}</template>
          </el-table-column>
          <el-table-column prop="registrationIP" label="Reg. IP" width="140" />
          <el-table-column prop="registrationLocation" label="Reg. Location" min-width="200" />
          <el-table-column prop="registrationDevice" label="Reg. Device" min-width="200" show-overflow-tooltip />
          <el-table-column label="Registered" width="120">
            <template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}</template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrap" v-if="regTotal > 0">
          <el-pagination background layout="prev, pager, next" :total="regTotal" :page-size="50" v-model:current-page="regPage" @current-change="fetchRegUsers" small />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '@/api/request'

const activeTab = ref('devices')
const summary = ref({ os: [], browsers: [], devices: [], locations: [] })
const regUsers = ref([])
const regLoading = ref(false)
const regPage = ref(1)
const regTotal = ref(0)

const fetchSummary = async () => {
  const res = await get('/home/admin/geo-devices/summary')
  if (res?.code === 0) summary.value = res.data
}

const fetchRegUsers = async () => {
  regLoading.value = true
  const res = await get('/home/admin/users', { page: regPage.value, pageSize: 50 })
  if (res?.code === 0 && res?.data) {
    regUsers.value = (res.data.list || []).filter(u => u.registrationIP)
    regTotal.value = res.data.total || 0
  }
  regLoading.value = false
}

onMounted(() => { fetchSummary(); fetchRegUsers() })
</script>

<style scoped>
.admin-geo { padding: 20px; }
.admin-geo h2 { margin-bottom: 16px; }
.stat-card { background: var(--dash-dark-card); padding: 16px; border-radius: 8px; margin-bottom: 16px; }
.stat-card h4 { margin: 0 0 12px; font-size: 14px; color: rgba(255,255,255,0.7); }
.pagination-wrap { margin-top: 12px; display: flex; justify-content: center; }
</style>
