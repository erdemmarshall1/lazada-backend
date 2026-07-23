<template>
    <el-dialog :model-value="visible" title="Pay with Card" width="450px" @close="cleanup" @update:model-value="$emit('close')">
    <div v-loading="loading">
      <div class="stripe-form">
        <div class="card-element-wrapper" ref="cardRef"></div>
        <div v-if="error" class="stripe-error">{{ error }}</div>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">Cancel</el-button>
      <el-button type="primary" :loading="processing" @click="handlePayment">Pay ${{ amount.toFixed(2) }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { loadStripe } from '@stripe/stripe-js'
import { post } from '@/api/request'
import { ElMessage } from 'element-plus'

const props = defineProps({
  visible: Boolean, orderId: String, amount: { type: Number, default: 0 },
})
const emit = defineEmits(['close', 'success'])

const loading = ref(false)
const processing = ref(false)
const error = ref('')
const cardRef = ref(null)
const cardElement = ref(null)
const stripeInstance = ref(null)
const clientSecret = ref('')

let elements = null

watch(() => props.visible, async (v) => {
  if (v) await initPayment()
  else cleanup()
})

const initPayment = async () => {
  loading.value = true; error.value = ''
  try {
    const res = await post('/home/payment/create-payment-intent', { orderId: props.orderId })
    if (res?.code !== 0 || !res.data) { error.value = res?.msg || 'Failed to initialize payment'; loading.value = false; return }
    const { clientSecret: cs, publishableKey } = res.data
    clientSecret.value = cs
    stripeInstance.value = await loadStripe(publishableKey)
    elements = stripeInstance.value.elements({ clientSecret: cs })
    cardElement.value = elements.create('card', { style: { base: { fontSize: '16px', color: '#32325d' } } })
    await new Promise(resolve => setTimeout(resolve, 100))
    if (cardRef.value) cardElement.value.mount(cardRef.value)
  } catch (e) { error.value = e.message }
  loading.value = false
}

const handlePayment = async () => {
  processing.value = true; error.value = ''
  try {
    const { error: stripeError, paymentIntent } = await stripeInstance.value.confirmCardPayment(clientSecret.value, {
      payment_method: { card: cardElement.value },
    })
    if (stripeError) { error.value = stripeError.message; processing.value = false; return }
    if (paymentIntent.status === 'succeeded') {
      ElMessage.success('Payment successful!')
      emit('success')
      emit('close')
    }
  } catch (e) { error.value = e.message }
  processing.value = false
}

const cleanup = () => {
  if (cardElement.value) { cardElement.value.unmount(); cardElement.value = null }
  elements = null
  stripeInstance.value = null
  clientSecret.value = ''
  error.value = ''
}

onUnmounted(cleanup)
</script>

<style scoped>
.stripe-form { min-height: 120px; display: flex; flex-direction: column; gap: 12px; }
.card-element-wrapper { padding: 12px; border: 1px solid var(--g-border); border-radius: 4px; }
.stripe-error { color: #e74c3c; font-size: 13px; }
</style>
