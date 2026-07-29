import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface Driver {
  id: number
  full_name: string
  phone: string
  vehicle_type: string
  status: "pending" | "verified" | "rejected"
  route: string | null
}

interface DriversResponse {
  data: Driver[]
}

async function fetchDrivers(): Promise<Driver[]> {
  // Laravel API: GET /api/drivers
  const { data } = await api.get<DriversResponse>("/drivers")
  return data.data
}

export function useDrivers() {
  return useQuery({
    queryKey: ["drivers"],
    queryFn: fetchDrivers,
  })
}
