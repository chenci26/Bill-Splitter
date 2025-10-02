<template>
  <el-dialog
    v-model="visible"
    :title="isLogin ? '登入' : '註冊'"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <el-form :model="formData" :rules="rules" ref="formRef" label-width="80px">
      <el-form-item label="Email" prop="email">
        <el-input
          v-model="formData.email"
          type="email"
          placeholder="請輸入 Email"
          :disabled="loading"
        />
      </el-form-item>
      
      <el-form-item label="密碼" prop="password">
        <el-input
          v-model="formData.password"
          type="password"
          placeholder="請輸入密碼"
          :disabled="loading"
          show-password
        />
      </el-form-item>
      
      <el-form-item v-if="!isLogin" label="確認密碼" prop="confirmPassword">
        <el-input
          v-model="formData.confirmPassword"
          type="password"
          placeholder="請再次輸入密碼"
          :disabled="loading"
          show-password
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
import { ref, reactive, computed } from 'vue'
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
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      })
      
      if (error) throw error
      
      ElMessage.success('註冊成功！請檢查您的 Email 以確認帳號')
    }
    
    emit('success')
    visible.value = false
  } catch (error: any) {
    console.error('認證錯誤:', error)
    ElMessage.error(error.message || '操作失敗')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
