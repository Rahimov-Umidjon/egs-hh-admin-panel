import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  ArrowLeft,
  Ban,
  Box,
  Calendar,
  FileText,
  MapPin,
  Pencil,
  Snowflake,
  Thermometer,
  TriangleAlert,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useConfirm } from "@/components/confirm-provider"
import { cn } from "@/lib/utils"

import {
  useCancelCargo,
  useCargo,
  useCargoDocuments,
  useCargoTracking,
  useDeleteCargo,
} from "@/features/cargo/useCargo"
import { useCargoDocumentTypes } from "@/features/lookup/useLookup"
import type { CargoAdministrativeArea } from "@/types"

function formatCargoArea(area: CargoAdministrativeArea): string {
  const parts = [area.city?.name, area.state?.name, area.country?.name].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : "—"
}

const statusBadgeClass: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  assigned: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  delivered: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
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
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    )
  }

  const documentTypeLabel = (type: string) =>
    documentTypes?.find((dt) => dt.value === type)?.label ?? type

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Link
        to="/client/cargos"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("cargoDetail.back")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">{cargo.name}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn(statusBadgeClass[cargo.status])}>
              {t(`cargoStatus.${cargo.status}`)}
            </Badge>
            <Badge variant="outline">{t(`cargoForm.class${cargo.cargo_class === "premium" ? "Premium" : "Standard"}`)}</Badge>
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

      {cargo.cancelled_at && (
        <Card className="rounded-2xl border-rose-200 bg-rose-50/50 shadow-none dark:border-rose-500/20 dark:bg-rose-500/5">
          <CardContent className="pt-6 text-sm text-rose-700 dark:text-rose-400">
            {t("cargoDetail.cancelledNote", {
              date: new Date(cargo.cancelled_at).toLocaleString(),
            })}
            {cargo.cancel_reason && <> — {cargo.cancel_reason}</>}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border shadow-none">
        <CardContent className="space-y-4  ">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4" />
            {t("cargoDetail.route")}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t("cargoForm.pickup")}</p>
              <p className="text-sm font-medium">
                {cargo.pickup_location.address || formatCargoArea(cargo.from)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t("cargoForm.delivery")}</p>
              <p className="text-sm font-medium">
                {cargo.delivery_location.address || formatCargoArea(cargo.to)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border shadow-none">
        <CardContent className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-3">
          <InfoRow
            label={t("cargoForm.weight")}
            value={cargo.weight != null ? String(cargo.weight) : "—"}
          />
          <InfoRow
            label={t("cargoForm.volume")}
            value={cargo.volume != null ? String(cargo.volume) : "—"}
          />
          <InfoRow
            label={t("cargoForm.quantity")}
            value={cargo.quantity != null ? String(cargo.quantity) : "—"}
          />
          <InfoRow
            label={t("cargoForm.transportType")}
            value={cargo.transport_type?.name ?? "—"}
          />
          <InfoRow
            label={t("cargoForm.loadingAt")}
            value={new Date(cargo.loading_at).toLocaleString()}
          />
          <InfoRow
            label={t("cargoForm.unloadingAt")}
            value={cargo.unloading_at ? new Date(cargo.unloading_at).toLocaleString() : "—"}
          />
        </CardContent>
      </Card>

      {cargo.additional_info && (
        <Card className="rounded-2xl border shadow-none">
          <CardContent className="space-y-1  ">
            <p className="text-xs text-muted-foreground">{t("cargoForm.additionalInfo")}</p>
            <p className="text-sm">{cargo.additional_info}</p>
          </CardContent>
        </Card>
      )}

      {tracking && (
        <Card className="rounded-2xl border shadow-none">
          <CardContent className="space-y-4  ">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Calendar className="size-4" />
              {t("cargoDetail.tracking")}
            </h3>

            {tracking.driver_location && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Thermometer className="size-3.5" />
                {t("cargoDetail.driverLocation", {
                  lat: tracking.driver_location.latitude.toFixed(4),
                  lng: tracking.driver_location.longitude.toFixed(4),
                })}
              </p>
            )}

            {tracking.status_history.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("cargoDetail.noHistory")}</p>
            ) : (
              <ul className="space-y-2 border-l-2 pl-4">
                {tracking.status_history.map((entry, idx) => (
                  <li key={idx} className="relative text-sm">
                    <span className="absolute -left-[21px] top-1 size-2 rounded-full bg-primary" />
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

      <Card className="rounded-2xl border shadow-none">
        <CardContent className="space-y-3  ">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="size-4" />
            {t("cargoDetail.documents")}
          </h3>

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
  )
}
