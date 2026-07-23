<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'

const route = useRoute()
const usesAdminLayout = computed(() => route.matched.some(r => r.meta && r.meta.adminLayout))
const layoutComponent = computed(() => usesAdminLayout.value ? AdminLayout : 'div')
</script>
