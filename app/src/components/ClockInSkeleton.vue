<template>
  <div class="clock-in-skeleton">
    <!-- 今日狀態卡片 -->
    <div class="skeleton-card card">
      <div class="skeleton-card-title"></div>
      <div class="skeleton-status-empty">
        <div class="skeleton-icon"></div>
        <div class="skeleton-text"></div>
      </div>
    </div>
    
    <!-- 打卡操作區 -->
    <div class="skeleton-card card">
      <div class="skeleton-card-title"></div>
      <div class="skeleton-field">
        <div class="skeleton-label"></div>
        <div class="skeleton-select"></div>
      </div>
      <div class="skeleton-buttons">
        <div class="skeleton-button success"></div>
        <div class="skeleton-button danger"></div>
      </div>
      <div class="skeleton-toggle"></div>
    </div>
    
    <!-- 快速連結 -->
    <div class="skeleton-link"></div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.clock-in-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.skeleton-card {
  padding: var(--space-lg);
}

.skeleton-card-title {
  width: 120px;
  height: 22px;
  background: linear-gradient(
    90deg,
    var(--color-border) 25%,
    var(--color-bg) 50%,
    var(--color-border) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-md);
}

.skeleton-status-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) 0;
}

.skeleton-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(
    90deg,
    var(--color-border) 25%,
    var(--color-bg) 50%,
    var(--color-border) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 50%;
}

.skeleton-text {
  width: 80px;
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

.skeleton-field {
  margin-bottom: var(--space-md);
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
  margin-bottom: var(--space-xs);
}

.skeleton-select {
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

.skeleton-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.skeleton-button {
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
}

.skeleton-toggle {
  width: 100%;
  height: 40px;
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

.skeleton-link {
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
