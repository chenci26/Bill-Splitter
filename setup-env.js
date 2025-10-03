// 設置環境變數的腳本
import fs from 'fs'

const envContent = `VITE_SUPABASE_URL=https://supabase.com
VITE_SUPABASE_ANON_KEY=e1231231231321231321231231231321321231321321231321231231231231231321131321321231323`

fs.writeFileSync('.env', envContent)
console.log('✅ 環境變數文件已創建 (.env)')
