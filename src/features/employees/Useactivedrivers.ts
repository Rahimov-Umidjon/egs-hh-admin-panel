import { employeesApi } from "@/lib/employees.api"
import { useQuery } from "@tanstack/react-query"
 

export function useActiveDrivers() {
  return useQuery({
    queryKey: ["employees", "active-drivers"],
    queryFn: () => employeesApi.getActiveDrivers(),
    staleTime: 2 * 60 * 1000,
  })
}