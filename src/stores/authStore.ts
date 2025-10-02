import { ref, computed, nextTick } from 'vue'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  // 計算屬性
  const isAuthenticated = computed(() => {
    const result = !!user.value
    console.log('isAuthenticated computed:', result, 'user:', user.value?.email)
    return result
  })
  const userEmail = computed(() => {
    const result = user.value?.email || ''
    console.log('userEmail computed:', result)
    return result
  })

  // 初始化認證狀態
  const initAuth = async () => {
    try {
      loading.value = true
      
      // 獲取當前用戶
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Initial session:', session)
      user.value = session?.user || null
      console.log('Initial user:', user.value?.email)
      
      // 監聽認證狀態變化
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        console.log('Previous user:', user.value?.email)
        
        // 使用 nextTick 確保響應性更新
        nextTick(() => {
          user.value = session?.user || null
          console.log('New user:', user.value?.email)
          console.log('isAuthenticated:', !!user.value)
          
          if (event === 'SIGNED_OUT') {
            // 清除本地數據
            localStorage.removeItem('bill-splitter-data')
            console.log('Cleared local storage')
          }
        })
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
      console.log('開始登出，當前用戶:', user.value?.email)
      loading.value = true
      
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        console.error('Supabase 登出錯誤:', signOutError)
        throw signOutError
      }
      
      console.log('Supabase 登出成功')
      // 注意：不手動設置 user.value = null，讓認證狀態監聽器處理
      error.value = null
      
      console.log('登出完成，等待認證狀態更新...')
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
