import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// 資料庫表結構定義
export interface Database {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string
          trip_id: string
          date: string
          item_name: string
          category: string
          amount: number
          original_amount: number | null
          currency: string
          participants: string[]
          payer: string
          average_amount: number
          note: string
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          trip_id: string
          date: string
          item_name: string
          category: string
          amount: number
          original_amount?: number | null
          currency: string
          participants: string[]
          payer: string
          average_amount: number
          note?: string
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          trip_id?: string
          date?: string
          item_name?: string
          category?: string
          amount?: number
          original_amount?: number | null
          currency?: string
          participants?: string[]
          payer?: string
          average_amount?: number
          note?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
          created_by: string
          members: string[]
          settings: {
            currencies: any[]
            categories: any[]
            people: any[]
          }
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
          members: string[]
          settings?: {
            currencies: any[]
            categories: any[]
            people: any[]
          }
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          updated_at?: string
          members?: string[]
          settings?: {
            currencies: any[]
            categories: any[]
            people: any[]
          }
        }
      }
    }
  }
}
