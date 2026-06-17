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

export interface Complaint {
  id: number
  student_external_id: number
  student_name: string
  subject_external_id: number
  subject_name: string
  grade_type: string
  grade_value: number
  description: string
  status: string
  admin_response: string
  created_at: string
  updated_at: string
}
