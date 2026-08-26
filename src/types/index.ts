// Backend hujjatida to'liq ro'yxat berilmagan — misollardan taxmin qilindi.
// Backend'chidan aniqlashtirib, kerak bo'lsa shu yerda tuzating.
export type VacancyStatus = "draft" | "published" | "closed"
export type EmploymentType = "full_time" | "part_time" | "contract" | "temporary"
export type SalaryCurrency = "USD" | "EUR" | "UZS"



interface JobLocation {
  id: number;
  name: string;
  address_line1: string;
  city: string;
  region: string;
  phone: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

interface CarrierLogo {
  id: number;
  url: string;
}

interface Carrier {
  id: number;
  company_name: string;
  years_in_business: string;
  logo: CarrierLogo;
  locations: JobLocation[];
}

export interface VacancyID extends Vacancy {
  carrier: Carrier;
}

export interface JobResponse {
  success: boolean;
  message: string;
  data: VacancyID;
}





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
  is_favorite: boolean,
  view_count: number,
  application_count: number,
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
  logo: {
    id: number,
    url: string
  },
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

// Mavjud UpdateLocationPayload bilan bir xil shaklda, lekin create uchun
// name, address_line1, city, region, phone majburiy bo'lishi kerak
export interface CreateLocationPayload {
  name: string
  address_line1: string
  city: string
  region: string
  phone: string
  email?: string
}






export type ApplicationStatus = "pending" | "invited" | "rejected" | "hired"

export interface ApplicationVacancySummary {
  id: number
  title: string
  employment_type: "full_time" | "part_time" | string
  salary_from: number
  salary_to: number
  salary_currency: SalaryCurrency
  status: VacancyStatus
  published_at: string | null
}

export interface ApplicationDriverResume {
  birth_date: string | null
  experience_years: number | null
  desired_salary_from: string | number | null
  salary_currency: SalaryCurrency | string | null
  description: string | null
  address: string | null
}

export interface ApplicationDriverSummary {
  id: number
  phone_number: string
  fio: string | null
  number: string | null
  is_online: number
  last_login_at: string | null
  created_at: string
  resume?: ApplicationDriverResume | null
}

export interface Application {
  id: number
  vacancy_id: number
  driver_id: number
  status: ApplicationStatus
  message: string | null
  rejection_reason: string | null
  applied_at: string
  created_at: string
  updated_at: string
  vacancy: ApplicationVacancySummary
  driver: ApplicationDriver
}

export interface ApplicationListParams {
  page?: number
  status?: ApplicationStatus
  search?: string
}

export interface ChangeApplicationStatusPayload {
  status: Extract<ApplicationStatus, "invited" | "rejected">
  rejection_reason?: string
}


export type ApplicationDriver = {
  id: number
  phone_number: string
  fio: string
  number: string
  is_online: number | boolean
  last_login_at: string | null
  created_at: string
  avatar?: {
    url: string
    mime_type?: string
    size?: number
  } | null
  resume?: {
    birth_date: string | null
    experience_years: number | null
    desired_salary_from: string | null
    salary_currency: string | null
    description: string | null
    address: string | null
    transport_types: { id: number; name: string; slug: string }[]
    work_formats: { id: number; name_key: string }[]
  } | null
}





export type EmployeeStatus = "active" | "paused" | "ended"
export type EmployeeSource = "manual" | "vacancy"
export type PayPeriod = "monthly" | "weekly" | "daily" | "hourly"

export interface EmployeeDriver {
  id: number
  phone_number: string
  fio: string
  number: string
  avatar?: { url: string; mime_type?: string; size?: number } | null
  is_online: number | boolean
  last_login_at: string | null
  created_at: string
  resume?: unknown | null
}

export interface Employee {
  id: number
  carrier_id: number
  driver_id: number
  vacancy_id: number | null
  vacancy_application_id: number | null
  employee_number: string
  status: EmployeeStatus
  status_label: string | null
  source: EmployeeSource
  position: string
  employment_type: EmploymentType
  salary: string
  salary_currency: SalaryCurrency
  pay_period: PayPeriod
  started_at: string
  ended_at: string | null
  termination_type: string | null
  termination_reason: string | null
  notes: string | null
  meta: Record<string, unknown> | null
  driver?: EmployeeDriver
  created_at: string
  updated_at: string
}

export interface EmployeeListParams {
  search?: string
  driver_id?: number
  vacancy_id?: number
  source?: EmployeeSource
  status?: EmployeeStatus
  created_from?: string
  created_to?: string
  sort_by?: "created_at" | "started_at" | "salary"
  sort_direction?: "asc" | "desc"
  per_page?: number
  page?: number
}

export interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
  links: { first: string; last: string; prev: string | null; next: string | null }
}

export interface EmployeeListResponse {
  success: boolean
  message: string
  data: Employee[]
  pagination: Pagination
}

export interface EmployeePayload {
  employee_number: string
  position: string
  employment_type: EmploymentType
  salary: number
  salary_currency: SalaryCurrency
  pay_period: PayPeriod
  started_at: string
  ended_at?: string | null
  termination_type?: string | null
  termination_reason?: string | null
  notes?: string | null
  meta?: Record<string, unknown> | null
  vacancy_application_id?: number
  source?: EmployeeSource
  status:EmployeeStatus
  pause_reason:string
}

export interface EmployeeWithDriverPayload extends EmployeePayload {
  phone_number: string
  number: string
  fio: string
  telegram_chat_id?: string
}






export type TerminationType =
  | "resigned"
  | "fired"
  | "contract_expired"
  | "mutual_agreement"
  | "other"

export interface EmployeeTerminatePayload {
  status: "ended"
  termination_type: TerminationType
  termination_reason: string
}

export interface EmployeePausePayload {
  status: "paused"
  pause_reason?: string
}

export interface EmployeeResumePayload {
  status: "active"
}














export type VehicleStatus = "active" | "inactive" | "repair" | "sold"

export interface TransportTypeTranslations {
  en?: string
  ru?: string
  uz?: string
  uzcyrl?: string
  kk?: string
  ky?: string
  tj?: string
  tk?: string
  tr?: string
  kr?: string
  [locale: string]: string | undefined
}

export interface TransportType {
  id: number
  name: string
  name_ru: string
  slug: string
  is_active: boolean
  sort_order: number
  tonnage: string | null
  volume: string | null
  length: string | null
  width: string | null
  height: string | null
  image_url: string | null
  translations?: TransportTypeTranslations
  photo?:string
}

export interface VehicleCarrier {
  id: number
  name: string | null
}

export interface VehicleActiveRental {
  id: number
  [key: string]: unknown
}

export interface Vehicle {
  id: number
  carrier: VehicleCarrier
  carrier_id: number
  transport_type: TransportType
  transport_type_id: number
  plate_number: string
  vin: string
  brand: string
  model: string
  year: number
  mileage: string
  status: VehicleStatus
  status_label: string
  is_available: boolean
  notes: string | null
  active_rental: VehicleActiveRental | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface VehiclePayload {
  transport_type_id: number
  plate_number: string
  vin: string
  brand: string
  model: string
  year: number
  mileage: number
  status: VehicleStatus
  is_available: boolean
  notes?: string
}

export interface VehicleListParams {
  search?: string
  status?: VehicleStatus
  transport_type_id?: number
  is_available?: boolean
  created_from?: string
  created_to?: string
  sort_by?: string
  sort_direction?: "asc" | "desc"
  per_page?: number
  page?: number
}

export interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

 

export interface SingleResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface ApiMessageResponse {
  success: boolean
  message: string
}