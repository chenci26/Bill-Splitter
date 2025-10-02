<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MainLayout from './components/MainLayout.vue'
import AuthDialog from './components/AuthDialog.vue'
import TripSelector from './components/TripSelector.vue'
import { useAuthStore } from './stores/authStore'

const authStore = useAuthStore()
const showAuthDialog = ref(false)

onMounted(async () => {
  await authStore.initAuth()
  
  // 如果用戶未登入，顯示登入對話框
  if (!authStore.isAuthenticated) {
    showAuthDialog.value = true
  }
})

const handleAuthSuccess = () => {
  showAuthDialog.value = false
}
</script>

<template>
  <!-- 認證對話框 -->
  <AuthDialog 
    v-model="showAuthDialog"
    @success="handleAuthSuccess"
  />
  
  <!-- 主應用 -->
  <MainLayout v-if="authStore.isAuthenticated" />
  
  <!-- 旅程選擇器 -->
  <TripSelector v-if="authStore.isAuthenticated" />
</template>

<style>
/* Reset CSS */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  width: 100%;
  height: 100%;
}

body {
  width: 100%;
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  line-height: 1.5;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
  display: block;
}

/* 確保所有容器都是滿版 */
.el-container {
  width: 100%;
  height: 100%;
}

/* 移除Element Plus默認樣式 */
:deep(.el-card) {
  margin: 0;
}

:deep(.el-card__body) {
  padding: 20px;
}

/* 確保表格容器滿版 */
:deep(.el-table) {
  width: 100% !important;
}

:deep(.el-table__header-wrapper),
:deep(.el-table__body-wrapper) {
  width: 100% !important;
}
</style>
