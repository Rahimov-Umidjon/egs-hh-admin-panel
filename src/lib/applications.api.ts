import { api } from "@/lib/api"
import type {
  Application,
  ApplicationListParams,
  ChangeApplicationStatusPayload,
} from "@/types"

interface ApplicationsPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

interface ApplicationsListResponse {
  success: boolean
  message: string
  data: Application[]
  pagination: ApplicationsPagination
}

interface ApplicationDetailResponse {
  success: boolean
  message: string
  data: Application
}

export const applicationsApi = {
  getAll: async (params: ApplicationListParams) => {
    const { data } = await api.get<ApplicationsListResponse>(
      "/carrier/applications",
      { params }
    )
    return data
  },

  getOne: async (id: number) => {
    const { data } = await api.get<ApplicationDetailResponse>(
      `/carrier/applications/${id}`
    )
    return data.data
  },

  changeStatus: async (id: number, payload: ChangeApplicationStatusPayload) => {
    const { data } = await api.patch<ApplicationDetailResponse>(
      `/carrier/applications/${id}/change-status`,
      payload
    )
    return data.data
  },
}