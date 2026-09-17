import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronsUpDown, MapPin } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { LocationPickerDialog } from "@/components/LocationPickerDialog"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useCitySearch, useCountrySearch } from "@/features/lookup/useLookup"
import { cn } from "@/lib/utils"

export interface CargoLocationDraft {
  country_id: number | null
  countryLabel: string
  state_id: number | null
  city_id: number | null
  cityLabel: string
  address: string
  latitude: number | null
  longitude: number | null
}

export const EMPTY_CARGO_LOCATION: CargoLocationDraft = {
  country_id: null,
  countryLabel: "",
  state_id: null,
  city_id: null,
  cityLabel: "",
  address: "",
  latitude: null,
  longitude: null,
}

interface CargoLocationFieldProps {
  title: string
  value: CargoLocationDraft
  onChange: (next: CargoLocationDraft) => void
  error?: string
}

interface LocationOption {
  id: number
  name: string
}

interface LocationSearchSelectProps {
  label: string
  placeholder: string
  disabled?: boolean
  displayValue: string
  results: LocationOption[] | undefined
  isFetching: boolean
  query: string
  onQueryChange: (query: string) => void
  onSelect: (result: LocationOption) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Davlat/shahar tanlash uchun qidiruvli combobox — tugma bosilganda popover ochiladi va
// darhol tanlash uchun ro'yxat chiqadi, yozilganda esa natijalar torayadi.
function LocationSearchSelect({
  label,
  placeholder,
  disabled,
  displayValue,
  results,
  isFetching,
  query,
  onQueryChange,
  onSelect,
  open,
  onOpenChange,
}: LocationSearchSelectProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover
        open={open}
        onOpenChange={(next) => {
          onOpenChange(next)
          if (next) onQueryChange("")
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span className={cn("truncate", !displayValue && "text-muted-foreground")}>
              {displayValue || placeholder}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popper-anchor-width) p-0">
          <div className="p-2">
            <Input
              autoFocus
              placeholder={placeholder}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-y-auto border-t">
            {isFetching ? (
              <p className="p-3 text-sm text-muted-foreground">{t("cargoLocation.searching")}</p>
            ) : results && results.length > 0 ? (
              results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    onSelect(r)
                    onOpenChange(false)
                  }}
                >
                  {r.name}
                </button>
              ))
            ) : (
              <p className="p-3 text-sm text-muted-foreground">{t("cargoLocation.noResults")}</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function CargoLocationField({
  title,
  value,
  onChange,
  error,
}: CargoLocationFieldProps) {
  const { t } = useTranslation()
  const [countryOpen, setCountryOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [countryQuery, setCountryQuery] = useState("")
  const [cityQuery, setCityQuery] = useState("")
  const [mapOpen, setMapOpen] = useState(false)

  const debouncedCountryQuery = useDebouncedValue(countryQuery, 300)
  const debouncedCityQuery = useDebouncedValue(cityQuery, 300)

  const { data: countryResults, isFetching: countriesFetching } = useCountrySearch(
    debouncedCountryQuery,
    countryOpen
  )
  const { data: cityResults, isFetching: citiesFetching } = useCitySearch(
    value.country_id,
    debouncedCityQuery,
    cityOpen
  )

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <h4 className="text-sm font-semibold">{title}</h4>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LocationSearchSelect
          label={t("cargoLocation.country")}
          placeholder={t("cargoLocation.countryPlaceholder")}
          displayValue={value.countryLabel}
          query={countryQuery}
          onQueryChange={setCountryQuery}
          results={countryResults}
          isFetching={countriesFetching}
          open={countryOpen}
          onOpenChange={setCountryOpen}
          onSelect={(country) =>
            onChange({
              ...value,
              country_id: country.id,
              countryLabel: country.name,
              state_id: null,
              city_id: null,
              cityLabel: "",
            })
          }
        />

        <LocationSearchSelect
          label={t("cargoLocation.city")}
          placeholder={t("cargoLocation.cityPlaceholder")}
          disabled={!value.country_id}
          displayValue={value.cityLabel}
          query={cityQuery}
          onQueryChange={setCityQuery}
          results={cityResults}
          isFetching={citiesFetching}
          open={cityOpen}
          onOpenChange={setCityOpen}
          onSelect={(city) =>
            onChange({
              ...value,
              city_id: city.id,
              state_id: (city as { state_id?: number }).state_id ?? null,
              cityLabel: city.name,
            })
          }
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("cargoLocation.address")}</Label>
        <Input
          placeholder={t("cargoLocation.addressPlaceholder")}
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => setMapOpen(true)}>
          <MapPin className="mr-2 size-4" />
          {value.latitude
            ? t("cargoLocation.changePoint")
            : t("cargoLocation.pickPoint")}
        </Button>

        {value.latitude != null && value.longitude != null && (
          <a
            href={`https://www.google.com/maps?q=${value.latitude},${value.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
          </a>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <LocationPickerDialog
        open={mapOpen}
        onOpenChange={setMapOpen}
        initialPosition={
          value.latitude != null && value.longitude != null
            ? { lat: value.latitude, lng: value.longitude }
            : null
        }
        onConfirm={(lat, lng) => {
          onChange({ ...value, latitude: lat, longitude: lng })
          setMapOpen(false)
        }}
      />
    </div>
  )
}

export function cargoLocationDraftToInput(draft: CargoLocationDraft) {
  if (!draft.country_id || draft.latitude == null || draft.longitude == null) {
    return null
  }

  return {
    country_id: draft.country_id,
    state_id: draft.state_id ?? undefined,
    city_id: draft.city_id ?? undefined,
    address: draft.address || undefined,
    latitude: draft.latitude,
    longitude: draft.longitude,
  }
}

// Backend nuqta (lat/lng/address) va davlat/viloyat/shahar ma'lumotini alohida
// ob'ektlarda qaytaradi (`pickup_location`/`delivery_location` va `from`/`to`),
// shu sababli ularni birlashtirib formaga mos qoralamaga aylantiramiz.
export function cargoLocationFromApi(
  point: { address: string | null; latitude: number; longitude: number } | null,
  area?: {
    country: { id: number; name: string } | null
    state: { id: number; name: string } | null
    city: { id: number; name: string } | null
  } | null
): CargoLocationDraft {
  if (!point) return EMPTY_CARGO_LOCATION

  return {
    country_id: area?.country?.id ?? null,
    countryLabel: area?.country?.name ?? "",
    state_id: area?.state?.id ?? null,
    city_id: area?.city?.id ?? null,
    cityLabel: area?.city?.name ?? "",
    address: point.address ?? "",
    latitude: point.latitude,
    longitude: point.longitude,
  }
}
