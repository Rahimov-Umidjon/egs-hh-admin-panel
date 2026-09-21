import { api } from "@/lib/api"
import type { CargoOffer, PaginatedResponse } from "@/types"

export const cargoOfferApi = {
  getAll: async (cargoId: number) => {
    const { data } = await api.get<PaginatedResponse<CargoOffer>>(
      `/client/cargos/${cargoId}/offers`
    )
    return data
  },

  getOne: async (cargoId: number, offerId: number) => {
    const { data } = await api.get<{ data: CargoOffer }>(
      `/client/cargos/${cargoId}/offers/${offerId}`
    )
    return data.data
  },

  accept: async (cargoId: number, offerId: number) => {
    const { data } = await api.post<{ data: CargoOffer }>(
      `/client/cargos/${cargoId}/offers/${offerId}/accept`
    )
    return data.data
  },

  reject: async (cargoId: number, offerId: number, reason?: string) => {
    const { data } = await api.post<{ data: CargoOffer }>(
      `/client/cargos/${cargoId}/offers/${offerId}/reject`,
      { reason }
    )
    return data.data
  },

  contact: async (cargoId: number, offerId: number) => {
    const { data } = await api.post<{ message: string; data: { conversation_id: number } }>(
      `/client/cargos/${cargoId}/offers/${offerId}/contact`
    )
    return data.data
  },
}
