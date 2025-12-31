<template>
  <div class="submit-view">
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title">提交營業額</h1>
        <p class="user-name">{{ auth.user.value?.name }}</p>
      </div>
      <nav class="nav-links">
        <router-link to="/history" class="nav-link">查看紀錄</router-link>
      </nav>
    </header>

    <main class="page-content">
      <Transition name="fade" mode="out-in">
        <LoadingSpinner v-if="loadingMarkets" text="載入中..." />
        <div v-else class="form-container card">
          <RevenueForm
            ref="formRef"
            :markets="markets"
            :loading-markets="loadingMarkets"
            :submitting="submitting"
            @submit="handleSubmit"
          />
        </div>
      </Transition>
    </main>

    <!-- Toast for success message -->
    <Toast position="top-center" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import RevenueForm from '../components/RevenueForm.vue'
import { useApi } from '../composables/useApi'
import { useAuth } from '../composables/useAuth'
import type { Market } from '../types'

const router = useRouter()
const api = useApi()
const auth = useAuth()
const toast = useToast()

const markets = ref<Market[]>([])
const loadingMarkets = ref(true)
const submitting = ref(false)
const formRef = ref<InstanceType<typeof RevenueForm> | null>(null)

// 檢查登入狀態
if (!auth.isLoggedIn()) {
  router.push('/')
}

onMounted(async () => {
  const res = await api.getMarkets()
  if (res.success && res.data) {
    markets.value = res.data
  }
  loadingMarkets.value = false
})

const handleSubmit = async (data: {
  date: string
  market_id: string
  amount: number
  rent: number
  note: string
}) => {
  if (!auth.user.value) return
  
  submitting.value = true
  
  const res = await api.submitRevenue({
    phone: auth.user.value.phone,
    ...data,
  })
  
  submitting.value = false
  
  if (res.success) {
    toast.add({
      severity: 'success',
      summary: '提交成功',
      detail: `營業額 $${data.amount.toLocaleString()} 已記錄`,
      life: 3000,
    })
    formRef.value?.resetForm()
  } else {
    toast.add({
      severity: 'error',
      summary: '提交失敗',
      detail: res.error || '請稍後再試',
      life: 3000,
    })
  }
}
</script>

<style scoped>
.submit-view {
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
}

.form-container {
  padding: var(--space-lg);
}
</style>
