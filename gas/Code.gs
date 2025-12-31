/**
 * 營業額提交系統 - Google Apps Script 後端
 * 
 * 部署設定：
 * 1. 新增部署 → 選擇「網頁應用程式」
 * 2. 執行身份：我
 * 3. 存取權限：任何人
 */

// ========== 設定 ==========
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // 替換成你的 Google Sheet ID

// Sheet 名稱
const SHEET_USERS = 'users';
const SHEET_MARKETS = 'markets';
const SHEET_REVENUES = 'revenues';

// ========== 主要進入點 ==========
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    
    let result;
    
    switch (action) {
      case 'login':
        result = handleLogin(request.phone);
        break;
      case 'getMarkets':
        result = handleGetMarkets();
        break;
      case 'submitRevenue':
        result = handleSubmitRevenue(request);
        break;
      case 'getRevenues':
        result = handleGetRevenues(request.phone, request.filters);
        break;
      case 'getUsers':
        result = handleGetUsers(request.phone);
        break;
      default:
        result = { success: false, error: '未知的操作' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 測試用 GET
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: '營業額系統 API 運作中' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========== 工具函數 ==========
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

function getSheetData(name) {
  const sheet = getSheet(name);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

function generateId() {
  return Utilities.getUuid();
}

function formatDate(date) {
  if (date instanceof Date) {
    return Utilities.formatDate(date, 'Asia/Taipei', 'yyyy-MM-dd');
  }
  return date;
}

// ========== API 處理函數 ==========

/**
 * 登入驗證
 */
function handleLogin(phone) {
  if (!phone) {
    return { success: false, error: '請輸入手機號碼' };
  }
  
  const users = getSheetData(SHEET_USERS);
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
 */
function handleGetMarkets() {
  const markets = getSheetData(SHEET_MARKETS);
  
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
 */
function handleSubmitRevenue(request) {
  const { phone, date, market_id, amount, rent, parking_fee, cleaning_fee, other_cost, note } = request;
  
  if (!phone || !date || !market_id || amount === undefined || rent === undefined) {
    return { success: false, error: '缺少必要欄位' };
  }
  
  // 取得使用者和市場資料
  const users = getSheetData(SHEET_USERS);
  const user = users.find(u => u['手機'] === phone);
  
  if (!user || user['狀態'] !== '啟用') {
    return { success: false, error: '使用者驗證失敗' };
  }
  
  const markets = getSheetData(SHEET_MARKETS);
  const market = markets.find(m => m['id'] === market_id);
  
  if (!market) {
    return { success: false, error: '找不到市場資料' };
  }
  
  const id = generateId();
  const pFee = parking_fee || 0;
  const cFee = cleaning_fee || 0;
  const oCost = other_cost || 0;
  const totalCost = rent + pFee + cFee + oCost;
  const profit = amount - totalCost;
  const submittedAt = new Date();
  
  // 寫入資料
  const sheet = getSheet(SHEET_REVENUES);
  sheet.appendRow([
    date,                    // 日期
    market['名稱'],          // 市場
    amount,                  // 營業額
    rent,                    // 租金
    pFee,                    // 停車費
    cFee,                    // 清潔費
    oCost,                   // 其他成本
    profit,                  // 淨利
    user['名稱'],            // 提交者
    note || '',              // 備註
    submittedAt,             // 提交時間
    id,                      // id
    market_id,               // market_id
    "'" + phone              // submitted_by_phone（加單引號強制文字格式）
  ]);
  
  return { success: true, data: { id: id } };
}

/**
 * 查詢營業額
 */
function handleGetRevenues(phone, filters) {
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
  
  // 非管理員只能看自己的
  if (!isAdmin) {
    revenues = revenues.filter(r => r['submitted_by_phone'] === phone);
  } else {
    // 管理員套用篩選條件
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
    // 先比較日期
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
  
  // 計算統計
  const summary = {
    total_amount: revenues.reduce((sum, r) => sum + (r['營業額'] || 0), 0),
    total_rent: revenues.reduce((sum, r) => sum + (r['租金'] || 0), 0),
    total_costs: revenues.reduce((sum, r) => sum + (r['停車費'] || 0) + (r['清潔費'] || 0) + (r['其他成本'] || 0), 0),
    total_profit: revenues.reduce((sum, r) => sum + (r['淨利'] || 0), 0)
  };
  
  // 格式化輸出
  const records = revenues.map(r => ({
    id: r['id'],
    date: formatDate(r['日期']),
    market: r['市場'],
    market_id: r['market_id'],
    amount: r['營業額'],
    rent: r['租金'],
    parking_fee: r['停車費'] || 0,
    cleaning_fee: r['清潔費'] || 0,
    other_cost: r['其他成本'] || 0,
    profit: r['淨利'],
    submitted_by: r['提交者'],
    submitted_by_phone: r['submitted_by_phone'],
    note: r['備註'] || '',
    submitted_at: r['提交時間'] ? Utilities.formatDate(r['提交時間'], 'Asia/Taipei', "yyyy-MM-dd'T'HH:mm:ss") : ''
  }));
  
  return {
    success: true,
    data: {
      records: records,
      summary: summary
    }
  };
}

/**
 * 取得使用者列表（僅管理員）
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
  
  const activeUsers = users
    .filter(u => u['狀態'] === '啟用')
    .map(u => ({
      phone: u['手機'],
      name: u['名稱']
    }));
  
  return { success: true, data: activeUsers };
}
