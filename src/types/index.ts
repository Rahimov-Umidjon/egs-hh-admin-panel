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

// Tizimga kirayotgan foydalanuvchi turi — Carrier (tashuvchi kompaniya, mavjud admin
// panel) yoki Client (yuk beruvchi: cargo_owner/broker/expeditor, backend /api/client)
export type ActorType = "carrier" | "client"

export type ClientType = "cargo_owner" | "broker" | "expeditor"
export type ClientStatus = "pending" | "approved" | "rejected"

export interface ClientProfile {
  id: number
  name: string
  inn: string
  website: string | null
  contact_person_name: string | null
  contact_person_phone: string | null
  type: ClientType
  email: string
  phone_number: string | null
  address: string | null
  country_id: number | null
  state_id: number | null
  city_id: number | null
  latitude: number | null
  longitude: number | null
  status: ClientStatus
  is_active: boolean
  avatar: { id: number; url: string } | null
  created_at: string
}

export interface UpdateProfileInfoPayload {
  website?: string
  email?: string
  username?: string
}

export interface UpdateClientProfilePayload {
  name?: string
  website?: string
  contact_person_name?: string
  contact_person_phone?: string
  phone_number?: string
  address?: string
  country_id?: number
  state_id?: number
  city_id?: number
  latitude?: number
  longitude?: number
}

export interface UpdateClientPasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}

// ---- Lookup (reference data) — /lookup/* ----------------------------------
// Bu endpointlar spec (client_open_api.yaml)da yo'q, backend jamoasi alohida
// taqdim etgan: /lookup/countries, /lookup/cities, /lookup/transport-types,
// /lookup/currencies, /lookup/cargo-document-types. Javob — Envelope'siz, xom array.
export interface CountryOption {
  id: number
  name: string
  latitude: string
  longitude: string
}

export interface CityOption {
  id: number
  name: string
  state_id: number
  country_id: number
}

export interface TransportTypeOption {
  id: number
  name: string
  name_ru: string
  slug: string
  is_active: number
  sort_order: number
  image_url: string | null
  tonnage: string | null
  volume: string | null
  length: string | null
  width: string | null
  height: string | null
}

export interface CargoDocumentTypeOption {
  value: string
  label: string
}

// ---- Cargo (Client) — /cargos ----------------------------------------------
export type CargoStatus = "open" | "assigned" | "in_progress" | "delivered" | "cancelled"
export type CargoClass = "standard" | "premium"

// Backendning haqiqiy javobi spec'dagi Location schema'sidan farq qiladi: nuqta
// (lat/lng/address) `pickup_location`/`delivery_location` ichida, davlat/viloyat/shahar
// esa alohida `from`/`to` ob'ektlarida keladi.
export interface CargoPoint {
  id: number
  address: string | null
  latitude: number
  longitude: number
}

export interface CargoAdministrativeArea {
  country: { id: number; name: string } | null
  state: { id: number; name: string } | null
  city: { id: number; name: string } | null
}

export interface CargoLocationInput {
  country_id: number
  state_id?: number | null
  city_id?: number | null
  address?: string | null
  latitude: number
  longitude: number
}

export interface Cargo {
  id: number
  name: string
  status: CargoStatus
  cargo_class: CargoClass
  pickup_location: CargoPoint
  delivery_location: CargoPoint
  from: CargoAdministrativeArea
  to: CargoAdministrativeArea
  weight: number | null
  volume: number | null
  quantity: number | null
  dimensions: {
    length: number | null
    width: number | null
    height: number | null
  }
  fragile: boolean
  dangerous: boolean
  temperature_controlled: boolean
  min_temperature: number | null
  max_temperature: number | null
  transport_requirements: string | null
  transport_type: { id: number; name: string , image_url:string } | null
  additional_info: string | null
  loading_at: string
  unloading_at: string | null
  current_offer: Record<string, unknown> | null
  current_assignment: Record<string, unknown> | null
  offers_count: number
  view_count: number
  documents: CargoDocument[]
  published_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  created_at: string
  updated_at: string
}

export interface CargoDocument {
  id: number
  type: string
  label?: string
  url?: string
  created_at?: string
}

export interface CreateCargoPayload {
  name: string
  pickup: CargoLocationInput
  delivery: CargoLocationInput
  weight?: number
  volume?: number
  quantity?: number
  length?: number
  width?: number
  height?: number
  fragile?: boolean
  dangerous?: boolean
  temperature_controlled?: boolean
  min_temperature?: number
  max_temperature?: number
  transport_requirements?: string
  transport_type_id?: number
  additional_info?: string
  cargo_class?: CargoClass
  loading_at: string
  unloading_at?: string
}

export type UpdateCargoPayload = Partial<CreateCargoPayload>

export interface CargoListParams {
  status?: CargoStatus
  per_page?: number
  page?: number
}

export interface CargoStatusHistoryEntry {
  status: string
  changed_at: string
  note?: string | null
}

export interface CargoTracking {
  cargo_id: number
  cargo_status: string
  assignment: Record<string, unknown> | null
  status_history: CargoStatusHistoryEntry[]
  driver_location: { latitude: number; longitude: number; updated_at?: string } | null
}

// ---- Cargo offers (Client) — /cargos/:id/offers -------------------------------
export type CargoOfferStatus = "pending" | "accepted" | "rejected"

export interface CargoOfferProposer {
  type: string
  id: number
  name: string
  avatar?: { url: string; mime_type: string; size: number } | null
  is_online?: boolean
}

export interface CargoOfferCurrency {
  id: number
  code: string
  symbol: string
}

export interface CargoOfferCargoRequirements {
  weight: number | null
  volume: number | null
  quantity: number | null
  length: number | null
  width: number | null
  height: number | null
  fragile: boolean
  dangerous: boolean
  temperature_controlled: boolean
  min_temperature: number | null
  max_temperature: number | null
  transport_requirements: string | null
  transport_type: { id: number; name: string; image_url: string | null } | null
}

// Taklif javobidagi `cargo` ob'ekti asosiy `Cargo` tipidan farqli shaklda keladi
// (masalan `weight`/`volume` emas, `requirements` ichida; `from`/`to` emas,
// `route.from`/`route.to` ichida) — shu sababli alohida tip sifatida ajratildi.
export interface CargoOfferCargoSummary {
  id: number
  name: string
  status: CargoStatus
  cargo_class: CargoClass
  view_count: number
  pickup_location: CargoPoint
  delivery_location: CargoPoint
  route: {
    from: CargoAdministrativeArea
    to: CargoAdministrativeArea
  }
  requirements: CargoOfferCargoRequirements
  additional_info: string | null
  loading_at: string
  unloading_at: string | null
  is_negotiable: boolean
  posted_by: { id: number; type: string; name: string }
  published_at: string | null
  expires_at: string | null
  created_at: string
}

export interface CargoOffer {
  id: number
  cargo_id: number
  proposer: CargoOfferProposer
  amount: number
  currency: CargoOfferCurrency
  advance_amount: number | null
  payment_terms: string | null
  message: string | null
  status: CargoOfferStatus
  status_label: string
  rejection_reason: string | null
  responded_at: string | null
  created_at: string
  cargo: CargoOfferCargoSummary
}

// ---- Driver profili (Client) — GET /client/drivers/:id -----------------------
export interface DriverReview {
  id: number
  rating: number
  comment: string
  is_anonymous: boolean
  reviewer: { type: string; id: number; name: string }
  created_at: string
}

export interface Driver {
  id: number
  rating: number
  rating_count: number
  name: string | null
  avatar: { url: string; mime_type: string; size: number } | null
  is_online: boolean
  is_verified: boolean
  completed_cargos_count: number
  cancelled_cargos_count: number
  reliability_rate: number
  member_since: string
  recent_reviews: DriverReview[]
}

// ---- Ochiq yuklar bozori (Client) — GET /client/public-cargos ----------------
export interface PublicCargo {
  id: number
  name: string
  status: CargoStatus
  from: CargoAdministrativeArea
  to: CargoAdministrativeArea
  weight: number | null
  volume: number | null
  quantity: number | null
  transport_type: { id: number; name: string; image_url: string | null } | null
  loading_at: string
  unloading_at: string | null
  created_at: string
}

export interface PublicCargoListParams {
  from_city_id?: number
  to_city_id?: number
  transport_type_id?: number
  page?: number
  per_page?: number
}

// ---- Client dashboard — GET /client/dashboard --------------------------------
export interface DashboardCargoCounts {
  total: number
  open: number
  assigned: number
  in_progress: number
  delivered: number
  cancelled: number
}

export interface DashboardRecentCargo {
  id: number
  name: string
  status: CargoStatus
  cargo_class: CargoClass
  view_count: number
  from: CargoAdministrativeArea[] | CargoAdministrativeArea
  to: CargoAdministrativeArea[] | CargoAdministrativeArea
  weight: number | null
  volume: number | null
  quantity: number | null
  loading_at: string
  unloading_at: string | null
  created_at: string
}

export interface DashboardPublicCargo {
  id: number
  name: string
  status: CargoStatus
  from: CargoAdministrativeArea[] | CargoAdministrativeArea
  to: CargoAdministrativeArea[] | CargoAdministrativeArea
  weight: number | null
  volume: number | null
  quantity: number | null
  loading_at: string
  unloading_at: string | null
  created_at: string
}

export interface ClientDashboardData {
  cargos: DashboardCargoCounts
  recent_cargos: DashboardRecentCargo[]
  recent_public_cargos: DashboardPublicCargo[]
  carriers: {
    total_approved: number
  }
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










export type VehicleRentalStatus = "active" | "completed" | "cancelled"

export interface VehicleRental {
  id: number
  vehicle_id: number
  driver_id: number
  driver?: {
    id: number
    full_name: string
    phone?: string | null
  }
  started_at: string
  ended_at: string | null
  status: VehicleRentalStatus
  status_label: string
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface VehicleRentalCreatePayload {
  vehicle_id: number
  driver_id: number
  started_at: string
  notes?: string
}

export interface VehicleRentalUpdatePayload {
  ended_at?: string
  status?: VehicleRentalStatus
  notes?: string
}


export interface ActiveDriver {
  employee_id: number
  driver_id: number
  name: string | null
  avatar: { url: string } | null
}



export type ConversationType = "private" | "group"
// Backend hujjatida "open"dan boshqa qiymat ko'rsatilmagan — misoldan taxmin qilindi.
export type ConversationStatus = "open" | "closed"
export type ChatMessageType = "text" | "image" | "audio" | "location"

export interface Conversation {
  id: number
  type: ConversationType
  name: string
  avatar: string | null
  status: ConversationStatus
  last_message: string | null
  last_message_at: string | null
  is_muted: boolean
  muted_until: string | null
  is_pinned: boolean
  pinned_at: string | null
}

export interface ChatMessageSender {
  id: number
  fio: string | null
  phone_number?: string | null
}

export interface ChatMessage {
  id: number
  conversation_id: number
  reply_to_id: number | null
  sender_id: number
  sender_type: string
  message: string | null
  type: ChatMessageType
  file_path: string | null
  audio_path: string | null
  latitude: string | null
  longitude: string | null
  edited_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  file_url: string | null
  audio_url: string | null
  sender?: ChatMessageSender
}

export interface ListMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ConversationsListResponse {
  data: Conversation[]
  meta: ListMeta
}

export interface LaravelPaginator<T> {
  current_page: number
  data: T[]
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface ConversationDetailResponse {
  conversation: Pick<Conversation, "id" | "type" | "name" | "avatar" | "status">
  data: LaravelPaginator<ChatMessage>
}

export interface UnreadStats {
  total: number
  unread_by_conversation: Record<string, number>
}
