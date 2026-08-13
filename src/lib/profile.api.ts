import { api } from "@/lib/api"
import type {
  CompanyLocation,
  CompanyProfile,
  CreateLocationPayload,
  UpdateLocationPayload,
  UpdatePasswordPayload,
  UpdateProfileInfoPayload,
} from "@/types"

export const profileApi = {
  getMe: async () => {
    const { data } = await api.get<{ data: CompanyProfile }>("/auth/me")
    return data.data
  },

  updateLogo: async (file: File) => {
    const formData = new FormData()

    formData.append("_method", "PATCH")
    formData.append("logo", file)

    const { data } = await api.post<{ data: CompanyProfile }>(
      "/carrier/profile",
      formData
    )

    return data.data
  },

  updateInfo: async (payload: UpdateProfileInfoPayload) => {
    const { data } = await api.patch<{ data: CompanyProfile }>(
      "/carrier/profile",
      payload
    )
    return data.data
  },

  updatePassword: async (payload: UpdatePasswordPayload) => {
    const { data } = await api.patch<{ data: CompanyProfile }>(
      "/carrier/profile",
      payload
    )
    return data.data
  },

  updateLocation: async (id: number, payload: UpdateLocationPayload) => {
    const { data } = await api.patch<{ data: CompanyLocation }>(
      `/carrier/profile/locations/${id}`,
      payload
    )
    return data.data
  },

  createLocation: async (payload: CreateLocationPayload) => {
    const { data } = await api.post<{ data: CompanyLocation }>(
      "/carrier/profile/locations",
      payload
    )
    return data.data
  },

  deleteLocation: async (id: number) => {
    const { data } = await api.delete<{ success: boolean; message: string }>(
      `/carrier/profile/locations/${id}`
    )
    return data
  },
}