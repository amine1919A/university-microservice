export type UserRole = 'admin' | 'teacher' | 'student'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  phone: string
  is_active: boolean
  date_joined: string
}

export interface AuthResponse {
  user: User
  access: string
  refresh: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  phone: string
  password: string
  password2: string
}
