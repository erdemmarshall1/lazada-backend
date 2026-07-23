<template>
  <div>
    <div class="g-flex-align-center g-flex-justify-between"><h3>Bank Cards</h3><el-button type="primary" size="small" style="background:var(--g-main_color);border-color:var(--g-main_color)" @click="showDialog=true">+ Add</el-button></div>
    <div v-if="list.length===0" class="c-no-list"><span class="c-no-list-text">No cards</span></div>
    <div class="card-item" v-for="card in list" :key="card._id">{{ card.bankName }} - ****{{ card.cardNumber.slice(-4) }} <el-button link type="danger" size="small" @click="delCard(card._id)">Delete</el-button></div>
    <el-dialog v-model="showDialog" title="Add Card" width="400px">
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="Bank Name" prop="bankName"><el-input v-model="form.bankName" /></el-form-item>
        <el-form-item label="Card Number" prop="cardNumber"><el-input v-model="form.cardNumber" /></el-form-item>
        <el-form-item label="Card Holder" prop="cardHolder"><el-input v-model="form.cardHolder" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="showDialog=false">Cancel</el-button><el-button type="primary" @click="addCard">Save</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { get, post, qe } from '@/api/request'
const list = ref([]); const showDialog = ref(false); const formRef = ref(null); const form = ref({ bankName: '', cardNumber: '', cardHolder: '' })
const rules = { bankName: [{ required: true, message: 'Please enter bank name', trigger: 'blur' }], cardNumber: [{ required: true, message: 'Please enter card number', trigger: 'blur' }], cardHolder: [{ required: true, message: 'Please enter card holder', trigger: 'blur' }] }
const loadList = async () => { const res = await get('/home/userBank/getList'); if (res?.data) list.value = res.data }
const addCard = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  await qe(post('/home/userBank/add', form.value)); showDialog.value = false; await loadList()
}
const delCard = async (id) => {
  try { await ElMessageBox.confirm('Delete this card?', 'Confirm') } catch { return }
  await qe(post('/home/userBank/del', { id })); await loadList()
}
onMounted(loadList)
</script>

<style scoped>
.card-item { padding: 12px; border: 1px solid var(--g-border); border-radius: 4px; margin-top: 8px; display: flex; justify-content: space-between; align-items: center; }
@media (max-width: 768px) {
  .card-item { flex-direction: column; align-items: flex-start; gap: 8px; font-size: 13px; }
  :deep(.el-dialog) { width: 90% !important; max-width: 400px; }
}
</style>
