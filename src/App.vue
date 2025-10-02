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
  console.log('初始化認證...')
  await authStore.initAuth()
  
  console.log('認證狀態:', {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    userEmail: authStore.userEmail
  })
  
  // 如果用戶未登入，顯示登入對話框
  if (!authStore.isAuthenticated) {
    console.log('用戶未登入，顯示登入對話框')
    showAuthDialog.value = true
  } else {
    console.log('用戶已登入，跳過登入對話框')
  }
})

// 監聽認證狀態變化
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  console.log('認證狀態變化:', isAuthenticated)
  if (!isAuthenticated) {
    console.log('用戶登出，顯示登入對話框')
    showAuthDialog.value = true
  } else {
    console.log('用戶登入，關閉登入對話框')
    showAuthDialog.value = false
  }
})

const handleAuthSuccess = () => {
  console.log('認證成功，關閉對話框')
  showAuthDialog.value = false
  
  // 強制觸發響應性更新
  setTimeout(() => {
    console.log('認證成功後狀態:', {
      isAuthenticated: authStore.isAuthenticated.value,
      user: authStore.user.value?.email
    })
  }, 100)
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
