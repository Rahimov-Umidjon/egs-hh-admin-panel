import { useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { cargoApi } from "@/lib/cargo.api"
import type { CargoListParams, CargoStatus, CreateCargoPayload, UpdateCargoPayload } from "@/types"

export const cargoKeys = {
  all: ["cargos"] as const,
  list: (params?: CargoListParams) => [...cargoKeys.all, "list", params] as const,
  infiniteList: (params?: Omit<CargoListParams, "page">) =>
    [...cargoKeys.all, "list", "infinite", params] as const,
  detail: (id: number) => [...cargoKeys.all, "detail", id] as const,
  tracking: (id: number) => [...cargoKeys.all, "tracking", id] as const,
  documents: (id: number) => [...cargoKeys.all, "documents", id] as const,
}

// Global QueryClient `staleTime: 30_000` bilan sozlangan — bu yuklar ro'yxati uchun
// mos emas: status filtri almashtirilganda yoki yukka amal qilingandan keyin (edit/
// bekor qilish/o'chirish) foydalanuvchi doim eng so'nggi statusni ko'rishi kerak,
// aks holda tugmalar (tahrirlash/o'chirish) eskirgan status asosida noto'g'ri
// yoqilgan/o'chirilgan bo'lib qolishi mumkin. Shu sababli bu yerda staleTime 0ga
// tushiriladi — ro'yxat har safar (montajda/queryKey o'zgarganda) qaytadan so'raladi.
export function useCargos(params?: CargoListParams) {
  return useQuery({
    queryKey: cargoKeys.list(params),
    queryFn: () => cargoApi.getAll(params),
    staleTime: 0,
  })
}

// Karta ko'rinishida pastga scroll qilinganda keyingi sahifani avtomatik yuklash uchun
export function useInfiniteCargos(params?: Omit<CargoListParams, "page">) {
  return useInfiniteQuery({
    queryKey: cargoKeys.infiniteList(params),
    queryFn: ({ pageParam }) => cargoApi.getAll({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.current_page < lastPage.pagination.last_page
        ? lastPage.pagination.current_page + 1
        : undefined,
    staleTime: 0,
  })
}

const STATUS_COUNT_LIST: CargoStatus[] = [
  "open",
  "assigned",
  "in_progress",
  "delivered",
  "cancelled",
]

// Har bir status uchun jami sonini (footer'dagi statuslar kartasi kabi joylarda
// ko'rsatish uchun) alohida so'rovlar orqali oladi — backend hozircha statuslar
// bo'yicha yagona statistikani qaytaruvchi endpoint bermagani uchun, har bir
// status uchun `per_page: 1` bilan so'rov yuborib, faqat `pagination.total`dan
// foydalanamiz (haqiqiy ma'lumot yuklanadi, hech narsa o'ylab topilmaydi).
export function useCargoStatusCounts() {
  const results = useQueries({
    queries: STATUS_COUNT_LIST.map((status) => ({
      queryKey: cargoKeys.list({ status, per_page: 1 }),
      queryFn: () => cargoApi.getAll({ status, per_page: 1 }),
      staleTime: 0,
    })),
  })

  const counts = Object.fromEntries(
    STATUS_COUNT_LIST.map((status, i) => [status, results[i].data?.pagination.total ?? null])
  ) as Record<CargoStatus, number | null>

  return { counts, isLoading: results.some((r) => r.isLoading) }
}

export function useCargo(id: number) {
  return useQuery({
    queryKey: cargoKeys.detail(id),
    queryFn: () => cargoApi.getOne(id),
    enabled: Number.isFinite(id),
  })
}

export function useCargoTracking(id: number) {
  return useQuery({
    queryKey: cargoKeys.tracking(id),
    queryFn: () => cargoApi.getTracking(id),
    enabled: Number.isFinite(id),
  })
}

export function useCargoDocuments(id: number) {
  return useQuery({
    queryKey: cargoKeys.documents(id),
    queryFn: () => cargoApi.getDocuments(id),
    enabled: Number.isFinite(id),
  })
}

export function useCreateCargo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCargoPayload) => cargoApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cargoKeys.all })
    },
  })
}

export function useUpdateCargo(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateCargoPayload) => cargoApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cargoKeys.all })
    },
  })
}

export function useDeleteCargo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cargoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cargoKeys.all })
    },
  })
}

export function useCancelCargo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      cargoApi.cancel(id, reason),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: cargoKeys.all })
      queryClient.invalidateQueries({ queryKey: cargoKeys.detail(id) })
    },
    onError: () => {
      toast.error("Yukni bekor qilishda xatolik yuz berdi")
    },
  })
}
