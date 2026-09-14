import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { vehicleRentalsApi } from "@/lib/vehicle-rentals.api"
import { vehicleKeys } from "@/features/vehicles/Usevehicles"
import { getErrorMessage } from "@/lib/Api-error"
import type { VehicleRentalCreatePayload, VehicleRentalUpdatePayload } from "@/types"

export function useCreateVehicleRental() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: VehicleRentalCreatePayload) => vehicleRentalsApi.create(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(variables.vehicle_id) })
      toast.success("Haydovchi moshinaga biriktirildi")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Biriktirishda xatolik yuz berdi"))
    },
  })
}

export function useUpdateVehicleRental() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      vehicleId,
      payload,
    }: {
      id: number
      vehicleId: number
      payload: VehicleRentalUpdatePayload
    }) => vehicleRentalsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(variables.vehicleId) })
      toast.success("Ijara ma'lumotlari yangilandi")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Yangilashda xatolik yuz berdi"))
    },
  })
}