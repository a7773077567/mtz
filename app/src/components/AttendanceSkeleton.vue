<template>
  <div class="attendance-skeleton">
    <div v-for="i in count" :key="i" class="skeleton-item">
      <div class="skeleton-header">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line badge"></div>
      </div>
      <div class="skeleton-market"></div>
      <div class="skeleton-times">
        <div class="skeleton-time-block">
          <div class="skeleton-line tiny"></div>
          <div class="skeleton-line short"></div>
        </div>
        <div class="skeleton-arrow"></div>
        <div class="skeleton-time-block">
          <div class="skeleton-line tiny"></div>
          <div class="skeleton-line short"></div>
        </div>
        <div class="skeleton-hours"></div>
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
.attendance-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.skeleton-item {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  box-shadow: var(--shadow-card, 0 2px 8px -2px rgb(0 0 0 / 0.1));
  border-left: 4px solid var(--color-border);
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.skeleton-market {
  height: 18px;
  width: 100px;
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

.skeleton-times {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.skeleton-time-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.skeleton-arrow {
  width: 16px;
  height: 2px;
  background: var(--color-border);
  border-radius: 1px;
}

.skeleton-hours {
  margin-left: auto;
  width: 60px;
  height: 28px;
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

.skeleton-line {
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

.skeleton-line.tiny {
  width: 30px;
  height: 10px;
}

.skeleton-line.short {
  width: 50px;
}

.skeleton-line.badge {
  width: 36px;
  height: 18px;
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
