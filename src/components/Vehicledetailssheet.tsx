import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Banknote,
  Building2,
  CalendarClock,
  Check,
  Copy,
  Fingerprint,
  Gauge,
  PackageCheck,
  StickyNote,
  Tag,
  Truck,
  UserRound,
} from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useVehicle } from "@/features/vehicles/Usevehicles"
import { statusBadgeClass } from "@/components/vehicle-status"
import { Button } from "./ui/button"
import { VehicleRentalAssignDialog } from "./VehicleRentalAssignDialog"
import { VehicleRentalEndDialog } from "./Vehiclerentalenddialog"

// ------------------------------------------------------------------
// Formatting helpers
// ------------------------------------------------------------------

function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return null
  const d = new Date(value.replace(" ", "T"))
  const date = d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })
  const time = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
  return `${date}, ${time}`
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

interface VehicleDetailsSheetProps {
  vehicleId: number | null
  onOpenChange: (open: boolean) => void
}

export function VehicleDetailsSheet({ vehicleId, onOpenChange }: VehicleDetailsSheetProps) {
  const { t, i18n } = useTranslation()
  const { data: vehicle, isLoading } = useVehicle(vehicleId)
  const [assignOpen, setAssignOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)

  const availabilityMeta: Record<"available" | "unavailable", { label: string; badge: string }> = {
    available: {
      label: t("Vehicles.availability.available"),
      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    unavailable: {
      label: t("Vehicles.availability.unavailable"),
      badge: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400",
    },
  }

  const availMeta = vehicle ? availabilityMeta[vehicle.is_available ? "available" : "unavailable"] : null
  const isAvailable = vehicle?.status === 'active'

  const handleCopyVin = () => {
    if (!vehicle?.vin) return
    navigator.clipboard.writeText(vehicle.vin)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Sheet open={vehicleId !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-105 gap-0 overflow-y-auto p-0 sm:max-w-105"
      >
        {isLoading && (
          <div className="space-y-4 p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        )}

        {!isLoading && vehicle && (
          <div className="flex min-h-full flex-col">
            {/* Header */}
            <SheetHeader
              className={cn(
                "relative border-b bg-linear-to-b px-6 py-4",
                isAvailable
                  ? "from-emerald-500/[0.07] via-background to-background"
                  : "from-muted/40 via-background to-background"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative shrink-0">
                    {vehicle.transport_type?.image_url && !photoFailed ? (
                      <img
                        src={vehicle.transport_type.image_url}
                        alt={vehicle.transport_type.name}
                        onError={() => setPhotoFailed(true)}
                        className={cn(
                          "w-28 h-16 rounded-2xl border bg-muted object-cover   ring-2 ring-offset-2 ring-offset-background",
                          isAvailable ? "ring-emerald-500/30" : "ring-primary/10"
                        )}
                      />
                    ) : (
                      <div
                        className={cn(
                          "flex size-16 items-center justify-center rounded-2xl text-lg font-semibold ring-2 ring-offset-2 ring-offset-background transition-colors",
                          isAvailable
                            ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400"
                            : "bg-primary/10 text-primary ring-primary/10"
                        )}
                      >
                        <Truck className="size-6" />
                      </div>
                    )}

                    <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center">
                      {isAvailable && (
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60" />
                      )}
                      <span
                        className={cn(
                          "relative size-3.5 rounded-full border-2 border-background",
                          isAvailable ? "bg-emerald-500" : "bg-muted-foreground/40"
                        )}
                      />
                    </span>
                  </div>

                  <div className="min-w-0">
                    <SheetTitle className="truncate text-lg font-semibold tracking-tight">
                      {vehicle.brand} {vehicle.model}
                    </SheetTitle>

                    <p className="mt-0.5 flex items-center gap-1.5 font-mono text-sm font-medium tracking-wide text-muted-foreground">
                      {vehicle.plate_number}
                    </p>
                  </div>
                </div>
              </div>
            </SheetHeader>

            {/* Content */}
            <div className="flex-1 space-y-7 p-5">
              {/* Vehicle information */}
              <section>
                <SectionTitle>{t("Vehicles.details.vehicleInfo")}</SectionTitle>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <InfoCard
                    icon={Fingerprint}
                    label={t("Vehicles.details.vinCode")}
                    value={vehicle.vin}
                    action={
                      <button
                        onClick={handleCopyVin}
                        className="text-muted-foreground/60 transition-colors hover:text-foreground"
                        aria-label={t("Vehicles.details.copyVinAria")}
                      >
                        {copied ? (
                          <Check className="size-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    }
                  />
                  <InfoCard
                    icon={Truck}
                    label={t("Vehicles.details.transportType")}
                    value={vehicle.transport_type?.name ?? "—"}
                  />
                  <InfoCard icon={CalendarClock} label={t("Vehicles.details.year")} value={String(vehicle.year)} />
                  <InfoCard
                    icon={Gauge}
                    label={t("Vehicles.details.mileage")}
                    value={`${Number(vehicle.mileage).toLocaleString(i18n.language)} km`}
                  />
                </div>
              </section>

              {/* Timeline */}
              <section>
                <SectionTitle>{t("Vehicles.details.historyStatus")}</SectionTitle>

                <div className="mt-3 overflow-hidden rounded-2xl border bg-card">
                  <DetailRow
                    icon={Tag}
                    label={t("Vehicles.details.status")}
                    value={
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-0 px-2 py-0.5 text-xs font-medium",
                          statusBadgeClass(vehicle.status)
                        )}
                      >
                        {vehicle.status_label}
                      </Badge>
                    }
                  />
                  <DetailRow
                    icon={PackageCheck}
                    label={t("Vehicles.details.availability")}
                    value={
                      availMeta && (
                        <Badge
                          variant="outline"
                          className={cn("border-0 px-2 py-0.5 text-xs font-medium", availMeta.badge)}
                        >
                          {availMeta.label}
                        </Badge>
                      )
                    }
                  />
                  <DetailRow
                    icon={Building2}
                    label={t("Vehicles.details.carrier")}
                    value={vehicle.carrier?.name ?? "—"}
                  />
                  <DetailRow
                    icon={Banknote}
                    label={t("Vehicles.details.activeRental")}
                    value={vehicle.active_rental ? t("Vehicles.details.yes") : t("Vehicles.details.no")}
                  />
                  <DetailRow
                    icon={CalendarClock}
                    label={t("Vehicles.details.createdAt")}
                    value={formatDateTime(vehicle.created_at, i18n.language) ?? "—"}
                  />
                  <DetailRow
                    icon={CalendarClock}
                    label={t("Vehicles.details.updatedAt")}
                    value={formatDateTime(vehicle.updated_at, i18n.language) ?? "—"}
                  />
                </div>
              </section>
              <section>
                <SectionTitle>{t("Vehicles.rentals.sectionTitle")}</SectionTitle>

                {vehicle.active_rental ? (
                  <div className="mt-3 rounded-2xl border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/5">
                        <UserRound className="size-4 text-primary/70" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {vehicle.active_rental.driver?.full_name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("Vehicles.rentals.since")} {formatDateTime(vehicle.active_rental.started_at, i18n.language)}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setEndOpen(true)}>
                        {t("Vehicles.rentals.end")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between rounded-2xl border border-dashed p-4">
                    <p className="text-sm text-muted-foreground">{t("Vehicles.rentals.noneAssigned")}</p>
                    <Button size="sm" onClick={() => setAssignOpen(true)}>
                      {t("Vehicles.rentals.assign")}
                    </Button>
                  </div>
                )}
              </section>

              {/* Notes */}
              {vehicle.notes && (
                <section>
                  <SectionTitle>{t("Vehicles.details.notes")}</SectionTitle>
                  <div className="mt-3 rounded-2xl border bg-muted/30 p-4">
                    <div className="flex gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background">
                        <StickyNote className="size-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-sm leading-6 text-foreground/80">
                        {vehicle.notes}
                      </p>
                    </div>
                  </div>j
                </section>
              )}
            </div>
          </div>
        )}
      </SheetContent>


      <VehicleRentalAssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        vehicleId={vehicleId}
      />
      <VehicleRentalEndDialog
        open={endOpen}
        onOpenChange={setEndOpen}
        rental={vehicle?.active_rental}
        vehicleId={vehicleId}
      />
    </Sheet>
  )
}

// ------------------------------------------------------------------
// Shared sub-components (identical style to EmployeeDetailsSheet)
// ------------------------------------------------------------------

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
      {children}
    </h3>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="group rounded-2xl border bg-card p-4 transition-colors hover:border-primary/20 hover:bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/5 transition-colors group-hover:bg-primary/10">
          <Icon className="size-4 text-primary/70" />
        </div>
        {action}
      </div>

      <p className="mt-3 text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="mt-1 truncate text-sm font-semibold">
            {value}
          </div>
        </TooltipTrigger>

        <TooltipContent>
          {value}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 border-b px-4 py-3.5 transition-colors last:border-b-0 hover:bg-muted/20">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/5">
        <Icon className="size-4 text-primary/70" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <div className="mt-0.5 truncate text-sm font-medium text-foreground">
          {value}
        </div>
      </div>
    </div>
  )
}