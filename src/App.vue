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

/* RWD 響應式設計 */
@media (max-width: 768px) {
  /* 調整 body 字體大小 */
  body {
    font-size: 14px;
  }
  
  /* 卡片內距縮小 */
  :deep(.el-card__body) {
    padding: 12px;
  }
  
  /* 按鈕組調整 */
  :deep(.el-button) {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  :deep(.el-button--small) {
    padding: 6px 10px;
    font-size: 12px;
  }
  
  /* 表單項目調整 */
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 13px;
  }
  
  /* 輸入框調整 */
  :deep(.el-input__inner),
  :deep(.el-select__wrapper),
  :deep(.el-textarea__inner) {
    font-size: 14px;
  }
  
  /* 表格調整 */
  :deep(.el-table) {
    font-size: 12px;
  }
  
  :deep(.el-table th),
  :deep(.el-table td) {
    padding: 8px 4px;
  }
  
  /* Dialog 調整 */
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 20px auto !important;
  }
  
  :deep(.el-dialog__body) {
    padding: 15px;
  }
  
  /* Tag 標籤調整 */
  :deep(.el-tag) {
    font-size: 12px;
    padding: 0 6px;
    height: 24px;
    line-height: 24px;
  }
  
  /* 統計卡片調整 */
  :deep(.el-statistic) {
    font-size: 13px;
  }
  
  :deep(.el-statistic__content) {
    font-size: 18px;
  }
}

/* 極小螢幕（手機橫屏或小型手機） */
@media (max-width: 480px) {
  body {
    font-size: 13px;
  }
  
  :deep(.el-card__body) {
    padding: 10px;
  }
  
  :deep(.el-button) {
    padding: 6px 10px;
    font-size: 12px;
  }
  
  :deep(.el-dialog) {
    width: 98% !important;
    margin: 10px auto !important;
  }
  
  :deep(.el-table) {
    font-size: 11px;
  }
  
  :deep(.el-table th),
  :deep(.el-table td) {
    padding: 6px 2px;
  }
}
</style>
