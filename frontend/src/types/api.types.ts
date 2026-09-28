export interface LoginResponse {
  token: string
  role: 'admin' | 'doctor' | 'patient'
  user: {
    id: string
    name: string
    email: string
    role: 'admin' | 'doctor' | 'patient'
    phone?: string
    dob?: string
    specialization?: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
}

export interface SuccessResponse<T = null> {
  success: true
  message?: string
  data: T
}