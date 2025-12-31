<template>
  <router-view v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" />
    </Transition>
  </router-view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 處理 GitHub Pages 404 重定向
onMounted(() => {
  const redirect = sessionStorage.getItem('spa-redirect')
  if (redirect) {
    sessionStorage.removeItem('spa-redirect')
    // 移除 base path 前綴
    const basePath = import.meta.env.BASE_URL
    let path = redirect
    if (path.startsWith(basePath)) {
      path = path.slice(basePath.length - 1) // 保留開頭的 /
    }
    if (path && path !== '/') {
      router.replace(path)
    }
  }
})
</script>

<style>
/* Global app styles are in main.css */
</style>
