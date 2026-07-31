import { api } from "@/lib/api" // sizning axios instance joylashgan fayl yo'liga moslang
import type { PaginatedResponse, Vacancy, VacancyListParams, VacancyPayload, VacancyStatus } from "@/types"


// api instance baseURL'i allaqachon "/api" bilan tugaydi, shuning uchun
// bu yerda faqat "/carrier/vacancies" yoziladi.
const BASE_URL = "/carrier/vacancies"

export const vacanciesApi = {
  getAll: async (params: VacancyListParams) => {
    const { data } = await api.get<PaginatedResponse<Vacancy>>(BASE_URL, {
      params,
    })
    return data
  },

  getOne: async (id: number) => {
    const { data } = await api.get<{ data: Vacancy }>(`${BASE_URL}/${id}`)
    return data.data
  },

  create: async (payload: VacancyPayload) => {
    const { data } = await api.post<{ data: Vacancy }>(BASE_URL, payload)
    return data.data
  },

  update: async (id: number, payload: VacancyPayload) => {
    const { data } = await api.put<{ data: Vacancy }>(
      `${BASE_URL}/${id}`,
      payload
    )
    return data.data
  },

  // 👇 status uchun alohida, yengil metod
  updateStatus: async (id: number, status: VacancyStatus) => {
    const { data } = await api.patch<{ data: Vacancy }>(
      `${BASE_URL}/${id}`,
      { status }
    )
    return data.data
  },

  delete: async (id: number) => {
    await api.delete(`${BASE_URL}/${id}`)
  },
}