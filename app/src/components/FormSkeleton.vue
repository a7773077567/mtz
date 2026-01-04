<template>
  <div class="form-skeleton card">
    <!-- 標題 -->
    <div class="skeleton-title"></div>
    
    <!-- 表單欄位 -->
    <div v-for="i in fieldCount" :key="i" class="skeleton-field">
      <div class="skeleton-label"></div>
      <div class="skeleton-input"></div>
    </div>
    
    <!-- 按鈕 -->
    <div class="skeleton-button"></div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  fieldCount?: number
}>(), {
  fieldCount: 6,
})
</script>

<style scoped>
.form-skeleton {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.skeleton-title {
  width: 120px;
  height: 24px;
  background: linear-gradient(
    90deg,
    var(--color-border) 25%,
    var(--color-bg) 50%,
    var(--color-border) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-sm);
}

.skeleton-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.skeleton-label {
  width: 60px;
  height: 14px;
  background: linear-gradient(
    90deg,
    var(--color-border) 25%,
    var(--color-bg) 50%,
    var(--color-border) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

.skeleton-input {
  width: 100%;
  height: 44px;
  background: linear-gradient(
    90deg,
    var(--color-border) 25%,
    var(--color-bg) 50%,
    var(--color-border) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

.skeleton-button {
  width: 100%;
  height: 48px;
  background: linear-gradient(
    90deg,
    var(--color-border) 25%,
    var(--color-bg) 50%,
    var(--color-border) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
  margin-top: var(--space-sm);
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
