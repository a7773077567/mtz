import type {
  ApiResponse,
  LoginResponse,
  Market,
  RevenuesResponse,
  RevenueFilters,
  User,
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

  // 查詢營業額
  const getRevenues = async (
    phone: string,
    filters?: RevenueFilters
  ): Promise<ApiResponse<RevenuesResponse>> => {
    return request<RevenuesResponse>('getRevenues', { phone, filters })
  }

  // 取得使用者列表（管理員用）
  const getUsers = async (phone: string): Promise<ApiResponse<User[]>> => {
    return request<User[]>('getUsers', { phone })
  }

  return {
    login,
    getMarkets,
    submitRevenue,
    getRevenues,
    getUsers,
  }
}

