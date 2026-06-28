<template>
  <div v-loading="loading"><h3>Wallets</h3><div v-if="list.length===0" class="c-no-list"><span class="c-no-list-text">No wallets</span></div><div v-for="w in list" :key="w._id" class="wallet-item">Balance: ${{ w.balance }}</div></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '@/api/request'
const list = ref([])
const loading = ref(true)
onMounted(async () => { const res = await get('/home/userWallet/getList'); if (res?.data) list.value = res.data.list || res.data || []; loading.value = false })
</script>

<style scoped>
.wallet-item { padding: 12px; border: 1px solid var(--g-border); border-radius: 4px; margin-top: 8px; }
@media (max-width: 768px) {
  .wallet-item { padding: 10px; font-size: 14px; }
}
</style>
