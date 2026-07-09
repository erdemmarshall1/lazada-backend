<template>
  <div>
    <h3>My Account</h3>
    <el-form :model="form" label-position="top" style="max-width:500px;margin-top:20px">
      <el-form-item label="Username"><el-input v-model="form.username" disabled /></el-form-item>
      <el-form-item label="Full Name"><el-input v-model="form.fullName" placeholder="Your full name" /></el-form-item>
      <el-form-item label="Email"><el-input v-model="form.email" /></el-form-item>
      <el-form-item label="Phone"><el-input v-model="form.phone" /></el-form-item>
      <el-form-item label="Bio"><el-input v-model="form.bio" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="Tell us about yourself" /></el-form-item>
      <el-form-item label="Date of Birth">
        <el-date-picker v-model="form.dateOfBirth" type="date" placeholder="Select date" style="width:100%" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item label="Gender">
        <el-select v-model="form.gender" placeholder="Select gender" style="width:100%">
          <el-option label="Male" value="male" />
          <el-option label="Female" value="female" />
          <el-option label="Other" value="other" />
          <el-option label="Prefer not to say" value="prefer_not_to_say" />
        </el-select>
      </el-form-item>
      <el-form-item label="Country"><el-input v-model="form.country" placeholder="Country" /></el-form-item>
      <el-form-item label="City"><el-input v-model="form.city" placeholder="City" /></el-form-item>
      <el-form-item label="Postal Code"><el-input v-model="form.postalCode" placeholder="Postal code" /></el-form-item>
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
const form = reactive({
  username: '', email: '', phone: '', fullName: '', bio: '', dateOfBirth: null,
  gender: 'prefer_not_to_say', country: '', city: '', postalCode: '',
})

const saveProfile = async () => {
  const res = await qe(post('/home/user/edit', {
    email: form.email,
    phone: form.phone,
    fullName: form.fullName,
    bio: form.bio,
    dateOfBirth: form.dateOfBirth,
    gender: form.gender,
    country: form.country,
    city: form.city,
    postalCode: form.postalCode,
  }))
  if (res) {
    store.setUserInfo(res.data)
    ElMessage.success('Profile updated')
  }
}

onMounted(() => {
  if (store.userInfo) {
    const u = store.userInfo
    form.username = u.username || ''
    form.email = u.email || ''
    form.phone = u.phone || ''
    form.fullName = u.fullName || ''
    form.bio = u.bio || ''
    form.dateOfBirth = u.dateOfBirth || null
    form.gender = u.gender || 'prefer_not_to_say'
    form.country = u.country || ''
    form.city = u.city || ''
    form.postalCode = u.postalCode || ''
  }
})
</script>

<style scoped>
@media (max-width: 768px) {
  .el-form { max-width: 100% !important; padding: 0 12px; }
}
</style>