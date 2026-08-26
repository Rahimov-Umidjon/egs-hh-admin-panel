import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

import { cn } from "@/lib/utils"
import { getErrorMessage } from "@/lib/Api-error"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useConfirm } from "@/components/confirm-provider"
import { statusBadgeClass } from "@/components/vehicle-status"
import { VehicleFormDialog } from "@/components/Vehicleformdialog"
import { VehicleDetailsSheet } from "@/components/Vehicledetailssheet"
import {
  useDeleteVehicle,
  useUpdateVehicle,
  useVehicles,
} from "@/features/vehicles/Usevehicles"
import type { Vehicle, VehicleStatus } from "@/types"

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return null
  return new Date(value.replace(" ", "T")).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function getPageRange(current: number, last: number): (number | "ellipsis")[] {
  const delta = 1
  const range: (number | "ellipsis")[] = []
  const start = Math.max(2, current - delta)
  const end = Math.min(last - 1, current + delta)

  range.push(1)
  if (start > 2) range.push("ellipsis")
  for (let i = start; i <= end; i++) range.push(i)
  if (end < last - 1) range.push("ellipsis")
  if (last > 1) range.push(last)

  return range
}

export default function VehiclesPage() {
  const { t, i18n } = useTranslation()

  const statusFilterOptions: { value: VehicleStatus; label: string }[] = [
    { value: "active", label: t("Vehicles.status.active") },
    { value: "inactive", label: t("Vehicles.status.inactive") },
    { value: "repair", label: t("Vehicles.status.repair") },
    { value: "sold", label: t("Vehicles.status.sold") },
  ]

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<VehicleStatus | undefined>()
  const [availability, setAvailability] = useState<"available" | "unavailable" | undefined>()
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)

  const debouncedSearch = useDebouncedValue(search, 400)
  const hasActiveFilters = Boolean(search || status || availability)

  const clearFilters = () => {
    setSearch("")
    setStatus(undefined)
    setAvailability(undefined)
    setPage(1)
  }

  const { data, isLoading, isFetching, isError, error, refetch } = useVehicles({
    search: debouncedSearch || undefined,
    status,
    is_available:
      availability === "available" ? true : availability === "unavailable" ? false : undefined,
    sort_by: "created_at",
    sort_direction: "desc",
    per_page: perPage,
    page,
  })

  const vehicles = data?.data ?? []
  const pagination = data?.pagination

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [viewingId, setViewingId] = useState<number | null>(null)

  const updateMutation = useUpdateVehicle()
  const deleteMutation = useDeleteVehicle()
  const confirm = useConfirm()

  const openCreate = () => {
    setEditingId(null)
    setFormOpen(true)
  }

  const openEdit = (id: number) => {
    setEditingId(id)
    setFormOpen(true)
  }

  const handleToggleAvailability = (id: number, current: boolean, label: string) => {
    updateMutation.mutate({ id, payload: { is_available: !current } })
    void label
  }

  const handleDelete = (id: number, label: string) => {
    confirm({
      title: t("Vehicles.deleteConfirm.title"),
      description: t("Vehicles.deleteConfirm.description", { label }),
      confirmText: t("Vehicles.deleteConfirm.confirm"),
      variant: "destructive",
      onConfirm: async () => {
        await deleteMutation.mutateAsync(id)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("Vehicles.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("Vehicles.subtitle")}</p>
        </div>
        <Button onClick={openCreate} className="shadow-sm">
          <Plus className="mr-2 size-4" /> {t("Vehicles.addNew")}
        </Button>
      </div>

      {/* Filterlar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("Vehicles.searchPlaceholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={status ?? "all"}
          onValueChange={(v) => {
            setStatus(v === "all" ? undefined : (v as VehicleStatus))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("Vehicles.status.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Vehicles.status.all")}</SelectItem>
            {statusFilterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={availability ?? "all"}
          onValueChange={(v) => {
            setAvailability(v === "all" ? undefined : (v as "available" | "unavailable"))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("Vehicles.availability.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Vehicles.availability.all")}</SelectItem>
            <SelectItem value="available">{t("Vehicles.availability.available")}</SelectItem>
            <SelectItem value="unavailable">{t("Vehicles.availability.unavailable")}</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 size-3.5" />
            {t("Vehicles.clearFilters")}
          </Button>
        )}

        {!isLoading && !isError && (
          <p className="ml-auto shrink-0 text-sm text-muted-foreground">
            {t("Vehicles.totalCount", { count: pagination?.total ?? 0 })}
          </p>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 py-20 text-center">
          <AlertTriangle className="size-9 text-destructive/70" />
          <div>
            <p className="font-medium text-foreground">{t("Vehicles.loadError.title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{getErrorMessage(error)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 size-3.5" />
            {t("Vehicles.loadError.retry")}
          </Button>
        </div>
      )}

      {!isLoading && !isError && vehicles.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center text-muted-foreground">
          <Truck className="mb-3 size-10 opacity-40" />
          <p className="font-medium text-foreground">
            {hasActiveFilters ? t("Vehicles.empty.filteredTitle") : t("Vehicles.empty.title")}
          </p>
          <p className="text-sm">
            {hasActiveFilters ? t("Vehicles.empty.filteredSubtitle") : t("Vehicles.empty.subtitle")}
          </p>
          {!hasActiveFilters && (
            <Button size="sm" className="mt-4" onClick={openCreate}>
              <Plus className="mr-2 size-3.5" /> {t("Vehicles.addNew")}
            </Button>
          )}
        </div>
      )}

      {!isLoading && !isError && vehicles.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>{t("Vehicles.table.vehicle")}</TableHead>
                <TableHead>{t("Vehicles.table.vin")}</TableHead>
                <TableHead>{t("Vehicles.table.transportType")}</TableHead>
                <TableHead>{t("Vehicles.table.year")}</TableHead>
                <TableHead>{t("Vehicles.table.mileage")}</TableHead>
                <TableHead>{t("Vehicles.table.status")}</TableHead>
                <TableHead>{t("Vehicles.table.availability")}</TableHead>
                <TableHead>{t("Vehicles.table.createdAt")}</TableHead>
                <TableHead className="text-right">{t("Vehicles.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => {
                const label = `${vehicle.brand} ${vehicle.model} (${vehicle.plate_number})`
                return (
                  <TableRow
                    key={vehicle.id}
                    className="cursor-pointer"
                    onClick={() => setViewingId(vehicle.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <VehicleThumb vehicle={vehicle} />
                        <div>
                          <p className="font-medium leading-none text-foreground">
                            {vehicle.brand} {vehicle.model}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{vehicle.plate_number}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{vehicle.vin}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {vehicle.transport_type?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{vehicle.year}</TableCell>
                    <TableCell className="text-sm font-medium tabular-nums">
                      {Number(vehicle.mileage).toLocaleString(i18n.language)} km
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("border-0 px-2 py-0.5 text-xs font-medium", statusBadgeClass(vehicle.status))}
                      >
                        {vehicle.status_label}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(vehicle.id, vehicle.is_available, label)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
                          vehicle.is_available
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-500/10 dark:text-slate-400"
                        )}
                      >
                        {vehicle.is_available ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : (
                          <Circle className="size-3.5" />
                        )}
                        {vehicle.is_available ? t("Vehicles.availability.available") : t("Vehicles.availability.unavailable")}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(vehicle.created_at, i18n.language)}
                    </TableCell>

                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => setViewingId(vehicle.id)}>
                            <Eye className="size-4" />
                            {t("Vehicles.actionsMenu.view")}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(vehicle.id)}>
                            <Pencil className="size-4" />
                            {t("Vehicles.actionsMenu.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-rose-600 focus:text-rose-600"
                            onClick={() => handleDelete(vehicle.id, label)}
                          >
                            <Trash2 className="size-4" />
                            {t("Vehicles.actionsMenu.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {pagination && pagination.last_page > 1 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {pagination.from}–{pagination.to} / {pagination.total}
          </p>

          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={pagination.current_page <= 1 || isFetching}
                  className={cn(
                    (pagination.current_page <= 1 || isFetching) && "pointer-events-none opacity-50"
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    setPage((p) => Math.max(1, p - 1))
                  }}
                />
              </PaginationItem>

              {getPageRange(pagination.current_page, pagination.last_page).map((item, idx) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={item === pagination.current_page}
                      onClick={(e) => {
                        e.preventDefault()
                        setPage(item)
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={pagination.current_page >= pagination.last_page || isFetching}
                  className={cn(
                    (pagination.current_page >= pagination.last_page || isFetching) &&
                      "pointer-events-none opacity-50"
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    setPage((p) => p + 1)
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <VehicleFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingId(null)
        }}
        vehicleId={editingId}
      />

      <VehicleDetailsSheet vehicleId={viewingId} onOpenChange={(open) => !open && setViewingId(null)} />
    </div>
  )
}

function VehicleThumb({ vehicle }: { vehicle: Vehicle }) {
  const [failed, setFailed] = useState(false)
  const imageUrl = vehicle.transport_type?.image_url

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={vehicle.transport_type.name}
        onError={() => setFailed(true)}
        className="size-9 shrink-0 rounded-lg border bg-muted object-cover"
      />
    )
  }

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Truck className="size-4" />
    </div>
  )
}