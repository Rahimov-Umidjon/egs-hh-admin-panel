import { useState } from "react" 
import {
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Users,
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
import { useEmployees } from "@/features/employees/useEmployees"
import type { EmployeeSource } from "@/types"
import { EmployeeFormDialog } from "@/components/EmployeeFormDialog"
import { EmployeeDetailsSheet } from "@/components/EmployeeDetailsSheet"
import { EmployeeCreateDialog } from "@/components/Employeecreatedialog"

const statusMeta: Record<string, { label: string; badge: string }> = {
  active: {
    label: "Faol",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  inactive: {
    label: "Faol emas",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  terminated: {
    label: "Ishdan bo'shatilgan",
    badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  },
}

const sourceLabels: Record<string, string> = {
  manual: "Qo'lda",
  vacancy: "Vakansiya orqali",
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
 
  const [search, setSearch] = useState("")
  //   const [status, setStatus] = useState<EmployeeStatus | undefined>()
  const [source, setSource] = useState<EmployeeSource | undefined>()
  const [createdFrom, setCreatedFrom] = useState("")
  const [createdTo, setCreatedTo] = useState("")
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)

  const debouncedSearch = useDebouncedValue(search, 400)
  const debouncedCreatedFrom = useDebouncedValue(createdFrom, 400)
  const debouncedCreatedTo = useDebouncedValue(createdTo, 400)

  const hasActiveFilters = Boolean(search || source || createdFrom || createdTo)

  const clearFilters = () => {
    setSearch("")
    // setStatus(undefined)
    setSource(undefined)
    setCreatedFrom("")
    setCreatedTo("")
    setPage(1)
  }

  const { data, isLoading, isFetching } = useEmployees({
    search: debouncedSearch || undefined,
    // status,
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

  const openEdit = (id: number) => {
    setEditingId(id)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Xodimlar</h2>
          <p className="text-sm text-muted-foreground">
            Kompaniya xodimlari ro'yxati va boshqaruvi
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shadow-sm">
          <Plus className="mr-2 size-4" /> Yangi xodim
        </Button>
      </div>

      {/* Filterlar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Xodim raqami, F.I.Sh bo'yicha qidirish..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>

        {/* <Select
          value={status ?? "all"}
          onValueChange={(v) => {
            setStatus(v === "all" ? undefined : (v as EmployeeStatus))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha statuslar</SelectItem>
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="inactive">Faol emas</SelectItem>
            <SelectItem value="terminated">Ishdan bo'shatilgan</SelectItem>
          </SelectContent>
        </Select> */}

        <Select
          value={source ?? "all"}
          onValueChange={(v) => {
            setSource(v === "all" ? undefined : (v as EmployeeSource))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Manba" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha manbalar</SelectItem>
            <SelectItem value="manual">Qo'lda</SelectItem>
            <SelectItem value="vacancy">Vakansiya orqali</SelectItem>
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
            Tozalash
          </Button>
        )}

        {!isLoading && (
          <p className="ml-auto shrink-0 text-sm text-muted-foreground">
            Jami <span className="font-medium text-foreground">{pagination?.total ?? 0}</span> ta xodim
          </p>
        )}
      </div>

      {/* <Card className="rounded-2xl shadow-none p-0"> */}
      {/* <CardContent className="p-5"> */}
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
          <p className="font-medium text-foreground">Xodimlar topilmadi</p>
          <p className="text-sm">Qidiruv yoki filtrni o'zgartirib ko'ring</p>
        </div>
      )}

      {!isLoading && employees.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Xodim</TableHead>
                <TableHead>Lavozim</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Manba</TableHead>
                <TableHead>Maosh</TableHead>
                <TableHead>Boshlangan sana</TableHead>
                <TableHead>Yaratilgan</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => {
                const meta = statusMeta[emp.status] ?? statusMeta.active
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
                        className={cn("border-0 px-2 py-0.5 text-xs font-medium", meta.badge)}
                      >
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sourceLabels[emp.source] ?? emp.source}
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
                            Ko'rish
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => openEdit(emp.id)}
                          >
                            <Pencil className="size-4" />
                            Tahrirlash
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
      {/* </CardContent> */}
      {/* </Card> */}

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
          // if (!open) setEmployeeCreateApp(null)
        }}
        defaultMode="new_driver"
        // initialApplication={employeeCreateApp}
      />

    </div>
  )
}