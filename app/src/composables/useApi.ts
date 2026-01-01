import type {
  ApiResponse,
  LoginResponse,
  InitResponse,
  Market,
  RevenuesResponse,
  RevenueFilters,
  User,
  Attendance,
  AttendanceResponse,
  AttendanceFilters,
} from '../types'

const API_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL

async function request<T>(action: string, payload: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({ action, ...payload }),
    })
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: '網路連線錯誤，請稍後再試',
    }
  }
}

export function useApi() {
  // 登入驗證
  const login = async (phone: string): Promise<ApiResponse<LoginResponse>> => {
    return request<LoginResponse>('login', { phone })
  }

  // 取得市場列表（含租金資訊）
  const getMarkets = async (): Promise<ApiResponse<Market[]>> => {
    return request<Market[]>('getMarkets')
  }

  // 初始化（登入 + 市場列表），減少 round trips
  const init = async (phone: string): Promise<ApiResponse<InitResponse>> => {
    return request<InitResponse>('init', { phone })
  }

  // 提交營業額
  const submitRevenue = async (data: {
    phone: string
    date: string
    market_id: string
    amount: number
    rent: number
    parking_fee?: number
    cleaning_fee?: number
    other_cost?: number
    note?: string
  }): Promise<ApiResponse<{ id: string }>> => {
    return request<{ id: string }>('submitRevenue', data)
  }

  // 查詢營業額（支援分頁）
  const getRevenues = async (
    phone: string,
    filters?: RevenueFilters,
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<RevenuesResponse>> => {
    return request<RevenuesResponse>('getRevenues', { phone, filters, limit, offset })
  }

  // 取得使用者列表（管理員用）
  const getUsers = async (phone: string): Promise<ApiResponse<User[]>> => {
    return request<User[]>('getUsers', { phone })
  }

  // 刪除單筆營業紀錄
  const deleteRevenue = async (phone: string, id: string): Promise<ApiResponse<void>> => {
    return request<void>('deleteRevenue', { phone, id })
  }

  // ============ 打卡系統 ============

  // 上班打卡
  const clockIn = async (data: {
    phone: string
    market_id: string
    is_manual?: boolean
    manual_time?: string
    note?: string
  }): Promise<ApiResponse<{ id: string; clock_in: string }>> => {
    return request<{ id: string; clock_in: string }>('clockIn', data)
  }

  // 下班打卡
  const clockOut = async (data: {
    phone: string
    attendance_id?: string
    is_manual?: boolean
    manual_time?: string
  }): Promise<ApiResponse<{ clock_out: string; hours: number }>> => {
    return request<{ clock_out: string; hours: number }>('clockOut', data)
  }

  // 補登出勤
  const manualAttendance = async (data: {
    phone: string
    market_id: string
    date: string
    clock_in: string
    clock_out: string
    note?: string
  }): Promise<ApiResponse<{ id: string; hours: number }>> => {
    return request<{ id: string; hours: number }>('manualAttendance', data)
  }

  // 取得今日打卡狀態
  const getTodayAttendance = async (phone: string): Promise<ApiResponse<Attendance[]>> => {
    return request<Attendance[]>('getTodayAttendance', { phone })
  }

  // 查詢我的出勤紀錄
  const getMyAttendance = async (
    phone: string,
    filters?: { date_from?: string; date_to?: string },
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<AttendanceResponse>> => {
    return request<AttendanceResponse>('getMyAttendance', { phone, ...filters, limit, offset })
  }

  // 查詢所有出勤紀錄（管理員）
  const getAllAttendance = async (
    phone: string,
    filters?: AttendanceFilters,
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<AttendanceResponse>> => {
    return request<AttendanceResponse>('getAllAttendance', { phone, filters, limit, offset })
  }

  // 修改出勤紀錄（管理員）
  const updateAttendance = async (data: {
    phone: string
    attendance_id: string
    clock_in?: string
    clock_out?: string
    note?: string
  }): Promise<ApiResponse<void>> => {
    return request<void>('updateAttendance', data)
  }

  return {
    login,
    init,
    getMarkets,
    submitRevenue,
    getRevenues,
    getUsers,
    deleteRevenue,
    // 打卡系統
    clockIn,
    clockOut,
    manualAttendance,
    getTodayAttendance,
    getMyAttendance,
    getAllAttendance,
    updateAttendance,
  }
}
