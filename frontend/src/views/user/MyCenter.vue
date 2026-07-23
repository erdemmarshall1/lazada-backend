<template>
  <div class="mycenter-view">
    <div class="mycenter-container g-flex">
      <button class="mycenter-sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
        <span v-if="!sidebarOpen">&#9776; {{ $t('user.myCenter.menu') }}</span>
        <span v-else>&times; {{ $t('user.myCenter.close') }}</span>
      </button>
      <div class="sidebar-overlay" v-if="sidebarOpen" @click="sidebarOpen = false"></div>
      <div class="mycenter-sidebar" :class="{ open: sidebarOpen }">
        <div class="content-left">
          <div class="content-user" v-if="store.isLogin">
            <div v-if="shopLogo" class="store-identity">
              <img :src="shopLogo" :alt="$t('store.myStore.logoAlt')" class="store-logo" />
              <div class="store-name">{{ shopName }}</div>
              <div class="store-meta" v-if="storeNumber">{{ storeNumber }}</div>
              <div class="user-title username-sm">{{ store.userInfo?.username }}</div>
            </div>
            <div v-else>
              <div class="user-title">{{ store.userInfo?.username }}</div>
            </div>
          </div>
          <div
            v-for="item in flatMenu"
            :key="item.path"
            class="user-menu"
            :class="{ 'menu-active': $route.path === item.path }"
            @click="handleMenuClick(item)"
          >
            <div class="menu-title">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path v-html="item.svg"/></svg>
              {{ item.label }}
            </div>
          </div>
        </div>
      </div>
      <div class="mycenter-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { get, imgUrl } from '@/api/request'
const store = useAppStore()
const isAdmin = computed(() => store.isAdmin)
const router = useRouter()
const sidebarOpen = ref(false)
const shopLogo = ref('')
const shopName = ref('')
const storeNumber = ref('')

watch(sidebarOpen, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

const handleMenuClick = (item) => {
  if (item.external) {
    window.open(item.path, '_blank')
  } else {
    router.push(item.path)
  }
  sidebarOpen.value = false
}

const flatMenu = computed(() => {
  const items = [
    { label: 'My Account', path: '/myaccount' },
    { label: 'Current Balance', path: '/balance' },
    { label: 'My Orders', path: '/myorder' },
    { label: 'Order Management', path: '/storeordercontrol', hidden: !store.isSeller },
    { label: 'Billing Records', path: '/mybill' },
    { label: 'Recharge Record', path: '/rechargehistory' },
    { label: 'Withdrawal Record', path: '/cashouthistory' },
    { label: 'Wallet Management', path: '/walletlist' },
    { label: 'Delivery Address', path: '/addresslist' },
    { label: 'Internal Message', path: '/internalmsg' },
    { label: 'My Consultations', path: '/myconsultations' },
    { label: 'Wholesale Management', path: '/sourcegoods' },
    { label: store.isSeller ? 'Shop Details' : 'Apply for Merchant', path: store.isSeller ? '/storesettings' : '/applystore' },
    { label: 'Product Management', path: '/storegoodcontrol' },
    { label: 'Logistics Management', path: '/seller-logistics', hidden: !store.isSeller },
  ]

  return items.filter(i => !i.hidden)
})

onMounted(async () => {
  if (store.isSeller) {
    try {
      const res = await get('/home/userShop/getInfo')
      if (res?.data) {
        shopLogo.value = imgUrl(res.data.logo) || ''
        shopName.value = res.data.name || ''
        storeNumber.value = res.data.storeNumber || ''
      }
    } catch {}
  }
})
</script>

<style scoped>
.mycenter-view { flex: 1; background: var(--g-bg); padding: 20px 0; min-height: calc(100vh - 200px); }
.mycenter-container { max-width: var(--g-main-width); margin: 0 auto; gap: 20px; width: 100%; }
.mycenter-sidebar { width: 220px; flex-shrink: 0; max-height: calc(100vh - 250px); overflow-y: auto; }
.mycenter-sidebar-toggle { display: none; align-items: center; gap: 8px; padding: 10px 16px; margin-bottom: 12px; background: var(--g-white); border: 1px solid var(--g-border); border-radius: 8px; font-size: 14px; cursor: pointer; color: var(--g-text); width: 100%; justify-content: center; }
.mycenter-sidebar-toggle:hover { background: #f4f2ee; }

.content-left { background: var(--g-white); border: 1px solid var(--g-border); border-radius: 4px; padding: 0; }
.content-user { padding: 20px 16px 12px; border-bottom: 1px solid var(--g-border); }
.user-title { font-size: 16px; font-weight: 600; color: var(--g-text); }
.store-identity { text-align: center; }
.store-logo { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid var(--g-border); margin: 0 auto 8px; display: block; }
.store-name { font-size: 15px; font-weight: 600; color: var(--g-text); }
.store-meta { font-size: 12px; color: var(--g-text-light); margin-top: 2px; }
.username-sm { font-size: 12px; color: var(--g-text-light); margin-top: 4px; }

.user-menu { cursor: pointer; transition: all 0.2s; }
.user-menu .menu-title { padding: 12px 16px; font-size: 14px; color: var(--g-text); display: flex; align-items: center; gap: 10px; }
.user-menu:hover { background: rgba(0,0,0,0.02); }
.user-menu.menu-active .menu-title { color: var(--g-main_color); font-weight: 600; background: rgba(238,77,45,0.04); }

.menu-icon { width: 18px; height: 18px; flex-shrink: 0; color: var(--g-text-light); }
.user-menu.menu-active .menu-icon { color: var(--g-main_color); }

.mycenter-content { flex: 1; background: var(--g-white); border-radius: 8px; padding: 24px; min-height: 500px; }

@media (max-width: 768px) {
  .mycenter-container { flex-direction: column; position: relative; min-height: calc(100vh - 200px); }
  .mycenter-sidebar-toggle { display: flex; position: sticky; top: 0; z-index: 10; }
  .sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 98; }
  .mycenter-sidebar { position: fixed; top: 0; left: -240px; width: 240px; height: 100%; z-index: 99; display: flex; flex-direction: column; background: var(--g-bg); max-height: 100vh; overflow-y: auto; transition: left 0.3s ease; padding: 0; margin: 0; }
  .mycenter-sidebar.open { left: 0; display: flex; }
  .mycenter-content { padding: 16px; min-height: auto; }
}
</style>
