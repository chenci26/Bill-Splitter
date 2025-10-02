# 部署指南

## GitHub Pages 部署

### 方法一：使用 GitHub Actions（推薦）

1. **推送代碼到GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/BillSpliter.git
   git push -u origin main
   ```

2. **啟用GitHub Pages**
   - 進入GitHub倉庫的 Settings 頁面
   - 滾動到 "Pages" 部分
   - 在 "Source" 下選擇 "GitHub Actions"
   - 保存設置

3. **自動部署**
   - 每次推送到 `main` 分支時，GitHub Actions 會自動構建並部署
   - 部署完成後，網站將在 `https://yourusername.github.io/BillSpliter/` 可用

### 方法二：手動部署

1. **構建項目**
   ```bash
   npm run build
   ```

2. **安裝 gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

3. **部署到GitHub Pages**
   ```bash
   npm run deploy
   ```

4. **在GitHub設置中啟用Pages**
   - 進入倉庫 Settings > Pages
   - 選擇 "Deploy from a branch"
   - 選擇 "gh-pages" 分支
   - 保存設置

## 多人在線協作

### 數據同步機制

本應用使用瀏覽器本地存儲（localStorage）來保存數據，這意味著：

1. **同一個瀏覽器**：數據會在不同標籤頁之間同步
2. **不同瀏覽器/設備**：需要手動導入/導出數據來同步

### 數據共享方法

1. **導出數據**
   - 在統計頁面點擊"導出數據"按鈕
   - 下載 JSON 文件

2. **導入數據**
   - 將 JSON 文件發送給其他用戶
   - 其他用戶可以通過瀏覽器開發者工具導入數據

### 改進建議

為了實現真正的多人在線協作，可以考慮：

1. **後端API**：使用 Firebase、Supabase 或自建後端
2. **實時同步**：使用 WebSocket 或 Server-Sent Events
3. **用戶認證**：添加登錄系統
4. **數據庫**：使用雲數據庫存儲數據

## 環境變量

如果需要自定義配置，可以創建 `.env` 文件：

```env
# GitHub Pages 基礎路徑
VITE_BASE_PATH=/BillSpliter/

# API 端點（如果使用後端）
VITE_API_URL=https://your-api.com
```

## 故障排除

### 常見問題

1. **頁面空白**
   - 檢查控制台錯誤
   - 確認所有依賴已正確安裝
   - 檢查路由配置

2. **樣式不正確**
   - 確認 Element Plus 已正確導入
   - 檢查 CSS 文件路徑

3. **數據不保存**
   - 檢查瀏覽器是否支持 localStorage
   - 確認沒有禁用 JavaScript

4. **部署失敗**
   - 檢查 GitHub Actions 日誌
   - 確認 Node.js 版本兼容性
   - 檢查構建腳本是否正確

### 調試技巧

1. **本地測試**
   ```bash
   npm run build
   npm run preview
   ```

2. **檢查構建輸出**
   ```bash
   ls -la dist/
   ```

3. **查看網絡請求**
   - 使用瀏覽器開發者工具的 Network 標籤
   - 檢查資源加載狀態

## 性能優化

1. **代碼分割**
   - 使用動態導入減少初始包大小
   - 按路由分割代碼

2. **資源優化**
   - 壓縮圖片
   - 使用 CDN 加速

3. **緩存策略**
   - 設置適當的緩存頭
   - 使用 Service Worker

## 安全考慮

1. **數據驗證**
   - 前端和後端都要驗證輸入
   - 防止 XSS 攻擊

2. **敏感信息**
   - 不要在客戶端存儲敏感信息
   - 使用 HTTPS

3. **權限控制**
   - 實現適當的訪問控制
   - 防止未授權訪問

