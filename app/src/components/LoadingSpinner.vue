<template>
  <div class="loading-spinner" :class="props.size">
    <div class="spinner"></div>
    <span v-if="props.text" class="loading-text">{{ props.text }}</span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  text?: string
}>(), {
  size: 'md',
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}

.spinner {
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.sm .spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.md .spinner {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

.lg .spinner {
  width: 48px;
  height: 48px;
  border-width: 4px;
}

.loading-text {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
