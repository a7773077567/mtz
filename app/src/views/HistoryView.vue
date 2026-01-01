<template>
  <div class="history-view">
    <AppHeader />

    <main class="page-content">
      <!-- 管理員篩選器 -->
      <Transition name="slide-up">
        <RevenueFilters
          v-if="isAdmin"
          :markets="markets"
          :users="users"
          :loading="loading"
          @filter="handleFilter"
          @clear="handleClear"
        />
      </Transition>

      <!-- 統計區塊（僅管理員） -->
      <Transition name="slide-up">
        <StatsSummary
          v-if="isAdmin && summary"
          :summary="summary"
          class="stats-block"
        />
      </Transition>

      <!-- 列表 -->
      <section class="list-section">
        <Transition name="fade" mode="out-in">
          <RevenueSkeleton v-if="loading && revenues.length === 0" :count="5" />
          <div v-else>
            <RevenueList
              :items="revenues"
              :show-submitter="isAdmin"
              :deleting-id="deletingId"
              :can-delete="isAdmin"
              @delete="handleDeleteRequest"
            />
            <!-- Load More 按鈕 -->
            <div v-if="hasMore" class="load-more-container">
              <Button
                label="載入更多"
                :loading="loadingMore"
                :disabled="loadingMore"
                severity="secondary"
                outlined
                class="load-more-btn"
                @click="loadMore"
              />
            </div>
          </div>
        </Transition>
      </section>
    </main>

    <!-- 確認對話框和 Toast -->
    <ConfirmDialog />
    <Toast position="top-center" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import AppHeader from '../components/AppHeader.vue'
import RevenueSkeleton from '../components/RevenueSkeleton.vue'
import RevenueFilters from '../components/RevenueFilters.vue'
import StatsSummary from '../components/StatsSummary.vue'
import RevenueList from '../components/RevenueList.vue'
import { useApi } from '../composables/useApi'
import { useAuth } from '../composables/useAuth'
import { useCache } from '../composables/useCache'
import type { Market, User, Revenue, RevenueSummary, RevenueFilters as Filters } from '../types'

const PAGE_SIZE = 30

const router = useRouter()
const api = useApi()
const auth = useAuth()
const cache = useCache()
const confirm = useConfirm()
const toast = useToast()

const loading = ref(true)
const loadingMore = ref(false)
const revenues = ref<Revenue[]>([])
const summary = ref<RevenueSummary | null>(null)
const markets = ref<Market[]>([])
const users = ref<User[]>([])
const hasMore = ref(false)
const currentFilters = ref<Filters | undefined>(undefined)
const deletingId = ref<string | null>(null)

const isAdmin = computed(() => auth.isAdmin())

// 檢查登入狀態
if (!auth.isLoggedIn()) {
  router.push('/')
}

const fetchData = async (filters?: Filters, append = false) => {
  if (!auth.user.value) return
  
  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
    revenues.value = []
  }
  
  const offset = append ? revenues.value.length : 0
  const res = await api.getRevenues(auth.user.value.phone, filters, PAGE_SIZE, offset)
  
  if (res.success && res.data) {
    if (append) {
      revenues.value = [...revenues.value, ...res.data.records]
    } else {
      revenues.value = res.data.records
    }
    summary.value = res.data.summary
    hasMore.value = res.data.records.length >= PAGE_SIZE
  }
  
  loading.value = false
  loadingMore.value = false
}

const loadMore = () => {
  fetchData(currentFilters.value, true)
}

onMounted(async () => {
  // 管理員優先載入快取的 markets/users（立即顯示篩選器）
  if (isAdmin.value) {
    const cachedMarkets = cache.getCachedMarkets()
    const cachedUsers = cache.getCachedUsers()
    if (cachedMarkets) markets.value = cachedMarkets
    if (cachedUsers) users.value = cachedUsers
  }
  
  // 取得營業額資料
  await fetchData()
  
  // 管理員背景更新 markets/users
  if (isAdmin.value && auth.user.value) {
    Promise.all([
      api.getMarkets(),
      api.getUsers(auth.user.value.phone),
    ]).then(([marketsRes, usersRes]) => {
      if (marketsRes.success && marketsRes.data) {
        markets.value = marketsRes.data
        cache.setCachedMarkets(marketsRes.data)
      }
      if (usersRes.success && usersRes.data) {
        users.value = usersRes.data
        cache.setCachedUsers(usersRes.data)
      }
    })
  }
})

const handleFilter = (filters: Filters) => {
  currentFilters.value = filters
  fetchData(filters)
}

const handleClear = () => {
  currentFilters.value = undefined
  fetchData()
}

// 處理刪除請求（顯示確認對話框）
const handleDeleteRequest = (item: Revenue) => {
  const dateStr = new Date(item.date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
  
  confirm.require({
    message: `確定要刪除 ${dateStr} 的 $${item.amount.toLocaleString()} 營業紀錄？`,
    header: '刪除確認',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: '取消',
    acceptLabel: '刪除',
    acceptClass: 'p-button-danger',
    accept: () => executeDelete(item),
  })
}

// 執行刪除
const executeDelete = async (item: Revenue) => {
  if (!auth.user.value) return
  
  deletingId.value = item.id
  
  const res = await api.deleteRevenue(auth.user.value.phone, item.id)
  
  deletingId.value = null
  
  if (res.success) {
    // 從列表中移除
    revenues.value = revenues.value.filter(r => r.id !== item.id)
    
    // 更新統計
    if (summary.value) {
      summary.value = {
        total_amount: summary.value.total_amount - item.amount,
        total_rent: summary.value.total_rent - item.rent,
        total_costs: summary.value.total_costs - (item.parking_fee + item.cleaning_fee + item.other_cost),
        total_profit: summary.value.total_profit - item.profit,
      }
    }
    
    toast.add({
      severity: 'success',
      summary: '刪除成功',
      life: 2000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: '刪除失敗',
      detail: res.error || '請稍後再試',
      life: 3000,
    })
  }
}
</script>

<style scoped>
.history-view {
  min-height: 100vh;
  background: var(--color-bg);
}

.page-content {
  padding: var(--space-lg);
  max-width: var(--content-max-width, 480px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.stats-block {
  margin-top: calc(-1 * var(--space-sm));
}

.list-section {
  min-height: 200px;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: var(--space-lg) 0;
}

.load-more-btn {
  min-width: 140px;
}
</style>
