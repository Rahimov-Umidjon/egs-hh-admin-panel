import { api } from "@/lib/api"
import type {
  Cargo,
  CargoListParams,
  CargoTracking,
  ClientDashboardData,
  CreateCargoPayload,
  PaginatedResponse,
  PublicCargo,
  PublicCargoListParams,
  UpdateCargoPayload,
} from "@/types"

export const cargoApi = {
  getDashboard: async () => {
    const { data } = await api.get<{ data: ClientDashboardData }>("/client/dashboard")
    return data.data
  },

  getAll: async (params?: CargoListParams) => {
    const { data } = await api.get<PaginatedResponse<Cargo>>("/client/cargos", {
      params,
    })
    return data
  },

  getPublic: async (params?: PublicCargoListParams) => {
    const { data } = await api.get<PaginatedResponse<PublicCargo>>("/client/public-cargos", {
      params,
    })
    return data
  },

  getOne: async (id: number) => {
    const { data } = await api.get<{ data: Cargo }>(`/client/cargos/${id}`)
    return data.data
  },

  create: async (payload: CreateCargoPayload) => {
    const { data } = await api.post<{ data: Cargo }>("/client/cargos", payload)
    return data.data
  },

  update: async (id: number, payload: UpdateCargoPayload) => {
    const { data } = await api.put<{ data: Cargo }>(`/client/cargos/${id}`, payload)
    return data.data
  },

  delete: async (id: number) => {
    const { data } = await api.delete<{ success: boolean; message: string }>(
      `/client/cargos/${id}`
    )
    return data
  },

  cancel: async (id: number, reason?: string) => {
    const { data } = await api.post<{ data: Cargo }>(`/client/cargos/${id}/cancel`, {
      reason,
    })
    return data.data
  },

  getTracking: async (id: number) => {
    const { data } = await api.get<{ data: CargoTracking }>(
      `/client/cargos/${id}/tracking`
    )
    return data.data
  },

  getDocuments: async (id: number) => {
    const { data } = await api.get<{ data: Cargo["documents"] }>(
      `/client/cargos/${id}/documents`
    )
    return data.data
  },
}
