import { useMemo, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowRight, Loader2, MapPin, Store, Truck, X } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LocationSearchSelect } from "@/components/CargoLocationField"
import { cn } from "@/lib/utils"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useInfinitePublicCargos } from "@/features/cargo/useCargo"
import { useCitySearch, useCountrySearch, useTransportTypes } from "@/features/lookup/useLookup"
import type { CargoAdministrativeArea, CargoStatus, PublicCargo } from "@/types"

const statusBadgeClass: Record<CargoStatus, string> = {
  open: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
  assigned: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400",
  delivered: "border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400",
  cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
}

function formatArea(area: CargoAdministrativeArea): string {
  const parts = [area.city?.name, area.state?.name, area.country?.name].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : "—"
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-2 py-2 text-center">
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function PublicCargoCard({ cargo }: { cargo: PublicCargo }) {
  const { t } = useTranslation()

  return (
    <Card className="rounded-2xl border shadow-none">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">{cargo.name}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            {cargo.transport_type && (
              <Badge variant="outline" className="gap-1">
                <Truck className="size-3.5" />
                {cargo.transport_type.name}
              </Badge>
            )}
            <Badge variant="outline" className={cn(statusBadgeClass[cargo.status])}>
              {t(`cargoStatus.${cargo.status}`)}
            </Badge>
          </div>
        </div>

        <div className="flex min-w-0 items-center rounded-2xl bg-[#f7f8fa] px-5 py-3.5">
          <div className="relative mr-3.5 flex h-[68px] w-3.5 shrink-0 flex-col items-center">
            <div className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-slate-200" />
            <div className="z-10 mt-0.5 size-3 rounded-full border-2 border-[#083451] bg-white" />
            <div className="z-10 mt-auto flex size-4 items-center justify-center rounded-full bg-[#083451] text-white">
              <MapPin className="size-2.5" fill="currentColor" strokeWidth={1.5} />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="min-w-0">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {t("cargoForm.pickup")}
              </p>
              <p className="truncate text-[15px] font-semibold leading-5 text-[#263746]">
                {formatArea(cargo.from)}
              </p>
            </div>

            <div className="mt-3.5 min-w-0">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {t("cargoForm.delivery")}
              </p>
              <p className="truncate text-[15px] font-semibold leading-5 text-[#263746]">
                {formatArea(cargo.to)}
              </p>
            </div>
          </div>

          <ArrowRight className="ml-3 size-5 shrink-0 text-[#083451]" strokeWidth={1.8} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat value={cargo.weight != null ? `${cargo.weight} kg` : "—"} label={t("cargoForm.weight")} />
          <Stat value={cargo.volume != null ? `${cargo.volume} m³` : "—"} label={t("cargoForm.volume")} />
          <Stat value={cargo.quantity ?? "—"} label={t("cargoForm.quantity")} />
        </div>

        <div className="flex items-center justify-between border-t border-dashed pt-2 text-xs text-muted-foreground">
          <span>{new Date(cargo.loading_at).toLocaleDateString()}</span>
          <ArrowRight className="size-3 shrink-0" />
          <span>{cargo.unloading_at ? new Date(cargo.unloading_at).toLocaleDateString() : "—"}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function useLocationFilter() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [id, setId] = useState<number | null>(null)
  const [label, setLabel] = useState("")

  const clear = () => {
    setId(null)
    setLabel("")
  }

  return { open, setOpen, query, setQuery, id, setId, label, setLabel, clear }
}

export default function PublicCargosPage() {
  const { t } = useTranslation()

  const fromCountry = useLocationFilter()
  const fromCity = useLocationFilter()
  const toCountry = useLocationFilter()
  const toCity = useLocationFilter()
  const [transportTypeId, setTransportTypeId] = useState<string>("all")

  const debouncedFromCountryQuery = useDebouncedValue(fromCountry.query, 300)
  const debouncedFromCityQuery = useDebouncedValue(fromCity.query, 300)
  const debouncedToCountryQuery = useDebouncedValue(toCountry.query, 300)
  const debouncedToCityQuery = useDebouncedValue(toCity.query, 300)

  const { data: fromCountryResults, isFetching: fromCountryFetching } = useCountrySearch(
    debouncedFromCountryQuery,
    fromCountry.open
  )
  const { data: fromCityResults, isFetching: fromCityFetching } = useCitySearch(
    fromCountry.id,
    debouncedFromCityQuery,
    fromCity.open
  )
  const { data: toCountryResults, isFetching: toCountryFetching } = useCountrySearch(
    debouncedToCountryQuery,
    toCountry.open
  )
  const { data: toCityResults, isFetching: toCityFetching } = useCitySearch(
    toCountry.id,
    debouncedToCityQuery,
    toCity.open
  )
  const { data: transportTypes } = useTransportTypes()

  const filters = useMemo(
    () => ({
      from_city_id: fromCity.id ?? undefined,
      to_city_id: toCity.id ?? undefined,
      transport_type_id: transportTypeId !== "all" ? Number(transportTypeId) : undefined,
    }),
    [fromCity.id, toCity.id, transportTypeId]
  )

  const hasActiveFilters =
    filters.from_city_id != null || filters.to_city_id != null || filters.transport_type_id != null

  const clearFilters = () => {
    fromCountry.clear()
    fromCity.clear()
    toCountry.clear()
    toCity.clear()
    setTransportTypeId("all")
  }

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfinitePublicCargos(filters)
  const cargos = data?.pages.flatMap((page) => page.data) ?? []
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t("publicCargos.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("publicCargos.subtitle")}</p>
      </div>

      <Card className="rounded-2xl border shadow-none">
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <LocationSearchSelect
                label={t("publicCargos.filters.fromCountry")}
                placeholder={t("cargoLocation.countryPlaceholder")}
                displayValue={fromCountry.label}
                query={fromCountry.query}
                onQueryChange={fromCountry.setQuery}
                results={fromCountryResults}
                isFetching={fromCountryFetching}
                open={fromCountry.open}
                onOpenChange={fromCountry.setOpen}
                onSelect={(country) => {
                  fromCountry.setId(country.id)
                  fromCountry.setLabel(country.name)
                  fromCity.clear()
                }}
              />
              <LocationSearchSelect
                label={t("publicCargos.filters.fromCity")}
                placeholder={t("cargoLocation.cityPlaceholder")}
                disabled={!fromCountry.id}
                displayValue={fromCity.label}
                query={fromCity.query}
                onQueryChange={fromCity.setQuery}
                results={fromCityResults}
                isFetching={fromCityFetching}
                open={fromCity.open}
                onOpenChange={fromCity.setOpen}
                onSelect={(city) => {
                  fromCity.setId(city.id)
                  fromCity.setLabel(city.name)
                }}
              />
            </div>

            <div className="space-y-3">
              <LocationSearchSelect
                label={t("publicCargos.filters.toCountry")}
                placeholder={t("cargoLocation.countryPlaceholder")}
                displayValue={toCountry.label}
                query={toCountry.query}
                onQueryChange={toCountry.setQuery}
                results={toCountryResults}
                isFetching={toCountryFetching}
                open={toCountry.open}
                onOpenChange={toCountry.setOpen}
                onSelect={(country) => {
                  toCountry.setId(country.id)
                  toCountry.setLabel(country.name)
                  toCity.clear()
                }}
              />
              <LocationSearchSelect
                label={t("publicCargos.filters.toCity")}
                placeholder={t("cargoLocation.cityPlaceholder")}
                disabled={!toCountry.id}
                displayValue={toCity.label}
                query={toCity.query}
                onQueryChange={toCity.setQuery}
                results={toCityResults}
                isFetching={toCityFetching}
                open={toCity.open}
                onOpenChange={toCity.setOpen}
                onSelect={(city) => {
                  toCity.setId(city.id)
                  toCity.setLabel(city.name)
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-56 space-y-1.5">
              <Label>{t("publicCargos.filters.transportType")}</Label>
              <Select value={transportTypeId} onValueChange={setTransportTypeId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("publicCargos.filters.transportTypeAll")}</SelectItem>
                  {transportTypes?.map((tt) => (
                    <SelectItem key={tt.id} value={String(tt.id)}>
                      {tt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1.5 size-3.5" />
                {t("publicCargos.filters.clear")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : cargos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Store className="size-6" />
          </div>
          <p className="text-sm font-medium">{t("publicCargos.empty.title")}</p>
          <p className="text-sm text-muted-foreground">{t("publicCargos.empty.description")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cargos.map((cargo) => (
              <PublicCargoCard key={cargo.id} cargo={cargo} />
            ))}
          </div>

          <div ref={sentinelRef} className="flex justify-center py-4">
            {isFetchingNextPage && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
            {!hasNextPage && cargos.length > 0 && (
              <p className="text-sm text-muted-foreground">{t("cargoList.loadedAll")}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
