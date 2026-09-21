import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { cargoOfferApi } from "@/lib/cargo-offer.api"
import { cargoKeys } from "@/features/cargo/useCargo"
import { chatKeys } from "@/features/chat/useChat"

export const cargoOfferKeys = {
  all: (cargoId: number) => ["cargos", cargoId, "offers"] as const,
  detail: (cargoId: number, offerId: number) =>
    ["cargos", cargoId, "offers", offerId] as const,
}

export function useCargoOffers(cargoId: number) {
  return useQuery({
    queryKey: cargoOfferKeys.all(cargoId),
    queryFn: () => cargoOfferApi.getAll(cargoId),
    enabled: Number.isFinite(cargoId),
  })
}

export function useCargoOffer(cargoId: number, offerId: number | null) {
  return useQuery({
    queryKey: cargoOfferKeys.detail(cargoId, offerId ?? -1),
    queryFn: () => cargoOfferApi.getOne(cargoId, offerId as number),
    enabled: Number.isFinite(cargoId) && offerId !== null,
  })
}

// Taklifni qabul qilish yukning statusini ham o'zgartiradi (masalan "assigned"ga
// o'tadi), shu sababli muvaffaqiyatli bo'lgach taklif va yukning o'zi ham qayta
// so'raladi.
export function useAcceptCargoOffer(cargoId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (offerId: number) => cargoOfferApi.accept(cargoId, offerId),
    onSuccess: (_data, offerId) => {
      queryClient.invalidateQueries({ queryKey: cargoOfferKeys.all(cargoId) })
      queryClient.invalidateQueries({ queryKey: cargoOfferKeys.detail(cargoId, offerId) })
      queryClient.invalidateQueries({ queryKey: cargoKeys.detail(cargoId) })
    },
  })
}

export function useRejectCargoOffer(cargoId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ offerId, reason }: { offerId: number; reason?: string }) =>
      cargoOfferApi.reject(cargoId, offerId, reason),
    onSuccess: (_data, { offerId }) => {
      queryClient.invalidateQueries({ queryKey: cargoOfferKeys.all(cargoId) })
      queryClient.invalidateQueries({ queryKey: cargoOfferKeys.detail(cargoId, offerId) })
      queryClient.invalidateQueries({ queryKey: cargoKeys.detail(cargoId) })
    },
  })
}

// Taklif beruvchi bilan suhbat ochadi/topadi — muvaffaqiyatli bo'lgach suhbatlar
// ro'yxati (yangi suhbat sidebar'da ko'rinishi uchun) qayta so'raladi.
export function useContactOfferProposer(cargoId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (offerId: number) => cargoOfferApi.contact(cargoId, offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
    },
  })
}
