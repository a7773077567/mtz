<template>
  <div class="login-view">
    <div class="login-container">
      <header class="login-header">
        <h1 class="app-title">營業額系統</h1>
        <p class="app-subtitle">請輸入手機號碼登入</p>
      </header>

      <main class="login-content">
        <PhoneInput
          ref="phoneInputRef"
          :loading="loading"
          @submit="handleLogin"
        />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PhoneInput from '../components/PhoneInput.vue'
import { useApi } from '../composables/useApi'
import { useAuth } from '../composables/useAuth'
import { useCache } from '../composables/useCache'

const router = useRouter()
const api = useApi()
const auth = useAuth()
const cache = useCache()

const loading = ref(false)
const phoneInputRef = ref<InstanceType<typeof PhoneInput> | null>(null)

const handleLogin = async (phone: string) => {
  loading.value = true
  
  // 使用 init API 一次取得 user + markets
  const res = await api.init(phone)
  
  loading.value = false
  
  if (res.success && res.data) {
    const { user, markets } = res.data
    
    // 設定使用者
    auth.setUser({
      id: '',
      phone: user.phone,
      name: user.name,
      role: user.role,
    })
    
    // 快取 markets
    cache.setCachedMarkets(markets)
    
    router.push('/submit')
  } else {
    phoneInputRef.value?.setError(res.error || '登入失敗')
  }
}
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  background: linear-gradient(135deg, #f0f4ff 0%, #e8ecf8 100%);
}

.login-container {
  width: 100%;
  max-width: 360px;
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.app-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.app-subtitle {
  margin: var(--space-sm) 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.login-content {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-lg);
}
</style>
