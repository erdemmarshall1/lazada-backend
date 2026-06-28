<template>
  <div>
    <h3>Application Status</h3>

    <div v-if="loading" v-loading="loading" style="height:200px"></div>

    <div v-else-if="error" class="c-no-list">
      <span class="c-no-list-text">{{ error }}</span>
    </div>

    <div v-else-if="shop" class="status-container">
      <div class="status-header" :class="statusClass">
        <div class="status-icon">
          <span v-if="shop.status === 0">&#9203;</span>
          <span v-else-if="shop.status === 1">&#9989;</span>
          <span v-else>&#10060;</span>
        </div>
        <div class="status-info">
          <h4>{{ statusTitle }}</h4>
          <p>{{ statusMessage }}</p>
        </div>
      </div>

      <div class="summary-card">
        <h4>Application Details</h4>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Store Name</span>
            <span class="summary-value">{{ shop.name }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Full Name</span>
            <span class="summary-value">{{ shop.fullName }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Email Address</span>
            <span class="summary-value">{{ shop.email }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Phone Number</span>
            <span class="summary-value">{{ shop.phone }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Address</span>
            <span class="summary-value">{{ shop.address }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">SSN / ID Number</span>
            <span class="summary-value">{{ shop.idNumber }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Invitation Code</span>
            <span class="summary-value">{{ shop.invitationCode }}</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <el-button v-if="shop.status === 1" type="primary" @click="$router.push('/mystore')">
          Go to My Store
        </el-button>
        <el-button v-else type="primary" @click="$router.push('/mystore')">
          Back to Dashboard
        </el-button>
        <el-button @click="$router.push('/applystore')">
          View / Edit Application
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { get } from '@/api/request'

const loading = ref(true)
const shop = ref(null)
const error = ref('')

const statusClass = computed(() => {
  if (!shop.value) return ''
  if (shop.value.status === 0) return 'status-pending'
  if (shop.value.status === 1) return 'status-approved'
  return 'status-rejected'
})

const statusTitle = computed(() => {
  if (!shop.value) return ''
  if (shop.value.status === 0) return 'Application Under Review'
  if (shop.value.status === 1) return 'Application Approved'
  return 'Application Rejected'
})

const statusMessage = computed(() => {
  if (!shop.value) return ''
  if (shop.value.status === 0) return 'Your store application has been submitted successfully. We are reviewing your information and will notify you once it is processed.'
  if (shop.value.status === 1) return 'Congratulations! Your store application has been approved. You can now start selling your products.'
  return 'Unfortunately, your store application was not approved. Please contact support for more information or submit a new application.'
})

onMounted(async () => {
  const res = await get('/home/userShop/getInfo')
  if (res?.data) {
    shop.value = res.data
  } else {
    error.value = 'No application found. Please submit a store application first.'
  }
  loading.value = false
})
</script>

<style scoped>
.status-container {
  max-width: 600px;
  margin-top: 16px;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid;
}

.status-pending {
  background: #fff7e6;
  border-color: #ffd591;
}

.status-approved {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.status-rejected {
  background: #fff2f0;
  border-color: #ffccc7;
}

.status-icon {
  font-size: 36px;
  line-height: 1;
}

.status-info h4 {
  font-size: 18px;
  margin: 0 0 4px 0;
}

.status-info p {
  font-size: 13px;
  color: var(--g-text-light);
  margin: 0;
  line-height: 1.5;
}

.summary-card {
  border: 1px solid var(--g-border);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background: var(--g-white);
}

.summary-card h4 {
  font-size: 14px;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--g-border);
}

.summary-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.summary-label {
  color: var(--g-text-light);
  flex-shrink: 0;
}

.summary-value {
  font-weight: 500;
  text-align: right;
  color: var(--g-text);
}

.actions {
  display: flex;
  gap: 12px;
}

.c-no-list {
  text-align: center;
  padding: 60px 20px;
  color: var(--g-text-light);
}

.c-no-list-text {
  font-size: 15px;
}
</style>
