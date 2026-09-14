import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, LocateFixed } from "lucide-react"
import {
  AdvancedMarker,
  APILoadingStatus,
  Map,
  useApiLoadingStatus,
  useMap,
  // useMapsLibrary, // TODO: Places API (qidiruv) yoqilganda qayta ochiladi
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
// import { Input } from "@/components/ui/input" // TODO: Places API (qidiruv) yoqilganda qayta ochiladi

const MAP_ID = "chat-location-picker"
// Toshkent markazi — geolokatsiya berilmagan/rad etilgan holatlar uchun boshlang'ich nuqta
const DEFAULT_CENTER = { lat: 41.311081, lng: 69.240562 }

interface ChatLocationPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (lat: number, lng: number) => void
  isSubmitting: boolean
}

export function ChatLocationPickerDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: ChatLocationPickerDialogProps) {
  const { t } = useTranslation()
  const status = useApiLoadingStatus()
  // const placesLib = useMapsLibrary("places") // TODO: Places API (qidiruv) yoqilganda qayta ochiladi
  const map = useMap(MAP_ID)
  const mapRef = useRef(map)
  const [position, setPosition] = useState(DEFAULT_CENTER)
  // const searchInputRef = useRef<HTMLInputElement>(null) // TODO: Places API (qidiruv) yoqilganda qayta ochiladi

  useEffect(() => {
    mapRef.current = map
  }, [map])

  // Dialog har ochilganda joriy geolokatsiyaga markazlashtirib boshlaymiz. Xarita hali
  // (skript yuklanayotgani sababli) tayyor bo'lmasa, `defaultCenter` mount paytida shu
  // yangilangan `position`ni o'zi oladi; xarita allaqachon ochiq bo'lsa, panTo bilan suramiz.
  useEffect(() => {
    if (!open || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const center = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setPosition(center)
        mapRef.current?.panTo(center)
      },
      () => setPosition(DEFAULT_CENTER),
      { timeout: 4000 }
    )
  }, [open])

  // TODO: Places API (manzil bo'yicha qidiruv) hozircha o'chirilgan — Google Cloud
  // Console'da "Places API" yoqilgach, quyidagi bloklarni qayta ochish kifoya.
  //
  // useEffect(() => {
  //   if (!open && searchInputRef.current) searchInputRef.current.value = ""
  // }, [open])
  //
  // // Manzil qidiruvi — Google Places Autocomplete oddiy <input>ga bog'lanadi
  // useEffect(() => {
  //   if (!open || !placesLib || !searchInputRef.current) return
  //
  //   const autocomplete = new placesLib.Autocomplete(searchInputRef.current, {
  //     fields: ["geometry", "name"],
  //     componentRestrictions: { country: "uz" },
  //   })
  //
  //   const listener = autocomplete.addListener("place_changed", () => {
  //     const place = autocomplete.getPlace()
  //     const location = place.geometry?.location
  //     if (!location) return
  //     const center = { lat: location.lat(), lng: location.lng() }
  //     setPosition(center)
  //     mapRef.current?.panTo(center)
  //     mapRef.current?.setZoom(16)
  //   })
  //
  //   return () => listener.remove()
  // }, [open, placesLib])

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
    <Dialog  open={open}  onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent
        className="sm:max-w-2xl"
        // TODO: Places API qayta yoqilganda quyidagini ham qaytaring — .pac-container
        // dialogdan tashqarida (body'da) chiqadi, aks holda Radix uni "tashqi bosish"
        // deb hisoblab dialogni yopib qo'yadi.
        // onPointerDownOutside={(event) => {
        //   if ((event.target as HTMLElement | null)?.closest(".pac-container")) {
        //     event.preventDefault()
        //   }
        // }}
      >
        <DialogHeader>
          <DialogTitle>{t("chat.location.title")}</DialogTitle>
          <DialogDescription>{t("chat.location.description")}</DialogDescription>
        </DialogHeader>

        {/* TODO: Places API (manzil bo'yicha qidiruv) yoqilganda qayta ochiladi
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={t("chat.location.searchPlaceholder")}
            className="pl-9"
            disabled={!hasApiKey || !placesLib}
            onKeyDown={(event) => {
              // Autocomplete taklifi tanlanayotganda forma submit bo'lib ketmasin
              if (event.key === "Enter") event.preventDefault()
            }}
          />
        </div>
        */}

        <div className="relative h-96 w-full overflow-hidden rounded-xl border bg-muted">
          {!hasApiKey ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{t("chat.location.apiKeyMissing")}</p>
              <p className="text-xs">VITE_GOOGLE_MAPS_API_KEY</p>
            </div>
          ) : status === APILoadingStatus.AUTH_FAILURE ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{t("chat.location.authFailure")}</p>
            </div>
          ) : status === APILoadingStatus.FAILED ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {t("chat.location.loadFailed")}
            </div>
          ) : !isLoaded ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("chat.location.loading")}
            </div>
          ) : null}

          {hasApiKey && isLoaded && open && (
            <>
              <Map
                id={MAP_ID}
                mapId="DEMO_MAP_ID"
                defaultCenter={position}
                defaultZoom={15}
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
                title={t("chat.location.currentLocation")}
              >
                <LocateFixed className="size-4" />
              </Button>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t("chat.location.cancel")}
          </Button>
          <Button
            onClick={() => onConfirm(position.lat, position.lng)}
            disabled={isSubmitting || !isLoaded || !hasApiKey}
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("chat.location.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
