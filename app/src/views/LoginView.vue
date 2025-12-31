<template>
  <div class="login-view">
    <div class="login-container">
      <header class="login-header">
        <h1 class="app-title" :class="{ mounted: mounted, loading: loading }">蘿綺莉蕾芭索</h1>
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
const mounted = ref(false)
const phoneInputRef = ref<InstanceType<typeof PhoneInput> | null>(null)

// 確保頁面渲染完成後才開始動畫
import { onMounted } from 'vue'
onMounted(() => {
  // 延遲一幀確保 DOM 完全準備好
  requestAnimationFrame(() => {
    mounted.value = true
  })
})

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
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.3em;
  opacity: 0;
  filter: blur(4px);
  transition: none;
}

.app-title.mounted {
  animation: reveal 1s ease-out 0.3s forwards;
}

.app-title.mounted.loading {
  opacity: 1;
  letter-spacing: 0.08em;
  filter: blur(0);
  animation: float 1.3s ease-in-out infinite, glow 1s ease-in-out infinite;
}

@keyframes reveal {
  0% {
    opacity: 0;
    letter-spacing: 0.3em;
    filter: blur(4px);
  }
  100% {
    opacity: 1;
    letter-spacing: 0.08em;
    filter: blur(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes glow {
  0%, 100% {
    filter: drop-shadow(0 0 4px rgba(147, 197, 253, 0.6));
  }
  50% {
    filter: drop-shadow(0 0 14px rgba(147, 197, 253, 1)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.8));
  }
}

.login-content {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-lg);
}
</style>
