<template>
  <div class="account-container">
    <div class="account-box">
      <div class="account-title">My Account</div>
      <div class="account-row">
        <div class="account-label">Store ID</div>
        <div class="account-value">{{ storeNumber || '---' }}</div>
      </div>
      <div class="account-row">
        <div class="account-label">Nick name</div>
        <div class="account-value">{{ store.userInfo?.username || '---' }}</div>
      </div>
      <div class="account-row">
        <div class="account-label">Avatar</div>
        <div class="account-value account-value-btn" @click="triggerAvatarUpload">
          <img v-if="store.userInfo?.avatar" :src="$imgUrl(store.userInfo.avatar)" class="account-avatar-thumb" @error="$imgFallback" />
          <span v-else class="account-avatar-upload-text">Upload</span>
          <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarUpload" />
        </div>
      </div>
      <div class="account-row">
        <div class="account-label">Mail</div>
        <div class="account-value">{{ maskedEmail }}</div>
      </div>
      <div class="account-row">
        <div class="account-label">
          <span>Login Password</span>
          <span class="account-label-status">{{ hasPassword ? '******' : 'Not set' }}</span>
        </div>
        <div class="account-value account-value-btn" @click="$router.push('/changepassword')">Go to Settings</div>
      </div>
      <div class="account-row">
        <div class="account-label">
          <span>Payment password</span>
          <span class="account-label-status">{{ 'Not set' }}</span>
        </div>
        <div class="account-value account-value-btn" @click="$router.push('/changepassword')">Go to Settings</div>
      </div>
    </div>
    <div class="account-logout">
      <div class="account-logout-btn" @click="handleLogout">Log out</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'
import { post, get } from '@/api/request'

const router = useRouter()
const store = useAppStore()
const avatarInput = ref(null)
const storeNumber = ref('')

const hasPassword = computed(() => !!store.userInfo?.hasPassword)
const maskedEmail = computed(() => {
  const email = store.userInfo?.email || ''
  if (!email) return '---'
  const [user, domain] = email.split('@')
  if (!domain) return email
  const masked = user.slice(0, 2) + '****'
  return masked + '@' + domain
})

const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const handleAvatarUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await post('/home/user/uploadAvatar', formData)
    if (res?.data?.url) {
      store.setUserInfo({ ...store.userInfo, avatar: res.data.url })
      ElMessage.success('Avatar updated')
    }
  } catch {
    ElMessage.error('Failed to upload avatar')
  }
  e.target.value = ''
}

const handleLogout = () => {
  store.logout()
  router.push('/main')
  ElMessage.success('Logged out')
}

onMounted(async () => {
  try {
    const res = await get('/home/userShop/getInfo')
    if (res?.data?.storeNumber) storeNumber.value = res.data.storeNumber
  } catch {}
})
</script>

<style scoped>
.account-container { max-width: 600px; }

.account-box { background: var(--g-white); border: 1px solid var(--g-border); border-radius: 4px; padding: 0; }

.account-title { padding: 16px 20px; font-size: 16px; font-weight: 600; color: var(--g-text); border-bottom: 1px solid var(--g-border); }

.account-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid var(--g-border); }
.account-row:last-child { border-bottom: none; }

.account-label { font-size: 14px; color: var(--g-text-light); display: flex; align-items: center; gap: 8px; }
.account-label-status { font-size: 12px; color: #999; }

.account-value { font-size: 14px; color: var(--g-text); }
.account-value-btn { color: var(--g-blue); cursor: pointer; }
.account-value-btn:hover { text-decoration: underline; }

.account-avatar-thumb { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.account-avatar-upload-text { color: var(--g-blue); font-size: 13px; }

.account-logout { margin-top: 24px; text-align: center; }
.account-logout-btn { display: inline-block; padding: 10px 40px; background: var(--g-white); border: 1px solid var(--g-border); border-radius: 4px; font-size: 14px; color: var(--g-text); cursor: pointer; transition: all 0.2s; }
.account-logout-btn:hover { border-color: var(--g-main_color); color: var(--g-main_color); }

@media (max-width: 768px) {
  .account-row { flex-direction: column; align-items: flex-start; gap: 6px; }
}
</style>
