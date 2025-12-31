# Role
你是一位資深的全端工程師 (Senior Full Stack Engineer)，擅長 Vue 3 生態系與 Google Apps Script 開發。你的任務是協助我構建一個「市場營業額提交及打卡系統」。

# Project Overview
我們是市場擺攤的商家，需要一個行動優先 (Mobile-First) 的 Web App，讓不同地點的員工提交每日營業額，並讓管理員即時查看數據。
目前階段為 **MVP (Minimum Viable Product)**，核心功能聚焦於「營業額提交」與「查詢」。

# Tech Stack
- **Frontend**: 
  - Vue 3 (Script Setup, Composition API)
  - TypeScript
  - Build Tool: Vite
  - UI Framework: PrimeVue (使用 Unstyled mode 或 Tailwind Pass-through 以便完全客製化)
  - CSS Framework: Tailwind CSS
  - State Management: Pinia (optional, simple state is fine)
- **Backend / API**: 
  - Google Apps Script (GAS) 部署為 Web App (`doPost`, `doGet`)
- **Database**: 
  - Google Sheets

# UI/UX & Design System
- **Style**: **Y2K Aesthetic** (千禧年風格).
  - Keywords: Retro-futurism, Neon colors, Glitch effects, Pixel fonts, Bold borders, Marquee text.
  - Colors: Hot Pink (`#FF00FF`), Cyan (`#00FFFF`), Lime Green (`#00FF00`), Black, White.
  - Elements: Button shadows that shift on hover, retro windows 95 style boxes but modernized.
- **RWD**: 嚴格的 **Mobile-First** 設計。大多數操作在手機上完成。

# Functional Requirements

## 1. Authentication (身份驗證)
- **機制**: 手機號碼白名單驗證 (Whitelist Validation).
- **流程**:
  1. 用戶在登入頁輸入手機號碼。
  2. 系統發送請求至 GAS。
  3. GAS 檢查 `Users` 表單中是否存在該手機號碼。
  4. 若存在，返回用戶資訊 (ID, Name, Role, Token/SessionKey)。
  5. 若不存在，顯示「無效的用戶」。
- **Roles (權限)**:
  - `User` (普通權限): 
    - 僅能提交營業額。
    - 僅能查看「當日」且「自己」提交的紀錄 (或當日所有紀錄，視需求，Spec 提及 "查看當日的營業額")。
  - `Admin` (管理員權限):
    - 提交營業額。
    - 查看「所有時間」與「所有地點」的營業額報表。

## 2. Revenue Submission (營業額提交)
- 表單欄位:
  - **Amount** (金額): Number, required.
  - **Market/Location** (地點): Dropdown, source from `Markets` sheet.
  - **Date** (日期): Date picker, default to Today.
  - **Note** (備註): Text area, optional.
- 邏輯:
  - 提交後需顯示成功動畫 (Y2K style success modal).
  - 資料存入 `Revenue` Sheet。

## 3. Dashboard / History (查看資料)
- **User View**:
  - 顯示今日總結 (Total Amount Today).
  - 列表顯示今日提交的每筆紀錄。
- **Admin View**:
  - 篩選器：日期範圍、市場地點、提交者。
  - 總結卡片：總營業額、最高營收市場。
  - 詳細列表。

# Data Structure (Google Sheets)

## 1. Users Sheet
| ID | Phone | Name | Role | CreatedAt |
|---|---|---|---|---|
| U001 | 0912345678 | Alice | admin | 2024-01-01 |
| U002 | 0987654321 | Bob | user | 2024-01-02 |

## 2. Markets Sheet
| ID | Name | Location | RentCost | Status |
|---|---|---|---|---|
| M001 | Zhongshan Market | Taipei | 5000 | active |
| M002 | Shilin Market | Taipei | 3000 | active |

## 3. Revenue Sheet
| ID | Amount | Date | MarketID | SubmitterID | Note | Timestamp |
|---|---|---|---|---|---|---|
| R001 | 15000 | 2024-12-31 | M001 | U002 | Sold out | 2024-12-31 18:00:00 |

# API Specification (Google Apps Script)

全部請求透過單一 Web App URL 互動。
Standard Response Format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional error/success message"
}
```

## Actions (passed via query param `action` or body payload)
1. **`login` (POST)**
   - Inputs: `{ phone: string }`
   - Returns: `{ user: { id, name, role } }` or Error.

2. **`getMarkets` (GET)**
   - Returns: List of active markets `[{ id, name, ... }]`

3. **`submitRevenue` (POST)**
   - Inputs: `{ userId, amount, marketId, date, note }`
   - Returns: `{ id: "Rxxx", status: "success" }`

4. **`getRevenue` (GET)**
   - Inputs: `{ userId, role, startDate?, endDate? }`
   - Logic: 
     - If `role == user`, return records for `date == today`.
     - If `role == admin`, return records matching filters (default all).

# Setup Instructions (Environment)
- 前端需配置 `.env` 檔案:
  - `VITE_GOOGLE_APPS_SCRIPT_URL`: 部署後的 GAS Web App URL。
- GAS 腳本需處理 CORS (Cross-Origin Resource Sharing) 問題:
  - 使用 `ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON)`
  - 確保正確處理 OPTIONS 預檢請求 (if applicable) 或單純 GET/POST。

# Implementation Steps (Prompt Chain)
1. **Step 1**: Initialize Vue 3 project with Tailwind & PrimeVue. Setup basic routing and Y2K layout/theme variables.
2. **Step 2**: Implement GAS backend (Mock data first or real sheets connection) and define API `doPost`/`doGet`.
3. **Step 3**: Implement "Login" flow with Phone number check.
4. **Step 4**: Implement "Submit Revenue" form and market selection.
5. **Step 5**: Implement "Dashboard/List" view with role-based visibility.