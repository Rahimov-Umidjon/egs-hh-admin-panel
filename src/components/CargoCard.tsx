import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Handshake,
  MapPin,
  Pencil,
  Trash2,
  Truck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn, fixAssetUrl } from "@/lib/utils"
import type { CargoAdministrativeArea, CargoClass, CargoStatus } from "@/types"

const statusBadgeClass: Record<CargoStatus, string> = {
  open: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
  assigned: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400",
  delivered: "border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400",
  cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
}

export interface CargoCardData {
  id?: number
  name: string
  status: CargoStatus
  cargo_class: CargoClass
  from: CargoAdministrativeArea
  to: CargoAdministrativeArea
  weight: number | null
  volume: number | null
  quantity: number | null
  dimensions: {
    length: number | null
    width: number | null
    height: number | null
  }
  fragile: boolean
  dangerous: boolean
  temperature_controlled: boolean
  transport_requirements: string | null
  transport_type: { id: number; name: string; image_url?: string | null } | null
  additional_info: string | null
  loading_at: string
  unloading_at: string | null
  offers_count: number
  view_count: number
  created_at: string
}

interface CargoCardProps {
  cargo: CargoCardData
  detailHref?: string
  editHref?: string
  onClose?: () => void
  className?: string
}

function routePart(area: CargoAdministrativeArea) {
  return [area.city?.name, area.state?.name, area.country?.name].filter(Boolean).join(", ") || "—"
}

function formatRelativeTime(value: string, t: (key: string, opts?: Record<string, unknown>) => string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.round(diffMs / 60000)

  if (diffMinutes < 1) return t("common.justNow")
  if (diffMinutes < 60) return t("common.minutesAgo", { count: diffMinutes })

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return t("common.hoursAgo", { count: diffHours })

  const diffDays = Math.round(diffHours / 24)
  return t("common.daysAgo", { count: diffDays })
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export function CargoCard({ cargo, detailHref, editHref, onClose, className }: CargoCardProps) {
  const { t } = useTranslation()
  const [imageFailed, setImageFailed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const transportImageSrc = fixAssetUrl(cargo.transport_type?.image_url)

  const hasMoreDetails =
    cargo.dimensions.length != null ||
    cargo.dimensions.width != null ||
    cargo.dimensions.height != null ||
    Boolean(cargo.unloading_at) ||
    Boolean(cargo.transport_requirements) ||
    Boolean(cargo.additional_info) ||
    cargo.fragile ||
    cargo.dangerous ||
    cargo.temperature_controlled

  // `cargo` prop o'zgarganda (masalan, formada boshqa transport turi tanlanganda) bu
  // komponent instansi qayta ishlatiladi — shu sababli oldingi rasm xatosi holati
  // yangi rasm uchun ham "yopishib qolmasligi" kerak.
  useEffect(() => {
    setImageFailed(false)
  }, [transportImageSrc])

  return (
    <Card
      className={`flex h-full flex-col rounded-2xl border shadow-none transition-[height] duration-200 ease-in-out ${className ?? ""}`}
    >
      <CardContent className="flex h-full flex-col">
        <div className="flex-1 space-y-2 text-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                <Eye className="size-3" />
                {cargo.view_count}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                <Handshake className="size-3" />
                {cargo.offers_count}
              </span>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
              <Clock className="size-3" />
              {formatRelativeTime(cargo.created_at, t)}
            </span>
          </div>

          <div className="flex items-start gap-3">
            {/* <div className="flex flex-col items-center gap-1">
              <div className="flex size-24 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
                {transportImageSrc && !imageFailed ? (
                  <img
                    src={transportImageSrc}
                    alt={cargo.transport_type?.name ?? ""}
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <div className="flex h-[58px] w-[110px] items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Truck className="size-6" />
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {cargo.transport_type?.name ?? "—"}
              </span>
            </div> */}

            <div className="flex min-w-0 flex-1 items-center rounded-2xl bg-[#f7f8fa] px-5 py-3.5">
              {/* Timeline */}
              <div className="relative mr-3.5 flex h-[68px] w-3.5 shrink-0 flex-col items-center">
                <div className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-slate-200" />

                <div className="z-10 mt-0.5 size-3 rounded-full border-2 border-[#083451] bg-white" />

                <div className="z-10 mt-auto flex size-4 items-center justify-center rounded-full bg-[#083451] text-white">
                  <MapPin className="size-2.5" fill="currentColor" strokeWidth={1.5} />
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="min-w-0">
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {t("cargoForm.pickup")}
                  </p>
                  <p className="text-[15px] font-semibold leading-5 text-[#263746]">
                    {routePart(cargo.from)}
                  </p>
                </div>

                <div className="mt-3.5 min-w-0">
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {t("cargoForm.delivery")}
                  </p>
                  <p className="text-[15px] font-semibold leading-5 text-[#263746]">
                    {routePart(cargo.to)}
                  </p>
                </div>
              </div>

              <ArrowRight className="ml-3 size-5 shrink-0 text-[#083451]" strokeWidth={1.8} />
            </div>
          </div>

          <Stat label={t("cargoForm.name")} value={cargo.name || "—"} />

          <div className="h-36 space-y-1.5 overflow-y-auto border-t border-dashed pt-3">
            {cargo.weight != null && <Stat label={t("cargoForm.weight")} value={`${cargo.weight} kg`} />}
            {cargo.volume != null && <Stat label={t("cargoForm.volume")} value={`${cargo.volume} m³`} />}
            {cargo.quantity != null && (
              <Stat label={t("cargoForm.quantity")} value={String(cargo.quantity)} />
            )}
            <Stat
              label={t("cargoForm.loadingAt")}
              value={new Date(cargo.loading_at).toLocaleDateString()}
            />
            <Stat
              label={t("cargoForm.cargoClass")}
              value={t(`cargoForm.class${cargo.cargo_class === "premium" ? "Premium" : "Standard"}`)}
            />

            {expanded && (
              <div className="animate-in fade-in space-y-1.5 duration-200">
                {cargo.dimensions.length != null && (
                  <Stat label={t("cargoForm.length")} value={`${cargo.dimensions.length} sm`} />
                )}
                {cargo.dimensions.width != null && (
                  <Stat label={t("cargoForm.width")} value={`${cargo.dimensions.width} sm`} />
                )}
                {cargo.dimensions.height != null && (
                  <Stat label={t("cargoForm.height")} value={`${cargo.dimensions.height} sm`} />
                )}
                {cargo.unloading_at && (
                  <Stat
                    label={t("cargoForm.unloadingAt")}
                    value={new Date(cargo.unloading_at).toLocaleDateString()}
                  />
                )}
                {cargo.transport_requirements && (
                  <Stat
                    label={t("cargoForm.transportRequirements")}
                    value={cargo.transport_requirements}
                  />
                )}
                {cargo.additional_info && (
                  <Stat label={t("cargoForm.additionalInfo")} value={cargo.additional_info} />
                )}
                {cargo.fragile && <Stat label={t("cargoForm.fragile")} value="✓" />}
                {cargo.dangerous && <Stat label={t("cargoForm.dangerous")} value="✓" />}
                {cargo.temperature_controlled && (
                  <Stat label={t("cargoForm.temperatureControlled")} value="✓" />
                )}
              </div>
            )}
          </div>

          {hasMoreDetails && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex cursor-pointer w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {expanded ? (
                <>
                  {t("cargoList.card.showLess")}
                  <ChevronUp className="size-3.5" />
                </>
              ) : (
                <>
                  {t("cargoList.card.showMore")}
                  <ChevronDown className="size-3.5" />
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-dashed mt-2 pt-2">
          <Badge variant="outline" className={cn("rounded py-1 px-2", statusBadgeClass[cargo.status])}>
            {t(`cargoStatus.${cargo.status}`)}
          </Badge>

          <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-md border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300"
            disabled={!detailHref}
            asChild={Boolean(detailHref)}
            aria-label={t("cargoList.actions.view")}
          >
            {detailHref ? (
              <Link to={detailHref}>
                <Eye className="size-4" />
              </Link>
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-md border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300"
            disabled={!editHref}
            asChild={Boolean(editHref)}
            aria-label={t("cargoList.actions.edit")}
          >
            {editHref ? (
              <Link to={editHref}>
                <Pencil className="size-4" />
              </Link>
            ) : (
              <Pencil className="size-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-md border-rose-100 bg-rose-50/60 text-rose-500 hover:bg-rose-100 disabled:opacity-40 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
            disabled={!onClose}
            onClick={onClose}
            aria-label={t("cargoList.actions.close")}
          >
            <Trash2 className="size-4" />
          </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
