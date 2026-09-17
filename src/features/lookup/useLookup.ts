import { useQuery } from "@tanstack/react-query"
import { lookupApi } from "@/lib/lookup.api"

export const lookupKeys = {
  all: ["lookup"] as const,
  countries: (search: string) => [...lookupKeys.all, "countries", search] as const,
  transportTypes: () => [...lookupKeys.all, "transport-types"] as const,
  cities: (countryId: number | null, search: string) =>
    [...lookupKeys.all, "cities", countryId, search] as const,
  cargoDocumentTypes: () => [...lookupKeys.all, "cargo-document-types"] as const,
}

// `search` bo'sh bo'lsa ham ishlaydi (select ochilganda tanlash uchun boshlang'ich
// ro'yxat chiqishi uchun), yozilganda esa natijalarni torayadi. Chaqiruvchi komponent
// `search`ni debounce qiladi.
export function useCountrySearch(search: string, enabled = true) {
  return useQuery({
    queryKey: lookupKeys.countries(search),
    queryFn: () => lookupApi.getCountries(search),
    enabled,
  })
}

export function useTransportTypes() {
  return useQuery({
    queryKey: lookupKeys.transportTypes(),
    queryFn: () => lookupApi.getTransportTypes(),
    staleTime: Infinity,
  })
}

export function useCargoDocumentTypes() {
  return useQuery({
    queryKey: lookupKeys.cargoDocumentTypes(),
    queryFn: () => lookupApi.getCargoDocumentTypes(),
    staleTime: Infinity,
  })
}

// `search` bo'sh bo'lsa ham ishlaydi (select ochilganda tanlash uchun boshlang'ich
// ro'yxat chiqishi uchun), yozilganda esa natijalarni torayadi. Chaqiruvchi komponent
// `search`ni debounce qiladi.
export function useCitySearch(countryId: number | null, search: string, enabled = true) {
  return useQuery({
    queryKey: lookupKeys.cities(countryId, search),
    queryFn: () => lookupApi.searchCities(countryId as number, search),
    enabled: Boolean(countryId) && enabled,
  })
}
