import { useQuery } from "@tanstack/react-query"

import { driverApi } from "@/lib/driver.api"

export function useDriver(driverId: number | null) {
  return useQuery({
    queryKey: ["drivers", driverId],
    queryFn: () => driverApi.getOne(driverId as number),
    enabled: driverId !== null && Number.isFinite(driverId),
  })
}
