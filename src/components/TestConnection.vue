<template>
  <el-dialog
    v-model="visible"
    title="Supabase 連接測試"
    width="500px"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    :show-close="true"
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
</style>
