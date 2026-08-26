import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Eye,
  MoreVertical,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Users,
  UserX,
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
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useEmployees, useUpdateEmployee } from "@/features/employees/useEmployees"
import type { EmployeeSource, TerminationType } from "@/types"
import { EmployeeFormDialog } from "@/components/EmployeeFormDialog"
import { EmployeeDetailsSheet } from "@/components/EmployeeDetailsSheet"
import { EmployeeCreateDialog } from "@/components/Employeecreatedialog"
import { EmployeeTerminateDialog } from "@/components/EmployeeTerminateDialog"
import { useConfirm } from "@/components/confirm-provider"

// stillar — labellar t() orqali olinadi
const statusStyles: Record<string, { badge: string }> = {
  active: { badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  paused: { badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  ended: { badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" },
}

function formatDate(value?: string | null) {
  if (!value) return null
  return new Date(value.replace(" ", "T")).toLocaleDateString("uz-UZ", {
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

export default function EmployeesPage() {
  const { t } = useTranslation()

  const [search, setSearch] = useState("")
  const [source, setSource] = useState<EmployeeSource | undefined>()
  const [createdFrom, setCreatedFrom] = useState("")
  const [createdTo, setCreatedTo] = useState("")
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)

  const debouncedSearch = useDebouncedValue(search, 400)
  const debouncedCreatedFrom = useDebouncedValue(createdFrom, 400)
  const debouncedCreatedTo = useDebouncedValue(createdTo, 400)

  const hasActiveFilters = Boolean(search || source || createdFrom || createdTo)

  const [terminatingId, setTerminatingId] = useState<number | null>(null)

  const getStatusLabel = (status: string) => t(`employees.status.${status}`, { defaultValue: status })
  const getSourceLabel = (src: string) => t(`employees.source.${src}`, { defaultValue: src })

  const clearFilters = () => {
    setSearch("")
    setSource(undefined)
    setCreatedFrom("")
    setCreatedTo("")
    setPage(1)
  }

  const { data, isLoading, isFetching } = useEmployees({
    search: debouncedSearch || undefined,
    source,
    created_from: debouncedCreatedFrom || undefined,
    created_to: debouncedCreatedTo || undefined,
    sort_by: "created_at",
    sort_direction: "desc",
    per_page: perPage,
    page,
  })

  const employees = data?.data ?? []
  const pagination = data?.pagination

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const updateMutation = useUpdateEmployee()

  const confirm = useConfirm()

  const handlePause = (id: number, name?: string) => {
    confirm({
      title: t("employees.pauseDialog.title"),
      description: name
        ? t("employees.pauseDialog.descriptionWithName", { name })
        : t("employees.pauseDialog.descriptionGeneric"),
      confirmText: t("employees.pauseDialog.confirm"),
      fields: [
        {
          name: "pause_reason",
          label: t("employees.pauseDialog.reasonLabel"),
          placeholder: t("employees.pauseDialog.reasonPlaceholder"),
          multiline: true,
        },
      ],
      onConfirm: async (values) => {
        await updateMutation.mutateAsync({
          id,
          payload: { status: "paused", pause_reason: values.pause_reason || undefined },
        })
      },
    })
  }

  const handleResume = (id: number, name?: string) => {
    confirm({
      title: t("employees.resumeDialog.title"),
      description: name
        ? t("employees.resumeDialog.descriptionWithName", { name })
        : t("employees.resumeDialog.descriptionGeneric"),
      confirmText: t("employees.resumeDialog.confirm"),
      onConfirm: async () => {
        await updateMutation.mutateAsync({ id, payload: { status: "active" } })
      },
    })
  }

  const handleTerminate = (id: number, name?: string) => {
    confirm({
      title: t("employees.terminateConfirm.title"),
      description: name
        ? t("employees.terminateConfirm.descriptionWithName", { name })
        : t("employees.terminateConfirm.descriptionGeneric"),
      confirmText: t("employees.terminateConfirm.confirm"),
      variant: "destructive",
      fields: [
        {
          name: "termination_type",
          label: t("employees.terminateConfirm.typeLabel"),
          placeholder: t("employees.terminateConfirm.typePlaceholder"),
          required: true,
          options: [
            { value: "resigned", label: t("employees.terminationTypes.resigned") },
            { value: "fired", label: t("employees.terminationTypes.fired") },
            { value: "contract_expired", label: t("employees.terminationTypes.contract_expired") },
            { value: "mutual_agreement", label: t("employees.terminationTypes.mutual_agreement") },
            { value: "other", label: t("employees.terminationTypes.other") },
          ],
        },
        {
          name: "termination_reason",
          label: t("employees.terminateConfirm.reasonLabel"),
          placeholder: t("employees.terminateConfirm.reasonPlaceholder"),
          required: true,
          multiline: true,
        },
      ],
      onConfirm: async (values) => {
        await updateMutation.mutateAsync({
          id,
          payload: {
            status: "ended",
            termination_type: values.termination_type as TerminationType,
            termination_reason: values.termination_reason,
          },
        })
      },
    })
  }

  const openEdit = (id: number) => {
    setEditingId(id)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("employees.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("employees.subtitle")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shadow-sm">
          <Plus className="mr-2 size-4" /> {t("employees.create")}
        </Button>
      </div>

      {/* Filterlar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("employees.searchPlaceholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={source ?? "all"}
          onValueChange={(v) => {
            setSource(v === "all" ? undefined : (v as EmployeeSource))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("employees.sourcePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("employees.sourceAll")}</SelectItem>
            <SelectItem value="manual">{t("employees.source.manual")}</SelectItem>
            <SelectItem value="vacancy">{t("employees.source.vacancy")}</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={createdFrom}
          onChange={(e) => {
            setCreatedFrom(e.target.value)
            setPage(1)
          }}
          className="w-40"
        />
        <Input
          type="date"
          value={createdTo}
          onChange={(e) => {
            setCreatedTo(e.target.value)
            setPage(1)
          }}
          className="w-40"
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 size-3.5" />
            {t("employees.clearFilters")}
          </Button>
        )}

        {!isLoading && (
          <p className="ml-auto shrink-0 text-sm text-muted-foreground">
            {t("employees.totalCountPrefix")}{" "}
            <span className="font-medium text-foreground">{pagination?.total ?? 0}</span>{" "}
            {t("employees.totalCountSuffix")}
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

      {!isLoading && employees.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center text-muted-foreground">
          <Users className="mb-3 size-10 opacity-40" />
          <p className="font-medium text-foreground">{t("employees.emptyTitle")}</p>
          <p className="text-sm">{t("employees.emptyDescription")}</p>
        </div>
      )}

      {!isLoading && employees.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>{t("employees.columns.employee")}</TableHead>
                <TableHead>{t("employees.columns.position")}</TableHead>
                <TableHead>{t("employees.columns.status")}</TableHead>
                <TableHead>{t("employees.columns.source")}</TableHead>
                <TableHead>{t("employees.columns.salary")}</TableHead>
                <TableHead>{t("employees.columns.startedAt")}</TableHead>
                <TableHead>{t("employees.columns.createdAt")}</TableHead>
                <TableHead className="text-right">{t("employees.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => {
                const style = statusStyles[emp.status] ?? statusStyles.active
                return (
                  <TableRow
                    key={emp.id}
                    className="cursor-pointer"
                    onClick={() => setViewingId(emp.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {emp.driver?.avatar?.url ? (
                          <img
                            src={emp.driver.avatar.url}
                            alt={emp.driver.fio}
                            className="size-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {(emp.driver?.fio ?? emp.employee_number)
                              .split(" ")
                              .map((p) => p[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium leading-none text-foreground">
                            {emp.driver?.fio ?? emp.employee_number}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {emp.employee_number}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {emp.position}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("border-0 px-2 py-0.5 text-xs font-medium", style.badge)}
                      >
                        {getStatusLabel(emp.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getSourceLabel(emp.source)}
                    </TableCell>
                    <TableCell className="text-sm font-medium tabular-nums">
                      {Number(emp.salary).toLocaleString()} {emp.salary_currency}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(emp.started_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(emp.created_at)}
                    </TableCell>

                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setViewingId(emp.id)}
                          >
                            <Eye className="size-4" />
                            {t("employees.actions.view")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => openEdit(emp.id)}
                          >
                            <Pencil className="size-4" />
                            {t("employees.actions.edit")}
                          </DropdownMenuItem>

                          {emp.status === "paused" ? (
                            <DropdownMenuItem
                              className="cursor-pointer text-emerald-600 focus:text-emerald-600"
                              onClick={() => handleResume(emp.id, emp.driver?.fio)}
                            >
                              <PlayCircle className="size-4" />
                              {t("employees.actions.activate")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="cursor-pointer text-amber-600 focus:text-amber-600"
                              onClick={() => handlePause(emp.id, emp.driver?.fio)}
                              disabled={emp.status === "ended"}
                            >
                              <PauseCircle className="size-4" />
                              {t("employees.actions.pause")}
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            className="cursor-pointer text-rose-600 focus:text-rose-600"
                            onClick={() => handleTerminate(emp.id, emp.driver?.fio)}
                            disabled={emp.status === "ended"}
                          >
                            <UserX className="size-4" />
                            {t("employees.actions.terminate")}
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
            {t("employees.pagination.range", {
              from: pagination.from,
              to: pagination.to,
              total: pagination.total,
            })}
          </p>

          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={pagination.current_page <= 1 || isFetching}
                  className={cn(
                    (pagination.current_page <= 1 || isFetching) &&
                    "pointer-events-none opacity-50"
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

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingId(null)
        }}
        employeeId={editingId}
      />

      <EmployeeDetailsSheet
        employeeId={viewingId}
        onOpenChange={(open) => !open && setViewingId(null)}
      />

      <EmployeeCreateDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
        }}
        defaultMode="new_driver"
      />

      <EmployeeTerminateDialog
        open={terminatingId !== null}
        onOpenChange={(open) => !open && setTerminatingId(null)}
        employeeId={terminatingId}
        employeeName={employees.find((e) => e.id === terminatingId)?.driver?.fio}
      />
    </div>
  )
}