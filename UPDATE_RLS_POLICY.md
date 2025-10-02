# 更新 Supabase RLS 策略

## 問題
目前只有旅程創建者可以管理標籤（人員、分類、幣別），其他成員無法新增或刪除標籤。

## 解決方案
需要更新 Supabase 中的 RLS（Row Level Security）策略，允許所有旅程成員都可以更新旅程設置。

## 操作步驟

### 1. 登入 Supabase Dashboard
前往 [https://supabase.com](https://supabase.com) 並登入你的專案

### 2. 打開 SQL Editor
在左側菜單選擇 **SQL Editor**

### 3. 刪除舊策略
執行以下 SQL 命令刪除舊的更新策略：

```sql
DROP POLICY IF EXISTS "Trip creators can update trips" ON trips;
```

### 4. 創建新策略
執行以下 SQL 命令創建新的策略，允許所有成員更新：

```sql
CREATE POLICY "Trip members can update trips" ON trips
  FOR UPDATE USING (
    created_by = auth.uid()::text OR 
    auth.email() = ANY(members)
  );
```

### 5. 添加刪除旅程策略
執行以下 SQL 命令創建刪除策略，只允許創建者刪除旅程：

```sql
CREATE POLICY "Trip creators can delete trips" ON trips
  FOR DELETE USING (created_by = auth.uid()::text);
```

### 6. 驗證策略
執行以下查詢檢查策略是否正確創建：

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'trips';
```

你應該看到兩個策略：
1. 更新策略：
   - `policyname`: `Trip members can update trips`
   - `cmd`: `UPDATE`
   - `qual`: 包含 `created_by` 和 `members` 的檢查邏輯

2. 刪除策略：
   - `policyname`: `Trip creators can delete trips`
   - `cmd`: `DELETE`
   - `qual`: 只檢查 `created_by`

## 新的權限說明

### 更新後的權限
- ✅ 旅程創建者可以更新旅程（包括標籤管理）
- ✅ 旅程創建者可以刪除旅程
- ✅ 所有旅程成員都可以更新旅程（包括標籤管理）
- ✅ 只有成員才能看到和更新旅程
- ✅ 非成員無法訪問或修改

### 具體功能

**創建者專屬：**
- 刪除整個旅程（包括所有費用記錄）
- 邀請成員
- 移除成員

**所有成員都可以：**
- 新增/刪除人員標籤
- 新增/刪除分類標籤
- 新增/刪除幣別標籤
- 修改匯率
- 查看和編輯費用記錄
- 離開旅程

### 安全性
- 所有操作都受 RLS 保護
- 只有成員可以訪問旅程數據
- 費用記錄的刪除仍然只能由創建者執行

## 測試

更新策略後，測試以下場景：

1. **創建者測試**：
   - 創建旅程
   - 邀請成員
   - 新增標籤 ✅

2. **成員測試**：
   - 接受邀請加入旅程
   - 嘗試新增人員標籤 ✅
   - 嘗試新增分類標籤 ✅
   - 嘗試新增幣別標籤 ✅

3. **非成員測試**：
   - 不應該看到該旅程 ✅
   - 無法訪問旅程數據 ✅

## 回滾（如果需要）

如果需要恢復到只允許創建者更新的策略：

```sql
DROP POLICY IF EXISTS "Trip members can update trips" ON trips;

CREATE POLICY "Trip creators can update trips" ON trips
  FOR UPDATE USING (created_by = auth.uid()::text);
```

## 注意事項

- 更新策略是即時生效的，無需重啟應用
- 已登入的用戶可能需要刷新頁面才能看到權限變化
- 確保在執行前備份重要數據

