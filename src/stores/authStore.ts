import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  // 計算屬性
  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email || '')

  // 初始化認證狀態
  const initAuth = async () => {
    try {
      loading.value = true
      
      // 獲取當前用戶
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user || null
      
      // 監聽認證狀態變化
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        user.value = session?.user || null
        
        if (event === 'SIGNED_OUT') {
          // 清除本地數據
          localStorage.removeItem('bill-splitter-data')
        }
      })
    } catch (err) {
      console.error('初始化認證失敗:', err)
      error.value = err instanceof Error ? err.message : '認證初始化失敗'
    } finally {
      loading.value = false
    }
  }

  // 登出
  const signOut = async () => {
    try {
      loading.value = true
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      
      user.value = null
      error.value = null
    } catch (err) {
      console.error('登出失敗:', err)
      error.value = err instanceof Error ? err.message : '登出失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 發送密碼重置郵件
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
    } catch (err) {
      console.error('密碼重置失敗:', err)
      error.value = err instanceof Error ? err.message : '密碼重置失敗'
      throw err
    }
  }

  return {
    // 數據
    user,
    loading,
    error,
    
    // 計算屬性
    isAuthenticated,
    userEmail,
    
    // 方法
    initAuth,
    signOut,
    resetPassword
  }
}
