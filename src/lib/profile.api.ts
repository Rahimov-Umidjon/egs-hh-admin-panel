import { api } from "@/lib/api" // sizning axios instance joylashgan fayl yo'liga moslang
import type {
  CompanyLocation,
  CompanyProfile,
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
    const formData = new FormData();

    formData.append("_method", "PATCH");
    formData.append("logo", file);

    const { data } = await api.post<{ data: CompanyProfile }>(
      "/carrier/profile",
      formData
    );

    return data.data;
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
}