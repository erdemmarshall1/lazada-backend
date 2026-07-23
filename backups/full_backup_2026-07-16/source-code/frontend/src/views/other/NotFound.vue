<template>
  <div class="not-found-view g-flex-center" style="flex-direction:column;min-height:50vh">
    <h1 style="font-size:72px;color:var(--g-main_color);margin-bottom:16px">404</h1>
    <p style="font-size:18px;color:#666;margin-bottom:24px">Page not found</p>
    <el-button type="primary" size="large" style="background:var(--g-main_color);border-color:var(--g-main_color)" @click="$router.push('/main')">Back to Home</el-button>
  </div>
</template>

<style scoped>
@media (max-width: 768px) {
  .not-found-view h1 { font-size: 48px !important; }
  .not-found-view p { font-size: 16px !important; }
}
</style>
