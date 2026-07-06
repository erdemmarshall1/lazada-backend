<template>
  <div class="ton-nav-bar desktop-only">
    <div class="ton-nav-bar-inner">
      <div
        v-for="item in navItems"
        :key="item.path"
        class="ton-nav-bar-item"
        :class="{ active: currentPath === item.path }"
        @click="goNav(item.path)"
      >
        <i v-if="item.icon" :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const currentPath = computed(() => route.path)

const navItems = [
  { label: 'Just In', path: '/searchgoods' },
  { label: 'Bestsellers', path: '/remenglist' },
  { label: 'Recommended', path: '/tuijianlist' },
  { label: 'Shop Street', path: '/shopjie' },
  { label: 'Flash Deals', path: '/miaoshalist' },
  { label: 'Categories', path: '/main' },
]

const goNav = (path) => { router.push(path) }
</script>

<style scoped>
.ton-nav-bar { background: #faf8f4; border-bottom: 1px solid #e8e6e2; }
.ton-nav-bar-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; height: 40px; padding: 0 20px; gap: 4px; }
.ton-nav-bar-item { display: flex; align-items: center; gap: 4px; height: 100%; padding: 0 16px; font-size: 12px; letter-spacing: 0.5px; color: #555; cursor: pointer; transition: all 0.2s; white-space: nowrap; position: relative; }
.ton-nav-bar-item:hover { color: #000; }
.ton-nav-bar-item.active { color: #000; font-weight: 600; }
.ton-nav-bar-item.active::after { content: ''; position: absolute; bottom: 0; left: 16px; right: 16px; height: 2px; background: #000; }
.ton-nav-bar-item .iconfont { font-size: 14px; }
@media (max-width: 1024px) {
  .ton-nav-bar-inner { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .ton-nav-bar-item { padding: 0 12px; font-size: 11px; }
}
@media (max-width: 768px) {
  .ton-nav-bar { display: none; }
}
</style>
