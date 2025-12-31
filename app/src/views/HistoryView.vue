<template>
  <div class="history-view">
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title">營業紀錄</h1>
        <p class="user-name">{{ auth.user.value?.name }}</p>
      </div>
      <nav class="nav-links">
        <router-link to="/submit" class="nav-link">提交營業額</router-link>
      </nav>
    </header>

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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.page-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
}

.user-name {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.nav-links {
  display: flex;
  gap: var(--space-md);
}

.nav-link {
  font-size: 0.875rem;
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.nav-link:hover {
  color: var(--color-primary-dark);
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
