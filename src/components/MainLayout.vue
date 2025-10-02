<template>
  <div class="main-layout">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <h1>旅遊分帳工具</h1>
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="旅程管理" name="trip" />
            <el-tab-pane label="分帳頁面" name="expense" />
            <el-tab-pane label="統計頁面" name="statistics" />
          </el-tabs>
        </div>
        
        <div class="header-right">
          <!-- 認證狀態 -->
          <div class="auth-status">
            <div>{{ authStore.isAuthenticated ? '已登入' : '未登入' }}</div>
            <div v-if="authStore.userEmail">{{ authStore.userEmail }}</div>
          </div>
          
          <!-- 按鈕組 -->
          <div class="header-buttons">
            <el-button @click="toggleTestConnection" size="small">
              測試連接
            </el-button>
            <el-button v-if="authStore.isAuthenticated" @click="handleLogout" size="small" type="danger">
              登出
            </el-button>
            <el-button v-if="!authStore.isAuthenticated" @click="showLoginDialog" size="small" type="primary">
              登入
            </el-button>
          </div>
        </div>
      </el-header>
      <el-main class="main-content">
        <TripSelector v-if="activeTab === 'trip'" />
        <ExpensePage v-if="activeTab === 'expense'" />
        <StatisticsPage v-if="activeTab === 'statistics'" />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TripSelector from './TripSelector.vue'
import ExpensePage from '../views/ExpensePage.vue'
import StatisticsPage from '../views/StatisticsPage.vue'
import { useAuthStore } from '../stores/authStore'

interface Emits {
  (e: 'showLoginDialog'): void
  (e: 'toggleTestConnection'): void
}

const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const activeTab = ref('trip')

const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
}

// 切換測試連接顯示
const toggleTestConnection = () => {
  emit('toggleTestConnection')
}

// 手動登出
const handleLogout = async () => {
  try {
    console.log('App: 開始登出...')
    await authStore.signOut()
    console.log('App: Supabase 登出完成，等待認證狀態更新...')
    
    // 等待一小段時間讓認證狀態監聽器更新
    await new Promise(resolve => setTimeout(resolve, 100))
    
    console.log('App: 當前認證狀態:', authStore.isAuthenticated)
    console.log('App: 用戶已登出')
  } catch (error) {
    console.error('App: 登出失敗:', error)
  }
}

// 手動顯示登入對話框
const showLoginDialog = () => {
  emit('showLoginDialog')
}
</script>

<style scoped>
.main-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
}

.header {
  background-color: #409EFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  flex-shrink: 0;
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 30px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.auth-status {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  text-align: right;
}

.header-buttons {
  display: flex;
  gap: 5px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.main-content {
  padding: 20px;
  background-color: #f5f5f5;
  flex: 1;
  box-sizing: border-box;
  width: 100%;
  overflow-y: auto;
  height: calc(100vh - 60px);
}

:deep(.el-tabs__header) {
  margin: 0;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__item) {
  color: white;
  font-size: 16px;
  padding: 0 20px;
  height: 40px;
  line-height: 40px;
  flex: 1;
  text-align: center;
  min-width: 120px;
}

:deep(.el-tabs__item.is-active) {
  color: #409EFF;
  background-color: white;
  border-radius: 4px 4px 0 0;
}

:deep(.el-tabs__item:hover) {
  color: #409EFF;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px 4px 0 0;
}

:deep(.el-tabs__active-bar) {
  display: none;
}

:deep(.el-tabs__nav-wrap) {
  display: flex;
  align-items: center;
  height: 60px;
}

:deep(.el-tabs__nav) {
  display: flex;
  width: 100%;
}
</style>

