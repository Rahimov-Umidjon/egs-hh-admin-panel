import { profileApi } from "@/lib/profile.api"
import type {
  UpdateLocationPayload,
  UpdatePasswordPayload,
  UpdateProfileInfoPayload,
} from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
}

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => profileApi.getMe(),
  })
}

export function useUpdateProfileLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => profileApi.updateLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() })
      toast.success("Logotip yangilandi")
    },
    onError: () => {
      toast.error("Logotipni yangilashda xatolik yuz berdi")
    },
  })
}

export function useUpdateProfileInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProfileInfoPayload) =>
      profileApi.updateInfo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() })
      toast.success("Ma'lumotlar yangilandi")
    },
    onError: () => {
      toast.error("Ma'lumotlarni yangilashda xatolik yuz berdi")
    },
  })
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) =>
      profileApi.updatePassword(payload),
    onSuccess: () => {
      toast.success("Parol muvaffaqiyatli yangilandi")
    },
    onError: () => {
      toast.error("Parolni yangilashda xatolik yuz berdi")
    },
  })
}

export function useUpdateLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: UpdateLocationPayload
    }) => profileApi.updateLocation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() })
      toast.success("Manzil yangilandi")
    },
    onError: () => {
      toast.error("Manzilni yangilashda xatolik yuz berdi")
    },
  })
}