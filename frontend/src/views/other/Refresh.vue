<template>
  <div class="g-flex-center refresh-page"><span>Refreshing...</span></div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
onMounted(() => { router.replace('/main') })
</script>

<style scoped>
.refresh-page { height: 100vh; }
@media (max-width: 768px) { .refresh-page { height: 60vh; } }
</style>
