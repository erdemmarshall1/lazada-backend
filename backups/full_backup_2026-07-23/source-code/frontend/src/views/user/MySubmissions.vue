<template>
  <div>
    <h3>{{ $t('user.mySubmissions.title') }}</h3>
    <p v-if="!list.length && !loading" class="empty-text">{{ $t('user.mySubmissions.empty') }}</p>
    <el-table :data="list" v-loading="loading" style="width:100%" size="small">
      <el-table-column :label="$t('user.mySubmissions.dateLabel')" width="140">
        <template #default="{row}">{{ new Date(row.createdAt).toLocaleDateString() }}</template>
      </el-table-column>
      <el-table-column prop="subject" :label="$t('user.mySubmissions.subjectLabel')" min-width="180" show-overflow-tooltip />
      <el-table-column :label="$t('user.mySubmissions.categoryLabel')" width="100">
        <template #default="{row}"><el-tag size="small">{{ row.category }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="$t('user.mySubmissions.statusLabel')" width="90">
        <template #default="{row}">
          <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('user.mySubmissions.actionLabel')" width="80">
        <template #default="{row}">
          <el-button size="small" text @click="selected = row; dialogVisible = true">{{ $t('user.mySubmissions.view') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="fetchList" small />
    </div>
    <el-dialog v-model="dialogVisible" :title="$t('user.mySubmissions.detailTitle')" width="500px">
      <div v-if="view">
        <p><strong>{{ $t('user.mySubmissions.subject') }}</strong> {{ view.subject }}</p>
        <p><strong>{{ $t('user.mySubmissions.category') }}</strong> {{ view.category }}</p>
        <p><strong>{{ $t('user.mySubmissions.date') }}</strong> {{ new Date(view.createdAt).toLocaleString() }}</p>
        <p><strong>{{ $t('user.mySubmissions.status') }}</strong> <el-tag :type="statusType(view.status)" size="small">{{ view.status }}</el-tag></p>
        <el-divider />
        <p><strong>{{ $t('user.mySubmissions.message') }}</strong></p>
        <p style="white-space:pre-wrap;background:#f9f9f9;padding:12px;border-radius:4px">{{ view.message }}</p>
        <div v-if="view.adminNotes" style="margin-top:16px;padding:12px;background:#f0f7ff;border-radius:4px">
          <p><strong>{{ $t('user.mySubmissions.adminResponse') }}</strong></p>
          <p style="white-space:pre-wrap">{{ view.adminNotes }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '@/api/request'

const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const dialogVisible = ref(false)
const view = ref(null)

const statusType = (s) => ({ new: 'info', read: 'primary', replied: 'success', closed: 'warning' })[s] || 'info'

const fetchList = async () => {
  loading.value = true
  try {
    const res = await get(`/home/submissions/my?page=${page.value}&pageSize=${pageSize}`)
    if (res?.code === 0 && res?.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch {} finally { loading.value = false }
}

onMounted(fetchList)
</script>

<style scoped>
.empty-text { color: #999; padding: 40px 0; text-align: center; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: center; }
</style>