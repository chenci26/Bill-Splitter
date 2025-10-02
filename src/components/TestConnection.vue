<template>
  <el-dialog
    v-model="visible"
    title="Supabase 連接測試"
    :width="dialogWidth"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    :show-close="true"
    class="test-dialog"
  >
    <div class="test-section">
      <el-button 
        type="primary" 
        @click="testConnection"
        :loading="testing"
      >
        測試 Supabase 連接
      </el-button>
      
      <div v-if="result" class="result">
        <el-alert
          :title="result.success ? '連接成功！' : '連接失敗'"
          :type="result.success ? 'success' : 'error'"
          :description="result.message"
          show-icon
        />
      </div>
    </div>
    
    <div class="env-info">
      <h4>環境變數狀態</h4>
      <p><strong>Supabase URL:</strong> {{ supabaseUrl ? '✅ 已設置' : '❌ 未設置' }}</p>
      <p><strong>Supabase Key:</strong> {{ supabaseKey ? '✅ 已設置' : '❌ 未設置' }}</p>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 響應式 Dialog 寬度
const dialogWidth = computed(() => {
  if (typeof window === 'undefined') return '450px'
  const width = window.innerWidth
  if (width <= 375) return '92%'
  if (width <= 480) return '90%'
  if (width <= 768) return '85%'
  return '450px'  // 電腦版縮小為 450px
})

const testing = ref(false)
const result = ref<{ success: boolean; message: string } | null>(null)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const testConnection = async () => {
  testing.value = true
  result.value = null
  
  try {
    // 測試基本連接
    const { error } = await supabase
      .from('trips')
      .select('count')
      .limit(1)
    
    if (error) {
      result.value = {
        success: false,
        message: `資料庫連接失敗: ${error.message}`
      }
    } else {
      result.value = {
        success: true,
        message: 'Supabase 連接正常，可以訪問資料庫'
      }
    }
  } catch (err) {
    result.value = {
      success: false,
      message: `連接測試失敗: ${err instanceof Error ? err.message : '未知錯誤'}`
    }
  } finally {
    testing.value = false
  }
}
</script>

<style scoped>
.test-connection {
  max-width: 600px;
  margin: 80px auto 20px auto;
  padding: 20px;
}

.test-section {
  margin-bottom: 20px;
}

.result {
  margin-top: 15px;
}

.env-info {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.env-info h4 {
  margin-bottom: 10px;
  color: #606266;
}

.env-info p {
  margin: 5px 0;
  font-family: monospace;
}

/* 電腦版優化 */
@media (min-width: 769px) {
  .test-section .el-button {
    width: auto;
    min-width: 180px;
  }
}

/* RWD 響應式設計 */
@media (max-width: 768px) {
  .test-section {
    margin-bottom: 15px;
  }
  
  .test-section .el-button {
    width: 100%;
  }
  
  .env-info {
    padding: 12px;
    font-size: 14px;
  }
  
  .env-info h4 {
    font-size: 15px;
    margin-bottom: 8px;
  }
  
  .env-info p {
    font-size: 13px;
    word-break: break-all;
  }
}

@media (max-width: 480px) {
  /* Dialog 本身調整 */
  .test-dialog :deep(.el-dialog) {
    width: 90% !important;
    max-width: calc(100vw - 30px) !important;
    margin: 5vh auto !important;
  }
  
  .test-dialog :deep(.el-dialog__header) {
    padding: 12px 12px !important;
  }
  
  .test-dialog :deep(.el-dialog__body) {
    padding: 12px !important;
    max-height: 70vh;
    overflow-y: auto;
    overflow-x: hidden;
  }
  
  .test-dialog :deep(.el-dialog__title) {
    font-size: 15px;
    word-break: break-word;
  }
  
  .test-section {
    margin-bottom: 12px;
  }
  
  .test-section .el-button {
    font-size: 13px;
    padding: 8px 12px;
  }
  
  .result {
    margin-top: 10px;
  }
  
  :deep(.el-alert) {
    padding: 8px;
  }
  
  :deep(.el-alert__title) {
    font-size: 13px;
  }
  
  :deep(.el-alert__description) {
    font-size: 11px;
    line-height: 1.4;
    word-break: break-word;
  }
  
  .env-info {
    padding: 10px;
    font-size: 12px;
    overflow-x: hidden;
  }
  
  .env-info h4 {
    font-size: 13px;
    margin-bottom: 8px;
  }
  
  .env-info p {
    font-size: 11px;
    line-height: 1.4;
    word-break: break-all;
    overflow-wrap: break-word;
  }
  
  .env-info strong {
    display: inline-block;
    margin-right: 4px;
  }
}

/* 更小的螢幕 (iPhone SE 等) */
@media (max-width: 375px) {
  .test-dialog :deep(.el-dialog) {
    width: 92% !important;
    max-width: calc(100vw - 20px) !important;
    margin: 3vh auto !important;
  }
  
  .test-dialog :deep(.el-dialog__header) {
    padding: 10px 10px !important;
  }
  
  .test-dialog :deep(.el-dialog__body) {
    padding: 10px !important;
    max-height: 75vh;
    overflow-x: hidden;
  }
  
  .test-dialog :deep(.el-dialog__title) {
    font-size: 14px;
    word-break: break-word;
  }
  
  .test-section .el-button {
    font-size: 12px;
    padding: 8px 10px;
  }
  
  :deep(.el-alert) {
    padding: 6px;
  }
  
  :deep(.el-alert__title) {
    font-size: 12px;
  }
  
  :deep(.el-alert__description) {
    font-size: 10px;
  }
  
  .env-info {
    padding: 8px;
    font-size: 11px;
  }
  
  .env-info h4 {
    font-size: 12px;
    margin-bottom: 6px;
  }
  
  .env-info p {
    font-size: 10px;
    line-height: 1.3;
    word-break: break-all;
    overflow-wrap: break-word;
  }
}
</style>
