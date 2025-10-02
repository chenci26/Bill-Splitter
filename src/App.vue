<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MainLayout from './components/MainLayout.vue'
import AuthDialog from './components/AuthDialog.vue'
import TripSelector from './components/TripSelector.vue'
import TestConnection from './components/TestConnection.vue'
import { useAuthStore } from './stores/authStore'

const authStore = useAuthStore()
const showAuthDialog = ref(false)
const showTestConnection = ref(false)

onMounted(async () => {
  console.log('初始化認證...')
  await authStore.initAuth()
  
  console.log('認證狀態:', {
    isAuthenticated: authStore.isAuthenticated.value,
    user: authStore.user.value,
    userEmail: authStore.userEmail.value
  })
  
  // 如果用戶未登入，顯示登入對話框
  if (!authStore.isAuthenticated.value) {
    console.log('用戶未登入，顯示登入對話框')
    showAuthDialog.value = true
  } else {
    console.log('用戶已登入，跳過登入對話框')
  }
})

const handleAuthSuccess = () => {
  showAuthDialog.value = false
}

// 切換測試連接顯示
const toggleTestConnection = () => {
  showTestConnection.value = !showTestConnection.value
}

// 手動登出
const handleLogout = async () => {
  try {
    console.log('App: 開始登出...')
    await authStore.signOut()
    console.log('App: Supabase 登出完成，等待認證狀態更新...')
    
    // 等待一小段時間讓認證狀態監聽器更新
    await new Promise(resolve => setTimeout(resolve, 100))
    
    console.log('App: 當前認證狀態:', authStore.isAuthenticated.value)
    console.log('App: 顯示登入對話框')
    showAuthDialog.value = true
    console.log('App: 用戶已登出')
  } catch (error) {
    console.error('App: 登出失敗:', error)
  }
}

// 手動顯示登入對話框
const showLoginDialog = () => {
  showAuthDialog.value = true
  console.log('手動顯示登入對話框')
}
</script>

<template>
  <!-- 測試連接按鈕 -->
  <div style="position: fixed; top: 10px; right: 10px; z-index: 1000;">
    <el-button @click="toggleTestConnection" size="small">
      {{ showTestConnection ? '隱藏測試' : '測試連接' }}
    </el-button>
    <el-button v-if="authStore.isAuthenticated.value && !showTestConnection" @click="handleLogout" size="small" type="danger">
      登出
    </el-button>
    <el-button v-if="!authStore.isAuthenticated.value && !showTestConnection" @click="showLoginDialog" size="small" type="primary">
      登入
    </el-button>
  </div>

  <!-- 調試信息 -->
  <div v-if="!showTestConnection" style="position: fixed; top: 60px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 4px; font-size: 12px; z-index: 999;">
    <div>認證狀態: {{ authStore.isAuthenticated.value ? '已登入' : '未登入' }}</div>
    <div v-if="authStore.userEmail.value">用戶: {{ authStore.userEmail.value }}</div>
    <div>對話框顯示: {{ showAuthDialog ? '是' : '否' }}</div>
  </div>

  <!-- 測試連接組件 -->
  <TestConnection v-if="showTestConnection" />

  <!-- 認證對話框 -->
  <AuthDialog 
    v-model="showAuthDialog"
    @success="handleAuthSuccess"
  />
  
  <!-- 主應用 -->
  <MainLayout v-if="authStore.isAuthenticated.value && !showTestConnection" />
  
  <!-- 旅程選擇器 -->
  <TripSelector v-if="authStore.isAuthenticated.value && !showTestConnection" />
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
