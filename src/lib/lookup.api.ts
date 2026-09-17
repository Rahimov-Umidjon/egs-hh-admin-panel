import { api } from "@/lib/api"
import type {
  CargoDocumentTypeOption,
  CityOption,
  CountryOption,
  TransportTypeOption,
} from "@/types"

// Bu ro'yxat (reference data) endpointlari client_open_api.yaml spec'da yo'q,
// backend jamoasi alohida taqdim etgan. Envelope'siz — to'g'ridan-to'g'ri array qaytaradi.
export const lookupApi = {
  getCountries: async (search?: string) => {
    const { data } = await api.get<CountryOption[]>("/lookup/countries", {
      params: search ? { search } : undefined,
    })
    return data
  },

  searchCities: async (countryId: number, search: string) => {
    const { data } = await api.get<CityOption[]>("/lookup/cities", {
      params: { country_id: countryId, search },
    })
    return data
  },

  getTransportTypes: async () => {
    const { data } = await api.get<TransportTypeOption[]>("/lookup/transport-types")
    return data
  },

  getCargoDocumentTypes: async () => {
    const { data } = await api.get<CargoDocumentTypeOption[]>(
      "/lookup/cargo-document-types"
    )
    return data
  },
}
