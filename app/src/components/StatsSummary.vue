<template>
  <div class="stats-summary">
    <div class="stat-item">
      <span class="stat-label">總營業額</span>
      <span class="stat-value primary">{{ formatCurrency(props.summary.total_amount) }}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">總租金</span>
      <span class="stat-value muted">{{ formatCurrency(props.summary.total_rent) }}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">總成本</span>
      <span class="stat-value muted">{{ formatCurrency(props.summary.total_costs || 0) }}</span>
    </div>
    <div class="stat-item highlight">
      <span class="stat-label">利潤</span>
      <span class="stat-value" :class="profitClass">{{ formatCurrency(props.summary.total_profit) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RevenueSummary } from '../types'

const props = defineProps<{
  summary: RevenueSummary
}>()

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(value)
}

const profitClass = computed(() => {
  return props.summary.total_profit >= 0 ? 'success' : 'error'
})
</script>

<style scoped>
.stats-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-sm);
  padding: var(--space-md);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: var(--radius-lg);
  color: white;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.stat-item.highlight {
  position: relative;
}

.stat-item.highlight::before {
  content: '';
  position: absolute;
  left: -0.5rem;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.3);
}

.stat-label {
  font-size: 0.75rem;
  opacity: 0.9;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
}

.stat-value.primary {
  color: white;
}

.stat-value.muted {
  opacity: 0.9;
}

.stat-value.success {
  color: #86efac;
}

.stat-value.error {
  color: #fca5a5;
}

@media (max-width: 360px) {
  .stats-summary {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }
  
  .stat-item.highlight::before {
    display: none;
  }
}
</style>
