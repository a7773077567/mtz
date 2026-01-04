<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="visible" class="loading-overlay">
        <div class="loading-content">
          <div class="pulse-ring">
            <div class="ring"></div>
            <div class="ring"></div>
            <div class="ring"></div>
          </div>
          <p v-if="text" class="loading-text">{{ text }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  text?: string
}>()
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.pulse-ring {
  position: relative;
  width: 64px;
  height: 64px;
}

.ring {
  position: absolute;
  inset: 0;
  border: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: pulse-ring 1.5s ease-out infinite;
}

.ring:nth-child(2) {
  animation-delay: 0.3s;
}

.ring:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.loading-text {
  color: white;
  font-size: 1rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  margin: 0;
}

/* 動畫 */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
