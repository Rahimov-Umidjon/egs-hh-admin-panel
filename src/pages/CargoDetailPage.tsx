import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Box,
  Calendar,
  ChevronRight,
  FileText,
  Handshake,
  MapPin,
  Pencil,
  Snowflake,
  TriangleAlert,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useConfirm } from "@/components/confirm-provider"
import { CargoRouteMap } from "@/components/CargoRouteMap"
import { cn } from "@/lib/utils"

import {
  useCancelCargo,
  useCargo,
  useCargoDocuments,
  useCargoTracking,
  useDeleteCargo,
} from "@/features/cargo/useCargo"
import { useCargoOffers } from "@/features/cargo/useCargoOffers"
import { useCargoDocumentTypes } from "@/features/lookup/useLookup"
import type { CargoAdministrativeArea, CargoOfferStatus } from "@/types"

const numberFormatter = new Intl.NumberFormat("ru-RU")

const offerStatusBadgeClass: Record<CargoOfferStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
  rejected: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400",
}

const statusBadgeClass: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  assigned: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  delivered: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
}

function formatCargoArea(area: CargoAdministrativeArea): string {
  const parts = [area.city?.name, area.state?.name, area.country?.name].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : "—"
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2.5 text-center">
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export default function CargoDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const params = useParams<{ id: string }>()
  const id = Number(params.id)

  const { data: cargo, isLoading } = useCargo(id)
  const { data: tracking } = useCargoTracking(id)
  const { data: documents } = useCargoDocuments(id)
  const { data: offers } = useCargoOffers(id)
  const { data: documentTypes } = useCargoDocumentTypes()

  const cancelCargo = useCancelCargo()
  const deleteCargo = useDeleteCargo()

  const handleCancel = () => {
    if (!cargo) return
    confirm({
      title: t("cargoList.cancelConfirm.title"),
      description: t("cargoList.cancelConfirm.description", { name: cargo.name }),
      confirmText: t("cargoList.cancelConfirm.confirm"),
      variant: "destructive",
      fields: [
        {
          name: "reason",
          label: t("cargoList.cancelConfirm.reasonLabel"),
          placeholder: t("cargoList.cancelConfirm.reasonPlaceholder"),
          multiline: true,
        },
      ],
      onConfirm: async (values) => {
        await cancelCargo.mutateAsync({ id, reason: values.reason || undefined })
        toast.success(t("cargoList.cancelSuccess"))
      },
    })
  }

  const handleDelete = () => {
    if (!cargo) return
    confirm({
      title: t("cargoList.deleteConfirm.title"),
      description: t("cargoList.deleteConfirm.description", { name: cargo.name }),
      confirmText: t("cargoList.deleteConfirm.confirm"),
      variant: "destructive",
      onConfirm: async () => {
        await deleteCargo.mutateAsync(id)
        toast.success(t("cargoList.deleteSuccess"))
        navigate("/client/cargos")
      },
    })
  }

  if (isLoading || !cargo) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  const documentTypeLabel = (type: string) =>
    documentTypes?.find((dt) => dt.value === type)?.label ?? type

  return (
    <div className="  w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="shrink-0" asChild>
            <Link to="/client/cargos" aria-label={t("cargoDetail.back")}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{cargo.name}</h2>
            <p className="text-sm text-muted-foreground">{t("cargoDetail.idLabel", { id: cargo.id })}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {cargo.status === "open" && (
            <Button variant="outline" asChild>
              <Link to={`/client/cargos/${cargo.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                {t("cargoDetail.edit")}
              </Link>
            </Button>
          )}
          {(cargo.status === "open" ||
            cargo.status === "assigned" ||
            cargo.status === "in_progress") && (
            <Button variant="outline" onClick={handleCancel}>
              <Ban className="mr-2 size-4" />
              {t("cargoDetail.cancel")}
            </Button>
          )}
          {cargo.status === "open" && (
            <Button variant="outline" className="text-rose-600" onClick={handleDelete}>
              <Trash2 className="mr-2 size-4" />
              {t("cargoDetail.delete")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn(statusBadgeClass[cargo.status])}>
          {t(`cargoStatus.${cargo.status}`)}
        </Badge>
        <Badge variant="outline">
          {t(`cargoForm.class${cargo.cargo_class === "premium" ? "Premium" : "Standard"}`)}
        </Badge>
        {cargo.fragile && (
          <Badge variant="outline" className="gap-1">
            <Box className="size-3.5" />
            {t("cargoForm.fragile")}
          </Badge>
        )}
        {cargo.dangerous && (
          <Badge variant="outline" className="gap-1">
            <TriangleAlert className="size-3.5" />
            {t("cargoForm.dangerous")}
          </Badge>
        )}
        {cargo.temperature_controlled && (
          <Badge variant="outline" className="gap-1">
            <Snowflake className="size-3.5" />
            {t("cargoForm.temperatureControlled")}
          </Badge>
        )}
      </div>

      {cargo.cancelled_at && (
        <Card className="rounded-2xl border-rose-200 bg-rose-50/50 shadow-none dark:border-rose-500/20 dark:bg-rose-500/5">
          <CardContent className="text-sm text-rose-700 dark:text-rose-400">
            {t("cargoDetail.cancelledNote", {
              date: new Date(cargo.cancelled_at).toLocaleString(),
            })}
            {cargo.cancel_reason && <> — {cargo.cancel_reason}</>}
          </CardContent>
        </Card>
      )}

      {tracking && tracking.status_history.length > 0 && (
        <Card className="rounded-2xl border shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">{t("cargoDetail.deliveryStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              {tracking.status_history.map((entry, idx) => {
                const isCurrent = idx === tracking.status_history.length - 1
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap",
                        isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {t(`cargoStatus.${entry.status}`, entry.status)}
                    </span>
                    {idx < tracking.status_history.length - 1 && (
                      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="rounded-2xl border shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="size-4" />
                {t("cargoDetail.route")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">
                  {cargo.pickup_location.address || formatCargoArea(cargo.from)}
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="font-medium">
                  {cargo.delivery_location.address || formatCargoArea(cargo.to)}
                </span>
              </div>
              <CargoRouteMap
                pickup={{
                  lat: cargo.pickup_location.latitude,
                  lng: cargo.pickup_location.longitude,
                  label: cargo.pickup_location.address || formatCargoArea(cargo.from),
                }}
                delivery={{
                  lat: cargo.delivery_location.latitude,
                  lng: cargo.delivery_location.longitude,
                  label: cargo.delivery_location.address || formatCargoArea(cargo.to),
                }}
                driverLocation={
                  tracking?.driver_location
                    ? {
                        lat: tracking.driver_location.latitude,
                        lng: tracking.driver_location.longitude,
                        updatedAt: tracking.driver_location.updated_at,
                      }
                    : null
                }
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardHeader>
              <CardTitle className="text-sm">{t("cargoDetail.info")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat
                  value={cargo.weight != null ? `${cargo.weight} kg` : "—"}
                  label={t("cargoForm.weight")}
                />
                <Stat
                  value={cargo.volume != null ? `${cargo.volume} m³` : "—"}
                  label={t("cargoForm.volume")}
                />
                <Stat
                  value={cargo.quantity != null ? String(cargo.quantity) : "—"}
                  label={t("cargoForm.quantity")}
                />
                <Stat value={cargo.transport_type?.name ?? "—"} label={t("cargoForm.transportType")} />
                <Stat
                  value={
                    cargo.dimensions.length != null ||
                    cargo.dimensions.width != null ||
                    cargo.dimensions.height != null
                      ? `${cargo.dimensions.length ?? "—"} × ${cargo.dimensions.width ?? "—"} × ${cargo.dimensions.height ?? "—"} sm`
                      : "—"
                  }
                  label={t("cargoDetail.dimensions")}
                />
                <Stat
                  value={new Date(cargo.loading_at).toLocaleDateString()}
                  label={t("cargoForm.loadingAt")}
                />
                <Stat
                  value={cargo.unloading_at ? new Date(cargo.unloading_at).toLocaleDateString() : "—"}
                  label={t("cargoForm.unloadingAt")}
                />
              </div>
            </CardContent>
          </Card>

          {cargo.additional_info && (
            <Card className="rounded-2xl border shadow-none">
              <CardContent className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("cargoForm.additionalInfo")}</p>
                <p className="text-sm">{cargo.additional_info}</p>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Handshake className="size-4" />
                {t("cargoOffers.title")}
                {offers && offers.data.length > 0 && (
                  <Badge variant="secondary" className="rounded-full">
                    {offers.pagination.total}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const acceptedOffer = offers?.data.find((o) => o.status === "accepted")
                if (!acceptedOffer) return null
                return (
                  <div className="rounded-xl border bg-muted/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">{t("cargoOffers.amount")}</p>
                        <p className="text-lg font-semibold">
                          {acceptedOffer.currency.symbol}
                          {numberFormatter.format(acceptedOffer.amount)}
                        </p>
                      </div>
                      {acceptedOffer.advance_amount != null && (
                        <div>
                          <p className="text-xs text-muted-foreground">{t("cargoOffers.advanceAmount")}</p>
                          <p className="font-medium">
                            {acceptedOffer.currency.symbol}
                            {numberFormatter.format(acceptedOffer.advance_amount)}
                          </p>
                        </div>
                      )}
                      {acceptedOffer.payment_terms && (
                        <div>
                          <p className="text-xs text-muted-foreground">{t("cargoOffers.paymentTerms")}</p>
                          <p className="font-medium">{acceptedOffer.payment_terms}</p>
                        </div>
                      )}
                      <Badge
                        variant="outline"
                        className={cn("rounded-full py-1", offerStatusBadgeClass[acceptedOffer.status])}
                      >
                        {t(`cargoOffers.status.${acceptedOffer.status}`, acceptedOffer.status_label)}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <Link to={`/client/cargos/${id}/offers/${acceptedOffer.id}`}>
                        {t("cargoOffers.viewDetails")}
                        <ChevronRight className="ml-1 size-4" />
                      </Link>
                    </Button>
                  </div>
                )
              })()}

              {!offers || offers.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("cargoOffers.empty")}</p>
              ) : (
                <ul className="space-y-2">
                  {offers.data.map((offer) => (
                    <li key={offer.id}>
                      <Link
                        to={`/client/cargos/${id}/offers/${offer.id}`}
                        className="flex w-full items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2.5 text-left hover:bg-muted"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{offer.proposer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {offer.currency.symbol}
                            {numberFormatter.format(offer.amount)} ·{" "}
                            {new Date(offer.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn("rounded-full py-1", offerStatusBadgeClass[offer.status])}
                          >
                            {t(`cargoOffers.status.${offer.status}`, offer.status_label)}
                          </Badge>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {tracking && (
            <Card className="rounded-2xl border shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4" />
                  {t("cargoDetail.tracking")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tracking.status_history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("cargoDetail.noHistory")}</p>
                ) : (
                  <ul className="space-y-2 border-l-2 pl-4">
                    {tracking.status_history.map((entry, idx) => (
                      <li key={idx} className="relative text-sm">
                        <span className="absolute -left-5.25 top-1 size-2 rounded-full bg-primary" />
                        <span className="font-medium">{t(`cargoStatus.${entry.status}`, entry.status)}</span>{" "}
                        <span className="text-muted-foreground">
                          {new Date(entry.changed_at).toLocaleString()}
                        </span>
                        {entry.note && <p className="text-muted-foreground">{entry.note}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="size-4" />
                {t("cargoDetail.documents")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!documents || documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("cargoDetail.noDocuments")}</p>
              ) : (
                <ul className="space-y-2">
                  {documents.map((doc) => (
                    <li key={doc.id}>
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm hover:bg-muted"
                        >
                          <FileText className="size-4 text-muted-foreground" />
                          {doc.label ?? documentTypeLabel(doc.type)}
                        </a>
                      ) : (
                        <span className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                          <FileText className="size-4 text-muted-foreground" />
                          {doc.label ?? documentTypeLabel(doc.type)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
