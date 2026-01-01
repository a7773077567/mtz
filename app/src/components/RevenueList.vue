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
            <!-- 可展開的其他成本 -->
            <div v-if="getTotalCosts(item) > 0" class="costs-section">
              <div
                class="amount-row costs-row"
                role="button"
                tabindex="0"
                @click="toggleCosts(item.id)"
                @keydown.enter="toggleCosts(item.id)"
              >
                <span class="amount-label costs-label">
                  其他成本
                  <span class="expand-arrow" :class="{ expanded: expandedItems.has(item.id) }"></span>
                </span>
                <span class="amount-value muted">-{{ formatCurrency(getTotalCosts(item)) }}</span>
              </div>
              <Transition name="slide">
                <div v-if="expandedItems.has(item.id)" class="costs-details">
                  <div v-if="item.parking_fee > 0" class="amount-row sub-row">
                    <span class="amount-label sub-label">停車費</span>
                    <span class="amount-value muted">-{{ formatCurrency(item.parking_fee) }}</span>
                  </div>
                  <div v-if="item.cleaning_fee > 0" class="amount-row sub-row">
                    <span class="amount-label sub-label">清潔費</span>
                    <span class="amount-value muted">-{{ formatCurrency(item.cleaning_fee) }}</span>
                  </div>
                  <div v-if="item.other_cost > 0" class="amount-row sub-row">
                    <span class="amount-label sub-label">其他</span>
                    <span class="amount-value muted">-{{ formatCurrency(item.other_cost) }}</span>
                  </div>
                </div>
              </Transition>
            </div>
            <div class="amount-row profit">
              <span class="amount-label">利潤</span>
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
        <!-- 刪除按鈕（僅管理員） -->
        <div v-if="canDelete" class="item-actions">
          <button
            class="delete-btn"
            type="button"
            :disabled="deletingId === item.id"
            @click.stop="handleDelete(item)"
          >
            <span v-if="deletingId === item.id" class="delete-spinner"></span>
            <template v-else>
              <svg class="delete-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>刪除</span>
            </template>
          </button>
        </div>
      </div>
    </TransitionGroup>

    <div v-if="props.items.length === 0" class="empty-state">
      <p>目前沒有資料</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Revenue } from '../types'

const props = defineProps<{
  items: Revenue[]
  showSubmitter?: boolean
  deletingId?: string | null  // 正在刪除的項目 ID
  canDelete?: boolean  // 是否可以刪除（僅管理員）
}>()

const emit = defineEmits<{
  delete: [item: Revenue]  // 通知父元件刪除
}>()

const expandedItems = ref<Set<string>>(new Set())

const toggleCosts = (id: string) => {
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id)
  } else {
    expandedItems.value.add(id)
  }
  // 觸發響應式更新
  expandedItems.value = new Set(expandedItems.value)
}

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

const getTotalCosts = (item: Revenue): number => {
  return (item.parking_fee || 0) + (item.cleaning_fee || 0) + (item.other_cost || 0)
}

const handleDelete = (item: Revenue) => {
  emit('delete', item)
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

/* 刪除按鈕區域 */
.item-actions {
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px dashed var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.delete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-error, #ef4444);
  transition: background var(--transition-fast), transform var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.delete-btn:active {
  transform: scale(0.97);
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-icon {
  width: 16px;
  height: 16px;
}

.delete-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-top-color: var(--color-error, #ef4444);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

/* Costs Expand */

.costs-row {
  cursor: pointer;
  user-select: none;
  padding: 4px 0;
  margin: -4px 0;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.costs-row:active {
  background: var(--color-bg);
}

.costs-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.expand-arrow {
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--color-primary);
  transition: transform var(--transition-fast);
}

.expand-arrow.expanded {
  transform: rotate(180deg);
}

.costs-details {
  margin-top: var(--space-xs);
  padding-left: var(--space-md);
  border-left: 2px solid var(--color-border);
}

.sub-row {
  padding: 2px 0;
}

.sub-row .amount-value {
  font-size: 0.75rem;
  opacity: 0.7;
}

.sub-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  opacity: 0.8;
}

/* Slide Transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
