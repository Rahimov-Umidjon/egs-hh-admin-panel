import { AdvancedMarker, Map } from "@vis.gl/react-google-maps"
import { MapPin } from "lucide-react"

import { cn } from "@/lib/utils"

interface ChatLocationPreviewProps {
  lat: number
  lng: number
  mine: boolean
  label: string
}

// Xabar pufakchasi ichida kichik, o'zaro ta'sirsiz xarita — bosilsa to'liq Google Maps
// yangi tabda ochiladi. `pointer-events-none` xaritani "faqat ko'rish uchun" qiladi va
// bosishni ostidagi <a> havolasiga o'tkazadi.
export function ChatLocationPreview({ lat, lng, mine, label }: ChatLocationPreviewProps) {
  const position = { lat, lng }

  return (
    <a
      href={`https://www.google.com/maps?q=${lat},${lng}`}
      target="_blank"
      rel="noreferrer"
      className="block"
    >
      <div className="h-44 w-[280px] overflow-hidden rounded-lg">
        <Map
          defaultCenter={position}
          defaultZoom={15}
          mapId="DEMO_MAP_ID"
          disableDefaultUI
          gestureHandling="none"
          keyboardShortcuts={false}
          className="pointer-events-none h-full w-full"
        >
          <AdvancedMarker position={position} />
        </Map>
      </div>
      <span
        className={cn(
          "mt-1.5 flex items-center gap-1.5 underline underline-offset-2",
          mine ? "text-primary-foreground" : "text-foreground"
        )}
      >
        <MapPin className="size-3.5" />
        {label}
      </span>
    </a>
  )
}
