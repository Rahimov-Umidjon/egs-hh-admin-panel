import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Truck } from "lucide-react"

import { cn, fixAssetUrl } from "@/lib/utils"
import type { TransportTypeOption } from "@/types"

interface TransportTypeCarouselProps {
  types: TransportTypeOption[]
  value: string
  onChange: (id: string) => void
}

function TypeImage({
  type,
  className,
}: {
  type: TransportTypeOption | undefined
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const src = fixAssetUrl(type?.image_url)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!type) return null
  return src && !failed ? (
    <img
      src={src}
      alt={type.name}
      className={cn("object-contain", className)}
      onError={() => setFailed(true)}
    />
  ) : (
    <Truck className={cn("text-muted-foreground", className)} />
  )
}

export function TransportTypeCarousel({ types, value, onChange }: TransportTypeCarouselProps) {
  const selectedIndex = types.findIndex((type) => String(type.id) === value)
  const [index, setIndex] = useState(Math.max(0, selectedIndex))

  useEffect(() => {
    if (selectedIndex >= 0) setIndex(selectedIndex)
  }, [selectedIndex])

  if (types.length === 0) return null

  const current = types[index]
  const prev = types[(index - 1 + types.length) % types.length]
  const next = types[(index + 1) % types.length]

  const goTo = (nextIndex: number) => {
    const wrapped = (nextIndex + types.length) % types.length
    setIndex(wrapped)
    onChange(String(types[wrapped].id))
  }

  return (
    <div className="rounded-2xl border-dashed border p-4">
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border text-muted-foreground hover:bg-muted"
        >
          <ChevronLeft className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => goTo(index - 1)}
          className="hidden shrink-0 opacity-40 grayscale transition hover:opacity-70 sm:block"
          tabIndex={-1}
        >
          <TypeImage type={prev} className="h-14 w-20" />
        </button>

        <div className="flex w-full max-w-52 flex-1 flex-col items-center gap-1 py-2">
          <div className="flex h-28 w-full items-center justify-center">
            <TypeImage type={current} className="h-full w-full" />
          </div>
          <p className="font-semibold text-primary">{current.name}</p>
          <p className="text-xs text-muted-foreground">
            {index + 1} / {types.length}
          </p>
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          className="hidden shrink-0 opacity-40 grayscale transition hover:opacity-70 sm:block"
          tabIndex={-1}
        >
          <TypeImage type={next} className="h-14 w-20" />
        </button>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border text-muted-foreground hover:bg-muted"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
