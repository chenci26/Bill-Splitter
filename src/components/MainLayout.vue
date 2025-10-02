<template>
  <div class="main-layout">
    <el-container>
      <el-header class="header">
        <h1>旅遊分帳工具</h1>
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="分帳頁面" name="expense" />
          <el-tab-pane label="統計頁面" name="statistics" />
        </el-tabs>
      </el-header>
      <el-main class="main-content">
        <ExpensePage v-if="activeTab === 'expense'" />
        <StatisticsPage v-if="activeTab === 'statistics'" />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ExpensePage from '../views/ExpensePage.vue'
import StatisticsPage from '../views/StatisticsPage.vue'

const activeTab = ref('expense')

const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
}
</script>

<style scoped>
.main-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
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

