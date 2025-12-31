<template>
  <div class="revenue-filters">
    <div class="filter-row">
      <!-- 日期區間 -->
      <div class="filter-group date-range">
        <label class="filter-label">開始日期</label>
        <DatePicker
          v-model="filters.dateFrom"
          dateFormat="yy-mm-dd"
          placeholder="選擇開始日期"
          showIcon
          fluid
          :maxDate="filters.dateTo || today"
        />
      </div>
      <div class="filter-group date-range">
        <label class="filter-label">結束日期</label>
        <DatePicker
          v-model="filters.dateTo"
          dateFormat="yy-mm-dd"
          placeholder="選擇結束日期"
          showIcon
          fluid
          :minDate="filters.dateFrom ?? undefined"
          :maxDate="today"
        />
      </div>
    </div>

    <div class="filter-row">
      <!-- 地點 -->
      <div class="filter-group">
        <label class="filter-label">地點</label>
        <Select
          v-model="filters.market"
          :options="marketsWithAll"
          optionLabel="name"
          placeholder="全部市場"
          fluid
        />
      </div>

      <!-- 提交者 -->
      <div class="filter-group">
        <label class="filter-label">提交者</label>
        <Select
          v-model="filters.user"
          :options="usersWithAll"
          optionLabel="name"
          placeholder="全部人員"
          fluid
        />
      </div>
    </div>

    <div class="filter-actions">
      <Button
        label="查詢"
        :loading="props.loading"
        @click="handleFilter"
      />
      <Button
        label="清除"
        severity="secondary"
        outlined
        @click="handleClear"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Button from 'primevue/button'
import type { Market, User, RevenueFilters } from '../types'

const props = defineProps<{
  markets: Market[]
  users: User[]
  loading?: boolean
}>()

const emit = defineEmits<{
  filter: [filters: RevenueFilters]
  clear: []
}>()

const today = new Date()

const filters = reactive({
  dateFrom: null as Date | null,
  dateTo: null as Date | null,
  market: null as (Market & { id: string }) | null,
  user: null as (User & { phone: string }) | null,
})

const marketsWithAll = computed(() => {
  return [{ id: '', name: '全部市場' }, ...props.markets]
})

const usersWithAll = computed(() => {
  return [{ phone: '', name: '全部人員' }, ...props.users]
})

const formatDate = (date: Date | null): string | undefined => {
  if (!date) return undefined
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const handleFilter = () => {
  const result: RevenueFilters = {}
  
  if (filters.dateFrom) {
    result.date_from = formatDate(filters.dateFrom)
  }
  if (filters.dateTo) {
    result.date_to = formatDate(filters.dateTo)
  }
  if (filters.market?.id) {
    result.market_id = filters.market.id
  }
  if (filters.user?.phone) {
    result.submitted_by_phone = filters.user.phone
  }
  
  emit('filter', result)
}

const handleClear = () => {
  filters.dateFrom = null
  filters.dateTo = null
  filters.market = null
  filters.user = null
  emit('clear')
}
</script>

<style scoped>
.revenue-filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.filter-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.filter-actions :deep(.p-button) {
  flex: 1;
}

@media (max-width: 480px) {
  .filter-row {
    grid-template-columns: 1fr;
  }
}
</style>
