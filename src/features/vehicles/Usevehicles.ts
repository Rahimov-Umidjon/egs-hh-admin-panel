import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
 
import { transportTypesApi, vehiclesApi } from "@/lib/vehicles.api" 
import type { VehicleListParams, VehiclePayload } from "@/types"
import { getErrorMessage } from "@/lib/Api-error"

export const vehicleKeys = {
  all: ["vehicles"] as const,
  lists: () => [...vehicleKeys.all, "list"] as const,
  list: (params: VehicleListParams) => [...vehicleKeys.lists(), params] as const,
  details: () => [...vehicleKeys.all, "detail"] as const,
  detail: (id: number) => [...vehicleKeys.details(), id] as const,
}

export function useVehicles(params: VehicleListParams) {
  return useQuery({
    queryKey: vehicleKeys.list(params),
    queryFn: () => vehiclesApi.getAll(params),
    placeholderData: keepPreviousData,
  })
}

export function useVehicle(id: number | null) {
  return useQuery({
    queryKey: vehicleKeys.detail(id ?? 0),
    queryFn: () => vehiclesApi.getOne(id as number),
    enabled: id !== null,
  })
}

export function useTransportTypes() {
  return useQuery({
    queryKey: ["transport-types"],
    queryFn: () => transportTypesApi.getAll(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: VehiclePayload) => vehiclesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
      toast.success("Moshina muvaffaqiyatli qo'shildi")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Moshina qo'shishda xatolik yuz berdi"))
    },
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<VehiclePayload> }) =>
      vehiclesApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(variables.id) })
      toast.success("Moshina ma'lumotlari yangilandi")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Moshinani yangilashda xatolik yuz berdi"))
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => vehiclesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
      toast.success("Moshina o'chirildi")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Moshinani o'chirishda xatolik yuz berdi"))
    },
  })
}