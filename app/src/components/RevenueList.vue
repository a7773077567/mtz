<template>
  <div class="revenue-list">
    <TransitionGroup name="list">
      <div v-for="item in props.items" :key="item.id" class="revenue-item">
        <div class="item-header">
          <span class="item-date">{{ formatDate(item.date) }}</span>
          <span class="item-market">{{ item.market }}</span>
        </div>
        <div class="item-body">
          <div class="item-amounts">
            <div class="amount-row">
              <span class="amount-label">營業額</span>
              <span class="amount-value primary">{{ formatCurrency(item.amount) }}</span>
            </div>
            <div class="amount-row">
              <span class="amount-label">租金</span>
              <span class="amount-value muted">-{{ formatCurrency(item.rent) }}</span>
            </div>
            <div class="amount-row profit">
              <span class="amount-label">淨利</span>
              <span class="amount-value" :class="profitClass(item.profit)">
                {{ formatCurrency(item.profit) }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="item.note || showSubmitter" class="item-footer">
          <span v-if="showSubmitter" class="item-submitter">{{ item.submitted_by }}</span>
          <span v-if="item.note" class="item-note">{{ item.note }}</span>
        </div>
      </div>
    </TransitionGroup>

    <div v-if="props.items.length === 0" class="empty-state">
      <p>目前沒有資料</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Revenue } from '../types'

const props = defineProps<{
  items: Revenue[]
  showSubmitter?: boolean
}>()

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(value)
}

const profitClass = (profit: number): string => {
  return profit >= 0 ? 'success' : 'error'
}
</script>

<style scoped>
.revenue-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.revenue-item {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  box-shadow: var(--shadow-card, 0 2px 8px -2px rgb(0 0 0 / 0.1));
  transition: box-shadow var(--transition-fast), transform var(--transition-fast);
}

.revenue-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.item-date {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.item-market {
  font-weight: 500;
  color: var(--color-text);
}

.item-body {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-sm);
}

.item-amounts {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-row.profit {
  margin-top: var(--space-xs);
  padding-top: var(--space-xs);
  border-top: 1px dashed var(--color-border);
}

.amount-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.amount-value {
  font-weight: 500;
}

.amount-value.primary {
  color: var(--color-text);
}

.amount-value.muted {
  color: var(--color-text-muted);
}

.amount-value.success {
  color: var(--color-success);
}

.amount-value.error {
  color: var(--color-error);
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--color-border);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.item-submitter {
  background: var(--color-bg);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.item-note {
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: var(--space-xl);
  color: var(--color-text-muted);
}

/* List Transition */
.list-enter-active,
.list-leave-active {
  transition: all var(--transition-normal);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
