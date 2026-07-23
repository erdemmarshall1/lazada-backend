<template>
  <div><h3>{{ $t('user.myBill.title') }}</h3><el-table :data="list" style="width:100%;margin-top:16px" v-if="list.length>0"><el-table-column prop="createdAt" :label="$t('user.myBill.dateLabel')" width="180"><template #default="{row}">{{ row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—' }}</template></el-table-column><el-table-column prop="type" :label="$t('user.myBill.typeLabel')" width="120" /><el-table-column prop="amount" :label="$t('user.myBill.amountLabel')" width="150"><template #default="{row}"><span :class="row.amount>0?'g-green':'g-red'">${{ Math.abs(row.amount).toFixed(2) }}</span></template></el-table-column><el-table-column prop="description" :label="$t('user.myBill.descriptionLabel')" /></el-table><div v-else class="c-no-list"><span class="c-no-list-text">{{ $t('user.myBill.empty') }}</span></div></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '@/api/request'
const list = ref([])
onMounted(async () => { const res = await get('/home/trade/getList', { pageSize: 50 }); if (res?.data) list.value = res.data.list || [] })
</script>

<style scoped>
@media (max-width: 768px) {
  .g-responsive-table { overflow-x: auto; }
  .g-responsive-table :deep(.el-table) { min-width: 600px; }
}
</style>