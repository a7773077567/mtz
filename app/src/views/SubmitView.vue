<template>
  <div class="submit-view">
    <AppHeader />

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
import AppHeader from '../components/AppHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import RevenueForm from '../components/RevenueForm.vue'
import { useApi } from '../composables/useApi'
import { useAuth } from '../composables/useAuth'
import { useCache } from '../composables/useCache'
import type { Market } from '../types'

const router = useRouter()
const api = useApi()
const auth = useAuth()
const cache = useCache()
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
  // 優先使用快取
  const cached = cache.getCachedMarkets()
  if (cached && cached.length > 0) {
    markets.value = cached
    loadingMarkets.value = false
    return
  }
  
  // 快取不存在才呼叫 API
  const res = await api.getMarkets()
  if (res.success && res.data) {
    markets.value = res.data
    cache.setCachedMarkets(res.data)
  }
  loadingMarkets.value = false
})

const handleSubmit = async (data: {
  date: string
  market_id: string
  amount: number
  rent: number
  parking_fee: number
  cleaning_fee: number
  other_cost: number
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

.page-content {
  padding: var(--space-lg);
  max-width: var(--content-max-width, 480px);
  margin: 0 auto;
}

.form-container {
  padding: var(--space-lg);
}
</style>
