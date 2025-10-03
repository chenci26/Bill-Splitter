# 更新费用记录编辑权限策略

## 问题
目前只有费用记录的创建者可以编辑该记录，其他旅程成员无法编辑。这限制了多人协作的灵活性。

## 解决方案
更新 Supabase 中的 RLS（Row Level Security）策略，允许所有旅程成员都可以编辑费用记录。

## 操作步骤

### 1. 登入 Supabase Dashboard
前往 [https://supabase.com](https://supabase.com) 并登入你的專案

### 2. 打开 SQL Editor
在左侧菜单选择 **SQL Editor**

### 3. 删除旧策略
执行以下 SQL 命令删除旧的更新策略：

```sql
DROP POLICY IF EXISTS "Expense creators can update expenses" ON expenses;
```

### 4. 创建新策略
执行以下 SQL 命令创建新的策略，允许所有旅程成员更新费用记录：

```sql
CREATE POLICY "Trip members can update expenses" ON expenses
  FOR UPDATE USING (
    trip_id IN (
      SELECT id FROM trips 
      WHERE auth.email() = ANY(members) OR created_by = auth.uid()::text
    )
  );
```

### 5. 验证策略
执行以下查询检查策略是否正确创建：

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
WHERE tablename = 'expenses' AND cmd = 'UPDATE';
```

你应该看到新的策略：
- `policyname`: `Trip members can update expenses`
- `cmd`: `UPDATE`
- `qual`: 包含旅程成员检查逻辑

## 新的权限说明

### 更新后的权限
- ✅ 旅程创建者可以编辑所有费用记录
- ✅ 所有旅程成员都可以编辑费用记录
- ✅ 只有旅程成员才能编辑费用记录
- ✅ 非成员无法编辑费用记录

### 具体功能

**所有旅程成员都可以：**
- 编辑任何费用记录（包括自己创建的和其他成员创建的）
- 修改费用记录的详细信息
- 更新参与人员、付款人等

**安全性：**
- 所有操作都受 RLS 保护
- 只有旅程成员可以编辑费用记录
- 非成员无法访问或修改

## 测试

更新策略后，测试以下场景：

1. **创建者测试**：
   - 编辑自己创建的费用记录 ✅
   - 编辑其他成员创建的费用记录 ✅

2. **成员测试**：
   - 编辑自己创建的费用记录 ✅
   - 编辑其他成员创建的费用记录 ✅

3. **非成员测试**：
   - 无法编辑任何费用记录 ✅

## 回滚（如果需要）

如果需要恢复到只允许创建者编辑的策略：

```sql
DROP POLICY IF EXISTS "Trip members can update expenses" ON expenses;

CREATE POLICY "Expense creators can update expenses" ON expenses
  FOR UPDATE USING (created_by = auth.uid()::text);
```

## 注意事项

- 更新策略是即时生效的，无需重启应用
- 已登入的用户可能需要刷新页面才能看到权限变化
- 确保在执行前备份重要数据
- 这个更改提高了协作灵活性，但降低了数据安全性（任何人都可以修改任何记录）
