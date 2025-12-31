<template>
  <div class="revenue-skeleton">
    <div v-for="i in count" :key="i" class="skeleton-item">
      <div class="skeleton-header">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line medium"></div>
      </div>
      <div class="skeleton-body">
        <div class="skeleton-row">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line short"></div>
        </div>
        <div class="skeleton-row">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line short"></div>
        </div>
        <div class="skeleton-row">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  count?: number
}>(), {
  count: 5,
})
</script>

<style scoped>
.revenue-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.skeleton-item {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  box-shadow: var(--shadow-card, 0 2px 8px -2px rgb(0 0 0 / 0.1));
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.skeleton-body {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.skeleton-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skeleton-line {
  height: 16px;
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

.skeleton-line.short {
  width: 60px;
}

.skeleton-line.medium {
  width: 100px;
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
