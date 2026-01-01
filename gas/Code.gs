/**
 * ============================================================================
 * 營業額提交系統 - Google Apps Script 後端
 * ============================================================================
 * 
 * 【架構說明】
 * 這是一個 Web App 模式的 GAS 應用，前端透過 HTTP POST 呼叫此腳本。
 * - doPost(e): 處理所有前端 API 請求的主入口
 * - doGet(e): 僅供測試用，確認 API 正常運作
 * 
 * 【部署設定】
 * 1. 在 Apps Script 編輯器選擇「部署」→「新增部署」
 * 2. 類型選擇「網頁應用程式」
 * 3. 執行身分：選擇「我」（腳本擁有者）
 * 4. 存取權限：選擇「任何人」
 * 5. 部署後會取得一個 URL，將此 URL 設定到前端的 VITE_GOOGLE_SCRIPT_URL
 * 
 * 【Google Sheet 結構】
 * 本系統使用 3 個 Sheet：
 * 
 * 1. users（使用者）
 *    | 手機 | 名稱 | 權限 | 狀態 |
 *    - 手機：登入用的唯一識別碼
 *    - 權限：'user' 或 'admin'
 *    - 狀態：'啟用' 或 '停用'
 * 
 * 2. markets（市場）
 *    | id | 名稱 | 租金規則 | 狀態 |
 *    - id：唯一識別碼，如 'm001'
 *    - 租金規則：格式 "1-4:2600,5:2800,6-7:3400"（1=週一, 7=週日）
 *    - 狀態：'啟用' 或 '停用'
 * 
 * 3. revenues（營業額紀錄）
 *    | 日期 | 市場 | 營業額 | 租金 | 停車費 | 清潔費 | 其他成本 | 利潤 | 提交者 | 備註 | 提交時間 | id | market_id | submitted_by_phone |
 *    - 利潤 = 營業額 - 租金 - 停車費 - 清潔費 - 其他成本
 *    - submitted_by_phone：存儲時會加上單引號前綴，避免 Sheets 將電話號碼當數字處理
 */

// ============================================================================
// 設定區
// ============================================================================

/**
 * Google Sheet 的 ID
 * 取得方式：開啟你的 Google Sheet，URL 中 /d/ 和 /edit 之間的那串字就是 ID
 * 範例 URL: https://docs.google.com/spreadsheets/d/ABC123XYZ/edit
 * 則 ID 為: ABC123XYZ
 */
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';

// Sheet 名稱常數（必須與實際 Sheet 標籤名稱完全相同）
const SHEET_USERS = 'users';
const SHEET_MARKETS = 'markets';
const SHEET_REVENUES = 'revenues';

// ============================================================================
// 主要進入點
// ============================================================================

/**
 * 處理 POST 請求 - 所有 API 操作的統一入口
 * 
 * 前端透過 fetch POST 呼叫此函數，request body 格式：
 * { action: '操作名稱', ...其他參數 }
 * 
 * @param {Object} e - GAS 事件物件，包含請求資料
 * @param {Object} e.postData - POST 資料
 * @param {string} e.postData.contents - JSON 格式的請求內容
 * @returns {TextOutput} JSON 格式的回應
 */
function doPost(e) {
  try {
    // 解析前端傳來的 JSON 資料
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    
    let result;
    
    // 根據 action 分派到對應的處理函數
    switch (action) {
      case 'login':
        // 單純登入驗證
        result = handleLogin(request.phone);
        break;
        
      case 'init':
        // 初始化：登入 + 取得市場列表（合併兩個請求減少網路往返）
        const loginResult = handleLogin(request.phone);
        if (!loginResult.success) {
          result = loginResult;
        } else {
          result = {
            success: true,
            data: {
              user: loginResult.data,
              markets: handleGetMarkets().data
            }
          };
        }
        break;
        
      case 'getMarkets':
        // 取得市場列表
        result = handleGetMarkets();
        break;
        
      case 'submitRevenue':
        // 提交營業額
        result = handleSubmitRevenue(request);
        break;
        
      case 'getRevenues':
        // 查詢營業額紀錄
        result = handleGetRevenues(request.phone, request.filters, request.limit, request.offset);
        break;
        
      case 'getUsers':
        // 取得使用者列表（僅管理員可用）
        result = handleGetUsers(request.phone);
        break;
        
      case 'deleteRevenue':
        // 刪除單筆營業紀錄
        result = handleDeleteRevenue(request.phone, request.id);
        break;
        
      default:
        result = { success: false, error: '未知的操作' };
    }
    
    // 回傳 JSON 格式的回應
    // ContentService 是 GAS 內建的服務，用於建立 HTTP 回應
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // 發生錯誤時回傳錯誤訊息
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 處理 GET 請求 - 僅供測試 API 是否正常運作
 * 
 * 在瀏覽器直接開啟部署 URL 時會觸發此函數
 * 
 * @param {Object} e - GAS 事件物件
 * @returns {TextOutput} JSON 格式的回應
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: '營業額系統 API 運作中' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// 工具函數
// ============================================================================

/**
 * 取得指定 Sheet 物件
 * 
 * SpreadsheetApp 是 GAS 內建的服務，用於操作 Google Sheets
 * 
 * @param {string} name - Sheet 名稱
 * @returns {Sheet} Sheet 物件
 */
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

/**
 * 讀取整個 Sheet 並轉換為物件陣列
 * 
 * 工作原理：
 * 1. 讀取 Sheet 所有資料（二維陣列）
 * 2. 第一行當作欄位名稱（headers）
 * 3. 其餘每一行轉換為物件，key 為欄位名稱
 * 
 * 範例：
 * Sheet 資料:
 * | 手機 | 名稱 | 權限 |
 * | 0912 | 小明 | user |
 * 
 * 轉換結果:
 * [{ '手機': '0912', '名稱': '小明', '權限': 'user' }]
 * 
 * @param {string} name - Sheet 名稱
 * @returns {Object[]} 物件陣列
 */
function getSheetData(name) {
  const sheet = getSheet(name);
  
  // getDataRange() 取得有資料的範圍，getValues() 取得該範圍的所有值
  const data = sheet.getDataRange().getValues();
  
  // 第一行是欄位標題
  const headers = data[0];
  
  // 其餘是資料列
  const rows = data.slice(1);
  
  // 將每一列轉換為物件
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

/**
 * 帶快取的 Sheet 讀取
 * 
 * 使用 GAS 的 CacheService 快取讀取結果，減少重複讀取 Sheet 的開銷。
 * 適合用於不常變動的資料（如使用者列表、市場列表）。
 * 
 * CacheService 說明：
 * - getScriptCache(): 取得腳本層級的快取（所有用戶共用）
 * - cache.get(key): 取得快取值，若不存在或過期則回傳 null
 * - cache.put(key, value, ttl): 設定快取值，ttl 為秒數
 * - 快取值上限為 100KB，超過會拋出錯誤
 * 
 * @param {string} name - Sheet 名稱
 * @param {number} ttlSeconds - 快取存活秒數，預設 300 秒（5 分鐘）
 * @returns {Object[]} 物件陣列
 */
function getSheetDataCached(name, ttlSeconds = 300) {
  const cache = CacheService.getScriptCache();
  const cacheKey = `sheet_${name}`;
  const cached = cache.get(cacheKey);
  
  // 若快取存在且未過期，直接回傳
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 快取不存在，從 Sheet 讀取
  const data = getSheetData(name);
  
  // 嘗試寫入快取（資料過大可能失敗，忽略錯誤）
  try {
    cache.put(cacheKey, JSON.stringify(data), ttlSeconds);
  } catch (e) {
    // 資料超過 100KB 無法快取，忽略
  }
  
  return data;
}

/**
 * 產生唯一識別碼（UUID）
 * 
 * Utilities 是 GAS 內建的工具服務
 * 
 * @returns {string} UUID 字串
 */
function generateId() {
  return Utilities.getUuid();
}

/**
 * 格式化日期為 yyyy-MM-dd 格式
 * 
 * @param {Date|string} date - 日期物件或字串
 * @returns {string} 格式化後的日期字串
 */
function formatDate(date) {
  if (date instanceof Date) {
    // Utilities.formatDate 是 GAS 的日期格式化函數
    // 第二個參數是時區，第三個是格式
    return Utilities.formatDate(date, 'Asia/Taipei', 'yyyy-MM-dd');
  }
  return date;
}

// ============================================================================
// API 處理函數
// ============================================================================

/**
 * 登入驗證
 * 
 * 根據手機號碼查詢 users Sheet，驗證使用者是否存在且啟用。
 * 
 * @param {string} phone - 手機號碼
 * @returns {Object} 回應物件
 *   - 成功: { success: true, data: { phone, name, role } }
 *   - 失敗: { success: false, error: '錯誤訊息' }
 */
function handleLogin(phone) {
  if (!phone) {
    return { success: false, error: '請輸入手機號碼' };
  }
  
  // 使用快取版本，因為 users 資料不常變動
  const users = getSheetDataCached(SHEET_USERS, 300);
  const user = users.find(u => u['手機'] === phone);
  
  if (!user) {
    return { success: false, error: '此手機號碼未註冊' };
  }
  
  if (user['狀態'] !== '啟用') {
    return { success: false, error: '此帳號已停用' };
  }
  
  return {
    success: true,
    data: {
      phone: user['手機'],
      name: user['名稱'],
      role: user['權限']
    }
  };
}

/**
 * 取得市場列表（含租金規則）
 * 
 * 只回傳狀態為「啟用」的市場。
 * 
 * @returns {Object} 回應物件
 *   - 成功: { success: true, data: [{ id, name, rent_rules }] }
 */
function handleGetMarkets() {
  // 使用快取版本
  const markets = getSheetDataCached(SHEET_MARKETS, 300);
  
  const activeMarkets = markets
    .filter(m => m['狀態'] === '啟用')
    .map(m => ({
      id: m['id'],
      name: m['名稱'],
      rent_rules: m['租金規則'] || ''
    }));
  
  return { success: true, data: activeMarkets };
}

/**
 * 提交營業額
 * 
 * 驗證使用者後，將營業額資料寫入 revenues Sheet。
 * 寫入時會自動計算利潤、產生 UUID、記錄提交時間。
 * 
 * @param {Object} request - 請求物件
 *   - phone: 提交者手機號碼
 *   - date: 營業日期
 *   - market_id: 市場 ID
 *   - amount: 營業額
 *   - rent: 租金
 *   - parking_fee: 停車費（選填）
 *   - cleaning_fee: 清潔費（選填）
 *   - other_cost: 其他成本（選填）
 *   - note: 備註（選填）
 * @returns {Object} 回應物件
 *   - 成功: { success: true, data: { id } }
 *   - 失敗: { success: false, error: '錯誤訊息' }
 */
function handleSubmitRevenue(request) {
  const { phone, date, market_id, amount, rent, parking_fee, cleaning_fee, other_cost, note } = request;
  
  // 驗證必要欄位
  if (!phone || !date || !market_id || amount === undefined || rent === undefined) {
    return { success: false, error: '缺少必要欄位' };
  }
  
  // 驗證使用者（不使用快取，確保即時性）
  const users = getSheetData(SHEET_USERS);
  const user = users.find(u => u['手機'] === phone);
  
  if (!user || user['狀態'] !== '啟用') {
    return { success: false, error: '使用者驗證失敗' };
  }
  
  // 驗證市場
  const markets = getSheetData(SHEET_MARKETS);
  const market = markets.find(m => m['id'] === market_id);
  
  if (!market) {
    return { success: false, error: '找不到市場資料' };
  }
  
  // 準備寫入資料
  const id = generateId();
  
  // 確保所有數值欄位都是數字類型（避免前端傳來字串造成計算錯誤）
  const numAmount = Number(amount) || 0;
  const numRent = Number(rent) || 0;
  const pFee = Number(parking_fee) || 0;
  const cFee = Number(cleaning_fee) || 0;
  const oCost = Number(other_cost) || 0;
  
  // 計算利潤
  const totalCost = numRent + pFee + cFee + oCost;
  const profit = numAmount - totalCost;
  
  const submittedAt = new Date();
  
  // 寫入 Sheet（欄位順序必須與 Sheet 標題一致）
  const sheet = getSheet(SHEET_REVENUES);
  sheet.appendRow([
    date,                    // 日期
    market['名稱'],          // 市場（存市場名稱，方便閱讀）
    numAmount,               // 營業額
    numRent,                 // 租金
    pFee,                    // 停車費
    cFee,                    // 清潔費
    oCost,                   // 其他成本
    profit,                  // 利潤
    user['名稱'],            // 提交者（存名稱，方便閱讀）
    note || '',              // 備註
    submittedAt,             // 提交時間
    id,                      // 唯一 ID
    market_id,               // 市場 ID
    "'" + phone              // 提交者手機（加單引號強制 Sheets 視為文字，保留開頭的 0）
  ]);
  
  return { success: true, data: { id: id } };
}

/**
 * 查詢營業額紀錄
 * 
 * 根據使用者權限回傳不同資料：
 * - 一般使用者：只能看到自己提交的紀錄
 * - 管理員：可看所有紀錄，並可套用篩選條件
 * 
 * 支援分頁機制，避免一次讀取過多資料。
 * 
 * @param {string} phone - 查詢者手機號碼
 * @param {Object} filters - 篩選條件（僅管理員有效）
 *   - date_from: 起始日期（含）
 *   - date_to: 結束日期（含）
 *   - market_id: 市場 ID
 *   - submitted_by_phone: 提交者手機
 * @param {number} limit - 每頁筆數
 * @param {number} offset - 跳過筆數
 * @returns {Object} 回應物件
 *   - 成功: { success: true, data: { records, summary } }
 *   - 失敗: { success: false, error: '錯誤訊息' }
 */
function handleGetRevenues(phone, filters, limit, offset) {
  if (!phone) {
    return { success: false, error: '缺少手機號碼' };
  }
  
  // 驗證使用者
  const users = getSheetData(SHEET_USERS);
  const user = users.find(u => u['手機'] === phone);
  
  if (!user || user['狀態'] !== '啟用') {
    return { success: false, error: '使用者驗證失敗' };
  }
  
  const isAdmin = user['權限'] === 'admin';
  
  // 取得營業額資料
  let revenues = getSheetData(SHEET_REVENUES);
  
  // 權限過濾
  if (!isAdmin) {
    // 非管理員只能看自己的紀錄
    revenues = revenues.filter(r => r['submitted_by_phone'] === phone);
  } else {
    // 管理員可套用篩選條件
    if (filters) {
      if (filters.date_from) {
        revenues = revenues.filter(r => formatDate(r['日期']) >= filters.date_from);
      }
      if (filters.date_to) {
        revenues = revenues.filter(r => formatDate(r['日期']) <= filters.date_to);
      }
      if (filters.market_id) {
        revenues = revenues.filter(r => r['market_id'] === filters.market_id);
      }
      if (filters.submitted_by_phone) {
        revenues = revenues.filter(r => r['submitted_by_phone'] === filters.submitted_by_phone);
      }
    }
  }
  
  // 排序：日期由新到舊，同日期則按提交時間由新到舊
  revenues.sort((a, b) => {
    const dateA = formatDate(a['日期']);
    const dateB = formatDate(b['日期']);
    if (dateA !== dateB) {
      return dateB > dateA ? 1 : -1;
    }
    // 同日期再比較提交時間
    const timeA = a['提交時間'] ? new Date(a['提交時間']).getTime() : 0;
    const timeB = b['提交時間'] ? new Date(b['提交時間']).getTime() : 0;
    return timeB - timeA;
  });
  
  // 計算統計（篩選後的資料）
  const summary = {
    total_amount: revenues.reduce((sum, r) => sum + (r['營業額'] || 0), 0),
    total_rent: revenues.reduce((sum, r) => sum + (r['租金'] || 0), 0),
    total_costs: revenues.reduce((sum, r) => sum + (r['停車費'] || 0) + (r['清潔費'] || 0) + (r['其他成本'] || 0), 0),
    total_profit: revenues.reduce((sum, r) => sum + (r['利潤'] || 0), 0)
  };
  
  // 格式化輸出（將中文欄位名轉換為英文 key，方便前端使用）
  const records = revenues.map(r => ({
    id: r['id'],
    date: formatDate(r['日期']),
    market: r['市場'],
    market_id: r['market_id'],
    amount: r['營業額'] || 0,
    rent: r['租金'] || 0,
    parking_fee: r['停車費'] || 0,
    cleaning_fee: r['清潔費'] || 0,
    other_cost: r['其他成本'] || 0,
    profit: r['利潤'] || 0,
    submitted_by: r['提交者'],
    submitted_by_phone: r['submitted_by_phone'],
    note: r['備註'] || '',
    submitted_at: r['提交時間'] ? Utilities.formatDate(r['提交時間'], 'Asia/Taipei', "yyyy-MM-dd'T'HH:mm:ss") : ''
  }));
  
  // 分頁處理
  const startIndex = offset || 0;
  const endIndex = limit ? startIndex + limit : records.length;
  const paginatedRecords = records.slice(startIndex, endIndex);
  
  return {
    success: true,
    data: {
      records: paginatedRecords,
      summary: summary
    }
  };
}

/**
 * 取得使用者列表
 * 
 * 僅限管理員使用，用於篩選器的「提交者」下拉選單。
 * 
 * @param {string} phone - 請求者手機號碼
 * @returns {Object} 回應物件
 *   - 成功: { success: true, data: [{ phone, name }] }
 *   - 失敗: { success: false, error: '錯誤訊息' }
 */
function handleGetUsers(phone) {
  if (!phone) {
    return { success: false, error: '缺少手機號碼' };
  }
  
  // 驗證是否為管理員
  const users = getSheetData(SHEET_USERS);
  const requestUser = users.find(u => u['手機'] === phone);
  
  if (!requestUser || requestUser['權限'] !== 'admin') {
    return { success: false, error: '權限不足' };
  }
  
  // 回傳所有啟用的使用者
  const activeUsers = users
    .filter(u => u['狀態'] === '啟用')
    .map(u => ({
      phone: u['手機'],
      name: u['名稱']
    }));
  
  return { success: true, data: activeUsers };
}

/**
 * 刪除單筆營業紀錄
 * 
 * 權限控制：
 * - 管理員可刪除任何紀錄
 * - 一般使用者只能刪除自己提交的紀錄
 * 
 * @param {string} phone - 請求者手機號碼
 * @param {string} id - 要刪除的紀錄 ID
 * @returns {Object} 回應物件
 *   - 成功: { success: true }
 *   - 失敗: { success: false, error: '錯誤訊息' }
 */
function handleDeleteRevenue(phone, id) {
  if (!phone || !id) {
    return { success: false, error: '缺少必要參數' };
  }
  
  // 驗證使用者
  const users = getSheetData(SHEET_USERS);
  const user = users.find(u => u['手機'] === phone);
  
  if (!user || user['狀態'] !== '啟用') {
    return { success: false, error: '使用者驗證失敗' };
  }
  
  const isAdmin = user['權限'] === 'admin';
  
  // 取得 Sheet 資料
  const sheet = getSheet(SHEET_REVENUES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // 找到 id 欄位的索引
  const idColIndex = headers.indexOf('id');
  const phoneColIndex = headers.indexOf('submitted_by_phone');
  
  if (idColIndex === -1) {
    return { success: false, error: '找不到 id 欄位' };
  }
  
  // 從第二列開始搜尋（第一列是標題）
  let rowToDelete = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idColIndex] === id) {
      // 找到該筆紀錄
      const recordPhone = data[i][phoneColIndex];
      
      // 權限檢查：非管理員只能刪除自己的紀錄
      if (!isAdmin && recordPhone !== phone) {
        return { success: false, error: '權限不足，只能刪除自己的紀錄' };
      }
      
      rowToDelete = i + 1; // Sheet 的列號是 1-indexed
      break;
    }
  }
  
  if (rowToDelete === -1) {
    return { success: false, error: '找不到該筆紀錄' };
  }
  
  // 刪除該列
  sheet.deleteRow(rowToDelete);
  
  return { success: true };
}
