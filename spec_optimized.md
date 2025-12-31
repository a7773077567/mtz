# 營業額提交系統 - 技術規格書

## 專案概述
市場擺攤商家的營業額提交系統。使用者透過手機號碼驗證身份，根據權限提交/查看營業額資料。管理員可查看統計報表。

---

## 技術架構

### 前端
| 項目 | 技術選型 |
|------|---------|
| 框架 | Vue 3 (Composition API) |
| 語言 | TypeScript |
| UI 框架 | PrimeVue |
| CSS 框架 | Tailwind CSS |
| 建構工具 | Vite |
| 部署 | GitHub Pages + GitHub Actions |

### 後端
| 項目 | 技術選型 |
|------|---------|
| 執行環境 | Google Apps Script |
| 資料庫 | Google Sheets |

### 環境變數 (.env)
```
VITE_GOOGLE_SCRIPT_URL=<Google Apps Script Web App URL>
```

---

## UI/UX 規範

### 設計原則
- **風格**：現代、清晰、易讀，對比度適中（避免過高對比）
- **RWD**：Mobile First，桌面版次要
- **互動體驗**：
  - API 請求時顯示簡潔 loading 動畫
  - 頁面切換使用 fade/slide 過場效果
  - 操作回饋即時（成功/失敗提示）

### 頁面結構
```
/                 → 登入頁（手機號碼輸入）
/submit           → 營業額提交頁
/history          → 營業額查看頁（含統計區塊，僅管理員）
```

---

## 功能規格

### 1. 身份驗證

#### 流程
1. 使用者輸入手機號碼
2. 前端格式驗證（台灣手機 10 碼，09 開頭）
3. 送至後端比對 Google Sheets 使用者資料
4. 驗證成功 → 回傳使用者資訊（含權限）
5. 驗證失敗 → 顯示錯誤訊息「此手機號碼未註冊」
6. 使用者已停用 → 顯示錯誤訊息「此帳號已停用」

#### Session
- **不保存登入狀態**，每次進入網頁皆需重新輸入手機號碼驗證

---

### 2. 權限系統

| 權限類型 | 提交營業額 | 查看範圍 | 統計區塊 |
|---------|-----------|---------|---------|
| 普通 (`user`) | ✓ | 當日自己提交的 | ✗ |
| 管理員 (`admin`) | ✓ | 全部（含篩選） | ✓ |

---

### 3. 營業額提交

#### 表單欄位
| 欄位 | 類型 | 說明 |
|-----|------|-----|
| 營業日期 | 日期選擇 | 預設今天，可選擇過去日期（補登） |
| 地點 | 下拉選單 | 從「市場資料」表讀取（僅啟用的） |
| 營業額 | 數字輸入 | 整數，必填 |
| 租金 | 數字輸入 | 自動帶入（根據日期+市場），可手動覆蓋 |
| 備註 | 文字輸入 | 選填 |

#### 租金自動帶入邏輯
1. 檢查 `special_dates` 是否有該日期 + 市場的特殊租金
2. 若無，判斷該日期是平日或假日，帶入對應租金

#### 自動填入
- 提交時間：自動使用當前時間
- 提交者：使用目前登入的使用者

#### 同市場同日多筆
- 允許同一天同一市場提交多筆營業額（如早場、晚場）

#### 成功後
- 顯示成功提示
- 清空表單供下一筆輸入

---

### 4. 營業額查看

#### 普通權限
- 顯示當日自己提交的營業額清單
- 無篩選功能

#### 管理員權限
- 顯示所有營業額清單（最新在前）
- 篩選功能：
  - 日期區間（起始日、結束日）
  - 地點（下拉選單）
  - 提交者（下拉選單，顯示名稱）

#### 列表欄位（顯示順序）
1. 日期
2. 市場
3. 營業額
4. 租金
5. 淨利（營業額 - 租金）
6. 提交者
7. 備註

---

### 5. 統計區塊（僅管理員）

顯示在查看頁面上方，根據篩選條件計算：

| 項目 | 計算方式 |
|-----|---------|
| 總營業額 | 篩選結果的 `amount` 加總 |
| 總租金 | 篩選結果的 `rent` 加總 |
| 總淨利 | 總營業額 - 總租金 |

---

## Google Sheets 資料結構

> **欄位順序原則**：易讀欄位（給人看）在左，工程欄位（給程式用）在右

### Sheet 1: `users` (使用者)

| 欄位 | 類型 | 必填 | 說明 |
|-----|------|-----|------|
| 名稱 | string | ✓ | 使用者姓名（顯示用） |
| 手機 | string | ✓ | 手機號碼（唯一，登入用） |
| 權限 | string | ✓ | `user` / `admin` |
| 狀態 | string | ✓ | `啟用` / `停用` |
| 建立時間 | datetime | ✓ | 建立時間 |
| id | string | ✓ | UUID（程式用） |

---

### Sheet 2: `markets` (市場)

| 欄位 | 類型 | 必填 | 說明 |
|-----|------|-----|------|
| 名稱 | string | ✓ | 市場名稱（顯示用） |
| 地址 | string | | 市場地址 |
| 平日租金 | number | ✓ | 週一～五租金 |
| 假日租金 | number | ✓ | 週六日租金 |
| 狀態 | string | ✓ | `啟用` / `停用` |
| id | string | ✓ | UUID（程式用） |

---

### Sheet 3: `special_dates` (特殊日期租金)

| 欄位 | 類型 | 必填 | 說明 |
|-----|------|-----|------|
| 日期 | date | ✓ | 特殊日期（如 2025-01-01） |
| 市場 | string | ✓ | 市場名稱 |
| 租金 | number | ✓ | 該日租金 |
| 備註 | string | | 說明（如「跨年加價」） |
| market_id | string | ✓ | 關聯市場 ID（程式用） |

---

### Sheet 4: `revenues` (營業額)

| 欄位 | 類型 | 必填 | 說明 |
|-----|------|-----|------|
| 日期 | date | ✓ | 營業日期 |
| 市場 | string | ✓ | 市場名稱 |
| 營業額 | number | ✓ | 當筆營業額（整數） |
| 租金 | number | ✓ | 當筆租金 |
| 淨利 | number | ✓ | = 營業額 - 租金（公式或提交時計算） |
| 提交者 | string | ✓ | 使用者姓名 |
| 備註 | string | | 備註 |
| 提交時間 | datetime | ✓ | 實際提交時間 |
| id | string | ✓ | UUID（程式用） |
| market_id | string | ✓ | 關聯市場 ID（程式用） |
| submitted_by_phone | string | ✓ | 提交者手機（程式用） |

---

## API 規格 (Google Apps Script)

### 請求格式
所有請求使用 `POST` + JSON body，`Content-Type: text/plain`（避免 preflight）

### 端點設計

#### 1. 驗證手機號碼
```json
POST /exec
{
  "action": "login",
  "phone": "0912345678"
}

// Success
{
  "success": true,
  "data": {
    "phone": "0912345678",
    "name": "王小明",
    "role": "admin"
  }
}

// Error
{ "success": false, "error": "此手機號碼未註冊" }
{ "success": false, "error": "此帳號已停用" }
```

#### 2. 取得市場列表
```json
POST /exec
{
  "action": "getMarkets"
}

// Response
{
  "success": true,
  "data": [
    { "id": "m1", "name": "台北花博市集" },
    { "id": "m2", "name": "新竹假日市集" }
  ]
}
```

#### 3. 取得租金
```json
POST /exec
{
  "action": "getRent",
  "market_id": "m1",
  "date": "2025-01-15"
}

// Response
{
  "success": true,
  "data": {
    "rent": 500,
    "is_special": false
  }
}
```

#### 4. 提交營業額
```json
POST /exec
{
  "action": "submitRevenue",
  "phone": "0912345678",
  "date": "2025-01-15",
  "market_id": "m1",
  "amount": 15000,
  "rent": 500,
  "note": "天氣好"
}

// Response
{
  "success": true,
  "data": { "id": "r123" }
}
```

#### 5. 查詢營業額
```json
POST /exec
{
  "action": "getRevenues",
  "phone": "0912345678",
  "filters": {
    "date_from": "2025-01-01",
    "date_to": "2025-01-31",
    "market_id": "m1",
    "submitted_by_phone": "0923456789"
  }
}

// Response
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "r1",
        "date": "2025-01-15",
        "market": "台北花博市集",
        "amount": 15000,
        "rent": 500,
        "profit": 14500,
        "submitted_by": "王小明",
        "note": "天氣好",
        "submitted_at": "2025-01-15T18:30:00"
      }
    ],
    "summary": {
      "total_amount": 150000,
      "total_rent": 15000,
      "total_profit": 135000
    }
  }
}
```

#### 6. 取得使用者列表（管理員用）
```json
POST /exec
{
  "action": "getUsers",
  "phone": "0912345678"
}

// Response
{
  "success": true,
  "data": [
    { "phone": "0912345678", "name": "王小明" },
    { "phone": "0923456789", "name": "李小華" }
  ]
}
```

---

## 專案結構

```
mtz/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css
│   ├── components/
│   │   ├── LoadingSpinner.vue
│   │   ├── PhoneInput.vue
│   │   ├── RevenueForm.vue
│   │   ├── RevenueList.vue
│   │   ├── RevenueFilters.vue
│   │   └── StatsSummary.vue
│   ├── composables/
│   │   ├── useApi.ts
│   │   └── useAuth.ts
│   ├── views/
│   │   ├── LoginView.vue
│   │   ├── SubmitView.vue
│   │   └── HistoryView.vue
│   ├── router/
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.vue
│   └── main.ts
├── gas/
│   └── Code.gs
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 開發順序

1. **環境建置**：Vite + Vue3 + TypeScript + PrimeVue + Tailwind
2. **Google Sheets**：建立 4 個 Sheet + 填入 seed 資料
3. **Google Apps Script**：實作所有 API
4. **前端**：登入 → 提交 → 查看 → 統計
5. **GitHub Actions**：自動部署
6. **測試**
