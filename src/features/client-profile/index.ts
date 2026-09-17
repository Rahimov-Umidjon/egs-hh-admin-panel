import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { clientProfileApi } from "@/lib/client-profile.api"
import type { UpdateClientPasswordPayload, UpdateClientProfilePayload } from "@/types"

export const clientProfileKeys = {
  all: ["client-profile"] as const,
  me: () => [...clientProfileKeys.all, "me"] as const,
}

export function useClientProfile() {
  return useQuery({
    queryKey: clientProfileKeys.me(),
    queryFn: () => clientProfileApi.getMe(),
  })
}

export function useUpdateClientProfileInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateClientProfilePayload) =>
      clientProfileApi.updateInfo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientProfileKeys.me() })
      toast.success("Ma'lumotlar yangilandi")
    },
    onError: () => {
      toast.error("Ma'lumotlarni yangilashda xatolik yuz berdi")
    },
  })
}

export function useUpdateClientPassword() {
  return useMutation({
    mutationFn: (payload: UpdateClientPasswordPayload) =>
      clientProfileApi.updatePassword(payload),
    onSuccess: () => {
      toast.success("Parol muvaffaqiyatli yangilandi")
    },
    onError: () => {
      toast.error("Parolni yangilashda xatolik yuz berdi")
    },
  })
}

export function useUpdateClientAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => clientProfileApi.updateAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientProfileKeys.me() })
      toast.success("Rasm yangilandi")
    },
    onError: () => {
      toast.error("Rasmni yangilashda xatolik yuz berdi")
    },
  })
}
