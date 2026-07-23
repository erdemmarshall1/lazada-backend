<template>
  <div class="change-password">
    <h3 class="page-title">Change Password</h3>
    <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="pwd-form">
      <el-form-item label="Current Password" prop="oldPassword">
        <el-input v-model="form.oldPassword" type="password" show-password placeholder="Enter current password" />
      </el-form-item>
      <el-form-item label="New Password" prop="newPassword">
        <el-input v-model="form.newPassword" type="password" show-password placeholder="Enter new password" />
      </el-form-item>
      <el-form-item label="Confirm New Password" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" show-password placeholder="Re-enter new password" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="handleSubmit" style="width:100%;background:var(--g-main_color);border-color:var(--g-main_color)">Update Password</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { post } from '@/api/request'

const formRef = ref(null)
const loading = ref(false)

const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

const validateConfirm = (rule, value, callback) => {
  if (value !== form.newPassword) {
    callback(new Error('Passwords do not match'))
  } else {
    callback()
  }
}

const rules = {
  oldPassword: [{ required: true, message: 'Please enter current password', trigger: 'blur' }],
  newPassword: [
    { required: true, message: 'Please enter new password', trigger: 'blur' },
    { min: 6, message: 'Minimum 6 characters', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm new password', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await post('/home/user/editPassword', {
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    })
    ElMessage.success(res?.msg || 'Password updated successfully')
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
  } catch (err) {
    ElMessage.error(err?.response?.data?.msg || err?.msg || 'Failed to update password')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.change-password { max-width: 480px; }
.page-title { font-size: 18px; font-weight: 600; margin-bottom: 24px; }
.pwd-form { max-width: 400px; }
</style>
