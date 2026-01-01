<template>
  <div class="my-attendance-view">
    <AppHeader />

    <main class="page-content">
      <!-- 返回按鈕 -->
      <Button
        label="← 返回打卡"
        severity="secondary"
        text
        class="back-btn"
        @click="router.push('/attendance')"
      />

      <!-- 篩選區 -->
      <div class="filters-section card">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">開始日期</label>
            <DatePicker
              v-model="dateFromObj"
              dateFormat="yy-mm-dd"
              placeholder="選擇開始日期"
              showIcon
              fluid
              :maxDate="dateToObj || today"
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">結束日期</label>
            <DatePicker
              v-model="dateToObj"
              dateFormat="yy-mm-dd"
              placeholder="選擇結束日期"
              showIcon
              fluid
              :minDate="dateFromObj ?? undefined"
              :maxDate="today"
            />
          </div>
        </div>
        <div class="quick-filters">
          <Button 
            v-for="filter in quickFilters" 
            :key="filter.label"
            :label="filter.label"
            severity="secondary"
            :outlined="activeQuickFilter !== filter.label"
            size="small"
            @click="applyQuickFilter(filter)"
          />
        </div>
        <div class="filter-actions">
          <Button
            label="查詢"
            :loading="loading"
            @click="loadData"
          />
        </div>
      </div>

      <!-- 統計摘要 -->
      <div v-if="summary" class="summary-card card">
        <div class="summary-item">
          <span class="summary-label">總出勤</span>
          <span class="summary-value">{{ summary.total_records }} 次</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">總時數</span>
          <span class="summary-value">{{ summary.total_hours.toFixed(1) }} 小時</span>
        </div>
      </div>

      <!-- 出勤列表 -->
      <Transition name="fade" mode="out-in">
        <LoadingSpinner v-if="loading" text="載入中..." />
        <div v-else-if="records.length === 0" class="empty-state card">
          <i class="pi pi-calendar-times empty-icon"></i>
          <p>沒有出勤紀錄</p>
        </div>
        <div v-else class="records-list">
          <div 
            v-for="record in records" 
            :key="record.id" 
            class="record-card card"
            :class="{ 'is-manual': record.is_manual }"
          >
            <div class="record-header">
              <span class="record-date">{{ formatDate(record.date) }}</span>
              <span v-if="record.is_manual" class="manual-badge">補登</span>
            </div>
            <div class="record-market">{{ record.market_name }}</div>
            <div class="record-times">
              <div class="time-block">
                <span class="time-label">上班</span>
                <span class="time-value">{{ formatTime(record.clock_in) }}</span>
              </div>
              <span class="time-arrow">→</span>
              <div class="time-block">
                <span class="time-label">下班</span>
                <span class="time-value" :class="{ pending: !record.clock_out }">
                  {{ record.clock_out ? formatTime(record.clock_out) : '待打卡' }}
                </span>
              </div>
              <div class="hours-block">
                <span class="hours-value">{{ record.hours.toFixed(1) }}h</span>
              </div>
            </div>
            <div v-if="record.note" class="record-note">
              📝 {{ record.note }}
            </div>
          </div>
        </div>
      </Transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import AppHeader from '../components/AppHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useApi } from '../composables/useApi'
import { useAuth } from '../composables/useAuth'
import type { Attendance, AttendanceSummary } from '../types'

const router = useRouter()
const api = useApi()
const auth = useAuth()

const loading = ref(true)
const records = ref<Attendance[]>([])
const summary = ref<AttendanceSummary | null>(null)
const dateFromObj = ref<Date | null>(null)
const dateToObj = ref<Date | null>(null)
const activeQuickFilter = ref('')
const today = new Date()

// 快速篩選選項
const quickFilters = [
  { label: '本月', getRange: () => getMonthRange(0) },
  { label: '上個月', getRange: () => getMonthRange(-1) },
  { label: '上上月', getRange: () => getMonthRange(-2) },
]

// 檢查登入
if (!auth.isLoggedIn()) {
  router.push('/')
}

// 取得月份範圍
function getMonthRange(offset: number): { from: Date; to: Date } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + offset
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  return { from: firstDay, to: lastDay }
}

// 格式化日期顯示
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
}

// 格式化時間
function formatTime(datetime: string | null): string {
  if (!datetime) return '--:--'
  const date = new Date(datetime)
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}

// 格式化日期為 API 需要的格式
function formatDateForApi(date: Date | null): string | undefined {
  if (!date) return undefined
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 套用快速篩選
function applyQuickFilter(filter: { label: string; getRange: () => { from: Date; to: Date } }) {
  const range = filter.getRange()
  dateFromObj.value = range.from
  dateToObj.value = range.to
  activeQuickFilter.value = filter.label
  loadData()
}

// 載入資料
async function loadData() {
  if (!auth.user.value) return
  
  loading.value = true
  const res = await api.getMyAttendance(
    auth.user.value.phone,
    { 
      date_from: formatDateForApi(dateFromObj.value), 
      date_to: formatDateForApi(dateToObj.value) 
    }
  )
  
  if (res.success && res.data) {
    records.value = res.data.records
    summary.value = res.data.summary
  }
  loading.value = false
}

// 監聽日期變化（手動選擇時清除快速篩選狀態）
watch([dateFromObj, dateToObj], () => {
  activeQuickFilter.value = ''
})

onMounted(() => {
  // 預設顯示本月
  const firstFilter = quickFilters[0]
  if (firstFilter) {
    applyQuickFilter(firstFilter)
  }
})
</script>

<style scoped>
.my-attendance-view {
  min-height: 100vh;
  background: var(--color-bg);
}

.page-content {
  padding: var(--space-lg);
  max-width: var(--content-max-width, 480px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.back-btn {
  align-self: flex-start;
  margin-bottom: var(--space-xs);
}

/* 篩選區 */
.filters-section {
  padding: var(--space-md);
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
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

.quick-filters {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.quick-filters :deep(.p-button) {
  flex: 1;
}

.filter-actions {
  display: flex;
}

.filter-actions :deep(.p-button) {
  flex: 1;
}

/* 統計摘要 */
.summary-card {
  padding: var(--space-md);
  display: flex;
  justify-content: space-around;
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-xs);
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
}

/* 空狀態 */
.empty-state {
  text-align: center;
  padding: var(--space-xl);
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 3rem;
  color: var(--color-text-muted);
  display: block;
  margin-bottom: var(--space-md);
}

/* 紀錄列表 */
.records-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.record-card {
  padding: var(--space-md);
  border-left: 4px solid var(--color-success);
}

.record-card.is-manual {
  border-left-color: var(--color-warning);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.record-date {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.manual-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  background: var(--color-warning);
  color: #000;
  border-radius: var(--radius-sm);
}

.record-market {
  font-weight: 600;
  margin-bottom: var(--space-sm);
}

.record-times {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.9rem;
}

.time-block {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.time-label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.time-value {
  font-weight: 500;
}

.time-value.pending {
  color: var(--color-warning);
}

.time-arrow {
  color: var(--color-text-muted);
}

.hours-block {
  margin-left: auto;
  background: var(--color-bg-secondary);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
}

.hours-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-primary);
}

.record-note {
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--color-border);
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

@media (max-width: 480px) {
  .filter-row {
    grid-template-columns: 1fr;
  }
}
</style>
