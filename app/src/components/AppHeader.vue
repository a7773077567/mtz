<template>
  <header class="app-header">
    <div class="header-container">
      <!-- 左側：使用者資訊 -->
      <div class="header-user">
        <span class="user-name">{{ userName }}</span>
      </div>
      
      <!-- 中間：導航連結 -->
      <nav class="header-nav">
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
      
      <!-- 右側：登出按鈕 -->
      <div class="header-actions">
        <button class="logout-btn" @click="handleLogout">登出</button>
      </div>
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
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--content-max-width, 800px);
  margin: 0 auto;
  padding: var(--space-md) var(--space-lg);
  gap: var(--space-md);
}

.header-user {
  flex-shrink: 0;
}

.user-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text);
}

.header-nav {
  display: flex;
  gap: var(--space-sm);
  flex: 1;
  justify-content: center;
}

.nav-item {
  padding: var(--space-sm) var(--space-md);
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  min-height: 2.75rem;
  display: flex;
  align-items: center;
}

.nav-item:hover {
  color: var(--color-primary);
  background: var(--color-bg);
}

.nav-item.active {
  color: var(--color-primary);
  background: var(--color-primary);
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
  color: white;
}

.header-actions {
  flex-shrink: 0;
}

.logout-btn {
  padding: var(--space-sm) var(--space-md);
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 2.75rem;
  font-family: inherit;
}

.logout-btn:hover {
  color: var(--color-error);
  border-color: var(--color-error);
  background: rgba(239, 68, 68, 0.05);
}

/* Mobile: 加大觸控區域 */
@media (max-width: 767px) {
  .header-container {
    flex-wrap: wrap;
    padding: var(--space-sm) var(--space-md);
  }
  
  .header-user {
    order: 1;
    flex: 1;
  }
  
  .header-actions {
    order: 2;
  }
  
  .header-nav {
    order: 3;
    width: 100%;
    margin-top: var(--space-sm);
  }
  
  .nav-item {
    flex: 1;
    justify-content: center;
    min-height: 3rem;
    font-size: 1.0625rem;
  }
  
  .user-name {
    font-size: 1.0625rem;
  }
  
  .logout-btn {
    min-height: 2.75rem;
    padding: var(--space-sm) var(--space-md);
  }
}
</style>
