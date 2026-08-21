import { api } from "@/lib/api"
import type {
  Employee,
  EmployeeListParams,
  EmployeeListResponse,
  EmployeePayload,
  EmployeeWithDriverPayload,
} from "@/types"

export const employeesApi = {
  getAll: async (params: EmployeeListParams) => {
    const { data } = await api.get<EmployeeListResponse>("/carrier/employees", { params })
    return data
  },

  getOne: async (id: number) => {
    const { data } = await api.get<{ data: Employee }>(`/carrier/employees/${id}`)
    return data.data
  },

  create: async (payload: EmployeePayload) => {
    const { data } = await api.post<{ data: Employee }>("/carrier/employees", payload)
    return data.data
  },

  createWithDriver: async (payload: EmployeeWithDriverPayload) => {
    const { data } = await api.post<{ data: Employee }>(
      "/carrier/employees/with-driver",
      payload
    )
    return data.data
  },

  update: async (id: number, payload: Partial<EmployeePayload>) => {
    const { data } = await api.put<{ data: Employee }>(`/carrier/employees/${id}`, payload)
    return data.data
  },
}