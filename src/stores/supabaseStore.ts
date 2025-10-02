import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { ExpenseItem, Person, Category, Currency } from './expenseStore'

// 重新導出類型
export type { ExpenseItem, Person, Category, Currency }

export interface Trip {
  id: string
  name: string
  description?: string
  members: string[]
  settings: {
    currencies: Currency[]
    categories: Category[]
    people: Person[]
  }
  created_at: string
  updated_at: string
  created_by: string
}

// 資料庫記錄轉換函數
const dbToExpense = (dbRecord: any): ExpenseItem => ({
  id: dbRecord.id,
  date: dbRecord.date,
  itemName: dbRecord.item_name,
  category: dbRecord.category,
  amount: dbRecord.amount,
  originalAmount: dbRecord.original_amount,
  currency: dbRecord.currency,
  participants: dbRecord.participants,
  payer: dbRecord.payer,
  averageAmount: dbRecord.average_amount,
  note: dbRecord.note
})

const expenseToDb = (expense: ExpenseItem) => ({
  id: expense.id,
  trip_id: currentTrip.value?.id || '',
  date: expense.date,
  item_name: expense.itemName,
  category: expense.category,
  amount: expense.amount,
  original_amount: expense.originalAmount,
  currency: expense.currency,
  participants: expense.participants,
  payer: expense.payer,
  average_amount: expense.averageAmount,
  note: expense.note
})

export const useSupabaseStore = defineStore('supabase', () => {
  // 響應式數據
  const currentTrip = ref<Trip | null>(null)
  const expenses = ref<ExpenseItem[]>([])
  const people = ref<Person[]>([])
  const categories = ref<Category[]>([])
  const currencies = ref<Currency[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 計算屬性
  const statistics = computed(() => {
    const stats: Record<string, {
      totalSpent: number
      totalPaid: number
      balance: number
      expenseCount: number
      paidCount: number
      items: ExpenseItem[]
    }> = {}

    expenses.value.forEach(expense => {
      // 統計花費
      expense.participants.forEach(person => {
        if (!stats[person]) {
          stats[person] = {
            totalSpent: 0,
            totalPaid: 0,
            balance: 0,
            expenseCount: 0,
            paidCount: 0,
            items: []
          }
        }
        stats[person].totalSpent += expense.averageAmount
        stats[person].expenseCount += 1
        stats[person].items.push(expense)
      })

      // 統計付款
      if (!stats[expense.payer]) {
        stats[expense.payer] = {
          totalSpent: 0,
          totalPaid: 0,
          balance: 0,
          expenseCount: 0,
          paidCount: 0,
          items: []
        }
      }
      stats[expense.payer]!.totalPaid += expense.amount
      stats[expense.payer]!.paidCount += 1
    })

    // 計算餘額
    Object.keys(stats).forEach(person => {
      stats[person]!.balance = stats[person]!.totalPaid - stats[person]!.totalSpent
    })

    return stats
  })

  const categoryStatistics = computed(() => {
    const stats: Record<string, { total: number; count: number }> = {}
    
    expenses.value.forEach(expense => {
      if (!stats[expense.category]) {
        stats[expense.category] = { total: 0, count: 0 }
      }
      stats[expense.category]!.total += expense.amount
      stats[expense.category]!.count += 1
    })

    return Object.entries(stats).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count
    }))
  })

  // 初始化預設數據
  const initializeDefaultData = () => {
    if (currencies.value.length === 0) {
      currencies.value = [
        { id: '1', name: '台幣', symbol: 'TWD', rate: 1, isDefault: true },
        { id: '2', name: '美元', symbol: 'USD', rate: 31.5 },
        { id: '3', name: '日圓', symbol: 'JPY', rate: 0.21 },
        { id: '4', name: '歐元', symbol: 'EUR', rate: 34.2 },
        { id: '5', name: '韓圓', symbol: 'KRW', rate: 0.024 }
      ]
    }

    if (categories.value.length === 0) {
      categories.value = [
        { id: '1', name: '旅遊', color: '#e3f2fd' },
        { id: '2', name: '交通', color: '#f3e5f5' },
        { id: '3', name: '娛樂', color: '#e8f5e8' },
        { id: '4', name: '門票', color: '#ffebee' },
        { id: '5', name: '飲食', color: '#f3e5f5' },
        { id: '6', name: '住宿', color: '#e1f5fe' }
      ]
    }
  }

  // 創建新旅程
  const createTrip = async (name: string, description?: string) => {
    try {
      loading.value = true
      error.value = null

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('請先登入')

      initializeDefaultData()

      const newTrip: Partial<Trip> = {
        name,
        description,
        members: [user.email || user.id],
        settings: {
          currencies: currencies.value,
          categories: categories.value,
          people: people.value
        },
        created_by: user.id
      }

      const { data, error: dbError } = await supabase
        .from('trips')
        .insert(newTrip)
        .select()
        .single()

      if (dbError) throw dbError

      currentTrip.value = data
      
      // 訂閱即時更新
      subscribeToExpenses(data.id)
      
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '創建旅程失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 載入旅程
  const loadTrip = async (tripId: string) => {
    try {
      console.log('載入旅程:', tripId)
      loading.value = true
      error.value = null

      const { data, error: dbError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single()

      if (dbError) {
        console.error('載入旅程資料庫錯誤:', dbError)
        throw dbError
      }

      console.log('載入的旅程數據:', data)
      currentTrip.value = data
      people.value = data.settings?.people || []
      categories.value = data.settings?.categories || []
      currencies.value = data.settings?.currencies || []

      console.log('設置的數據:', {
        people: people.value,
        categories: categories.value,
        currencies: currencies.value
      })

      // 載入費用記錄
      await loadExpenses(tripId)
      console.log('旅程載入成功')
    } catch (err) {
      console.error('載入旅程失敗:', err)
      error.value = err instanceof Error ? err.message : '載入旅程失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 載入費用記錄
  const loadExpenses = async (tripId: string) => {
    try {
      const { data, error: dbError } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: false })

      if (dbError) throw dbError

      expenses.value = (data || []).map(dbToExpense)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入費用記錄失敗'
      throw err
    }
  }

  // 添加費用記錄
  const addExpense = async (expense: Omit<ExpenseItem, 'id'>) => {
    try {
      if (!currentTrip.value) throw new Error('請先選擇旅程')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('請先登入')

      const { data, error: dbError } = await supabase
        .from('expenses')
        .insert({
          trip_id: currentTrip.value.id,
          date: expense.date,
          item_name: expense.itemName,
          category: expense.category,
          amount: expense.amount,
          original_amount: expense.originalAmount,
          currency: expense.currency,
          participants: expense.participants,
          payer: expense.payer,
          average_amount: expense.averageAmount,
          note: expense.note,
          created_by: user.id
        })
        .select()
        .single()

      if (dbError) throw dbError

      const newExpense = dbToExpense(data)
      expenses.value.unshift(newExpense)
      return newExpense
    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加費用記錄失敗'
      throw err
    }
  }

  // 更新費用記錄
  const updateExpense = async (id: string, expense: Partial<ExpenseItem>) => {
    try {
      const { data, error: dbError } = await supabase
        .from('expenses')
        .update({
          date: expense.date,
          item_name: expense.itemName,
          category: expense.category,
          amount: expense.amount,
          original_amount: expense.originalAmount,
          currency: expense.currency,
          participants: expense.participants,
          payer: expense.payer,
          average_amount: expense.averageAmount,
          note: expense.note
        })
        .eq('id', id)
        .select()
        .single()

      if (dbError) throw dbError

      const updatedExpense = dbToExpense(data)
      const index = expenses.value.findIndex(e => e.id === id)
      if (index !== -1) {
        expenses.value[index] = updatedExpense
      }
      return updatedExpense
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新費用記錄失敗'
      throw err
    }
  }

  // 刪除費用記錄
  const deleteExpense = async (id: string) => {
    try {
      const { error: dbError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (dbError) throw dbError

      expenses.value = expenses.value.filter(e => e.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刪除費用記錄失敗'
      throw err
    }
  }

  // 添加人員
  const addPerson = async (name: string) => {
    try {
      console.log('添加人員:', name)
      console.log('當前旅程:', currentTrip.value?.id)
      
      if (!currentTrip.value) throw new Error('請先選擇旅程')

      const newPerson = { id: Date.now().toString(), name }
      people.value.push(newPerson)
      console.log('本地人員列表:', people.value)

      // 更新旅程設置
      await updateTripSettings()
      console.log('人員添加成功')
    } catch (err) {
      console.error('添加人員失敗:', err)
      error.value = err instanceof Error ? err.message : '添加人員失敗'
      throw err
    }
  }

  // 刪除人員
  const deletePerson = async (id: string) => {
    try {
      people.value = people.value.filter(p => p.id !== id)
      await updateTripSettings()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刪除人員失敗'
      throw err
    }
  }

  // 添加分類
  const addCategory = async (name: string, color: string) => {
    try {
      if (!currentTrip.value) throw new Error('請先選擇旅程')

      const newCategory = { id: Date.now().toString(), name, color }
      categories.value.push(newCategory)

      await updateTripSettings()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加分類失敗'
      throw err
    }
  }

  // 刪除分類
  const deleteCategory = async (id: string) => {
    try {
      categories.value = categories.value.filter(c => c.id !== id)
      await updateTripSettings()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刪除分類失敗'
      throw err
    }
  }

  // 添加幣別
  const addCurrency = async (name: string, symbol: string, rate: number) => {
    try {
      if (!currentTrip.value) throw new Error('請先選擇旅程')

      const newCurrency = { id: Date.now().toString(), name, symbol, rate }
      currencies.value.push(newCurrency)

      await updateTripSettings()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加幣別失敗'
      throw err
    }
  }

  // 刪除幣別
  const deleteCurrency = async (id: string) => {
    try {
      currencies.value = currencies.value.filter(c => c.id !== id)
      await updateTripSettings()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刪除幣別失敗'
      throw err
    }
  }

  // 更新幣別匯率
  const updateCurrencyRate = async (id: string, rate: number) => {
    try {
      const currency = currencies.value.find(c => c.id === id)
      if (currency) {
        currency.rate = rate
        await updateTripSettings()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新匯率失敗'
      throw err
    }
  }

  // 更新旅程設置
  const updateTripSettings = async () => {
    if (!currentTrip.value) {
      console.log('沒有當前旅程，跳過設置更新')
      return
    }

    try {
      console.log('更新旅程設置:', currentTrip.value.id)
      console.log('設置數據:', {
        currencies: currencies.value,
        categories: categories.value,
        people: people.value
      })

      const { error: dbError } = await supabase
        .from('trips')
        .update({
          settings: {
            currencies: currencies.value,
            categories: categories.value,
            people: people.value
          }
        })
        .eq('id', currentTrip.value.id)

      if (dbError) {
        console.error('資料庫更新錯誤:', dbError)
        throw dbError
      }

      // 更新本地數據
      currentTrip.value.settings = {
        currencies: currencies.value,
        categories: categories.value,
        people: people.value
      }
      
      console.log('旅程設置更新成功')
    } catch (err) {
      console.error('更新設置失敗:', err)
      error.value = err instanceof Error ? err.message : '更新設置失敗'
      throw err
    }
  }

  // 訂閱即時更新
  const subscribeToExpenses = (tripId: string) => {
    return supabase
      .channel('expenses')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'expenses',
          filter: `trip_id=eq.${tripId}`
        }, 
        (payload) => {
          console.log('Expense changed:', payload)
          // 重新載入費用記錄
          loadExpenses(tripId)
        }
      )
      .subscribe()
  }

  return {
    // 數據
    currentTrip,
    expenses,
    people,
    categories,
    currencies,
    loading,
    error,
    supabase,
    
    // 計算屬性
    statistics,
    categoryStatistics,
    
    // 方法
    createTrip,
    loadTrip,
    loadExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    addPerson,
    deletePerson,
    addCategory,
    deleteCategory,
    addCurrency,
    deleteCurrency,
    updateCurrencyRate,
    subscribeToExpenses
  }
})
