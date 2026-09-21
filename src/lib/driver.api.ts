import { api } from "@/lib/api"
import type { Driver } from "@/types"

export const driverApi = {
  getOne: async (id: number) => {
    const { data } = await api.get<{ data: Driver }>(`/client/drivers/${id}`)
    return data.data
  },
}
