// Backend hujjatida to'liq ro'yxat berilmagan — misollardan taxmin qilindi.
// Backend'chidan aniqlashtirib, kerak bo'lsa shu yerda tuzating.
export type VacancyStatus = "draft" | "published" | "closed"
export type EmploymentType = "full_time" | "part_time" | "contract" | "temporary"
export type SalaryCurrency = "USD" | "EUR" | "UZS"

export interface Vacancy {
  id: number
  title: string
  description: string
  employment_type: EmploymentType | null
  salary_from: number
  salary_to: number
  salary_currency: SalaryCurrency
  requirements: string[] | null
  responsibilities: string[] | null
  status: VacancyStatus
  published_at: string | null
  expires_at: string | null
  created_at?: string
  updated_at?: string
}

// POST /api/carrier/vacancies va PUT /api/carrier/vacancies/:id uchun body
export interface VacancyPayload {
  title: string
  description: string
  employment_type?: EmploymentType
  salary_from: number
  salary_to: number
  salary_currency: SalaryCurrency
  requirements: string[]
  responsibilities: string[]
  status: VacancyStatus
  expires_at?: string
}


export interface VacancyListParams {
  page?: number
  search?: string
  currency?: SalaryCurrency
  status?: VacancyStatus       // 👈 qo'shing
  salary_from?: number         // 👈 qo'shing
  salary_to?: number           // 👈 qo'shing
}

// Laravel javobi: { success, message, data: [...], pagination: {...} }
export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}











export type CompanyStatus = "pending" | "approved" | "rejected"

export interface LocationContact {
  id: number
  first_name: string
  last_name: string
  title: string
  phone: string
  email: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface CompanyLocation {
  id: number
  name: string
  address_line1: string
  city: string
  region: string
  phone: string
  is_primary: boolean
  contacts: LocationContact[]
  created_at: string
  updated_at: string
}

export interface CompanyProfile {
  id: number
  company_name: string
  logo: string | null
  state_incorporated: string
  website: string
  business_started_at: string
  years_in_business: string
  tin: string | null
  email: string
  username: string
  agreed_terms: boolean
  agreed_terms_at: string
  status: CompanyStatus
  verified_at: string | null
  verified_by: number | null
  rejection_reason: string | null
  locations: CompanyLocation[]
  created_at: string
  updated_at: string
}

export interface UpdateProfileInfoPayload {
  website?: string
  email?: string
  username?: string
}

export interface UpdatePasswordPayload {
  password: string
  password_confirmation: string
}

export interface UpdateLocationPayload {
  name?: string
  address_line1?: string
  city?: string
  region?: string
  phone?: string
  email?: string
}