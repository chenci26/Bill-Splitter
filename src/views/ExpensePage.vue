<template>
  <div class="expense-page">
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <span>分帳記錄</span>
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            新增記錄
          </el-button>
        </div>
      </template>

      <!-- 表格 -->
      <el-table :data="expenses" stripe style="width: 100%">
        <template #empty>
          <div class="empty-state">
            <el-empty description="還沒有任何分帳記錄">
              <el-button type="primary" @click="showAddDialog = true">
                <el-icon><Plus /></el-icon>
                新增第一筆記錄
              </el-button>
            </el-empty>
          </div>
        </template>
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="itemName" label="項目名稱" width="150" />
        <el-table-column prop="category" label="分類" width="100">
          <template #default="{ row }">
            <el-tag 
              :style="{ 
                backgroundColor: getCategoryColor(row.category), 
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
            <div class="amount-display">
              <span class="original-amount" v-if="row.originalAmount && row.currency !== getDefaultCurrencyId()">
                {{ getCurrencySymbol(row.currency) }}{{ row.originalAmount.toFixed(2) }}
              </span>
              <span class="twd-amount">NT${{ row.amount.toFixed(2) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="participants" label="參與人員" width="150">
          <template #default="{ row }">
            <el-tag
              v-for="participant in row.participants"
              :key="participant"
              size="small"
              style="margin-right: 4px; background-color: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd;"
            >
              {{ participant }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payer" label="付款人" width="100" />
        <el-table-column prop="averageAmount" label="平均金額" width="100">
          <template #default="{ row }">
            ${{ row.averageAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="note" label="備註" width="150" />
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" @click="editExpense(row)">編輯</el-button>
              <el-button size="small" type="danger" @click="deleteExpense(row.id)">刪除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/編輯對話框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingExpense ? '編輯記錄' : '新增記錄'"
      width="600px"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="日期" required>
          <el-date-picker
            v-model="formData.date"
            type="date"
            placeholder="選擇日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="項目名稱" required>
          <el-input v-model="formData.itemName" placeholder="請輸入項目名稱" />
        </el-form-item>
        <el-form-item label="分類" required>
          <el-select v-model="formData.category" placeholder="選擇分類" style="width: 100%">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="金額" required>
          <div class="amount-input-group">
            <el-input-number
              v-model="formData.originalAmount"
              :min="0"
              :precision="2"
              style="flex: 1; margin-right: 10px;"
              @input="calculateAmount"
            />
            <el-select
              v-model="formData.currency"
              style="width: 120px;"
              @change="calculateAmount"
            >
              <el-option
                v-for="currency in currencies"
                :key="currency.id"
                :label="currency.symbol"
                :value="currency.id"
              />
            </el-select>
          </div>
          <div class="twd-amount-display" v-if="formData.originalAmount && formData.currency">
            <small>台幣金額：NT${{ formData.amount.toFixed(2) }}</small>
          </div>
        </el-form-item>
        <el-form-item label="參與人員" required>
          <el-select
            v-model="formData.participants"
            multiple
            placeholder="選擇參與人員"
            style="width: 100%"
          >
            <el-option
              v-for="person in people"
              :key="person.id"
              :label="person.name"
              :value="person.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="付款人" required>
          <el-select v-model="formData.payer" placeholder="選擇付款人" style="width: 100%">
            <el-option
              v-for="person in people"
              :key="person.id"
              :label="person.name"
              :value="person.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="備註">
          <el-input
            v-model="formData.note"
            type="textarea"
            placeholder="請輸入備註"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveExpense">保存</el-button>
      </template>
    </el-dialog>

    <!-- 標籤管理對話框 -->
    <el-dialog v-model="showTagDialog" title="標籤管理" width="500px">
      <el-tabs v-model="activeTagTab">
        <el-tab-pane label="人員管理" name="people">
          <div class="tag-management">
            <div class="add-tag">
              <el-input
                v-model="newPersonName"
                placeholder="輸入人員姓名"
                style="width: 200px; margin-right: 10px;"
              />
              <el-button type="primary" @click="addPerson">新增</el-button>
            </div>
            <div class="tag-list">
              <el-tag
                v-for="person in people"
                :key="person.id"
                closable
                @close="deletePerson(person.id)"
                style="margin: 5px; background-color: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd;"
              >
                {{ person.name }}
              </el-tag>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="分類管理" name="categories">
          <div class="tag-management">
            <div class="add-tag">
              <el-input
                v-model="newCategoryName"
                placeholder="輸入分類名稱"
                style="width: 150px; margin-right: 10px;"
              />
              <el-color-picker v-model="newCategoryColor" style="margin-right: 10px;" />
              <el-button type="primary" @click="addCategory">新增</el-button>
            </div>
            <div class="tag-list">
              <el-tag
                v-for="category in categories"
                :key="category.id"
                closable
                @close="deleteCategory(category.id)"
                :style="{
                  backgroundColor: category.color,
                  color: getCategoryTextColor(category.name),
                  border: '1px solid #ddd',
                  margin: '5px'
                }"
              >
                {{ category.name }}
              </el-tag>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="幣別管理" name="currencies">
          <div class="tag-management">
            <div class="add-tag">
              <el-input
                v-model="newCurrencyName"
                placeholder="輸入幣別名稱"
                style="width: 120px; margin-right: 10px;"
              />
              <el-input
                v-model="newCurrencySymbol"
                placeholder="符號"
                style="width: 80px; margin-right: 10px;"
              />
              <el-input-number
                v-model="newCurrencyRate"
                :min="0"
                :precision="4"
                placeholder="匯率"
                style="width: 120px; margin-right: 10px;"
              />
              <el-button type="primary" @click="addCurrency">新增</el-button>
            </div>
            <div class="tag-list">
              <div
                v-for="currency in currencies"
                :key="currency.id"
                class="currency-item"
              >
                <el-tag
                  closable
                  @close="deleteCurrency(currency.id)"
                  style="margin: 5px;"
                >
                  {{ currency.name }} ({{ currency.symbol }})
                </el-tag>
                <el-input-number
                  :model-value="currency.rate"
                  :min="0"
                  :precision="4"
                  size="small"
                  style="width: 100px; margin-left: 10px;"
                  @change="(value: number) => updateCurrencyRate(currency.id, value)"
                />
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 標籤管理按鈕 -->
    <button
      class="tag-management-btn"
      @click="showTagDialog = true"
    >
      <svg class="el-icon" viewBox="0 0 1024 1024" width="16" height="16">
        <path fill="currentColor" d="M512 64a32 32 0 0 1 32 32v64h320a32 32 0 1 1 0 64H544v64a32 32 0 1 1-64 0V224H160a32 32 0 0 1 0-64h320V96a32 32 0 0 1 32-32zM128 448a32 32 0 0 1 64 0v64h320a32 32 0 1 1 0 64H192v64a32 32 0 1 1-64 0V448zm768 0a32 32 0 1 1 64 0v320a32 32 0 1 1-64 0V448zM128 768a32 32 0 1 1 64 0v64a32 32 0 1 1-64 0v-64zm640-128a32 32 0 1 1 64 0v192a32 32 0 1 1-64 0V640zM128 640a32 32 0 1 1 64 0v64a32 32 0 1 1-64 0v-64zm640-128a32 32 0 1 1 64 0v64a32 32 0 1 1-64 0V512zM128 512a32 32 0 1 1 64 0v64a32 32 0 1 1-64 0V512z"/>
      </svg>
      標籤管理
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useExpenseStore, type ExpenseItem } from '../stores/expenseStore'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const store = useExpenseStore()

// 響應式數據
const showAddDialog = ref(false)
const showTagDialog = ref(false)
const activeTagTab = ref('people')
const editingExpense = ref<ExpenseItem | null>(null)
const newPersonName = ref('')
const newCategoryName = ref('')
const newCategoryColor = ref('#e3f2fd')
const newCurrencyName = ref('')
const newCurrencySymbol = ref('')
const newCurrencyRate = ref(1)

// 表單數據
const formData = reactive({
  date: '',
  itemName: '',
  category: '',
  originalAmount: 0,
  amount: 0,
  currency: '1', // 默認台幣
  participants: [] as string[],
  payer: '',
  note: ''
})

// 初始化時計算金額
watch(() => formData.originalAmount, () => {
  calculateAmount()
})

watch(() => formData.currency, () => {
  calculateAmount()
})

// 計算屬性
const expenses = computed(() => store.expenses)
const people = computed(() => store.people)
const categories = computed(() => store.categories)
const currencies = computed(() => store.currencies)

// 方法
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

const getCurrencySymbol = (currencyId: string) => {
  const currency = currencies.value.find(c => c.id === currencyId)
  return currency?.symbol || 'TWD'
}

const getDefaultCurrencyId = () => {
  const defaultCurrency = currencies.value.find(c => c.isDefault)
  return defaultCurrency?.id || '1'
}

const calculateAmount = () => {
  const currency = currencies.value.find(c => c.id === formData.currency)
  if (currency && formData.originalAmount) {
    formData.amount = formData.originalAmount * currency.rate
  } else {
    formData.amount = formData.originalAmount || 0
  }
}

const editExpense = (expense: ExpenseItem) => {
  editingExpense.value = expense
  formData.date = expense.date
  formData.itemName = expense.itemName
  formData.category = expense.category
  formData.originalAmount = expense.originalAmount || expense.amount
  formData.amount = expense.amount
  formData.currency = expense.currency
  formData.participants = [...expense.participants]
  formData.payer = expense.payer
  formData.note = expense.note
  showAddDialog.value = true
}

const deleteExpense = (id: string) => {
  store.deleteExpense(id)
}

const saveExpense = () => {
  if (!formData.date || !formData.itemName || !formData.category || 
      !formData.originalAmount || formData.participants.length === 0 || !formData.payer) {
    ElMessage.error('請填寫所有必填欄位')
    return
  }

  const expenseData = {
    date: dayjs(formData.date).format('YYYY-MM-DD'),
    itemName: formData.itemName,
    category: formData.category,
    amount: formData.amount,
    originalAmount: formData.originalAmount,
    currency: formData.currency,
    participants: formData.participants,
    payer: formData.payer,
    note: formData.note
  }

  if (editingExpense.value) {
    store.updateExpense(editingExpense.value.id, expenseData)
    ElMessage.success('記錄更新成功')
  } else {
    store.addExpense(expenseData)
    ElMessage.success('記錄新增成功')
  }

  resetForm()
  showAddDialog.value = false
}

const resetForm = () => {
  editingExpense.value = null
  formData.date = ''
  formData.itemName = ''
  formData.category = ''
  formData.originalAmount = 0
  formData.amount = 0
  formData.currency = '1'
  formData.participants = []
  formData.payer = ''
  formData.note = ''
}

const addPerson = () => {
  if (!newPersonName.value.trim()) {
    ElMessage.error('請輸入人員姓名')
    return
  }
  store.addPerson(newPersonName.value.trim())
  newPersonName.value = ''
  ElMessage.success('人員新增成功')
}

const deletePerson = (id: string) => {
  store.deletePerson(id)
  ElMessage.success('人員刪除成功')
}

const addCategory = () => {
  if (!newCategoryName.value.trim()) {
    ElMessage.error('請輸入分類名稱')
    return
  }
  store.addCategory(newCategoryName.value.trim(), newCategoryColor.value)
  newCategoryName.value = ''
  newCategoryColor.value = '#e3f2fd'
  ElMessage.success('分類新增成功')
}

const deleteCategory = (id: string) => {
  store.deleteCategory(id)
  ElMessage.success('分類刪除成功')
}

const addCurrency = () => {
  if (!newCurrencyName.value.trim() || !newCurrencySymbol.value.trim()) {
    ElMessage.error('請輸入幣別名稱和符號')
    return
  }
  store.addCurrency(newCurrencyName.value.trim(), newCurrencySymbol.value.trim(), newCurrencyRate.value)
  newCurrencyName.value = ''
  newCurrencySymbol.value = ''
  newCurrencyRate.value = 1
  ElMessage.success('幣別新增成功')
}

const deleteCurrency = (id: string) => {
  store.deleteCurrency(id)
  ElMessage.success('幣別刪除成功')
}

const updateCurrencyRate = (id: string, rate: number) => {
  store.updateCurrencyRate(id, rate)
  ElMessage.success('匯率更新成功')
}
</script>

<style scoped>
.expense-page {
  position: relative;
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

:deep(.el-table__row) {
  height: 48px;
}

:deep(.el-table td) {
  vertical-align: middle;
  padding: 8px 0;
}

:deep(.el-table th) {
  vertical-align: middle;
  padding: 12px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag-management-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  background-color: #409EFF;
  border: none;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
  color: white;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  font-family: inherit;
}

.tag-management-btn:hover {
  background-color: #337ecc;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
  color: white;
}

.tag-management-btn:focus {
  background-color: #409EFF;
  color: white;
  outline: none;
}

.tag-management-btn:active {
  background-color: #409EFF;
  color: white;
  transform: translateY(0);
}

.tag-management-btn .el-icon {
  color: white;
  margin-right: 6px;
  width: 16px;
  height: 16px;
}

.tag-management {
  padding: 20px 0;
}

:deep(.el-tabs__item) {
  color: #606266 !important;
  background-color: transparent !important;
}

:deep(.el-tabs__item.is-active) {
  color: #409EFF !important;
  background-color: #f0f9ff !important;
  border-bottom: 2px solid #409EFF !important;
}

:deep(.el-tabs__item:hover) {
  color: #409EFF !important;
  background-color: #f0f9ff !important;
}

:deep(.el-tabs__active-bar) {
  background-color: #409EFF !important;
}

:deep(.el-tabs__nav-wrap::after) {
  background-color: #e4e7ed !important;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 32px;
}

.action-buttons .el-button {
  margin: 0;
  flex-shrink: 0;
}

.add-tag {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.currency-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.amount-input-group {
  display: flex;
  align-items: center;
}

.amount-display {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.original-amount {
  font-size: 12px;
  color: #666;
}

.twd-amount {
  font-weight: bold;
  color: #409EFF;
}

.twd-amount-display {
  margin-top: 5px;
  color: #409EFF;
  font-size: 12px;
}
</style>
