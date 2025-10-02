# Supabase 設置指南

## 1. 創建 Supabase 專案

1. 前往 [https://supabase.com](https://supabase.com)
2. 註冊帳號並創建新專案
3. 等待專案初始化完成

## 2. 設置資料庫表結構

在 Supabase SQL Editor 中執行以下 SQL：

```sql
-- 創建旅程表
CREATE TABLE trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  members TEXT[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by TEXT NOT NULL
);

-- 創建費用表
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  original_amount DECIMAL(10,2),
  currency TEXT NOT NULL,
  participants TEXT[] NOT NULL,
  payer TEXT NOT NULL,
  average_amount DECIMAL(10,2) NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by TEXT NOT NULL
);

-- 創建索引
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_trips_created_by ON trips(created_by);

-- 啟用 Row Level Security (RLS)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 設置 RLS 策略
-- 旅程表策略：只有成員可以訪問
CREATE POLICY "Users can view trips they are members of" ON trips
  FOR SELECT USING (auth.email() = ANY(members) OR created_by = auth.uid()::text);

CREATE POLICY "Users can create trips" ON trips
  FOR INSERT WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Trip creators can update trips" ON trips
  FOR UPDATE USING (created_by = auth.uid()::text);

-- 費用表策略：只有旅程成員可以訪問
CREATE POLICY "Trip members can view expenses" ON expenses
  FOR SELECT USING (
    trip_id IN (
      SELECT id FROM trips 
      WHERE auth.email() = ANY(members) OR created_by = auth.uid()::text
    )
  );

CREATE POLICY "Trip members can create expenses" ON expenses
  FOR INSERT WITH CHECK (
    trip_id IN (
      SELECT id FROM trips 
      WHERE auth.email() = ANY(members) OR created_by = auth.uid()::text
    ) AND created_by = auth.uid()::text
  );

CREATE POLICY "Expense creators can update expenses" ON expenses
  FOR UPDATE USING (created_by = auth.uid()::text);

CREATE POLICY "Expense creators can delete expenses" ON expenses
  FOR DELETE USING (created_by = auth.uid()::text);
```

## 3. 設置環境變數

1. 在 Supabase 專案設定中複製：
   - Project URL
   - Anon public key

2. 在專案根目錄創建 `.env` 文件：
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. 啟用認證功能

1. 在 Supabase Dashboard 中前往 Authentication > Settings
2. 啟用 Email 認證
3. 設置 Site URL 為你的域名

## 5. 啟用 Real-time 功能

1. 在 Supabase Dashboard 中前往 Database > Replication
2. 找到 `trips` 和 `expenses` 表
3. 啟用 Real-time 功能（點擊開關按鈕）
4. 這樣多人編輯時就能即時同步數據

**注意事項：**
- Real-time 功能會增加資料庫負載，但對小型專案影響不大
- 免費方案也支持 Real-time，但有併發連接限制
- 如果不需要即時同步，可以不啟用，仍然可以手動刷新

## 6. 功能特色

- ✅ **即時同步** - 多人同時編輯自動同步
- ✅ **用戶認證** - 安全的用戶管理
- ✅ **權限控制** - 只有旅程成員可以訪問
- ✅ **數據備份** - 自動備份到雲端
- ✅ **離線支援** - 可以離線使用，連線時自動同步

## 7. 部署注意事項

- 環境變數需要在 GitHub Pages 設置中配置
- 建議使用 Supabase 的免費方案開始，足夠小型專案使用
- 可以隨時升級到付費方案獲得更多功能

## 8. 多人共用說明

**如何邀請成員：**
1. 創建旅程後，在「旅程管理」頁面會看到當前旅程信息
2. 點擊「邀請成員」按鈕
3. 輸入成員的註冊 Email
4. 被邀請的成員登入後，在旅程列表就能看到該旅程
5. 所有成員的操作都會即時同步

**成員權限說明：**
- 旅程創建者可以邀請/移除成員
- 所有成員都可以新增/編輯/刪除費用記錄
- 費用記錄只能由創建者刪除（保護數據安全）
- 旅程設置（人員、分類、幣別）的修改會即時同步給所有成員
