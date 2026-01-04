<template>
  <div class="attendance-view">
    <AppHeader />

    <main class="page-content">
      <Transition name="fade" mode="out-in">
        <LoadingSpinner v-if="loading" text="載入中..." />
        <div v-else class="attendance-container">
          <!-- 今日狀態卡片 -->
          <div class="status-card card">
            <h2 class="status-title">今日打卡狀態</h2>
            <div v-if="todayRecords.length === 0" class="status-empty">
              <i class="pi pi-clock status-icon"></i>
              <p>尚未打卡</p>
            </div>
            <div v-else class="status-list">
              <div 
                v-for="record in todayRecords" 
                :key="record.id" 
                class="status-item"
                :class="{ 'is-complete': record.clock_out }"
              >
                <div class="status-market">{{ record.market_name }}</div>
                <div class="status-times">
                  <span class="time-in">
                    <span class="time-label">上班</span>
                    <span class="time-value">{{ formatTime(record.clock_in) }}</span>
                  </span>
                  <span class="time-separator">→</span>
                  <span class="time-out" :class="{ 'pending': !record.clock_out }">
                    <span class="time-label">下班</span>
                    <span class="time-value">{{ record.clock_out ? formatTime(record.clock_out) : '待打卡' }}</span>
                  </span>
                </div>
                <div v-if="record.hours > 0" class="status-hours">
                  共 {{ formatHoursToHM(record.hours) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 打卡操作區 -->
          <div class="action-card card">
            <h2 class="action-title">打卡</h2>
            
            <!-- 選擇市場 / 工作中提示 -->
            <div class="form-group">
              <template v-if="hasOpenRecord">
                <div class="working-status">
                  <span class="working-label">正在工作於</span>
                  <span class="working-market">{{ openRecord?.market_name }}</span>
                </div>
              </template>
              <template v-else>
                <label class="form-label">選擇市場</label>
                <Select
                  v-model="selectedMarket"
                  :options="markets"
                  optionLabel="name"
                  placeholder="請選擇市場"
                  :disabled="submitting"
                  fluid
                />
              </template>
            </div>

            <!-- 打卡按鈕 -->
            <div class="action-buttons">
              <Button 
                label="上班打卡"
                :disabled="!selectedMarket || hasOpenRecord"
                :loading="submitting && clockAction === 'in'"
                severity="success"
                @click="handleClockIn"
              />
              <Button 
                label="下班打卡"
                :disabled="!hasOpenRecord"
                :loading="submitting && clockAction === 'out'"
                severity="danger"
                @click="showClockOutModal = true"
              />
            </div>

            <!-- 補登按鈕 -->
            <Button
              :label="showManualForm ? '收起補登' : '補登出勤'"
              :icon="showManualForm ? 'pi pi-chevron-up' : 'pi pi-pencil'"
              severity="secondary"
              outlined
              class="manual-toggle-btn"
              :disabled="submitting"
              @click="showManualForm = !showManualForm"
            />

            <!-- 補登表單 -->
            <Transition name="slide">
              <div v-if="showManualForm" class="manual-form">
                <div class="manual-form-header">
                  <i class="pi pi-calendar-plus"></i>
                  <span>補登出勤紀錄</span>
                </div>
                <div class="form-group">
                  <label class="form-label">日期</label>
                  <DatePicker
                    v-model="manualDateObj"
                    dateFormat="yy-mm-dd"
                    :maxDate="today"
                    showIcon
                    fluid
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">市場</label>
                  <Select
                    v-model="manualMarket"
                    :options="markets"
                    optionLabel="name"
                    placeholder="請選擇市場"
                    fluid
                  />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">上班時間</label>
                    <TimeInput
                      v-model="manualClockInTime"
                      placeholder="00:00"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">下班時間</label>
                    <TimeInput
                      v-model="manualClockOutTime"
                      placeholder="00:00"
                    />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">休息時間（分鐘）</label>
                  <div class="break-time-input">
                    <InputNumber 
                      v-model="manualBreakTime" 
                      inputId="manual-break" 
                      :min="0"
                      :max="480"
                      placeholder="0" 
                      fluid 
                    />
                    <div class="quick-break-btns">
                      <Button label="30" size="small" severity="secondary" :outlined="manualBreakTime !== 30" @click="manualBreakTime = 30" />
                      <Button label="60" size="small" severity="secondary" :outlined="manualBreakTime !== 60" @click="manualBreakTime = 60" />
                      <Button label="90" size="small" severity="secondary" :outlined="manualBreakTime !== 90" @click="manualBreakTime = 90" />
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">備註（選填）</label>
                  <InputText v-model="manualNote" placeholder="輸入備註" fluid />
                </div>
                <Button 
                  label="提交補登"
                  :disabled="!manualDateObj || !manualMarket || !manualClockInTime || !manualClockOutTime"
                  :loading="submitting && clockAction === 'manual'"
                  class="submit-btn"
                  @click="handleManualAttendance"
                />
              </div>
            </Transition>
          </div>

          <!-- 快速連結 -->
          <Button
            label="查看我的出勤紀錄"
            icon="pi pi-list"
            severity="info"
            class="view-records-btn"
            @click="router.push('/my-attendance')"
          />

          <!-- 管理員專用 -->
          <Button
            v-if="auth.user.value?.role === 'admin'"
            label="出勤管理"
            icon="pi pi-users"
            severity="secondary"
            outlined
            class="admin-btn"
            @click="router.push('/attendance-admin')"
          />
        </div>
      </Transition>
    </main>

    <!-- 下班打卡 Modal -->
    <Transition name="modal">
      <div v-if="showClockOutModal" class="modal-overlay" @click.self="showClockOutModal = false">
        <div class="modal-content card">
          <h2 class="modal-title">下班打卡</h2>
          <p class="modal-subtitle">請輸入今日休息時間</p>
          <div class="form-group">
            <label class="form-label">休息時間（分鐘）</label>
            <div class="break-time-input">
              <InputNumber 
                v-model="clockOutBreakTime" 
                inputId="clockout-break" 
                :min="0"
                :max="480"
                placeholder="0" 
                fluid 
              />
              <div class="quick-break-btns">
                <Button label="30" size="small" severity="secondary" :outlined="clockOutBreakTime !== 30" @click="clockOutBreakTime = 30" />
                <Button label="60" size="small" severity="secondary" :outlined="clockOutBreakTime !== 60" @click="clockOutBreakTime = 60" />
                <Button label="90" size="small" severity="secondary" :outlined="clockOutBreakTime !== 90" @click="clockOutBreakTime = 90" />
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <Button label="取消" severity="secondary" outlined @click="showClockOutModal = false" />
            <Button 
              label="確認下班" 
              severity="danger" 
              :loading="submitting && clockAction === 'out'"
              @click="confirmClockOut" 
            />
          </div>
        </div>
      </div>
    </Transition>

    <Toast position="top-center" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import AppHeader from '../components/AppHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import TimeInput from '../components/TimeInput.vue'
import { useApi } from '../composables/useApi'
import { useAuth } from '../composables/useAuth'
import { useCache } from '../composables/useCache'
import type { Market, Attendance } from '../types'

const router = useRouter()
const api = useApi()
const auth = useAuth()
const cache = useCache()
const toast = useToast()

// 基本狀態
const loading = ref(true)
const submitting = ref(false)
const clockAction = ref<'in' | 'out' | 'manual' | null>(null)
const markets = ref<Market[]>([])
const todayRecords = ref<Attendance[]>([])
const selectedMarket = ref<Market | null>(null)
const today = new Date()

// 補登表單
const showManualForm = ref(false)
const manualDateObj = ref<Date | null>(null)
const manualMarket = ref<Market | null>(null)
const manualClockInTime = ref<Date | null>(null)
const manualClockOutTime = ref<Date | null>(null)
const manualBreakTime = ref(0)
const manualNote = ref('')

// 下班打卡 Modal
const showClockOutModal = ref(false)
const clockOutBreakTime = ref(0)

// 是否有未完成的打卡（只上班沒下班）
const hasOpenRecord = computed(() => {
  return todayRecords.value.some(r => r.clock_in && !r.clock_out)
})

// 取得未完成打卡的紀錄
const openRecord = computed(() => {
  return todayRecords.value.find(r => r.clock_in && !r.clock_out)
})

// 下班打卡最大可休息時間（分鐘）
const maxClockOutBreak = computed(() => {
  if (!openRecord.value?.clock_in) return 480
  const clockIn = new Date(openRecord.value.clock_in)
  const now = new Date()
  const diffMinutes = Math.floor((now.getTime() - clockIn.getTime()) / 60000)
  return Math.max(0, diffMinutes)
})

// 補登最大可休息時間（分鐘）
const maxManualBreak = computed(() => {
  if (!manualClockInTime.value || !manualClockOutTime.value) return 480
  const diffMinutes = Math.floor(
    (manualClockOutTime.value.getTime() - manualClockInTime.value.getTime()) / 60000
  )
  return Math.max(0, diffMinutes)
})

// 檢查登入
if (!auth.isLoggedIn()) {
  router.push('/')
}

// 格式化時間
const formatTime = (datetime: string | null): string => {
  if (!datetime) return '--:--'
  const date = new Date(datetime)
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}

// 格式化日期
const formatDate = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 格式化時間為 HH:mm
const formatTimeOnly = (date: Date): string => {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

// 格式化小時數為 X時Y分
const formatHoursToHM = (hours: number): string => {
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}分鐘`
  if (m === 0) return `${h}小時`
  return `${h}小時${m}分鐘`
}

// 載入資料
onMounted(async () => {
  // 載入市場
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

  // 載入今日打卡狀態
  if (auth.user.value) {
    const res = await api.getTodayAttendance(auth.user.value.phone)
    if (res.success && res.data) {
      todayRecords.value = res.data
    }
  }

  loading.value = false
})

// 上班打卡
const handleClockIn = async () => {
  if (!auth.user.value || !selectedMarket.value) return
  
  submitting.value = true
  clockAction.value = 'in'
  const res = await api.clockIn({
    phone: auth.user.value.phone,
    market_id: selectedMarket.value.id,
  })
  submitting.value = false
  clockAction.value = null

  if (res.success && res.data) {
    todayRecords.value.push({
      id: res.data.id,
      market_id: selectedMarket.value.id,
      market_name: selectedMarket.value.name,
      date: formatDate(new Date()),
      clock_in: res.data.clock_in,
      clock_out: null,
      hours: 0,
      is_manual: false,
    })
    toast.add({
      severity: 'success',
      summary: '上班打卡成功',
      detail: `${selectedMarket.value.name} - ${formatTime(res.data.clock_in)}`,
      life: 3000,
    })
    selectedMarket.value = null
  } else {
    toast.add({
      severity: 'error',
      summary: '打卡失敗',
      detail: res.error || '請稍後再試',
      life: 3000,
    })
  }
}

// 下班打卡
const confirmClockOut = async () => {
  if (!auth.user.value || !openRecord.value) return

  // 驗證休息時間
  if (clockOutBreakTime.value > maxClockOutBreak.value) {
    toast.add({
      severity: 'warn',
      summary: '休息時間過長',
      detail: `休息時間不能超過工作時間 (${maxClockOutBreak.value} 分鐘)`,
      life: 4000,
    })
    return
  }

  submitting.value = true
  clockAction.value = 'out'
  const res = await api.clockOut({
    phone: auth.user.value.phone,
    attendance_id: openRecord.value.id,
    break_time: clockOutBreakTime.value,
  })
  submitting.value = false
  clockAction.value = null

  if (res.success && res.data) {
    const record = todayRecords.value.find(r => r.id === openRecord.value?.id)
    if (record) {
      record.clock_out = res.data.clock_out
      record.hours = res.data.hours
    }
    showClockOutModal.value = false
    clockOutBreakTime.value = 0
    toast.add({
      severity: 'success',
      summary: '下班打卡成功',
      detail: `實際工時 ${formatHoursToHM(res.data.hours)}`,
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: '打卡失敗',
      detail: res.error || '請稍後再試',
      life: 3000,
    })
  }
}

// 補登出勤
const handleManualAttendance = async () => {
  if (!auth.user.value || !manualDateObj.value || !manualMarket.value || !manualClockInTime.value || !manualClockOutTime.value) return

  // 驗證休息時間
  if (manualBreakTime.value > maxManualBreak.value) {
    toast.add({
      severity: 'warn',
      summary: '休息時間過長',
      detail: `休息時間不能超過工作時間 (${maxManualBreak.value} 分鐘)`,
      life: 4000,
    })
    return
  }

  submitting.value = true
  clockAction.value = 'manual'
  
  const dateStr = formatDate(manualDateObj.value)
  const res = await api.manualAttendance({
    phone: auth.user.value.phone,
    market_id: manualMarket.value.id,
    date: dateStr,
    clock_in: `${dateStr}T${formatTimeOnly(manualClockInTime.value)}:00`,
    clock_out: `${dateStr}T${formatTimeOnly(manualClockOutTime.value)}:00`,
    break_time: manualBreakTime.value,
    note: manualNote.value,
  })
  submitting.value = false
  clockAction.value = null

  if (res.success && res.data) {
    toast.add({
      severity: 'success',
      summary: '補登成功',
      detail: `已補登 ${formatHoursToHM(res.data.hours)}`,
      life: 3000,
    })
    // 重置表單
    showManualForm.value = false
    manualDateObj.value = null
    manualMarket.value = null
    manualClockInTime.value = null
    manualClockOutTime.value = null
    manualBreakTime.value = 0
    manualNote.value = ''
    // 如果補登的是今天，重新載入今日紀錄
    const todayStr = formatDate(new Date())
    if (dateStr === todayStr && auth.user.value) {
      const res = await api.getTodayAttendance(auth.user.value.phone)
      if (res.success && res.data) {
        todayRecords.value = res.data
      }
    }
  } else {
    toast.add({
      severity: 'error',
      summary: '補登失敗',
      detail: res.error || '請稍後再試',
      life: 3000,
    })
  }
}
</script>

<style scoped>
.attendance-view {
  min-height: 100vh;
  background: var(--color-bg);
}

.page-content {
  padding: var(--space-lg);
  max-width: var(--content-max-width, 480px);
  margin: 0 auto;
}

.attendance-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* 狀態卡片 */
.status-card {
  padding: var(--space-lg);
}

.status-title,
.action-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--space-md);
  color: var(--color-text);
}

.status-empty {
  text-align: center;
  padding: var(--space-xl);
  color: var(--color-text-muted);
}

.status-icon {
  font-size: 2.5rem;
  color: var(--color-text-muted);
  display: block;
  margin-bottom: var(--space-sm);
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.status-item {
  padding: var(--space-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-warning);
}

.status-item.is-complete {
  border-left-color: var(--color-success);
}

.status-market {
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.status-times {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.9rem;
}

.time-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  display: block;
}

.time-value {
  font-weight: 500;
}

.time-out.pending .time-value {
  color: var(--color-warning);
}

.time-separator {
  color: var(--color-text-muted);
}

.status-hours {
  margin-top: var(--space-xs);
  font-size: 0.85rem;
  color: var(--color-success);
  font-weight: 500;
}

/* 操作卡片 */
.action-card {
  padding: var(--space-lg);
}

.form-group {
  margin-bottom: var(--space-md);
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.working-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-md);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
  border-radius: var(--radius-md);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.working-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-xs);
}

.working-market {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-success);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.action-buttons :deep(.p-button) {
  justify-content: center;
  padding: var(--space-md) var(--space-md);
  font-size: 1.05rem;
  min-height: 48px;
}

.manual-toggle-btn {
  width: 100%;
  font-size: 1rem;
}

/* 補登表單 */
.manual-form {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: rgba(251, 191, 36, 0.08);
  border-left: 3px solid var(--color-warning);
  border-radius: var(--radius-md);
}

.manual-form-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: 600;
  color: var(--color-warning);
  margin-bottom: var(--space-md);
  font-size: 0.95rem;
}

.manual-form-header i {
  font-size: 1.1rem;
}

.submit-btn {
  width: 100%;
  margin-top: var(--space-sm);
}

/* 查看紀錄按鈕 */
.view-records-btn {
  width: 100%;
  font-size: 1.1rem;
  padding: var(--space-md) var(--space-lg);
}

.admin-btn {
  width: 100%;
  margin-top: var(--space-sm);
}

/* 動畫 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Break Time Input */
.break-time-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.quick-break-btns {
  display: flex;
  gap: var(--space-sm);
}

.quick-break-btns :deep(.p-button) {
  flex: 1;
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
  max-width: 360px;
  padding: var(--space-lg);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 var(--space-xs);
  text-align: center;
}

.modal-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin: 0 0 var(--space-md);
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
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
</style>
