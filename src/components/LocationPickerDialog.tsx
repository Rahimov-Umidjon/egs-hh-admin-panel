import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, LocateFixed } from "lucide-react"
import {
  AdvancedMarker,
  APILoadingStatus,
  Map,
  useApiLoadingStatus,
  useMap,
} from "@vis.gl/react-google-maps"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Umumiy (chatga bog'liq bo'lmagan) xaritadan nuqta tanlash dialogi — Cargo
// pickup/delivery joylashuvi kabi formalarda lat/lng tanlash uchun ishlatiladi.
// `ChatLocationPickerDialog` bilan bir xil xarita mantig'i, lekin "Yuborish"
// emas "Tanlash" kabi neytral matnlar bilan.
const MAP_ID = "location-picker"
const DEFAULT_CENTER = { lat: 41.311081, lng: 69.240562 }

interface LocationPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (lat: number, lng: number) => void
  initialPosition?: { lat: number; lng: number } | null
}

export function LocationPickerDialog({
  open,
  onOpenChange,
  onConfirm,
  initialPosition,
}: LocationPickerDialogProps) {
  const { t } = useTranslation()
  const status = useApiLoadingStatus()
  const map = useMap(MAP_ID)
  const mapRef = useRef(map)
  const [position, setPosition] = useState(initialPosition ?? DEFAULT_CENTER)

  useEffect(() => {
    mapRef.current = map
  }, [map])

  useEffect(() => {
    if (!open) return
    if (initialPosition) {
      setPosition(initialPosition)
      mapRef.current?.panTo(initialPosition)
      return
    }
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const center = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setPosition(center)
        mapRef.current?.panTo(center)
      },
      () => setPosition(DEFAULT_CENTER),
      { timeout: 4000 }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const center = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setPosition(center)
      map?.panTo(center)
    })
  }, [map])

  const hasApiKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
  const isLoaded = status === APILoadingStatus.LOADED

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("locationPicker.title")}</DialogTitle>
          <DialogDescription>{t("locationPicker.description")}</DialogDescription>
        </DialogHeader>

        <div className="relative h-96 w-full overflow-hidden rounded-xl border bg-muted">
          {!hasApiKey ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{t("locationPicker.apiKeyMissing")}</p>
              <p className="text-xs">VITE_GOOGLE_MAPS_API_KEY</p>
            </div>
          ) : status === APILoadingStatus.AUTH_FAILURE ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{t("locationPicker.authFailure")}</p>
            </div>
          ) : status === APILoadingStatus.FAILED ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {t("locationPicker.loadFailed")}
            </div>
          ) : !isLoaded ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("locationPicker.loading")}
            </div>
          ) : null}

          {hasApiKey && isLoaded && open && (
            <>
              <Map
                id={MAP_ID}
                mapId="DEMO_MAP_ID"
                defaultCenter={position}
                defaultZoom={13}
                gestureHandling="greedy"
                disableDefaultUI
                zoomControl
                className="h-full w-full"
                onClick={(event) => {
                  if (!event.detail.latLng) return
                  setPosition(event.detail.latLng)
                }}
              >
                <AdvancedMarker
                  position={position}
                  draggable
                  onDragEnd={(event) => {
                    const latLng = event.latLng
                    if (latLng) setPosition({ lat: latLng.lat(), lng: latLng.lng() })
                  }}
                />
              </Map>

              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute bottom-3 right-3 cursor-pointer shadow"
                onClick={handleUseCurrentLocation}
                title={t("locationPicker.currentLocation")}
              >
                <LocateFixed className="size-4" />
              </Button>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("locationPicker.cancel")}
          </Button>
          <Button
            onClick={() => onConfirm(position.lat, position.lng)}
            disabled={!isLoaded || !hasApiKey}
          >
            {t("locationPicker.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
