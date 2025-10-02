<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import MainLayout from './components/MainLayout.vue'
import AuthDialog from './components/AuthDialog.vue'
import TestConnection from './components/TestConnection.vue'
import { useAuthStore } from './stores/authStore'

const authStore = useAuthStore()
const showAuthDialog = ref(false)
const showTestConnection = ref(false)

onMounted(async () => {
  await authStore.initAuth()
  
  if (!authStore.isAuthenticated) {
    showAuthDialog.value = true
  }
})

// 監聽認證狀態變化
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (!isAuthenticated) {
    showAuthDialog.value = true
  } else {
    showAuthDialog.value = false
  }
})

const handleAuthSuccess = () => {
  showAuthDialog.value = false
}

// 切換測試連接顯示
const toggleTestConnection = () => {
  showTestConnection.value = !showTestConnection.value
}

</script>

<template>
  <!-- 測試連接組件 -->
  <TestConnection v-model="showTestConnection" />

  <!-- 認證對話框 -->
  <AuthDialog 
    v-model="showAuthDialog"
    @success="handleAuthSuccess"
  />
  
  <!-- 主應用 -->
  <MainLayout 
    v-if="authStore.isAuthenticated && !showTestConnection" 
    @showLoginDialog="showAuthDialog = true"
    @toggleTestConnection="toggleTestConnection"
  />
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
  min-height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  line-height: 1.5;
  overflow-y: auto;
}

#app {
  width: 100%;
  height: 100vh;
  display: block;
  overflow: hidden;
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
