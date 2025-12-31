// User
export interface User {
  id: string
  phone: string
  name: string
  role: 'user' | 'admin'
}

// Market
export interface Market {
  id: string
  name: string
  rent_rules: string // 格式: "1-4:2600,5:2800,6-7:3400" (1=週一, 7=週日)
}

// Revenue Record
export interface Revenue {
  id: string
  date: string
  market: string
  market_id: string
  amount: number
  rent: number
  parking_fee: number
  cleaning_fee: number
  other_cost: number
  profit: number
  submitted_by: string
  submitted_by_phone: string
  note: string
  submitted_at: string
}

// Revenue Filters
export interface RevenueFilters {
  date_from?: string
  date_to?: string
  market_id?: string
  submitted_by_phone?: string
}

// Revenue Summary
export interface RevenueSummary {
  total_amount: number
  total_rent: number
  total_costs: number
  total_profit: number
}

// API Response
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Login Response
export interface LoginResponse {
  phone: string
  name: string
  role: 'user' | 'admin'
}

// Init Response (login + markets)
export interface InitResponse {
  user: LoginResponse
  markets: Market[]
}

// Revenues Response
export interface RevenuesResponse {
  records: Revenue[]
  summary: RevenueSummary
}

