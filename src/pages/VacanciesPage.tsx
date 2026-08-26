import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Banknote,
  Briefcase,
  CalendarClock,
  Check,
  ClipboardList,
  Eye,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

import { useDebouncedValue } from "@/hooks/use-debounced-value"
import type { SalaryCurrency, Vacancy, VacancyStatus } from "@/types"
import {
  useDeleteVacancy,
  useInfiniteVacancies,
  useUpdateVacancyStatus,
} from "@/features/vacancies"
import { VacancyFormDialog } from "@/components/Vacancyformdialog"
import { cn } from "@/lib/utils"
import { VacancyDetailsDialog } from "@/components/VacancyDetailsDialog"
import { useNavigate } from "react-router-dom"

// Faqat rang/uslub — tarjima emas
const statusStyles: Record<
  string,
  { dot: string; bar: string; text: string }
> = {
  draft: {
    dot: "bg-amber-400",
    bar: "bg-amber-400/6",
    text: "text-amber-700 dark:text-amber-400",
  },
  published: {
    dot: "bg-emerald-500",
    bar: "bg-emerald-500/6",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  closed: {
    dot: "bg-rose-400",
    bar: "bg-rose-400/6",
    text: "text-rose-700 dark:text-rose-400",
  },
}

// Har bir status uchun qaysi statuslarga o'tish mumkinligi
const nextStatusOptions: Record<VacancyStatus, VacancyStatus[]> = {
  draft: ["published", "closed"],
  published: ["draft", "closed"],
  closed: [], // yopilgan vakansiyani yangilab bo'lmaydi
}

function formatDate(value?: string) {
  if (!value) return null
  return new Date(value).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function VacanciesPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [currency, setCurrency] = useState<SalaryCurrency | undefined>()
  const [status, setStatus] = useState<VacancyStatus | undefined>()
  const [salaryFrom, setSalaryFrom] = useState("")
  const [salaryTo, setSalaryTo] = useState("")
  const navigate = useNavigate()

  const debouncedSearch = useDebouncedValue(search, 400)
  const debouncedSalaryFrom = useDebouncedValue(salaryFrom, 400)
  const debouncedSalaryTo = useDebouncedValue(salaryTo, 400)
  const [viewTargetId, setViewTargetId] = useState<number | null>(null)
  const hasActiveFilters = Boolean(
    search || currency || status || salaryFrom || salaryTo
  )

  const clearFilters = () => {
    setSearch("")
    setCurrency(undefined)
    setStatus(undefined)
    setSalaryFrom("")
    setSalaryTo("")
  }


  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteVacancies({
    search: debouncedSearch || undefined,
    currency,
    status,
    salary_from: debouncedSalaryFrom ? Number(debouncedSalaryFrom) : undefined,
    salary_to: debouncedSalaryTo ? Number(debouncedSalaryTo) : undefined,
  })

  const deleteMutation = useDeleteVacancy()
  const updateStatusMutation = useUpdateVacancyStatus()

  const [formOpen, setFormOpen] = useState(false)
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Vacancy | null>(null)
  const [statusTarget, setStatusTarget] = useState<{
    vacancy: Vacancy
    status: VacancyStatus
  } | null>(null)


  const requestStatusChange = (vacancy: Vacancy, newStatus: VacancyStatus) => {
    setStatusTarget({ vacancy, status: newStatus })
  }

  const confirmStatusChange = () => {
    if (!statusTarget) return
    updateStatusMutation.mutate(
      { id: statusTarget.vacancy.id, status: statusTarget.status },
      { onSuccess: () => setStatusTarget(null) }
    )
  }


  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const openCreate = () => {
    setEditingVacancy(null)
    setFormOpen(true)
  }

  const openEdit = (vacancy: Vacancy) => {
    setEditingVacancy(vacancy)
    setFormOpen(true)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  const vacancies = data?.pages.flatMap((page) => page.data) ?? []
  const total = data?.pages[0]?.pagination.total ?? 0


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("vacancies.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("vacancies.subtitle")}
          </p>
        </div>
        <Button onClick={openCreate} className="shadow-sm">
          <Plus className="mr-2 size-4" /> {t("vacancies.create")}
        </Button>
      </div>

      {/* Filterlar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("vacancies.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={currency ?? "all"}
          onValueChange={(v) =>
            setCurrency(v === "all" ? undefined : (v as SalaryCurrency))
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t("vacancies.currencyPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("vacancies.currencyAll")}</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="UZS">UZS</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={status ?? "all"}
          onValueChange={(v) =>
            setStatus(v === "all" ? undefined : (v as VacancyStatus))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("vacancies.statusPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("vacancies.statusAll")}</SelectItem>
            <SelectItem value="draft">{t("vacancies.status.draft")}</SelectItem>
            <SelectItem value="published">{t("vacancies.status.published")}</SelectItem>
            <SelectItem value="closed">{t("vacancies.status.closed")}</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder={t("vacancies.salaryFromPlaceholder")}
          value={salaryFrom}
          onChange={(e) => setSalaryFrom(e.target.value)}
          className="w-32"
        />
        <Input
          type="number"
          placeholder={t("vacancies.salaryToPlaceholder")}
          value={salaryTo}
          onChange={(e) => setSalaryTo(e.target.value)}
          className="w-32"
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="mr-1 size-3.5" />
            {t("vacancies.clearFilters")}
          </Button>
        )}
        {!isLoading && (
          <p className="ml-auto shrink-0 text-sm text-muted-foreground">
            {t("vacancies.totalCountPrefix")}{" "}
            <span className="font-medium text-foreground">{total}</span>{" "}
            {t("vacancies.totalCountSuffix")}
          </p>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && vacancies.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center text-muted-foreground">
          <Briefcase className="mb-3 size-10 opacity-40" />
          <p className="font-medium text-foreground">{t("vacancies.emptyTitle")}</p>
          <p className="text-sm">{t("vacancies.emptyDescription")}</p>
        </div>
      )}

      {!isLoading && vacancies.length > 0 && (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-1 lg:grid-cols-1">
          {vacancies.map((vacancy) => {
            const style = statusStyles[vacancy.status] ?? statusStyles.draft
            const statusLabel = t(`vacancies.status.${vacancy.status}`)
            const availableStatuses = nextStatusOptions[vacancy.status as VacancyStatus] ?? []
            const employmentLabel = vacancy.employment_type
              ? t(`vacancies.employmentType.${vacancy.employment_type}`, {
                  defaultValue: vacancy.employment_type,
                })
              : null
            const publishedLabel = vacancy.published_at ? formatDate(vacancy.published_at) : null

            return (
              <Card
                key={vacancy.id}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-2xl shadow-none border-none",
                  "transition-all duration-300 hover:-translate-y-0.5 hover:border-border",
                  style.bar
                )}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pt-5">
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-muted-foreground">
                      <Briefcase className="size-5" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        {vacancy.is_favorite && (
                          <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                        )}
                        <h3 className="line-clamp-2 font-bold leading-tight tracking-tight text-[#54606a]">
                          {vacancy.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className={cn("border-0 px-2 py-0 text-xs font-medium", style.text)}>
                          <span className={cn("mr-1.5 size-1.5 rounded-full", style.dot)} />
                          {statusLabel}
                        </Badge>
                        {employmentLabel && (
                          <Badge
                            variant="outline"
                            className="border-0 bg-white px-2 py-0 text-xs font-medium text-gray-500"
                          >
                            {employmentLabel}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Barcha amallar bitta dropdown menyusida */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer bg-white"
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem
                        onClick={() => navigate(`/vacancies/${vacancy?.id}`)}
                        className="cursor-pointer"
                      >
                        <Eye className="size-4" />
                        {t("vacancies.actions.view")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openEdit(vacancy)}
                        className="cursor-pointer"
                      >
                        <Pencil className="size-4" />
                        {t("vacancies.actions.edit")}
                      </DropdownMenuItem>

                      {availableStatuses.length > 0 && <DropdownMenuSeparator />}
                      {availableStatuses.map((s) => (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => requestStatusChange(vacancy, s)}
                          disabled={updateStatusMutation.isPending}
                          className={cn("cursor-pointer", statusStyles[s].text)}
                        >
                          {s === "closed" ? (
                            <X className="size-4" />
                          ) : (
                            <Check className="size-4" />
                          )}
                          {t("vacancies.actions.changeStatusTo", {
                            status: t(`vacancies.status.${s}`),
                          })}
                        </DropdownMenuItem>
                      ))}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(vacancy)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        {t("vacancies.actions.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>

                <CardContent className="flex-1 space-y-3">
                  <p className="line-clamp-2 font-medium text-muted-foreground">
                    {vacancy.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
                      <Banknote className="size-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-semibold tabular-nums">
                        {vacancy.salary_from.toLocaleString()} –{" "}
                        {vacancy.salary_to.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {vacancy.salary_currency}
                      </span>
                    </div>

                    {typeof vacancy.view_count === "number" && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs text-muted-foreground">
                        <Eye className="size-3.5" />
                        {vacancy.view_count}
                      </div>
                    )}
                    {typeof vacancy.application_count === "number" && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs text-muted-foreground">
                        <ClipboardList className="size-3.5" />
                        {t("vacancies.applicationCount", { count: vacancy.application_count })}
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-wrap justify-between gap-1.5 border-t border-border/50 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-2">
                      {(vacancy.requirements ?? []).map((req, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="rounded-[4px] border-0 bg-white px-2 py-1 text-sm font-medium text-gray-500"
                        >
                          {req}
                        </Badge>
                      ))}
                    </div>
                    {publishedLabel && (
                      <span className="text-xs font-medium text-gray-400">
                        {t("vacancies.publishedLabel", { date: publishedLabel })}
                      </span>
                    )}
                  </div>

                  {vacancy.expires_at && (
                    <div className="flex items-center gap-2 font-semibold text-gray-500">
                      <CalendarClock className="size-3.5" />
                      <span>
                        {t("vacancies.expiresLabel", {
                          date: new Date(vacancy.expires_at).toLocaleDateString("uz-UZ"),
                        })}
                      </span>
                    </div>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        )}
        {!hasNextPage && vacancies.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {t("vacancies.loadedAll")}
          </p>
        )}
      </div>

      <VacancyFormDialog open={formOpen} onOpenChange={setFormOpen} vacancy={editingVacancy} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("vacancies.deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("vacancies.deleteDialog.description", { title: deleteTarget?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("vacancies.deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("vacancies.deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



      <AlertDialog open={!!statusTarget} onOpenChange={(open) => !open && setStatusTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("vacancies.statusDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget &&
                t("vacancies.statusDialog.description", {
                  title: statusTarget.vacancy.title,
                  status: t(`vacancies.status.${statusTarget.status}`),
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("vacancies.statusDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              {t("vacancies.statusDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VacancyDetailsDialog
        vacancyId={viewTargetId}
        onOpenChange={(open) => !open && setViewTargetId(null)}
      />



    </div>
  )
}