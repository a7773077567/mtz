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
          <LoadingSpinner v-if="loading" text="載入中..." class="loading-center" />
          <RevenueList
            v-else
            :items="revenues"
            :show-submitter="isAdmin"
          />
        </Transition>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import RevenueFilters from '../components/RevenueFilters.vue'
import StatsSummary from '../components/StatsSummary.vue'
import RevenueList from '../components/RevenueList.vue'
import { useApi } from '../composables/useApi'
import { useAuth } from '../composables/useAuth'
import type { Market, User, Revenue, RevenueSummary, RevenueFilters as Filters } from '../types'

const router = useRouter()
const api = useApi()
const auth = useAuth()

const loading = ref(true)
const revenues = ref<Revenue[]>([])
const summary = ref<RevenueSummary | null>(null)
const markets = ref<Market[]>([])
const users = ref<User[]>([])

const isAdmin = computed(() => auth.isAdmin())

// 檢查登入狀態
if (!auth.isLoggedIn()) {
  router.push('/')
}

const fetchData = async (filters?: Filters) => {
  if (!auth.user.value) return
  
  loading.value = true
  
  const res = await api.getRevenues(auth.user.value.phone, filters)
  
  if (res.success && res.data) {
    revenues.value = res.data.records
    summary.value = res.data.summary
  }
  
  loading.value = false
}

onMounted(async () => {
  // 取得營業額資料
  await fetchData()
  
  // 管理員需要額外載入市場和使用者列表
  if (isAdmin.value && auth.user.value) {
    const [marketsRes, usersRes] = await Promise.all([
      api.getMarkets(),
      api.getUsers(auth.user.value.phone),
    ])
    
    if (marketsRes.success && marketsRes.data) {
      markets.value = marketsRes.data
    }
    if (usersRes.success && usersRes.data) {
      users.value = usersRes.data
    }
  }
})

const handleFilter = (filters: Filters) => {
  fetchData(filters)
}

const handleClear = () => {
  fetchData()
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

.loading-center {
  padding: var(--space-xl) 0;
}
</style>
