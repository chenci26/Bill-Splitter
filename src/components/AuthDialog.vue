<template>
  <el-dialog
    v-model="visible"
    :width="dialogWidth"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    class="auth-dialog"
  >
    <template #header>
      <div class="auth-header">
        <h2 class="auth-title">分帳神器</h2>
        <p class="auth-subtitle">{{ isLogin ? '登入您的帳號' : '註冊新帳號' }}</p>
      </div>
    </template>
    <el-form 
      :model="formData" 
      :rules="rules" 
      ref="formRef" 
      label-width="80px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="Email" prop="email">
        <el-input
          v-model="formData.email"
          type="email"
          placeholder="請輸入 Email"
          :disabled="loading"
          @keyup.enter="handleSubmit"
        />
      </el-form-item>
      
      <el-form-item label="密碼" prop="password">
        <el-input
          v-model="formData.password"
          type="password"
          placeholder="請輸入密碼"
          :disabled="loading"
          show-password
          @keyup.enter="handleSubmit"
        />
      </el-form-item>
      
      <el-form-item v-if="!isLogin" label="確認密碼" prop="confirmPassword">
        <el-input
          v-model="formData.confirmPassword"
          type="password"
          placeholder="請再次輸入密碼"
          :disabled="loading"
          show-password
          @keyup.enter="handleSubmit"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="toggleMode" :disabled="loading">
          {{ isLogin ? '還沒有帳號？註冊' : '已有帳號？登入' }}
        </el-button>
        <el-button 
          type="primary" 
          @click="handleSubmit" 
          :loading="loading"
        >
          {{ isLogin ? '登入' : '註冊' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 響應式 Dialog 寬度
const dialogWidth = computed(() => {
  if (typeof window === 'undefined') return '360px'
  const width = window.innerWidth
  if (width <= 375) return '92%'
  if (width <= 480) return '90%'
  if (width <= 768) return '85%'
  return '360px'  // 電腦版縮小為 360px
})

// 監聽對話框顯示狀態，重置為登入模式
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // 對話框打開時，重置為登入模式並清空表單
    isLogin.value = true
    formData.email = ''
    formData.password = ''
    formData.confirmPassword = ''
    formRef.value?.clearValidate()
  }
})

const isLogin = ref(true)
const loading = ref(false)
const formRef = ref()

const formData = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

const rules = {
  email: [
    { required: true, message: '請輸入 Email', trigger: 'blur' },
    { type: 'email', message: '請輸入正確的 Email 格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '請輸入密碼', trigger: 'blur' },
    { min: 6, message: '密碼至少需要6個字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '請確認密碼', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: Function) => {
        if (value !== formData.password) {
          callback(new Error('兩次輸入的密碼不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  // 清空表單
  formData.email = ''
  formData.password = ''
  formData.confirmPassword = ''
  // 清除驗證錯誤
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    if (isLogin.value) {
      // 登入
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })
      
      if (error) throw error
      
      ElMessage.success('登入成功！')
    } else {
      // 註冊
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      })
      
      if (error) throw error
      
      // 檢查是否需要 email 確認
      if (data.user && !data.session) {
        ElMessage.success('註冊成功！請檢查您的 Email 以確認帳號')
        // 切換到登入模式
        isLogin.value = true
        return
      }
      
      // 如果不需要確認，直接登入成功
      ElMessage.success('註冊成功！')
    }
    
    emit('success')
    visible.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '操作失敗')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-header {
  text-align: center;
  padding: 10px 0;
}

.auth-title {
  margin: 0;
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-subtitle {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 電腦版表單優化 */
@media (min-width: 769px) {
  :deep(.el-form-item__label) {
    width: 70px !important;
  }
  
  :deep(.el-form-item__content) {
    flex: 1;
  }
  
  :deep(.el-input) {
    width: 100%;
  }
}

/* RWD 響應式設計 */
@media (max-width: 768px) {
  .auth-header {
    padding: 8px 0;
  }
  
  .auth-title {
    font-size: 24px;
  }
  
  .auth-subtitle {
    font-size: 13px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 14px;
    min-width: 70px;
  }
  
  :deep(.el-input__inner) {
    font-size: 14px;
  }
  
  .dialog-footer {
    flex-direction: column-reverse;
    gap: 8px;
    margin-top: 15px;
  }
  
  .dialog-footer .el-button {
    width: 100%;
    margin: 0 !important;
  }
}

@media (max-width: 480px) {
  /* Dialog 本身調整 */
  .auth-dialog :deep(.el-dialog) {
    width: 90% !important;
    max-width: 340px !important;
    margin: 5vh auto !important;
  }
  
  .auth-dialog :deep(.el-dialog__header) {
    padding: 12px 15px 8px !important;
  }
  
  .auth-dialog :deep(.el-dialog__body) {
    padding: 15px !important;
    max-height: 70vh;
    overflow-y: auto;
  }
  
  .auth-dialog :deep(.el-dialog__footer) {
    padding: 10px 15px 15px !important;
  }
  
  .auth-header {
    padding: 0;
  }
  
  .auth-title {
    font-size: 20px;
    margin-bottom: 4px;
  }
  
  .auth-subtitle {
    font-size: 12px;
    margin-top: 4px;
  }
  
  :deep(.el-form) {
    margin-top: 5px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 14px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 13px;
    min-width: 55px;
    padding-right: 8px;
  }
  
  :deep(.el-input__wrapper) {
    padding: 6px 10px;
  }
  
  :deep(.el-input__inner) {
    font-size: 13px;
    height: 32px;
    line-height: 32px;
  }
  
  :deep(.el-button) {
    padding: 10px 15px;
    font-size: 14px;
    height: 38px;
  }
  
  .dialog-footer {
    gap: 8px;
    margin-top: 5px;
  }
}

/* 更小的螢幕 (iPhone SE 等) */
@media (max-width: 375px) {
  .auth-dialog :deep(.el-dialog) {
    width: 92% !important;
    max-width: 350px !important;
    margin: 3vh auto !important;
  }
  
  .auth-dialog :deep(.el-dialog__body) {
    padding: 12px !important;
    max-height: 75vh;
  }
  
  .auth-title {
    font-size: 18px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 12px;
    min-width: 50px;
  }
  
  :deep(.el-input__inner) {
    font-size: 12px;
  }
  
  :deep(.el-button) {
    padding: 8px 12px;
    font-size: 13px;
    height: 36px;
  }
}
</style>
