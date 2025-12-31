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
          @date-select="onMarketOrDateChange"
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
          @change="onMarketOrDateChange"
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
        <label class="form-label">租金</label>
        <InputNumber
          v-model="form.rent"
          :min="0"
          placeholder="自動帶入或手動輸入"
          fluid
          prefix="$"
        />
      </div>

      <!-- 成本區塊 -->
      <div class="costs-section">
        <div class="costs-header" @click="showCosts = !showCosts">
          <span class="costs-title">其他成本（選填）</span>
          <span class="costs-toggle">{{ showCosts ? '收合' : '展開' }}</span>
        </div>
        
        <Transition name="slide-up">
          <div v-if="showCosts" class="costs-fields">
            <!-- 停車費 -->
            <div class="form-group">
              <label class="form-label">停車費</label>
              <InputNumber
                v-model="form.parking_fee"
                :min="0"
                placeholder="0"
                fluid
                prefix="$"
              />
            </div>

            <!-- 清潔費 -->
            <div class="form-group">
              <label class="form-label">清潔費</label>
              <InputNumber
                v-model="form.cleaning_fee"
                :min="0"
                placeholder="0"
                fluid
                prefix="$"
              />
            </div>

            <!-- 其他成本 -->
            <div class="form-group">
              <label class="form-label">其他成本</label>
              <InputNumber
                v-model="form.other_cost"
                :min="0"
                placeholder="0"
                fluid
                prefix="$"
              />
            </div>
          </div>
        </Transition>
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
    parking_fee: number
    cleaning_fee: number
    other_cost: number
    note: string
  }]
}>()

const today = new Date()
const showCosts = ref(false)

const form = reactive({
  date: today,
  market: null as Market | null,
  amount: null as number | null,
  rent: null as number | null,
  parking_fee: null as number | null,
  cleaning_fee: null as number | null,
  other_cost: null as number | null,
  note: '',
})

const isFormValid = computed(() => {
  return form.date && form.market && form.amount !== null && form.amount > 0 && form.rent !== null
})

const formatDate = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const isWeekend = (date: Date): boolean => {
  const day = date.getDay()
  return day === 0 || day === 6
}

// 根據選擇的市場和日期自動帶入租金
const onMarketOrDateChange = () => {
  if (!form.date || !form.market) return
  
  // 根據平日/假日自動帶入租金
  const rent = isWeekend(form.date) 
    ? form.market.rent_weekend 
    : form.market.rent_weekday
  
  form.rent = rent
}

const handleSubmit = () => {
  if (!isFormValid.value || !form.market) return
  
  emit('submit', {
    date: formatDate(form.date),
    market_id: form.market.id,
    amount: form.amount!,
    rent: form.rent!,
    parking_fee: form.parking_fee || 0,
    cleaning_fee: form.cleaning_fee || 0,
    other_cost: form.other_cost || 0,
    note: form.note,
  })
}

// 重置表單
const resetForm = () => {
  form.date = today
  form.market = null
  form.amount = null
  form.rent = null
  form.parking_fee = null
  form.cleaning_fee = null
  form.other_cost = null
  form.note = ''
  showCosts.value = false
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

.costs-section {
  margin-bottom: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.costs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  background: var(--color-bg);
  cursor: pointer;
  user-select: none;
  transition: background var(--transition-fast);
}

.costs-header:hover {
  background: var(--color-border);
}

.costs-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.costs-toggle {
  font-size: 0.75rem;
  color: var(--color-primary);
}

.costs-fields {
  padding: var(--space-md);
  padding-bottom: 0;
  border-top: 1px solid var(--color-border);
}

.submit-btn {
  width: 100%;
  margin-top: var(--space-md);
}
</style>
