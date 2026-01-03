<template>
  <div class="time-input-wrapper">
    <InputText
      :modelValue="displayValue"
      @input="handleInput"
      @blur="handleBlur"
      inputmode="numeric"
      pattern="[0-9]*"
      :placeholder="placeholder"
      maxlength="5"
      class="time-input"
    />
    <i class="pi pi-clock time-icon"></i>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import InputText from 'primevue/inputtext'

const props = defineProps<{
  modelValue: Date | null
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Date | null]
}>()

// 顯示值（HH:mm 格式）
const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const h = String(props.modelValue.getHours()).padStart(2, '0')
  const m = String(props.modelValue.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
})

// 處理輸入
function handleInput(event: Event) {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '') // 只保留數字
  
  // 自動插入冒號
  if (value.length >= 2) {
    value = value.slice(0, 2) + ':' + value.slice(2, 4)
  }
  
  // 限制長度
  if (value.length > 5) {
    value = value.slice(0, 5)
  }
  
  // 更新 input 顯示
  input.value = value
  
  // 如果有完整時間，更新 modelValue
  if (value.length === 5) {
    const parts = value.split(':').map(Number)
    const hours = parts[0]
    const minutes = parts[1]
    if (hours !== undefined && minutes !== undefined && 
        hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const date = new Date()
      date.setHours(hours, minutes, 0, 0)
      emit('update:modelValue', date)
    }
  }
}

// 失焦時驗證
function handleBlur(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  
  if (!value) {
    emit('update:modelValue', null)
    return
  }
  
  // 嘗試解析時間
  const match = value.match(/^(\d{1,2}):?(\d{0,2})$/)
  if (match && match[1]) {
    let hours = parseInt(match[1], 10)
    let minutes = parseInt(match[2] ?? '0', 10)
    
    // 驗證範圍
    if (hours > 23) hours = 23
    if (minutes > 59) minutes = 59
    
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    emit('update:modelValue', date)
    
    // 更新顯示格式
    input.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  } else {
    // 無法解析，清空
    input.value = ''
    emit('update:modelValue', null)
  }
}
</script>

<style scoped>
.time-input-wrapper {
  position: relative;
  width: 100%;
}

.time-input {
  width: 100%;
  padding-right: 2.5rem;
  text-align: center;
  font-size: 1rem;
  letter-spacing: 0.1em;
}

.time-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}
</style>
