<template>
  <div class="statistics-page">
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <span>統計分析</span>
          <div class="header-buttons">
            <el-button type="success" @click="importData">
              <el-icon><Upload /></el-icon>
              導入數據
            </el-button>
            <el-button type="primary" @click="exportData">
              <el-icon><Download /></el-icon>
              導出數據
            </el-button>
          </div>
        </div>
      </template>

      <!-- 統計表格 -->
      <el-table :data="statisticsData" stripe style="width: 100%">
        <template #empty>
          <div class="empty-state">
            <el-empty description="還沒有任何統計數據">
              <div class="empty-tips">
                <p>請先在分帳頁面添加一些記錄</p>
                <el-button type="primary" @click="$router.push('/expense')">
                  前往分帳頁面
                </el-button>
              </div>
            </el-empty>
          </div>
        </template>
        <el-table-column prop="person" label="人員名稱" width="120" />
        <el-table-column prop="totalSpent" label="應付金額" width="120">
          <template #default="{ row }">
            <span :class="{ 'negative-amount': row.totalSpent < 0 }">
              ${{ row.totalSpent.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="totalPaid" label="已付金額" width="120">
          <template #default="{ row }">
            <span :class="{ 'positive-amount': row.totalPaid > 0 }">
              ${{ row.totalPaid.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="餘額" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getBalanceType(row.balance)"
              size="large"
            >
              {{ row.balance >= 0 ? '+' : '' }}${{ row.balance.toFixed(2) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="itemCount" label="參與項目數" width="120" />
        <el-table-column prop="details" label="詳細項目" min-width="200">
          <template #default="{ row }">
            <el-collapse>
              <el-collapse-item :title="`查看 ${row.itemCount} 個項目`">
                <div v-for="item in row.items" :key="item.id" class="item-detail">
                  <el-tag 
                    size="small" 
                    :style="{
                      backgroundColor: getCategoryColor(item.category),
                      color: getCategoryTextColor(item.category),
                      border: '1px solid #ddd'
                    }"
                  >
                    {{ item.category }}
                  </el-tag>
                  <span class="item-name">{{ item.itemName }}</span>
                  <span class="item-amount">${{ (item.amount / item.participants.length).toFixed(2) }}</span>
                </div>
              </el-collapse-item>
            </el-collapse>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 總結卡片 -->
    <el-row :gutter="20" class="summary-cards">
      <el-col :span="8">
        <el-card class="summary-card">
          <div class="summary-content">
            <div class="summary-title">總支出</div>
            <div class="summary-value total-expense">
              ${{ totalExpense.toFixed(2) }}
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="summary-card">
          <div class="summary-content">
            <div class="summary-title">參與人數</div>
            <div class="summary-value total-people">
              {{ people.length }} 人
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="summary-card">
          <div class="summary-content">
            <div class="summary-title">項目總數</div>
            <div class="summary-value total-items">
              {{ expenses.length }} 項
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分類統計 -->
    <el-card class="page-card">
      <template #header>
        <span>分類統計</span>
      </template>
      <el-table :data="categoryStatistics" stripe style="width: 100%">
        <el-table-column prop="category" label="分類" width="120">
          <template #default="{ row }">
            <el-tag 
              :style="{
                backgroundColor: row.color,
                color: getCategoryTextColor(row.category),
                border: '1px solid #ddd'
              }" 
              size="small"
            >
              {{ row.category }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金額" width="120">
          <template #default="{ row }">
            ${{ row.amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="count" label="項目數" width="100" />
        <el-table-column prop="percentage" label="佔比" width="120">
          <template #default="{ row }">
            {{ row.percentage.toFixed(1) }}%
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSupabaseStore } from '../stores/supabaseStore'
import { Download, Upload } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useSupabaseStore()

// 計算屬性
const expenses = store.expenses
const people = store.people
const categories = store.categories
const currencies = store.currencies
const statistics = store.statistics

const statisticsData = computed(() => {
  return Object.entries(statistics.value).map(([person, data]) => ({
    person,
    totalSpent: data.totalSpent,
    totalPaid: data.totalPaid,
    balance: data.balance,
    itemCount: (data as any).items.length,
    items: (data as any).items
  }))
})

const totalExpense = computed(() => {
  return expenses.value.reduce((sum, expense) => sum + expense.amount, 0)
})

const categoryStatistics = computed(() => {
  const categoryMap: Record<string, { amount: number; count: number; color: string }> = {}
  
  // 初始化分類統計
  categories.value.forEach(category => {
    categoryMap[category.name] = {
      amount: 0,
      count: 0,
      color: category.color
    }
  })

  // 計算每個分類的統計
  expenses.value.forEach(expense => {
    if (categoryMap[expense.category]) {
      categoryMap[expense.category]!.amount += expense.amount
      categoryMap[expense.category]!.count += 1
    }
  })

  // 轉換為數組並計算百分比
  return Object.entries(categoryMap).map(([category, data]) => ({
    category,
    amount: data.amount,
    count: data.count,
    color: data.color,
    percentage: totalExpense.value > 0 ? (data.amount / totalExpense.value) * 100 : 0
  })).sort((a, b) => b.amount - a.amount)
})

// 方法
const getBalanceType = (balance: number) => {
  if (balance > 0) return 'success'
  if (balance < 0) return 'danger'
  return 'info'
}

const getCategoryColor = (categoryName: string) => {
  const category = categories.value.find(c => c.name === categoryName)
  return category?.color || '#e3f2fd'
}

const getCategoryTextColor = (categoryName: string) => {
  const category = categories.value.find(c => c.name === categoryName)
  const color = category?.color || '#e3f2fd'
  
  // 根據背景色選擇文字顏色
  if (color.includes('#e3f2fd') || color.includes('#e8f5e8') || color.includes('#fff3e0') || 
      color.includes('#ffebee') || color.includes('#f3e5f5') || color.includes('#e1f5fe')) {
    return '#1f2937' // 深灰色文字
  }
  return '#ffffff' // 白色文字
}

const importData = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        
        // 驗證數據格式
        if (!data.expenses || !Array.isArray(data.expenses)) {
          ElMessage.error('無效的數據格式：缺少expenses數組')
          return
        }
        
        if (!data.people || !Array.isArray(data.people)) {
          ElMessage.error('無效的數據格式：缺少people數組')
          return
        }
        
        if (!data.categories || !Array.isArray(data.categories)) {
          ElMessage.error('無效的數據格式：缺少categories數組')
          return
        }
        
        if (!data.currencies || !Array.isArray(data.currencies)) {
          ElMessage.error('無效的數據格式：缺少currencies數組')
          return
        }

        // 確認導入
        ElMessageBox.confirm(
          '導入數據將覆蓋當前所有數據，是否繼續？',
          '確認導入',
          {
            confirmButtonText: '確定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        ).then(() => {
          // 導入數據
          if (data.expenses) {
            store.expenses = data.expenses
          }
          if (data.people) {
            store.people = data.people
          }
          if (data.categories) {
            store.categories = data.categories
          }
          if (data.currencies) {
            store.currencies = data.currencies
          }
          
          // 數據已同步到 Supabase，無需本地存儲
          
          ElMessage.success('數據導入成功')
        }).catch(() => {
          ElMessage.info('已取消導入')
        })
      } catch (error) {
        ElMessage.error('文件解析失敗，請檢查文件格式')
        console.error('Import error:', error)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

const exportData = () => {
  const data = {
    expenses: expenses.value,
    people: people.value,
    categories: categories.value,
    currencies: currencies.value,
    statistics: statisticsData.value,
    categoryStatistics: categoryStatistics.value,
    summary: {
      totalExpense: totalExpense.value,
      peopleCount: people.value.length,
      itemCount: expenses.value.length
    },
    exportTime: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `expense-data-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  ElMessage.success('數據導出成功')
}
</script>

<style scoped>
.statistics-page {
  padding: 0;
  width: 100%;
}

.page-card {
  margin-bottom: 20px;
  width: 100%;
}

:deep(.el-table) {
  width: 100% !important;
}

:deep(.el-table__header-wrapper) {
  width: 100% !important;
}

:deep(.el-table__body-wrapper) {
  width: 100% !important;
}

:deep(.el-table__header) {
  width: 100% !important;
}

:deep(.el-table__body) {
  width: 100% !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.empty-tips {
  margin-top: 20px;
}

.empty-tips p {
  margin-bottom: 15px;
  color: #666;
  font-size: 14px;
}

.summary-cards {
  margin-bottom: 20px;
}

.summary-card {
  text-align: center;
}

.summary-content {
  padding: 20px;
}

.summary-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
}

.total-expense {
  color: #E6A23C;
}

.total-people {
  color: #409EFF;
}

.total-items {
  color: #67C23A;
}

.negative-amount {
  color: #F56C6C;
}

.positive-amount {
  color: #67C23A;
}

.item-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 4px 0;
}

.item-name {
  flex: 1;
  font-size: 14px;
}

.item-amount {
  font-weight: bold;
  color: #E6A23C;
}

:deep(.el-collapse-item__header) {
  padding: 0;
  font-size: 14px;
  color: #409EFF;
}

:deep(.el-collapse-item__content) {
  padding: 10px 0;
}
</style>
