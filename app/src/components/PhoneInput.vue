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
        :invalid="!!error"
        class="phone-input"
        @keyup.enter="handleSubmit"
      />
    </div>
    <Transition name="fade">
      <p v-if="error" class="error-message">{{ error }}</p>
    </Transition>
    <Button
      :label="props.loading ? '驗證中...' : '登入'"
      :loading="props.loading"
      :disabled="!isValid || props.loading"
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
}>()

const phone = ref('')
const error = ref('')

// 台灣手機 10 碼驗證
const isValid = computed(() => {
  return /^09\d{8}$/.test(phone.value)
})

const handleSubmit = () => {
  error.value = ''
  
  if (!phone.value) {
    error.value = '請輸入手機號碼'
    return
  }
  
  if (!isValid.value) {
    error.value = '請輸入有效的手機號碼（09開頭，共10碼）'
    return
  }
  
  emit('submit', phone.value)
}

// 接收外部錯誤
const setError = (msg: string) => {
  error.value = msg
}

defineExpose({ setError })
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
}

.error-message {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-error);
}

.submit-btn {
  width: 100%;
  margin-top: var(--space-sm);
}
</style>
