import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ExpenseItem {
  id: string
  date: string
  itemName: string
  category: string
  amount: number // 台幣金額
  originalAmount?: number // 原始金額
  currency: string // 幣別ID
  participants: string[]
  payer: string
  averageAmount: number
  note: string
}

export interface Person {
  id: string
  name: string
}

export interface Category {
  id: string
  name: string
  color: string
}

export interface Currency {
  id: string
  name: string
  symbol: string
  rate: number // 對台幣的匯率
  isDefault?: boolean
}

export const useExpenseStore = defineStore('expense', () => {
  // 狀態
  const expenses = ref<ExpenseItem[]>([])
  const people = ref<Person[]>([
    { id: '1', name: '小明' },
    { id: '2', name: '小華' },
    { id: '3', name: '小美' }
  ])
  const categories = ref<Category[]>([
    { id: '1', name: '旅遊', color: '#e3f2fd' },
    { id: '2', name: '交通', color: '#e8f5e8' },
    { id: '3', name: '娛樂', color: '#fff3e0' },
    { id: '4', name: '門票', color: '#ffebee' },
    { id: '5', name: '飲食', color: '#f3e5f5' },
    { id: '6', name: '住宿', color: '#e1f5fe' }
  ])

  const currencies = ref<Currency[]>([
    { id: '1', name: '台幣', symbol: 'TWD', rate: 1, isDefault: true },
    { id: '2', name: '美元', symbol: 'USD', rate: 31.5 }, // 1 USD = 31.5 TWD
    { id: '3', name: '日圓', symbol: 'JPY', rate: 0.21 }, // 1 JPY = 0.21 TWD (30000 JPY = 6300 TWD)
    { id: '4', name: '歐元', symbol: 'EUR', rate: 34.2 }, // 1 EUR = 34.2 TWD
    { id: '5', name: '韓圓', symbol: 'KRW', rate: 0.024 } // 1 KRW = 0.024 TWD
  ])

  // 計算屬性
  const statistics = computed(() => {
    const stats: Record<string, {
      totalSpent: number
      totalPaid: number
      balance: number
      items: ExpenseItem[]
    }> = {}

    // 初始化每個人的統計
    people.value.forEach(person => {
      stats[person.name] = {
        totalSpent: 0,
        totalPaid: 0,
        balance: 0,
        items: []
      }
    })

    // 計算統計數據
    expenses.value.forEach(expense => {
      const averageAmount = expense.amount / expense.participants.length
      
      // 更新參與者的花費
      expense.participants.forEach(participant => {
        if (stats[participant]) {
          stats[participant]!.totalSpent += averageAmount
          stats[participant]!.items.push(expense)
        }
      })

      // 更新付款人的支付
      if (stats[expense.payer]) {
        stats[expense.payer]!.totalPaid += expense.amount
      }
    })

    // 計算餘額
    Object.keys(stats).forEach(person => {
      stats[person]!.balance = stats[person]!.totalPaid - stats[person]!.totalSpent
    })

    return stats
  })

  // 方法
  const addExpense = (expense: Omit<ExpenseItem, 'id' | 'averageAmount'>) => {
    const newExpense: ExpenseItem = {
      ...expense,
      id: Date.now().toString(),
      averageAmount: expense.amount / expense.participants.length
    }
    expenses.value.push(newExpense)
    saveToLocalStorage()
  }

  const updateExpense = (id: string, expense: Omit<ExpenseItem, 'id' | 'averageAmount'>) => {
    const index = expenses.value.findIndex(e => e.id === id)
    if (index !== -1) {
      expenses.value[index] = {
        ...expense,
        id,
        averageAmount: expense.amount / expense.participants.length
      }
      saveToLocalStorage()
    }
  }

  const deleteExpense = (id: string) => {
    const index = expenses.value.findIndex(e => e.id === id)
    if (index !== -1) {
      expenses.value.splice(index, 1)
      saveToLocalStorage()
    }
  }

  const addPerson = (name: string) => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name
    }
    people.value.push(newPerson)
    saveToLocalStorage()
  }

  const deletePerson = (id: string) => {
    const index = people.value.findIndex(p => p.id === id)
    if (index !== -1) {
      people.value.splice(index, 1)
      saveToLocalStorage()
    }
  }

  const addCategory = (name: string, color: string) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      color
    }
    categories.value.push(newCategory)
    saveToLocalStorage()
  }

  const deleteCategory = (id: string) => {
    const index = categories.value.findIndex(c => c.id === id)
    if (index !== -1) {
      categories.value.splice(index, 1)
      saveToLocalStorage()
    }
  }

  const addCurrency = (name: string, symbol: string, rate: number) => {
    const newCurrency: Currency = {
      id: Date.now().toString(),
      name,
      symbol,
      rate
    }
    currencies.value.push(newCurrency)
    saveToLocalStorage()
  }

  const deleteCurrency = (id: string) => {
    const index = currencies.value.findIndex(c => c.id === id)
    if (index !== -1) {
      currencies.value.splice(index, 1)
      saveToLocalStorage()
    }
  }

  const updateCurrencyRate = (id: string, rate: number) => {
    const currency = currencies.value.find(c => c.id === id)
    if (currency) {
      currency.rate = rate
      saveToLocalStorage()
    }
  }

  // 本地存儲
  const saveToLocalStorage = () => {
    localStorage.setItem('expenseData', JSON.stringify({
      expenses: expenses.value,
      people: people.value,
      categories: categories.value,
      currencies: currencies.value
    }))
  }

  const loadFromLocalStorage = () => {
    const data = localStorage.getItem('expenseData')
    if (data) {
      const parsed = JSON.parse(data)
      expenses.value = parsed.expenses || []
      people.value = parsed.people || people.value
      categories.value = parsed.categories || categories.value
      currencies.value = parsed.currencies || currencies.value
    }
  }

  // 初始化時載入數據
  loadFromLocalStorage()

  return {
    expenses,
    people,
    categories,
    currencies,
    statistics,
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
    saveToLocalStorage
  }
})
