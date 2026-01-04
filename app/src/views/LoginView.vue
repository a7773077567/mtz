<template>
  <div class="login-view">
    <div class="login-container">
      <!-- 日式極簡標題 -->
      <header class="login-header">
        <h1 class="app-title">蘿綺莉蕾芭索</h1>
        <div class="title-accent"></div>
      </header>

      <!-- 登入表單 -->
      <main class="login-content">
        <PhoneInput
          :loading="loading"
          @submit="handleLogin"
          @error="handleError"
        />
      </main>

      <!-- 底部裝飾線 -->
      <div class="zen-line"></div>
    </div>

    <Toast position="top-center" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import PhoneInput from '../components/PhoneInput.vue'
import { useApi } from '../composables/useApi'
import { useAuth } from '../composables/useAuth'
import { useCache } from '../composables/useCache'

const router = useRouter()
const api = useApi()
const auth = useAuth()
const cache = useCache()
const toast = useToast()

const loading = ref(false)

const handleError = (message: string) => {
  toast.add({
    severity: 'warn',
    summary: '提示',
    detail: message,
    life: 3000,
  })
}

const handleLogin = async (phone: string) => {
  loading.value = true
  
  const res = await api.init(phone)
  
  loading.value = false
  
  if (res.success && res.data) {
    const { user, markets } = res.data
    
    auth.setUser({
      id: '',
      phone: user.phone,
      name: user.name,
      role: user.role,
    })
    
    cache.setCachedMarkets(markets)
    
    router.push('/attendance')
  } else {
    handleError(res.error || '登入失敗')
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
  background: #fafaf9;
}

.login-container {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 日式極簡標題 */
.login-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.app-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 500;
  color: #1c1917;
  letter-spacing: 0.25em;
  font-family: 'Noto Serif TC', 'Noto Serif JP', serif;
}

.title-accent {
  width: 40px;
  height: 2px;
  background: #a8a29e;
  margin: var(--space-md) auto 0;
  border-radius: 1px;
}

/* 登入區塊 - 線條風格 */
.login-content {
  width: 100%;
  background: transparent;
  padding: var(--space-xl) 0;
  border-top: 1px solid #d6d3d1;
  border-bottom: 1px solid #d6d3d1;
}

/* 底部禪意裝飾線 */
.zen-line {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #d6d3d1, transparent);
  margin-top: var(--space-xl);
}
</style>
