import { api } from "@/lib/api" // mavjud axios instance'ingiz nomiga moslang
import type {
  VehicleRental,
  VehicleRentalCreatePayload,
  VehicleRentalUpdatePayload,
} from "@/types"

export const vehicleRentalsApi = {
  create: async (payload: VehicleRentalCreatePayload): Promise<VehicleRental> => {
    const { data } = await api.post("/carrier/vehicle-rentals", payload)
    return data.data ?? data
  },

  update: async (id: number, payload: VehicleRentalUpdatePayload): Promise<VehicleRental> => {
    const { data } = await api.post(`/carrier/vehicle-rentals/${id}`, payload)
    return data.data ?? data
  },
}