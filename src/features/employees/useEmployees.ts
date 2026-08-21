import { employeesApi } from "@/lib/employees.api"
import type { EmployeeListParams, EmployeePayload, EmployeeWithDriverPayload } from "@/types"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.lists(), params] as const,
  details: () => [...employeeKeys.all, "detail"] as const,
  detail: (id: number) => [...employeeKeys.details(), id] as const,
}

export function useEmployees(params: EmployeeListParams) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => employeesApi.getAll(params),
    placeholderData: keepPreviousData,
  })
}

export function useEmployee(id: number | null) {
  return useQuery({
    queryKey: employeeKeys.detail(id ?? 0),
    queryFn: () => employeesApi.getOne(id as number),
    enabled: id !== null,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EmployeePayload) => employeesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      toast.success("Xodim muvaffaqiyatli yaratildi")
    },
    onError: () => toast.error("Xodim yaratishda xatolik yuz berdi"),
  })
}

export function useCreateEmployeeWithDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EmployeeWithDriverPayload) => employeesApi.createWithDriver(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      toast.success("Xodim (yangi haydovchi bilan) yaratildi")
    },
    onError: () => toast.error("Xodim yaratishda xatolik yuz berdi"),
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<EmployeePayload> }) =>
      employeesApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) })
      toast.success("Xodim ma'lumotlari yangilandi")
    },
    onError: () => toast.error("Xodimni yangilashda xatolik yuz berdi"),
  })
}