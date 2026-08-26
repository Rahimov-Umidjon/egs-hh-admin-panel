// Loyihangizdagi umumiy axios instansiyasi. Yo'lini o'zingizdagi haqiqiy
// faylga moslang (masalan "@/lib/api" yoki "@/lib/http"). 

import type { ApiMessageResponse, PaginatedResponse, SingleResponse, TransportType, Vehicle, VehicleListParams, VehiclePayload } from "@/types"
import { api } from "./api"

 

const BASE_URL = "/carrier/vehicles"

export const vehiclesApi = {
  getAll: async (params: VehicleListParams) => {
    const { data } = await api.get<PaginatedResponse<Vehicle>>(BASE_URL, { params })
    return data
  },

  getOne: async (id: number) => {
    const { data } = await api.get<SingleResponse<Vehicle>>(`${BASE_URL}/${id}`)
    return data.data
  },

  create: async (payload: VehiclePayload) => {
    const { data } = await api.post<SingleResponse<Vehicle>>(BASE_URL, payload)
    return data.data
  },

  update: async (id: number, payload: Partial<VehiclePayload>) => {
    const { data } = await api.patch<SingleResponse<Vehicle>>(`${BASE_URL}/${id}`, payload)
    return data.data
  },

  remove: async (id: number) => {
    const { data } = await api.delete<ApiMessageResponse>(`${BASE_URL}/${id}`)
    return data
  },
}

// Transport turlari (Bongo, Isuzu va h.k.) — moshina formasidagi select uchun.
// Endpoint manzilini backendingizga moslang.
export const transportTypesApi = {
  getAll: async () => {
    const { data } = await api.get<{ success: boolean; message: string; data: TransportType[] }>(
      "/transport-types"
    )
    return data.data
  },
}