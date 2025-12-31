<template>
  <div class="revenue-form">
    <form @submit.prevent="handleSubmit">
      <!-- 營業日期 -->
      <div class="form-group">
        <label class="form-label">營業日期</label>
        <DatePicker
          v-model="form.date"
          dateFormat="yy-mm-dd"
          :maxDate="today"
          showIcon
          fluid
          @date-select="onDateChange"
        />
      </div>

      <!-- 地點 -->
      <div class="form-group">
        <label class="form-label">地點</label>
        <Select
          v-model="form.market"
          :options="props.markets"
          optionLabel="name"
          placeholder="選擇市場"
          :loading="props.loadingMarkets"
          fluid
          @change="onMarketChange"
        />
      </div>

      <!-- 營業額 -->
      <div class="form-group">
        <label class="form-label">營業額</label>
        <InputNumber
          v-model="form.amount"
          :min="0"
          placeholder="輸入金額"
          fluid
          prefix="$"
        />
      </div>

      <!-- 租金 -->
      <div class="form-group">
        <label class="form-label">
          租金
          <span v-if="loadingRent" class="rent-loading">計算中...</span>
          <span v-else-if="isSpecialRent" class="rent-special">（特殊日期）</span>
        </label>
        <InputNumber
          v-model="form.rent"
          :min="0"
          placeholder="自動帶入或手動輸入"
          fluid
          prefix="$"
        />
      </div>

      <!-- 備註 -->
      <div class="form-group">
        <label class="form-label">備註（選填）</label>
        <Textarea
          v-model="form.note"
          rows="2"
          placeholder="輸入備註..."
          fluid
        />
      </div>

      <!-- 提交按鈕 -->
      <Button
        type="submit"
        :label="props.submitting ? '提交中...' : '提交營業額'"
        :loading="props.submitting"
        :disabled="!isFormValid || props.submitting"
        class="submit-btn"
      />
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import type { Market } from '../types'
import { useApi } from '../composables/useApi'

const props = defineProps<{
  markets: Market[]
  loadingMarkets?: boolean
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [data: {
    date: string
    market_id: string
    amount: number
    rent: number
    note: string
  }]
}>()

const api = useApi()

const today = new Date()

const form = reactive({
  date: today,
  market: null as Market | null,
  amount: null as number | null,
  rent: null as number | null,
  note: '',
})

const loadingRent = ref(false)
const isSpecialRent = ref(false)

const isFormValid = computed(() => {
  return form.date && form.market && form.amount !== null && form.amount > 0 && form.rent !== null
})

const formatDate = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const fetchRent = async () => {
  if (!form.date || !form.market) return
  
  loadingRent.value = true
  const dateStr = formatDate(form.date)
  
  const res = await api.getRent(form.market.id, dateStr)
  
  if (res.success && res.data) {
    form.rent = res.data.rent
    isSpecialRent.value = res.data.is_special
  }
  
  loadingRent.value = false
}

const onDateChange = () => {
  fetchRent()
}

const onMarketChange = () => {
  fetchRent()
}

const handleSubmit = () => {
  if (!isFormValid.value || !form.market) return
  
  emit('submit', {
    date: formatDate(form.date),
    market_id: form.market.id,
    amount: form.amount!,
    rent: form.rent!,
    note: form.note,
  })
}

// 重置表單
const resetForm = () => {
  form.date = today
  form.market = null
  form.amount = null
  form.rent = null
  form.note = ''
  isSpecialRent.value = false
}

defineExpose({ resetForm })
</script>

<style scoped>
.revenue-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: var(--space-lg);
}

.form-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.rent-loading {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: normal;
}

.rent-special {
  font-size: 0.75rem;
  color: var(--color-warning);
  font-weight: normal;
}

.submit-btn {
  width: 100%;
  margin-top: var(--space-md);
}
</style>
