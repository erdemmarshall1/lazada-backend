<template>
  <div class="offline-page">
    <h2>You are offline</h2>
    <p>Please check your internet connection and try again.</p>
    <el-button @click="$router.push('/main')">Go to Home</el-button>
  </div>
</template>
<script setup>
import { ElButton } from 'element-plus'
</script>
<style scoped>
.offline-page { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; text-align: center; padding: 20px; }
@media (max-width: 768px) {
  .offline-page h2 { font-size: 18px; }
  .offline-page p { font-size: 14px; }
}
</style>
