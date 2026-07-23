<template>
  <div class="info-page">
    <div class="info-container">
      <h1 class="info-title">Contact Us</h1>
      <p class="info-lead">Have a question or need help? Send us a message and we'll get back to you as soon as possible.</p>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" style="max-width:600px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Name" prop="name">
              <el-input v-model="form.name" placeholder="Your name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Email" prop="email">
              <el-input v-model="form.email" placeholder="Your email" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Phone">
              <el-input v-model="form.phone" placeholder="Phone (optional)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Category" prop="category">
              <el-select v-model="form.category" placeholder="Select category" style="width:100%">
                <el-option label="General Inquiry" value="general" />
                <el-option label="Order Issue" value="order" />
                <el-option label="Product Question" value="product" />
                <el-option label="Shipping" value="shipping" />
                <el-option label="Refund" value="refund" />
                <el-option label="Partnership" value="partnership" />
                <el-option label="Press" value="press" />
                <el-option label="Other" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Subject" prop="subject">
          <el-input v-model="form.subject" placeholder="Brief subject" />
        </el-form-item>
        <el-form-item label="Message" prop="message">
          <el-input v-model="form.message" type="textarea" :rows="5" placeholder="Describe your inquiry in detail" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit" style="background:var(--g-main_color);border-color:var(--g-main_color);width:100%">Send Message</el-button>
        </el-form-item>
      </el-form>
      <div v-if="submitted" class="success-message">
        <el-alert type="success" :closable="false" show-icon title="Inquiry submitted!" :description="'Reference: ' + submittedId" />
      </div>
      <div class="alt-contact">
        <h2>Or reach us directly</h2>
        <p><strong>Email:</strong> support@theoutnet.com</p>
        <p><strong>Phone:</strong> +1 (800) 123-4567</p>
        <p><strong>Hours:</strong> Mon-Fri, 9AM-6PM EST</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { post } from '@/api/request'

const formRef = ref(null)
const submitting = ref(false)
const submitted = ref(false)
const submittedId = ref('')

const form = reactive({
  name: '', email: '', phone: '', category: 'general', subject: '', message: '',
})

const rules = {
  name: [{ required: true, message: 'Please enter your name', trigger: 'blur' }],
  email: [{ required: true, message: 'Please enter your email', trigger: 'blur' }, { type: 'email', message: 'Invalid email format', trigger: 'blur' }],
  subject: [{ required: true, message: 'Please enter a subject', trigger: 'blur' }],
  message: [{ required: true, message: 'Please enter your message', trigger: 'blur' }],
  category: [{ required: true, message: 'Please select a category', trigger: 'change' }],
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const res = await post('/home/submissions', {
      name: form.name, email: form.email, phone: form.phone,
      category: form.category, subject: form.subject, message: form.message,
    })
    if (res?.code === 0 && res?.data?.id) {
      submitted.value = true
      submittedId.value = res.data.id
    } else {
      ElMessage.error(res?.msg || 'Failed to submit inquiry')
    }
  } catch (err) {
    ElMessage.error(err?.response?.data?.msg || 'Network error')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.info-page { flex: 1; background: #faf8f4; padding: 40px 0; min-height: 60vh; }
.info-container { max-width: 700px; margin: 0 auto; background: #fff; border-radius: 4px; padding: 48px; }
.info-title { font-size: 28px; font-weight: 300; letter-spacing: 3px; margin-bottom: 16px; color: #000; }
.info-lead { font-size: 15px; line-height: 1.8; color: #555; margin-bottom: 32px; }
.success-message { margin-top: 20px; }
.alt-contact { margin-top: 40px; padding-top: 32px; border-top: 1px solid #e8e6e2; }
.alt-contact h2 { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
.alt-contact p { font-size: 14px; line-height: 1.8; color: #555; }
@media (max-width: 768px) {
  .info-page { padding: 20px 0; }
  .info-container { padding: 24px; margin: 0 12px; }
  .info-title { font-size: 22px; }
}
</style>