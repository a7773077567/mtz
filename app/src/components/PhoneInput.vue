<template>
  <div class="phone-input-wrapper">
    <label class="input-label">手機號碼</label>
    <div class="input-container">
      <InputText
        v-model="phone"
        type="tel"
        placeholder="0912345678"
        :maxlength="10"
        :disabled="props.loading"
        class="phone-input"
        @keyup.enter="handleSubmit"
      />
    </div>
    <Button
      :label="props.loading ? '驗證中...' : '登入'"
      :loading="props.loading"
      :disabled="!isValid || props.loading"
      severity="secondary"
      outlined
      class="submit-btn"
      @click="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const props = defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [phone: string]
  error: [message: string]
}>()

const phone = ref('')

// 台灣手機 10 碼驗證
const isValid = computed(() => {
  return /^09\d{8}$/.test(phone.value)
})

const handleSubmit = () => {
  if (!phone.value) {
    emit('error', '請輸入手機號碼')
    return
  }
  
  if (!isValid.value) {
    emit('error', '請輸入有效的手機號碼（09開頭，共10碼）')
    return
  }
  
  emit('submit', phone.value)
}

// 接收外部錯誤
const showError = (msg: string) => {
  emit('error', msg)
}

defineExpose({ showError })
</script>

<style scoped>
.phone-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.input-container {
  position: relative;
}

.phone-input {
  width: 100%;
  font-size: 1.125rem;
  letter-spacing: 0.05em;
  text-align: center;
  --p-inputtext-focus-border-color: #78716c;
  --p-inputtext-focus-ring-color: rgba(120, 113, 108, 0.25);
  --p-inputtext-disabled-background: #fafaf9;
  --p-inputtext-disabled-color: #a8a29e;
}

.submit-btn {
  width: 100%;
  margin-top: var(--space-sm);
  /* 邊框與文字 - 石色 */
  --p-button-outlined-secondary-border-color: #78716c;
  --p-button-outlined-secondary-color: #44403c;
  /* Hover - 淺灰背景 */
  --p-button-outlined-secondary-hover-background: #78716c;
  --p-button-outlined-secondary-hover-border-color: #78716c;
  --p-button-outlined-secondary-hover-color: #ffffff;
  /* Focus */
  --p-button-focus-ring-color: rgba(120, 113, 108, 0.3);
  /* Active */
  --p-button-outlined-secondary-active-background: #57534e;
  --p-button-outlined-secondary-active-border-color: #57534e;
}
</style>
