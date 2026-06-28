<template>
  <div>
    <h3>{{ isEditing ? 'Update Store Info' : 'Account Details' }}</h3>
    <p style="color:var(--g-text-light);margin-bottom:16px">{{ isEditing ? 'Edit your store information below' : 'Create your secure merchant store account' }}</p>

    <div v-if="loadingInfo" v-loading="loadingInfo" style="height:200px"></div>

    <el-form v-else ref="formRef" :model="form" :rules="computedRules" label-position="top" style="max-width:600px;margin-top:16px">
      <el-form-item label="Store Logo">
        <el-upload class="avatar-uploader" :show-file-list="false" :before-upload="handleLogoUpload" accept="image/*">
          <img v-if="form.storeLogo" :src="$imgUrl(form.storeLogo)" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>
      <el-form-item label="Full Name" prop="fullName">
        <el-input v-model="form.fullName" placeholder="Full Name" />
      </el-form-item>
      <el-form-item label="Store Name" prop="name">
        <el-input v-model="form.name" placeholder="Store Name" />
      </el-form-item>
      <el-form-item label="Address" prop="address">
        <el-input v-model="form.address" placeholder="Address" />
      </el-form-item>
      <el-form-item label="ID Front" prop="idFrontImage">
        <el-upload class="upload-demo" :show-file-list="true" :before-upload="handleIdFrontUpload" accept="image/*" :limit="1" :on-exceed="() => ElMessage.warning('Only one file allowed')">
          <el-button type="primary">Upload ID Front</el-button>
        </el-upload>
        <div v-if="form.idFrontImage" class="upload-hint">Uploaded: {{ form.idFrontImage.split('/').pop() }}</div>
      </el-form-item>
      <el-form-item label="ID Back" prop="idBackImage">
        <el-upload class="upload-demo" :show-file-list="true" :before-upload="handleIdBackUpload" accept="image/*" :limit="1" :on-exceed="() => ElMessage.warning('Only one file allowed')">
          <el-button type="primary">Upload ID Back</el-button>
        </el-upload>
        <div v-if="form.idBackImage" class="upload-hint">Uploaded: {{ form.idBackImage.split('/').pop() }}</div>
      </el-form-item>
      <el-form-item label="Social Security Number / ID Number" prop="idNumber">
        <el-input v-model="form.idNumber" placeholder="Social Security Number / ID Number" />
      </el-form-item>
      <el-form-item label="Invitation Code" prop="invitationCode">
        <el-input v-model="form.invitationCode" placeholder="Invitation Code (8101081865)" />
        <div style="font-size:12px;color:#999;margin-top:4px">Default code: 8101081865</div>
      </el-form-item>
      <el-form-item label="Upload Utility Bills" prop="utilityBill">
        <el-upload class="upload-demo" :show-file-list="true" :before-upload="handleUtilityBillUpload" accept="image/*,.pdf" :limit="1" :on-exceed="() => ElMessage.warning('Only one file allowed')">
          <el-button type="primary">Upload Utility Bill</el-button>
        </el-upload>
        <div v-if="form.utilityBill" class="upload-hint">Uploaded: {{ form.utilityBill.split('/').pop() }}</div>
      </el-form-item>
      <el-form-item label="Email Address" prop="email">
        <el-input v-model="form.email" placeholder="Email Address" />
      </el-form-item>
      <el-form-item label="Phone Number" prop="phone">
        <el-input v-model="form.phone" placeholder="Phone Number" />
      </el-form-item>
      <el-form-item v-if="!isEditing" label="Transaction Password" prop="password">
        <el-input v-model="form.password" type="password" placeholder="Transaction password for payments (min 8 chars)" show-password />
      </el-form-item>
      <el-form-item v-if="!isEditing" label="Confirm Transaction Password" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" placeholder="Repeat transaction password" show-password />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" style="background:var(--g-main_color);border-color:var(--g-main_color)" :loading="submitting" @click="submit">{{ isEditing ? 'Update Store' : 'Submit Application' }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { get, post, qe, uploadFile } from '@/api/request'
const router = useRouter()

const formRef = ref(null)
const submitting = ref(false)
const loadingInfo = ref(false)
const isEditing = ref(false)

const form = reactive({
  storeLogo: '',
  fullName: '',
  name: '',
  address: '',
  idFrontImage: '',
  idBackImage: '',
  idNumber: '',
  invitationCode: '8101081865',
  utilityBill: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) return callback(new Error('Passwords do not match'))
  callback()
}

const computedRules = computed(() => {
  const base = {
    fullName: [{ required: true, message: 'Full name is required', trigger: 'blur' }],
    name: [{ required: true, message: 'Store name is required', trigger: 'blur' }],
    address: [{ required: true, message: 'Address is required', trigger: 'blur' }],
    idNumber: [{ required: true, message: 'Social Security Number / ID Number is required', trigger: 'blur' }],
    invitationCode: [{ required: true, message: 'Invitation code is required', trigger: 'blur' }],
    email: [{ required: true, message: 'Email is required', trigger: 'blur' }, { type: 'email', message: 'Invalid email format', trigger: 'blur' }],
    phone: [{ required: true, message: 'Phone is required', trigger: 'blur' }],
  }
  if (!isEditing.value) {
    base.password = [{ required: true, message: 'Transaction password is required', trigger: 'blur' }, { min: 8, message: 'At least 8 characters', trigger: 'blur' }]
    base.confirmPassword = [{ required: true, message: 'Please confirm transaction password', trigger: 'blur' }, { validator: validateConfirmPassword, trigger: 'blur' }]
  }
  return base
})

const uploadImage = async (file) => {
  try {
    const res = await uploadFile(file)
    if (res?.code === 0 && res.data?.url) return res.data.url
    ElMessage.error('Upload failed')
    return ''
  } catch {
    ElMessage.error('Upload failed')
    return ''
  }
}

const handleLogoUpload = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => { form.storeLogo = e.target.result }
  reader.readAsDataURL(file)
  return false
}

const handleIdFrontUpload = async (file) => {
  const url = await uploadImage(file)
  if (url) form.idFrontImage = url
  return false
}

const handleIdBackUpload = async (file) => {
  const url = await uploadImage(file)
  if (url) form.idBackImage = url
  return false
}

const handleUtilityBillUpload = async (file) => {
  const url = await uploadImage(file)
  if (url) form.utilityBill = url
  return false
}

const loadExisting = async () => {
  loadingInfo.value = true
  const res = await get('/home/userShop/getInfo')
  if (res?.data) {
    isEditing.value = true
    const s = res.data
    form.storeLogo = s.logo || ''
    form.fullName = s.fullName || ''
    form.name = s.name || ''
    form.address = s.address || ''
    form.idFrontImage = s.idFrontImage || ''
    form.idBackImage = s.idBackImage || ''
    form.idNumber = s.idNumber || ''
    form.utilityBill = s.utilityBill || ''
    form.email = s.email || ''
    form.phone = s.phone || ''
  }
  loadingInfo.value = false
}

const submit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  const endpoint = isEditing.value ? '/home/userShop/update' : '/home/userShop/apply'
  const payload = {
    name: form.name,
    description: '',
    phone: form.phone,
    address: form.address,
    fullName: form.fullName,
    email: form.email,
    storeLogo: form.storeLogo,
  }
  if (!isEditing.value) {
    payload.password = form.password
    payload.invitationCode = form.invitationCode
    payload.idFrontImage = form.idFrontImage
    payload.idBackImage = form.idBackImage
    payload.utilityBill = form.utilityBill
    payload.idNumber = form.idNumber
  }
  const res = await qe(post(endpoint, payload))
  submitting.value = false
  if (res) {
    if (isEditing.value) {
      ElMessage.success('Store updated!')
    } else {
      router.push({ name: 'applyconfirm' })
    }
  }
}

onMounted(() => {
  loadExisting()
})
</script>

<style scoped>
.avatar-uploader { border: 1px dashed var(--el-border-color); border-radius: 6px; cursor: pointer; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; }
.avatar-uploader:hover { border-color: var(--g-main_color); }
.avatar { width: 120px; height: 120px; object-fit: cover; }
.avatar-uploader-icon { font-size: 28px; color: #8c939d; }
.upload-hint { font-size: 12px; color: var(--g-main_color); margin-top: 4px; }
.form-tip { font-size: 12px; color: #999; margin-top: 4px; }
@media (max-width: 768px) {
  .el-form { width: 100% !important; }
}
</style>
