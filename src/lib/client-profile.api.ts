import { api } from "@/lib/api"
import type {
  ClientProfile,
  UpdateClientPasswordPayload,
  UpdateClientProfilePayload,
} from "@/types"

export const clientProfileApi = {
  getMe: async () => {
    const { data } = await api.get<{ data: ClientProfile }>("/client/auth/me")
    return data.data
  },

  updateInfo: async (payload: UpdateClientProfilePayload) => {
    const { data } = await api.put<{ data: ClientProfile }>(
      "/client/profile",
      payload
    )
    return data.data
  },

  updatePassword: async (payload: UpdateClientPasswordPayload) => {
    const { data } = await api.put<{ success: boolean; message: string }>(
      "/client/profile/password",
      payload
    )
    return data
  },

  updateAvatar: async (file: File) => {
    const formData = new FormData()
    formData.append("avatar", file)

    const { data } = await api.post<{ data: ClientProfile }>(
      "/client/profile/avatar",
      formData
    )
    return data.data
  },
}
