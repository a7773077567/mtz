<template>
  <div class="attendance-admin-view">
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

      <h1 class="page-title">出勤管理</h1>

      <!-- 篩選區 -->
      <div class="filters-section card">
        <div class="filter-grid">
          <div class="filter-group">
            <label class="filter-label">員工</label>
            <Select
              v-model="selectedUser"
              :options="usersWithAll"
              optionLabel="name"
              placeholder="全部員工"
              fluid
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">市場</label>
            <Select
              v-model="selectedMarket"
              :options="marketsWithAll"
              optionLabel="name"
              placeholder="全部市場"
              fluid
            />
          </div>
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
          <Button
            label="清除"
            severity="secondary"
            outlined
            @click="clearFilters"
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
          <span class="summary-value">{{ formatHoursToHM(summary.total_hours) }}</span>
        </div>
      </div>

      <!-- 出勤列表 -->
      <Transition name="fade" mode="out-in">
        <AttendanceSkeleton v-if="loading" :count="5" />
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
            @click="openEditModal(record)"
          >
            <div class="record-header">
              <span class="record-date">{{ formatDate(record.date) }}</span>
              <span class="record-employee">{{ record.employee_name }}</span>
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
                <span class="hours-value">{{ formatHoursToHM(record.hours) }}</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </main>

    <!-- 編輯 Modal -->
    <Transition name="modal">
      <div v-if="editingRecord" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal-content card">
          <h2 class="modal-title">編輯出勤紀錄</h2>
          <div class="modal-info">
            <p><strong>員工:</strong> {{ editingRecord.employee_name }}</p>
            <p><strong>日期:</strong> {{ editingRecord.date }}</p>
            <p><strong>市場:</strong> {{ editingRecord.market_name }}</p>
          </div>
          <div class="form-group">
            <label class="filter-label">上班時間</label>
            <TimeInput
              v-model="editClockInTime"
              placeholder="00:00"
            />
          </div>
          <div class="form-group">
            <label class="filter-label">下班時間</label>
            <TimeInput
              v-model="editClockOutTime"
              placeholder="00:00"
            />
          </div>
          <div class="form-group">
            <label class="filter-label">休息時間（分鐘）</label>
            <InputNumber 
              v-model="editBreakTime" 
              inputId="edit-break" 
              :min="0"
              :max="480"
              placeholder="0" 
              fluid 
            />
          </div>
          <div class="form-group">
            <label class="filter-label">備註</label>
            <InputText v-model="editNote" fluid />
          </div>
          <div class="modal-actions">
            <Button label="取消" severity="secondary" outlined @click="closeEditModal" />
            <Button label="儲存" :loading="saving" @click="saveEdit" />
          </div>
          <div class="modal-delete">
            <Button 
              label="刪除此紀錄" 
              severity="danger" 
              text 
              :loading="deleting"
              @click="confirmDelete" 
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- 刪除確認 Modal -->
    <Transition name="modal">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal-content card delete-confirm-modal">
          <h2 class="modal-title">確認刪除</h2>
          <p class="delete-warning">確定要刪除這筆出勤紀錄嗎？此操作無法復原。</p>
          <div class="modal-info" v-if="recordToDelete">
            <p><strong>員工:</strong> {{ recordToDelete.employee_name }}</p>
            <p><strong>日期:</strong> {{ recordToDelete.date }}</p>
            <p><strong>市場:</strong> {{ recordToDelete.market_name }}</p>
          </div>
          <div class="modal-actions">
            <Button label="取消" severity="secondary" outlined @click="showDeleteConfirm = false" />
            <Button label="確認刪除" severity="danger" :loading="deleting" @click="executeDelete" />
          </div>
        </div>
      </div>
    </Transition>

    <Toast position="top-center" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import AppHeader from '../components/AppHeader.vue'
import AttendanceSkeleton from '../components/AttendanceSkeleton.vue'
import TimeInput from '../components/TimeInput.vue'
import { useApi } from '../composables/useApi'
import { useAuth } from '../composables/useAuth'
import { useCache } from '../composables/useCache'
import type { Attendance, AttendanceSummary, Market, User } from '../types'

const router = useRouter()
const api = useApi()
const auth = useAuth()
const cache = useCache()
const toast = useToast()

// 狀態
const loading = ref(true)
const records = ref<Attendance[]>([])
const summary = ref<AttendanceSummary | null>(null)
const users = ref<User[]>([])
const markets = ref<Market[]>([])
const activeQuickFilter = ref('')
const today = new Date()

// 篩選條件
const selectedUser = ref<{ phone: string; name: string } | null>(null)
const selectedMarket = ref<{ id: string; name: string } | null>(null)
const dateFromObj = ref<Date | null>(null)
const dateToObj = ref<Date | null>(null)

// 編輯 Modal
const editingRecord = ref<Attendance | null>(null)
const editClockInTime = ref<Date | null>(null)
const editClockOutTime = ref<Date | null>(null)
const editBreakTime = ref<number | null>(0)
const editNote = ref('')
const saving = ref(false)

// 刪除確認
const showDeleteConfirm = ref(false)
const recordToDelete = ref<Attendance | null>(null)
const deleting = ref(false)

// 快速篩選
const quickFilters = [
  { label: '本月', getRange: () => getMonthRange(0) },
  { label: '上個月', getRange: () => getMonthRange(-1) },
  { label: '上上月', getRange: () => getMonthRange(-2) },
]

// 選項列表（含「全部」選項）
const usersWithAll = computed(() => {
  return [{ phone: '', name: '全部員工' }, ...users.value]
})

const marketsWithAll = computed(() => {
  return [{ id: '', name: '全部市場' }, ...markets.value]
})

// 權限檢查
if (!auth.isLoggedIn()) {
  router.push('/')
} else if (auth.user.value?.role !== 'admin') {
  router.push('/attendance')
}

function getMonthRange(offset: number): { from: Date; to: Date } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + offset
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  return { from: firstDay, to: lastDay }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatTime(datetime: string | null): string {
  if (!datetime) return '--:--'
  const date = new Date(datetime)
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}

function formatDateForApi(date: Date | null): string | undefined {
  if (!date) return undefined
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatTimeOnly(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

// 格式化小時數為 X時Y分
function formatHoursToHM(hours: number): string {
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}分鐘`
  if (m === 0) return `${h}小時`
  return `${h}小時${m}分鐘`
}

function parseTimeToDate(timeStr: string | null): Date | null {
  if (!timeStr) return null
  const date = new Date(timeStr)
  return date
}

function applyQuickFilter(filter: { label: string; getRange: () => { from: Date; to: Date } }) {
  const range = filter.getRange()
  dateFromObj.value = range.from
  dateToObj.value = range.to
  activeQuickFilter.value = filter.label
  loadData()
}

function clearFilters() {
  selectedUser.value = null
  selectedMarket.value = null
  dateFromObj.value = null
  dateToObj.value = null
  activeQuickFilter.value = ''
  loadData()
}

async function loadData() {
  if (!auth.user.value) return
  
  loading.value = true
  const res = await api.getAllAttendance(
    auth.user.value.phone,
    {
      employee_phone: selectedUser.value?.phone || undefined,
      market_id: selectedMarket.value?.id || undefined,
      date_from: formatDateForApi(dateFromObj.value),
      date_to: formatDateForApi(dateToObj.value),
    }
  )
  
  if (res.success && res.data) {
    records.value = res.data.records
    summary.value = res.data.summary
  }
  loading.value = false
}

function openEditModal(record: Attendance) {
  editingRecord.value = record
  editClockInTime.value = parseTimeToDate(record.clock_in)
  editClockOutTime.value = parseTimeToDate(record.clock_out)
  editBreakTime.value = record.break_time || 0
  editNote.value = record.note || ''
}

function closeEditModal() {
  editingRecord.value = null
}

async function saveEdit() {
  if (!auth.user.value || !editingRecord.value) return
  
  saving.value = true
  const res = await api.updateAttendance({
    phone: auth.user.value.phone,
    attendance_id: editingRecord.value.id,
    clock_in: editClockInTime.value ? `${editingRecord.value.date}T${formatTimeOnly(editClockInTime.value)}:00` : undefined,
    clock_out: editClockOutTime.value ? `${editingRecord.value.date}T${formatTimeOnly(editClockOutTime.value)}:00` : undefined,
    break_time: editBreakTime.value ?? 0,
    note: editNote.value,
  })
  saving.value = false

  if (res.success) {
    toast.add({
      severity: 'success',
      summary: '儲存成功',
      life: 3000,
    })
    closeEditModal()
    loadData()
  } else {
    toast.add({
      severity: 'error',
      summary: '儲存失敗',
      detail: res.error,
      life: 3000,
    })
  }
}

// 刪除確認
function confirmDelete() {
  if (!editingRecord.value) return
  recordToDelete.value = editingRecord.value
  showDeleteConfirm.value = true
}

// 執行刪除
async function executeDelete() {
  if (!auth.user.value || !recordToDelete.value) return
  
  deleting.value = true
  const res = await api.deleteAttendance(auth.user.value.phone, recordToDelete.value.id)
  deleting.value = false

  if (res.success) {
    toast.add({
      severity: 'success',
      summary: '刪除成功',
      life: 3000,
    })
    showDeleteConfirm.value = false
    recordToDelete.value = null
    closeEditModal()
    loadData()
  } else {
    toast.add({
      severity: 'error',
      summary: '刪除失敗',
      detail: res.error,
      life: 3000,
    })
  }
}

watch([selectedUser, selectedMarket, dateFromObj, dateToObj], () => {
  activeQuickFilter.value = ''
})

onMounted(async () => {
  // 載入使用者列表
  if (auth.user.value) {
    const usersRes = await api.getUsers(auth.user.value.phone)
    if (usersRes.success && usersRes.data) {
      users.value = usersRes.data
    }
  }

  // 載入市場列表
  const cached = cache.getCachedMarkets()
  if (cached && cached.length > 0) {
    markets.value = cached
  } else {
    const res = await api.getMarkets()
    if (res.success && res.data) {
      markets.value = res.data
      cache.setCachedMarkets(res.data)
    }
  }

  // 預設顯示本月
  const firstFilter = quickFilters[0]
  if (firstFilter) {
    applyQuickFilter(firstFilter)
  }
})
</script>

<style scoped>
.attendance-admin-view {
  min-height: 100vh;
  background: var(--color-bg);
}

.page-content {
  padding: var(--space-lg);
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.back-btn {
  width: 100%;
  justify-content: center;
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-sm);
  background: rgba(59, 130, 246, 0.1) !important;
  border-radius: var(--radius-md);
  color: var(--color-primary) !important;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

/* 篩選區 */
.filters-section {
  padding: var(--space-md);
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
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
  gap: var(--space-sm);
}

.filter-actions :deep(.p-button) {
  flex: 1;
}

/* 統計 */
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
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.record-card:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.record-card.is-manual {
  border-left-color: var(--color-warning);
}

.record-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.record-date {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.record-employee {
  font-weight: 600;
  color: var(--color-primary);
}

.manual-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  background: var(--color-warning);
  color: #000;
  border-radius: var(--radius-sm);
  margin-left: auto;
}

.record-market {
  font-size: 0.9rem;
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
  font-weight: 600;
  color: var(--color-primary);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  z-index: 1000;
}

.modal-content {
  width: 100%;
  max-width: 400px;
  padding: var(--space-lg);
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--space-md);
}

.modal-info {
  background: var(--color-bg-secondary);
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-md);
  font-size: 0.9rem;
}

.modal-info p {
  margin: var(--space-xs) 0;
}

.form-group {
  margin-bottom: var(--space-md);
}

.modal-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.modal-actions :deep(.p-button) {
  flex: 1;
}

/* Modal 動畫 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* 刪除按鈕 */
.modal-delete {
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.delete-warning {
  color: var(--color-danger);
  margin-bottom: var(--space-md);
  font-weight: 500;
}

@media (max-width: 480px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
