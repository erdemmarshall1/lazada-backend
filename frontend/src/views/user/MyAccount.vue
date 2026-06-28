<template>
  <div>
    <h3>My Account</h3>
    <el-form :model="form" label-position="top" style="max-width:500px;margin-top:20px">
      <el-form-item label="Username"><el-input v-model="form.username" disabled /></el-form-item>
      <el-form-item label="Email"><el-input v-model="form.email" /></el-form-item>
      <el-form-item label="Phone"><el-input v-model="form.phone" /></el-form-item>
      <el-form-item>
        <el-button type="primary" style="background:var(--g-main_color);border-color:var(--g-main_color)" @click="saveProfile">Save</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'
import { post, qe } from '@/api/request'

const store = useAppStore()
const form = reactive({ username: '', email: '', phone: '' })

const saveProfile = async () => {
  const res = await qe(post('/home/user/edit', { email: form.email, phone: form.phone }))
  if (res) ElMessage.success('Profile updated')
}

onMounted(() => {
  if (store.userInfo) {
    form.username = store.userInfo.username || ''
    form.email = store.userInfo.email || ''
    form.phone = store.userInfo.phone || ''
  }
})
</script>

<style scoped>
@media (max-width: 768px) {
  .el-form { max-width: 100% !important; padding: 0 12px; }
}
</style>