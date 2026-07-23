<template>
  <div><h3>Withdrawal History</h3><div v-if="list.length===0" class="c-no-list"><span class="c-no-list-text">No records</span></div><div v-for="item in list" :key="item._id" class="record-item">${{ Math.abs(item.amount) }} - {{ item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—' }}</div></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '@/api/request'
const list = ref([])
onMounted(async () => { const res = await get('/home/userWithdraw/getList', { pageSize: 50 }); if (res?.data) list.value = res.data.list || [] })
</script>
<style scoped>.record-item { padding: 12px; border-bottom: 1px solid var(--g-border); }
@media (max-width: 768px) { .record-item { padding: 10px; font-size: 13px; } }
</style>
