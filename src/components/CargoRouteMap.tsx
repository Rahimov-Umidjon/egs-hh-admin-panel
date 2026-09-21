import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AdvancedMarker,
  APILoadingStatus,
  InfoWindow,
  Map,
  Pin,
  Polyline,
  useApiLoadingStatus,
  useMap,
} from "@vis.gl/react-google-maps"

const MAP_ID = "cargo-route-map"

interface LatLng {
  lat: number
  lng: number
}

interface CargoRouteMapProps {
  pickup: LatLng & { label: string }
  delivery: LatLng & { label: string }
  driverLocation?: (LatLng & { updatedAt?: string }) | null
}

// Ikki nuqta orasidagi to'g'ri chiziqli (havo yo'li) masofa — haqiqiy yo'l masofasi
// emas, chunki bu uchun Directions API kerak bo'lardi; shu sababli faqat taxminiy
// masofa sifatida ko'rsatiladi.
function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

function formatRelativeTime(iso: string, t: (key: string, opts?: Record<string, unknown>) => string) {
  const diffMinutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMinutes < 1) return t("common.justNow")
  if (diffMinutes < 60) return t("common.minutesAgo", { count: diffMinutes })
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return t("common.hoursAgo", { count: diffHours })
  return t("common.daysAgo", { count: Math.round(diffHours / 24) })
}

export function CargoRouteMap({ pickup, delivery, driverLocation }: CargoRouteMapProps) {
  const { t } = useTranslation()
  const status = useApiLoadingStatus()
  const map = useMap(MAP_ID)
  const mapRef = useRef(map)
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    mapRef.current = map
  }, [map])

  const hasApiKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
  const isLoaded = status === APILoadingStatus.LOADED

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return
    const points = driverLocation ? [pickup, delivery, driverLocation] : [pickup, delivery]
    const lats = points.map((p) => p.lat)
    const lngs = points.map((p) => p.lng)
    mapRef.current.fitBounds(
      { north: Math.max(...lats), south: Math.min(...lats), east: Math.max(...lngs), west: Math.min(...lngs) },
      56
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, pickup.lat, pickup.lng, delivery.lat, delivery.lng, driverLocation?.lat, driverLocation?.lng])

  const distanceKm = haversineKm(pickup, delivery)

  if (!hasApiKey) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-1 rounded-xl border bg-muted px-6 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{t("locationPicker.apiKeyMissing")}</p>
        <p className="text-xs">VITE_GOOGLE_MAPS_API_KEY</p>
      </div>
    )
  }

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl border">
      <Map
        id={MAP_ID}
        mapId="DEMO_MAP_ID"
        defaultCenter={pickup}
        defaultZoom={8}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        className="h-full w-full"
      >
        <Polyline
          path={[pickup, delivery]}
          strokeColor="#083451"
          strokeOpacity={0.6}
          strokeWeight={3}
          geodesic
        />
        <AdvancedMarker position={pickup} title={pickup.label}>
          <Pin background="#2563eb" borderColor="#1d4ed8" glyphColor="#ffffff" />
        </AdvancedMarker>
        <AdvancedMarker position={delivery} title={delivery.label}>
          <Pin background="#ea580c" borderColor="#c2410c" glyphColor="#ffffff" />
        </AdvancedMarker>
        {driverLocation && (
          <AdvancedMarker position={driverLocation} onClick={() => setInfoOpen(true)}>
            <Pin background="#16a34a" borderColor="#15803d" glyphColor="#ffffff" />
          </AdvancedMarker>
        )}
        {driverLocation && infoOpen && (
          <InfoWindow position={driverLocation} onCloseClick={() => setInfoOpen(false)}>
            <div className="text-xs">
              <p className="font-medium">{t("cargoDetail.driverLocationTitle")}</p>
              <p>
                {driverLocation.lat.toFixed(4)}°, {driverLocation.lng.toFixed(4)}°
              </p>
            </div>
          </InfoWindow>
        )}
      </Map>

      <div className="absolute top-3 left-3 flex items-center gap-3 rounded-full bg-white/90 px-3 py-1.5 text-xs shadow">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-blue-600" />
          {t("cargoDetail.origin")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-orange-600" />
          {t("cargoDetail.destination")}
        </span>
        {driverLocation && (
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-600" />
            {t("cargoDetail.driver")}
          </span>
        )}
      </div>

      <div className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold shadow">
        ≈{distanceKm.toFixed(0)} km
      </div>

      {driverLocation?.updatedAt && (
        <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-xs text-muted-foreground shadow">
          {t("cargoDetail.lastUpdated", { time: formatRelativeTime(driverLocation.updatedAt, t) })}
        </div>
      )}
    </div>
  )
}
