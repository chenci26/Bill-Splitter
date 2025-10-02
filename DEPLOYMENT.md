# 部署到 GitHub Pages 指南

## 📋 前置準備

### 1. 確認 GitHub 倉庫設置

確保你的專案已經推送到 GitHub，倉庫名稱應該是 `Bill-Splitter`（或修改 `vite.config.ts` 中的 `base` 路徑）。

### 2. 設置 Supabase 環境變數

在 GitHub 倉庫中設置以下 Secrets：

1. 進入 GitHub 倉庫頁面
2. 點擊 **Settings** → **Secrets and variables** → **Actions**
3. 點擊 **New repository secret**
4. 添加以下兩個 secrets：

   **Secret 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: 你的 Supabase 專案 URL（例如：`https://xxxxx.supabase.co`）

   **Secret 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: 你的 Supabase Anon Key

### 3. 啟用 GitHub Pages

1. 進入 GitHub 倉庫頁面
2. 點擊 **Settings** → **Pages**
3. 在 **Source** 選擇 **GitHub Actions**
4. 點擊 **Save**

## 🚀 部署步驟

### 方法 1：自動部署（推薦）

只需將代碼推送到 `main` 分支，GitHub Actions 會自動構建和部署：

```bash
git add .
git commit -m "feat: 更新功能"
git push origin main
```

### 方法 2：手動觸發部署

1. 進入 GitHub 倉庫頁面
2. 點擊 **Actions** 標籤
3. 選擇 **Deploy to GitHub Pages** workflow
4. 點擊 **Run workflow**
5. 選擇 `main` 分支
6. 點擊 **Run workflow**

## 📊 查看部署狀態

1. 進入 **Actions** 標籤
2. 查看最新的 workflow run
3. 等待構建完成（通常需要 2-3 分鐘）
4. 部署成功後，訪問：`https://你的GitHub用戶名.github.io/Bill-Splitter/`

## ⚙️ 配置說明

### vite.config.ts

```typescript
base: process.env.NODE_ENV === 'production' ? '/Bill-Splitter/' : '/'
```

- 生產環境使用 `/Bill-Splitter/` 作為 base URL
- 開發環境使用 `/` 作為 base URL
- **重要**: 如果你的倉庫名稱不是 `Bill-Splitter`，需要修改這裡的路徑

### GitHub Actions Workflow

位置：`.github/workflows/deploy.yml`

workflow 會在以下情況觸發：
- 推送代碼到 `main` 分支
- 手動觸發

構建步驟：
1. Checkout 代碼
2. 設置 Node.js 18
3. 安裝依賴 (`npm ci`)
4. 構建專案（使用環境變數）
5. 上傳構建產物
6. 部署到 GitHub Pages

## 🔧 常見問題

### Q1: 部署後頁面顯示 404

**原因**: `base` 路徑配置錯誤

**解決方法**:
1. 確認倉庫名稱
2. 修改 `vite.config.ts` 中的 `base` 路徑
3. 重新構建部署

### Q2: 環境變數未生效

**原因**: GitHub Secrets 未正確設置

**解決方法**:
1. 檢查 Secrets 名稱是否正確（大小寫敏感）
2. 確認 Secrets 值沒有多餘的空格或引號
3. 重新運行 workflow

### Q3: Supabase 連接失敗

**原因**: 跨域問題或環境變數錯誤

**解決方法**:
1. 在 Supabase Dashboard 中添加你的 GitHub Pages 域名到允許的來源
2. 位置：Settings → API → URL Configuration → Site URL
3. 添加：`https://你的GitHub用戶名.github.io`

### Q4: 構建失敗

**原因**: 依賴問題或 TypeScript 錯誤

**解決方法**:
1. 查看 Actions 日誌找出具體錯誤
2. 本地運行 `npm run build` 檢查是否有錯誤
3. 修復錯誤後重新推送

## 📝 本地測試生產構建

在推送到 GitHub 之前，可以本地測試生產構建：

```bash
# 構建
npm run build

# 預覽
npm run preview
```

然後訪問 `http://localhost:4173/Bill-Splitter/` 測試。

## 🔄 更新部署

每次更新代碼並推送到 `main` 分支，GitHub Actions 會自動重新構建和部署。

```bash
# 開發流程
git add .
git commit -m "fix: 修復某個問題"
git push origin main

# 等待 2-3 分鐘，新版本會自動上線
```

## 🌐 自定義域名（可選）

如果你有自己的域名：

1. 在倉庫根目錄創建 `public/CNAME` 文件
2. 內容為你的域名，例如：`billsplitter.yourdomain.com`
3. 在域名 DNS 設置中添加 CNAME 記錄指向 `你的GitHub用戶名.github.io`
4. 推送代碼
5. 在 GitHub Settings → Pages 中驗證域名

## 📚 相關資源

- [GitHub Pages 文檔](https://docs.github.com/en/pages)
- [GitHub Actions 文檔](https://docs.github.com/en/actions)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [Supabase 文檔](https://supabase.com/docs)

## ✅ 部署檢查清單

在部署前確認：

- [ ] 已設置 GitHub Secrets（`VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`）
- [ ] 已啟用 GitHub Pages（Source 設為 GitHub Actions）
- [ ] `vite.config.ts` 中的 `base` 路徑正確
- [ ] Supabase 已添加 GitHub Pages 域名到允許列表
- [ ] 本地 `npm run build` 可以成功構建
- [ ] 代碼已推送到 `main` 分支

完成以上步驟後，你的應用應該可以在 `https://你的GitHub用戶名.github.io/Bill-Splitter/` 訪問了！🎉
