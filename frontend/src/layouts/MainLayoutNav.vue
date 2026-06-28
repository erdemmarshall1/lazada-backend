<template>
  <div class="s-nav-box">
    <div class="s-nav g-flex-align-center">
      <div
        v-for="item in navItems"
        :key="item.path"
        class="s-nav-item"
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
  { label: 'All Categories', path: '/main', icon: 'iconfont icon-fenlei' },
  { label: 'Product Recommendation', path: '/tuijianlist', icon: 'iconfont icon-tuijian' },
  { label: 'Shop Street', path: '/shopstreet', icon: 'iconfont icon-dianpu' },
  { label: 'Popular', path: '/remenglist', icon: 'iconfont icon-huore' },
  { label: 'Personal Center', path: '/mycenter', icon: 'iconfont icon-yonghu' },
  { label: 'My Orders', path: '/myorder', icon: 'iconfont icon-dingdan' },
  { label: 'Browsing History', path: '/seehistory', icon: 'iconfont icon-lishi' },
]

const goNav = (path) => {
  router.push(path)
}
</script>

<style scoped>
.s-nav-box {
  background: var(--g-white);
  border-bottom: 1px solid var(--g-border);
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}
.s-nav {
  max-width: var(--g-main-width);
  margin: 0 auto;
  height: 44px;
}
.s-nav-item {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  padding: 0 18px;
  font-size: 14px;
  color: var(--g-text);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  white-space: nowrap;
}
.s-nav-item:hover {
  color: var(--g-main_color);
}
.s-nav-item.active {
  background: var(--g-main_color);
  color: #fff;
}
.s-nav-item .iconfont {
  font-size: 16px;
}
@media (max-width: 1024px) {
  .s-nav { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .s-nav-item { padding: 0 12px; font-size: 13px; }
}
@media (max-width: 768px) {
  .s-nav-box { display: none; }
}
</style>
