// 設置環境變數的腳本
import fs from 'fs'

const envContent = `VITE_SUPABASE_URL=https://xoaagpyyjbaijeorkwty.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvYWFncHl5amJhaWplb3Jrd3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MDE0NTgsImV4cCI6MjA3NDk3NzQ1OH0.2y99alJGrjNwutxLXOBzNR1csy0RZRU3T2vL5e49ASY`

fs.writeFileSync('.env', envContent)
console.log('✅ 環境變數文件已創建 (.env)')
