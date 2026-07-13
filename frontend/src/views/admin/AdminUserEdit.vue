<template>
  <div class="admin-page" v-loading="loading">
    <h3>Edit User</h3>
    <el-form v-if="user" label-width="140px" style="max-width:600px">
      <el-form-item label="Username">
        <el-input v-model="form.username" />
      </el-form-item>
      <el-form-item label="Email">
        <el-input v-model="form.email" />
      </el-form-item>
      <el-form-item label="Phone">
        <el-input v-model="form.phone" />
      </el-form-item>
      <el-form-item label="Full Name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="Gender">
        <el-select v-model="form.gender" style="width:100%">
          <el-option label="Not specified" value="" />
          <el-option label="Male" value="male" />
          <el-option label="Female" value="female" />
        </el-select>
      </el-form-item>
      <el-form-item label="Date of Birth">
        <el-date-picker v-model="form.birthday" type="date" style="width:100%" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item label="Country Code">
        <el-input v-model="form.countryCode" placeholder="e.g. +1" />
      </el-form-item>
      <el-form-item label="Status">
        <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="Active" inactive-text="Disabled" />
      </el-form-item>
      <el-form-item label="Role">
        <el-select v-model="form.role" style="width:100%">
          <el-option label="User" value="user" />
          <el-option label="Seller" value="seller" />
          <el-option label="Staff" value="staff" />
          <el-option label="Manager" value="manager" />
          <el-option label="Admin" value="admin" />
          <el-option label="Super Admin" value="super_admin" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="save" :loading="saving">Save Changes</el-button>
        <el-button @click="$router.back()">Cancel</el-button>
      </el-form-item>
    </el-form>

    <el-divider />

    <h4>Reset Password</h4>
    <el-form style="max-width:400px">
      <el-form-item label="New Password">
        <el-input v-model="newPassword" type="password" show-password />
      </el-form-item>
      <el-form-item>
        <el-button type="warning" @click="resetPassword" :loading="resetting">Reset Password</el-button>
      </el-form-item>
    </el-form>

    <el-divider />

    <h4>Login as User</h4>
    <p style="color:#999;margin-bottom:12px">Generate a temporary token to log in as this user (valid for 15 minutes).</p>
    <el-button type="danger" @click="loginAsUser" :loading="logining">Login as {{ user?.username }}</el-button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get, put, post } from '@/api/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userId = route.params.id

const loading = ref(false)
const saving = ref(false)
const resetting = ref(false)
const logining = ref(false)
const user = ref(null)
const newPassword = ref('')

const form = ref({
  username: '',
  email: '',
  phone: '',
  name: '',
  gender: '',
  birthday: '',
  countryCode: '',
  status: 1,
  role: 'user',
})

const fetchUser = async () => {
  loading.value = true
  try {
    const res = await get(`/home/admin/users/${userId}/detail`)
    if (res?.code === 0) {
      user.value = res.data
      form.value = {
        username: res.data.username || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        name: res.data.name || res.data.fullName || '',
        gender: res.data.gender || '',
        birthday: res.data.birthday || res.data.dateOfBirth || '',
        countryCode: res.data.countryCode || '',
        status: res.data.status ?? 1,
        role: res.data.role || 'user',
      }
    }
  } catch {} finally { loading.value = false }
}

const save = async () => {
  saving.value = true
  try {
    const res = await put(`/home/admin/users/${userId}`, {
      username: form.value.username,
      email: form.value.email,
      phone: form.value.phone,
      name: form.value.name,
      gender: form.value.gender,
      birthday: form.value.birthday,
      countryCode: form.value.countryCode,
      status: form.value.status,
      role: form.value.role,
    })
    if (res?.code === 0) {
      ElMessage.success('User updated')
      user.value = { ...user.value, ...res.data }
    }
  } catch {} finally { saving.value = false }
}

const resetPassword = async () => {
  if (!newPassword.value || newPassword.value.length < 6) {
    ElMessage.warning('Password must be at least 6 characters')
    return
  }
  resetting.value = true
  try {
    const res = await post(`/home/admin/users/${userId}/reset-password`, { password: newPassword.value })
    if (res?.code === 0) {
      ElMessage.success('Password reset successfully')
      newPassword.value = ''
    }
  } catch {} finally { resetting.value = false }
}

const loginAsUser = async () => {
  logining.value = true
  try {
    const res = await post(`/home/admin/login-as-user/${userId}`)
    if (res?.code === 0) {
      localStorage.setItem('seller_temp_token', res.data.token)
      ElMessage.success(`Logged in as ${res.data.username}`)
      window.open('/', '_blank')
    }
  } catch {} finally { logining.value = false }
}

onMounted(fetchUser)
</script>

<style scoped>
.admin-page { padding: 20px; }
</style>
