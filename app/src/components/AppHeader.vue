<template>
  <header class="app-header">
    <!-- 登出按鈕：右上角 -->
    <button class="logout-btn" @click="handleLogout" aria-label="登出">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
    </button>
    
    <div class="header-container">
      <!-- 使用者名稱 -->
      <div class="header-user">
        <span class="user-name">{{ userName }}</span>
      </div>
      
      <!-- 導航連結 -->
      <nav class="header-nav">
        <router-link 
          to="/attendance" 
          class="nav-item"
          :class="{ active: currentRoute === 'attendance' || currentRoute === 'my-attendance' || currentRoute === 'attendance-admin' }"
        >
          打卡
        </router-link>
        <router-link 
          to="/submit" 
          class="nav-item"
          :class="{ active: currentRoute === 'submit' }"
        >
          提交營業額
        </router-link>
        <router-link 
          to="/history" 
          class="nav-item"
          :class="{ active: currentRoute === 'history' }"
        >
          營業紀錄
        </router-link>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const userName = computed(() => auth.user.value?.name || '')
const currentRoute = computed(() => route.name as string)

const handleLogout = () => {
  auth.clearUser()
  router.push('/')
}
</script>

<style scoped>
.app-header {
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: var(--space-md) var(--space-lg);
}

.header-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  max-width: var(--content-max-width, 800px);
  margin: 0 auto;
}

.header-user {
  text-align: center;
}

.user-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text);
}

.header-nav {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
}

.nav-item {
  padding: var(--space-sm) var(--space-lg);
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.nav-item:hover {
  color: var(--color-primary);
  background: var(--color-bg);
}

.nav-item.active {
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
  color: white;
}

.logout-btn {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  width: 44px;
  height: 44px;
  padding: 10px;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn svg {
  width: 22px;
  height: 22px;
}

.logout-btn:hover {
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
}

.logout-btn:active {
  transform: scale(0.95);
}

/* Mobile */
@media (max-width: 767px) {
  .app-header {
    padding: var(--space-sm) var(--space-md);
    padding-top: var(--space-lg);
  }
  
  .user-name {
    font-size: 0.9375rem;
  }
  
  .nav-item {
    padding: var(--space-sm) var(--space-md);
    font-size: 0.9375rem;
    min-height: 2.5rem;
  }
  
  .logout-btn {
    top: var(--space-sm);
    right: var(--space-sm);
    width: 48px;
    height: 48px;
    padding: 12px;
  }
  
  .logout-btn svg {
    width: 24px;
    height: 24px;
  }
}
</style>
