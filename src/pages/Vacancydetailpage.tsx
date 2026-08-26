// pages/VacancyDetailPage.tsx
// Route: /vacancies/:id

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
    Award,
    Banknote,
    Briefcase,
    Cake,
    CalendarClock,
    Check,
    Clock,
    Copy,
    Eye,
    ListChecks,
    MapPin,
    MessageSquare,
    MoreVertical,
    Pencil,
    Phone,
    Plus,
    Search,
    Trash2,
    Truck,
    UserCheck,
    UserRound,
    UserX,
    Users,
    X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { ApplicationStatus, EmploymentType, VacancyStatus } from "@/types"
import {
    useDeleteVacancy,
    useUpdateVacancyStatus,
    useVacancy,
} from "@/features/vacancies"
import {
    useChangeApplicationStatus,
    useApplications,
    useApplication,
} from "@/features/applications/useApplications"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { VacancyFormDialog } from "@/components/Vacancyformdialog"
import { EmployeeCreateDialog, type SelectedApplication } from "@/components/Employeecreatedialog"
import { useConfirm } from "@/components/confirm-provider"


// ------------------------------------------------------------------
// Static maps (faqat stillar — labellar t() orqali olinadi)
// ------------------------------------------------------------------

const statusStyles: Record<string, { dot: string; text: string; badge: string }> = {
    draft: {
        dot: "bg-amber-400",
        text: "text-amber-700 dark:text-amber-400",
        badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    },
    published: {
        dot: "bg-emerald-500",
        text: "text-emerald-700 dark:text-emerald-400",
        badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    closed: {
        dot: "bg-rose-400",
        text: "text-rose-700 dark:text-rose-400",
        badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    },
}

const nextStatusOptions: Record<VacancyStatus, VacancyStatus[]> = {
    draft: ["published", "closed"],
    published: ["draft", "closed"],
    closed: [],
}

const applicationStatusStyles: Record<string, { dot: string; text: string; badge: string }> = {
    pending: {
        dot: "bg-amber-400",
        text: "text-amber-700 dark:text-amber-400",
        badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    },
    invited: {
        dot: "bg-emerald-500",
        text: "text-emerald-700 dark:text-emerald-400",
        badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    rejected: {
        dot: "bg-rose-400",
        text: "text-rose-700 dark:text-rose-400",
        badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    },
}

// ------------------------------------------------------------------
// Formatting helpers
// ------------------------------------------------------------------

function formatDate(value?: string | null) {
    if (!value) return null
    return new Date(value.replace(" ", "T")).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })
}

function formatDateTime(value?: string | null) {
    if (!value) return null
    const d = new Date(value.replace(" ", "T"))
    const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    return `${date}, ${time}`
}

function daysRemaining(expiresAt?: string | null) {
    if (!expiresAt) return null
    const diff = new Date(expiresAt.replace(" ", "T")).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// ------------------------------------------------------------------
// Types (loosened — adjust to your generated API types)
// ------------------------------------------------------------------

type ApplicationDriver = {
    id: number
    phone_number: string
    fio: string
    number: string
    is_online: number | boolean
    last_login_at: string | null
    created_at: string
    avatar?: {
        url: string
        mime_type?: string
        size?: number
    } | null
    resume?: {
        birth_date: string | null
        experience_years: number | null
        desired_salary_from: string | null
        salary_currency: string | null
        description: string | null
        address: string | null
        transport_types: { id: number; name: string; slug: string }[]
        work_formats: { id: number; name_key: string }[]
    } | null
}

type Application = {
    id: number
    vacancy_id: number
    driver_id: number
    status: string
    message: string | null
    rejection_reason: string | null
    applied_at: string
    created_at: string
    updated_at: string
    driver: ApplicationDriver
    full_name?: string
}

export default function VacancyDetailPage() {
    const { t } = useTranslation()
    const { id } = useParams<{ id: string }>()
    const vacancyId = id ? Number(id) : null
    const navigate = useNavigate()
    const confirm = useConfirm()

    const { data: vacancy, isLoading } = useVacancy(vacancyId)
    const [selectedAppId, setSelectedAppId] = useState<number | null>(null)

    // --- Arizalar: sahifalab paginatsiya ---
    const [search, setSearch] = useState("")
    const [appStatus, setAppStatus] = useState<ApplicationStatus | undefined>()
    const [page, setPage] = useState(1)
    const debouncedSearch = useDebouncedValue(search, 400)
    const [editOpen, setEditOpen] = useState(false)
    const [createOpen, setCreateOpen] = useState(false)
    const [employeeCreateApp, setEmployeeCreateApp] = useState<SelectedApplication | null>(null)

    // labellarni tarjima orqali olish uchun helperlar
    const getVacancyStatusLabel = (status: string) =>
        t(`vacancies.status.${status}`, { defaultValue: status })
    const getEmploymentTypeLabel = (type: string) =>
        t(`vacancies.employmentType.${type}`, { defaultValue: type })
    const getApplicationStatusLabel = (status: string) =>
        t(`applications.status.${status}`, { defaultValue: status })

    const hasActiveFilters = Boolean(search || appStatus)
    const clearFilters = () => {
        setSearch("")
        setAppStatus(undefined)
        setPage(1)
    }

    const {
        data: applicationsData,
        isLoading: applicationsLoading,
        isFetching: applicationsFetching,
    } = useApplications({
        vacancy_id: vacancyId ?? undefined,
        search: debouncedSearch || undefined,
        status: appStatus,
        page,
    } as never)

    const applications = (applicationsData?.data ?? []) as Application[]
    const pagination = applicationsData?.pagination
    const applicationsTotal = pagination?.total ?? applications.length

    const changeApplicationStatus = useChangeApplicationStatus()

    const handleInvite = async (applicationId: number) => {
        const ok = await confirm({
            title: t("vacancies.confirmInvite.title"),
            confirmText: t("vacancies.confirmInvite.confirmButton"),
        })
        if (!ok) return
        changeApplicationStatus.mutate({ id: applicationId, status: "invited" })
    }

    const handleReject = async (applicationId: number) => {
        const { confirmed, value } = await confirm({
            title: t("vacancies.confirmReject.title"),
            description: t("vacancies.confirmReject.description"),
            confirmText: t("vacancies.confirmReject.confirmButton"),
            variant: "destructive",
            input: {
                label: t("vacancies.confirmReject.reasonLabel"),
                placeholder: t("vacancies.confirmReject.reasonPlaceholder"),
                multiline: true,
                required: false, // majburiy qilish uchun true qiling
            },
        })

        if (!confirmed) return

        changeApplicationStatus.mutate({
            id: applicationId,
            status: "rejected",
            rejection_reason: value || undefined,
        })
    }

    const deleteMutation = useDeleteVacancy()
    const updateStatusMutation = useUpdateVacancyStatus()

    const style = vacancy ? statusStyles[vacancy.status] ?? statusStyles.draft : null
    const availableStatuses = vacancy
        ? nextStatusOptions[vacancy.status as VacancyStatus] ?? []
        : []

    const handleDelete = async () => {
        if (!vacancy) return
        const ok = await confirm({
            title: t("vacancies.deleteDialog.title"),
            description: t("vacancies.deleteDialog.description", { title: vacancy.title }),
            confirmText: t("vacancies.deleteDialog.confirm"),
            variant: "destructive",
        })
        if (!ok) return

        deleteMutation.mutate(vacancy.id, {
            onSuccess: () => navigate("/vacancies"),
        })
    }

    const handleStatusChange = async (newStatus: VacancyStatus) => {
        if (!vacancy) return
        const ok = await confirm({
            title: t("vacancies.statusDialog.title"),
            description: t("vacancies.statusDialog.description", {
                title: vacancy.title,
                status: getVacancyStatusLabel(newStatus),
            }),
        })
        if (!ok) return

        updateStatusMutation.mutate({ id: vacancy.id, status: newStatus })
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

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-6 w-52" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        )
    }

    if (!vacancy) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center text-muted-foreground">
                <Briefcase className="mb-3 size-10 opacity-40" />
                <p className="font-medium text-foreground">{t("vacancyDetail.notFoundTitle")}</p>
                <Button variant="link" asChild>
                    <Link to="/vacancies">{t("vacancyDetail.backToVacancies")}</Link>
                </Button>
            </div>
        )
    }

    const remaining = daysRemaining(vacancy.expires_at)

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Link to="/vacancies" className="hover:text-foreground">
                    {t("vacancies.title")}
                </Link>
                <span>/</span>
                <span className="text-foreground">{vacancy.title}</span>
            </div>

            {/* Title + actions */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">{vacancy.title}</h1>
                        {style && (
                            <Badge variant="outline" className={cn("border-0 px-2 py-0.5 text-xs font-medium", style.badge)}>
                                {getVacancyStatusLabel(vacancy.status)}
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {t("vacancyDetail.vacancyIdLabel", { id: vacancy.id })}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                        <Pencil className="size-4" />
                        {t("vacancies.actions.edit")}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                {t("vacancyDetail.more")}
                                <MoreVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            {availableStatuses.length === 0 && (
                                <DropdownMenuItem disabled>{t("vacancyDetail.noStatusChanges")}</DropdownMenuItem>
                            )}
                            {availableStatuses.map((s) => (
                                <DropdownMenuItem
                                    key={s}
                                    className={cn("cursor-pointer", statusStyles[s].text)}
                                    disabled={updateStatusMutation.isPending}
                                    onClick={() => handleStatusChange(s)}
                                >
                                    {s === "closed" ? <X className="size-4" /> : <Check className="size-4" />}
                                    {t("vacancies.actions.changeStatusTo", { status: getVacancyStatusLabel(s) })}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                    >
                        <Trash2 className="size-4" />
                        {t("vacancyDetail.deleteVacancy")}
                    </Button>
                </div>
            </div>

            {/* Summary card */}
            <Card className="rounded-2xl shadow-none p-0 w-max">
                <CardContent className="flex flex-wrap items-center gap-6 p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Briefcase className="size-5" />
                        </div>
                        <div>
                            <p className="font-semibold leading-tight text-foreground">{vacancy.title}</p>
                            <p className="text-xs text-muted-foreground">
                                {getEmploymentTypeLabel(vacancy.employment_type as EmploymentType)}
                            </p>
                        </div>
                    </div>

                    <div className="hidden h-10 w-px bg-border sm:block" />

                    <div>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Banknote className="size-3.5" /> {t("vacancyDetail.summary.salary")}
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                            ${vacancy.salary_from.toLocaleString()} – ${vacancy.salary_to.toLocaleString()}{" "}
                            <span className="text-xs font-normal text-muted-foreground">{vacancy.salary_currency}</span>
                        </p>
                    </div>

                    <div className="hidden h-10 w-px bg-border sm:block" />

                    <div>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock className="size-3.5" /> {t("vacancyDetail.summary.published")}
                        </p>
                        <p className="text-sm font-semibold">{formatDate(vacancy.published_at) ?? "—"}</p>
                    </div>

                    <div className="hidden h-10 w-px bg-border sm:block" />

                    <div>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock className="size-3.5" /> {t("vacancyDetail.summary.expires")}
                        </p>
                        <p className="text-sm font-semibold">{formatDate(vacancy.expires_at) ?? "—"}</p>
                    </div>

                    <div className="hidden h-10 w-px bg-border sm:block" />

                    <div>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock className="size-3.5" /> {t("vacancyDetail.summary.created")}
                        </p>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{formatDate(vacancy.created_at) ?? "—"}</p>
                            {style && (
                                <Badge variant="outline" className={cn("border-0 px-2 py-0 text-[10px] font-medium", style.badge)}>
                                    {getVacancyStatusLabel(vacancy.status)}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stat cards */}
            <div className="grid grid-cols-3 max-w-[80%] gap-3">
                <Card className="rounded-2xl border-none bg-muted shadow-none p-0">
                    <CardContent className="p-4">
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Eye className="size-3.5" /> {t("vacancyDetail.stats.views")}
                        </p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">{vacancy.view_count ?? 0}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none bg-muted shadow-none p-0">
                    <CardContent className="p-4">
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users className="size-3.5" /> {t("vacancyDetail.stats.applications")}
                        </p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">
                            {vacancy.application_count ?? applicationsTotal}
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none bg-muted shadow-none p-0">
                    <CardContent className="p-4">
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="size-3.5" /> {t("vacancyDetail.stats.daysRemaining")}
                        </p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">
                            {remaining ?? "—"}
                            {remaining !== null && (
                                <span className="ml-1 text-xs font-normal text-muted-foreground">
                                    {t("vacancyDetail.stats.until", { date: formatDate(vacancy.expires_at) })}
                                </span>
                            )}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main two-column content */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Left: description / requirements / responsibilities */}
                <Card className="rounded-2xl lg:col-span-2 shadow-none p-0">
                    <CardContent className="space-y-5 p-5">
                        <div className="space-y-1.5">
                            <h4 className="text-sm font-semibold text-foreground">{t("vacancyDetail.content.jobDescription")}</h4>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                                {vacancy.description}
                            </p>
                        </div>

                        {(vacancy.requirements?.length ?? 0) > 0 && (
                            <div className="space-y-1.5">
                                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                    <ListChecks className="size-4" /> {t("vacancyDetail.content.requirements")}
                                </h4>
                                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                                    {vacancy.requirements!.map((req: string, i: number) => (
                                        <li key={i}>{req}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {(vacancy.responsibilities?.length ?? 0) > 0 && (
                            <div className="space-y-1.5">
                                <h4 className="text-sm font-semibold text-foreground">{t("vacancyDetail.content.responsibilities")}</h4>
                                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                                    {vacancy.responsibilities!.map((res: string, i: number) => (
                                        <li key={i}>{res}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right: vacancy information panel */}
                <Card className="rounded-2xl shadow-none h-max p-0">
                    <CardContent className="p-5">
                        <h4 className="mb-3 text-sm font-semibold text-foreground">{t("vacancyDetail.info.title")}</h4>
                        <dl className="space-y-3 text-sm">
                            <InfoRow label={t("vacancyDetail.info.vacancyId")} value={`#${vacancy.id}`} />
                            <InfoRow
                                label={t("vacancyDetail.info.status")}
                                value={
                                    style ? (
                                        <Badge variant="outline" className={cn("border-0 px-2 py-0.5 text-xs font-medium", style.badge)}>
                                            {getVacancyStatusLabel(vacancy.status)}
                                        </Badge>
                                    ) : (
                                        "—"
                                    )
                                }
                            />
                            <InfoRow
                                label={t("vacancyDetail.info.employmentType")}
                                value={getEmploymentTypeLabel(vacancy.employment_type as EmploymentType)}
                            />
                            <InfoRow
                                label={t("vacancyDetail.info.salary")}
                                value={`$${vacancy.salary_from.toLocaleString()} – $${vacancy.salary_to.toLocaleString()} ${vacancy.salary_currency}`}
                            />
                            <InfoRow label={t("vacancyDetail.info.publishedAt")} value={formatDateTime(vacancy.published_at) ?? "—"} />
                            <InfoRow label={t("vacancyDetail.info.expiresAt")} value={formatDateTime(vacancy.expires_at) ?? "—"} />
                            <InfoRow label={t("vacancyDetail.info.createdAt")} value={formatDateTime(vacancy.created_at) ?? "—"} />
                        </dl>
                    </CardContent>
                </Card>
            </div>

            {/* Applications */}
            <Card className="rounded-2xl shadow-none p-0">
                <CardContent className="p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h4 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
                            {t("vacancyDetail.applicationsSection.title")}
                            <span className="font-normal text-muted-foreground">{applicationsTotal}</span>
                        </h4>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value)
                                        setPage(1)
                                    }}
                                    placeholder={t("vacancyDetail.applicationsSection.searchPlaceholder")}
                                    className="h-8 w-56 pl-8 text-sm"
                                />
                            </div>

                            <Select
                                value={appStatus ?? "all"}
                                onValueChange={(v) => {
                                    setAppStatus(v === "all" ? undefined : (v as ApplicationStatus))
                                    setPage(1)
                                }}
                            >
                                <SelectTrigger className="h-8 w-40 text-sm">
                                    <SelectValue placeholder={t("applications.statusPlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("applications.statusAll")}</SelectItem>
                                    <SelectItem value="pending">{t("applications.status.pending")}</SelectItem>
                                    <SelectItem value="invited">{t("applications.status.invited")}</SelectItem>
                                    <SelectItem value="rejected">{t("applications.status.rejected")}</SelectItem>
                                </SelectContent>
                            </Select>

                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-muted-foreground">
                                    <X className="mr-1 size-3.5" />
                                    {t("vacancyDetail.applicationsSection.clear")}
                                </Button>
                            )}
                        </div>
                    </div>

                    {applicationsLoading && (
                        <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-lg" />
                            ))}
                        </div>
                    )}

                    {!applicationsLoading && applications.length === 0 && (
                        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                            {t("vacancyDetail.applicationsSection.empty")}
                        </div>
                    )}

                    {!applicationsLoading && applications.length > 0 && (
                        <div className="overflow-hidden rounded-lg border border-border/60">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead>{t("vacancyDetail.applicationsSection.columns.applicant")}</TableHead>
                                        <TableHead>{t("vacancyDetail.applicationsSection.columns.phone")}</TableHead>
                                        <TableHead>{t("vacancyDetail.applicationsSection.columns.status")}</TableHead>
                                        <TableHead>{t("vacancyDetail.applicationsSection.columns.appliedAt")}</TableHead>
                                        <TableHead>{t("vacancyDetail.applicationsSection.columns.lastUpdated")}</TableHead>
                                        <TableHead className="text-right">{t("vacancyDetail.applicationsSection.columns.actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {applications.map((app) => {
                                        const appStyle = applicationStatusStyles[app?.status] ?? applicationStatusStyles.pending
                                        const canDecide = app.status === "pending"

                                        return (
                                            <TableRow key={app.id} className="cursor-pointer" onClick={() => setSelectedAppId(app.id)}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2.5">
                                                        {app.driver?.avatar?.url ? (
                                                            <img
                                                                src={app.driver.avatar.url}
                                                                alt={app.driver.fio ?? "Driver"}
                                                                className="size-8 shrink-0 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                                {(app.driver?.fio ?? "?")
                                                                    .split(" ")
                                                                    .map((p) => p[0])
                                                                    .join("")
                                                                    .slice(0, 2)
                                                                    .toUpperCase()}
                                                            </div>
                                                        )}

                                                        <div>
                                                            <p className="font-medium leading-none text-foreground">
                                                                {app.driver?.fio ?? `Application #${app.id}`}
                                                            </p>

                                                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                                <span
                                                                    className={cn(
                                                                        "size-1.5 rounded-full",
                                                                        app.driver?.is_online
                                                                            ? "bg-emerald-500"
                                                                            : "bg-muted-foreground/40"
                                                                    )}
                                                                />
                                                                {t("vacancyDetail.applicationsSection.driverIdLabel", { id: app.driver?.id })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {app.driver?.phone_number ?? "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn("border-0 px-2 py-0.5 text-xs font-medium", appStyle.badge)}>
                                                        {getApplicationStatusLabel(app.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDateTime(app.applied_at)}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDateTime(app.updated_at)}
                                                </TableCell>
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                                                                    <MoreVertical className="size-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-44">
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer text-emerald-700 focus:text-emerald-700 dark:text-emerald-400"
                                                                    disabled={changeApplicationStatus.isPending || !canDecide}
                                                                    onClick={() => handleInvite(app.id)}
                                                                >
                                                                    <UserCheck className="size-4" />
                                                                    {t("applications.actions.invite")}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer text-rose-700 focus:text-rose-700 dark:text-rose-400"
                                                                    disabled={changeApplicationStatus.isPending || !canDecide}
                                                                    onClick={() => handleReject(app.id)}
                                                                >
                                                                    <UserX className="size-4" />
                                                                    {t("applications.actions.reject")}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="cursor-pointer" onClick={() => setSelectedAppId(app.id)}>
                                                                    <UserRound className="size-4" />
                                                                    {t("vacancyDetail.applicationsSection.actions.viewProfile")}
                                                                </DropdownMenuItem>

                                                                {app.status === "invited" ? (
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer"
                                                                        onClick={() => {
                                                                            setEmployeeCreateApp({
                                                                                id: app.id,
                                                                                driverName: app.driver?.fio ?? `Ariza #${app.id}`,
                                                                                vacancyTitle: vacancy?.title,
                                                                            })
                                                                            setCreateOpen(true)
                                                                        }}
                                                                    >
                                                                        <Plus className="size-4" />
                                                                        {t("vacancyDetail.applicationsSection.actions.addToEmployees")}
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    ""
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Paginatsiya — shadcn Pagination */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                            <p className="text-sm text-muted-foreground">
                                {t("vacancyDetail.applicationsSection.pagination.range", {
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
                                            aria-disabled={pagination.current_page <= 1 || applicationsFetching}
                                            className={cn(
                                                (pagination.current_page <= 1 || applicationsFetching) &&
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
                                            aria-disabled={pagination.current_page >= pagination.last_page || applicationsFetching}
                                            className={cn(
                                                (pagination.current_page >= pagination.last_page || applicationsFetching) &&
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
                </CardContent>
            </Card>

            <VacancyFormDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                vacancy={vacancy}
            />

            {/* Side panel: applicant detail */}
            <ApplicantSidePanel
                applicationId={selectedAppId}
                onOpenChange={(open) => {
                    if (!open) setSelectedAppId(null)
                }}
            />

            <EmployeeCreateDialog
                open={createOpen}
                onOpenChange={(open) => {
                    setCreateOpen(open)
                    if (!open) setEmployeeCreateApp(null)
                }}
                defaultMode="from_application"
                initialApplication={employeeCreateApp}
            />
        </div>
    )
}

function InfoRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium text-foreground">{value}</dd>
        </div>
    )
}

function ApplicantSidePanel({
    applicationId,
    onOpenChange,
}: {
    applicationId: number | null
    onOpenChange: (open: boolean) => void
}) {
    const { t } = useTranslation()
    const { data: application, isLoading } = useApplication(applicationId)

    const driver = application?.driver
    const resume = driver?.resume
    const [copied, setCopied] = useState(false)
    const [avatarFailed, setAvatarFailed] = useState(false)

    const applicationStatusStyles: Record<string, { badge: string }> = {
        pending: { badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
        invited: { badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
        rejected: { badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" },
    }

    const appStyle = application
        ? applicationStatusStyles[application.status] ?? applicationStatusStyles.pending
        : null

    const getApplicationStatusLabel = (status: string) =>
        t(`applications.status.${status}`, { defaultValue: status })

    const isOnline = !!driver?.is_online

    const initials = (driver?.fio ?? "?")
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()

    const handleCopyPhone = () => {
        if (!driver?.phone_number) return
        navigator.clipboard.writeText(driver.phone_number)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    const desiredSalary =
        resume?.desired_salary_from && resume?.salary_currency
            ? `${Number(resume.desired_salary_from).toLocaleString()} ${resume.salary_currency}`
            : null

    const birthDate = resume?.birth_date ? formatDate(resume.birth_date) : null

    return (
        <Sheet open={applicationId !== null} onOpenChange={onOpenChange}>
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

                {!isLoading && application && (
                    <div className="flex min-h-full flex-col">
                        {/* Header */}
                        <SheetHeader
                            className={cn(
                                "relative border-b bg-linear-to-b px-6 py-4",
                                isOnline
                                    ? "from-emerald-500/[0.07] via-background to-background"
                                    : "from-muted/40 via-background to-background"
                            )}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-4">
                                    <div className="relative shrink-0">
                                        {driver?.avatar?.url && !avatarFailed ? (
                                            <img
                                                src={driver.avatar.url}
                                                alt={driver.fio}
                                                onError={() => setAvatarFailed(true)}
                                                className={cn(
                                                    "size-16 rounded-2xl object-cover ring-2 ring-offset-2 ring-offset-background",
                                                    isOnline ? "ring-emerald-500/30" : "ring-primary/10"
                                                )}
                                            />
                                        ) : (
                                            <div
                                                className={cn(
                                                    "flex size-16 items-center justify-center rounded-2xl text-lg font-semibold ring-2 ring-offset-2 ring-offset-background transition-colors",
                                                    isOnline
                                                        ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400"
                                                        : "bg-primary/10 text-primary ring-primary/10"
                                                )}
                                            >
                                                {initials}
                                            </div>
                                        )}

                                        <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center">
                                            {isOnline && (
                                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60" />
                                            )}
                                            <span
                                                className={cn(
                                                    "relative size-3.5 rounded-full border-2 border-background",
                                                    isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
                                                )}
                                            />
                                        </span>
                                    </div>

                                    <div className="min-w-0">
                                        <SheetTitle className="truncate text-lg font-semibold tracking-tight">
                                            {driver?.fio ?? t("vacancyDetail.panel.unknown")}
                                        </SheetTitle>

                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {t("vacancyDetail.panel.driverIdShort", { id: driver?.id ?? "—" })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </SheetHeader>

                        {/* Content */}
                        <div className="flex-1 space-y-7 p-5">
                            {/* Driver information */}
                            <section>
                                <SectionTitle>{t("vacancyDetail.panel.driverInformation")}</SectionTitle>

                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    <InfoCard icon={Briefcase} label={t("vacancyDetail.panel.driverNumber")} value={driver?.number ?? "—"} />
                                    <InfoCard
                                        icon={Phone}
                                        label={t("vacancyDetail.panel.phoneNumber")}
                                        value={driver?.phone_number ?? "—"}
                                        action={
                                            driver?.phone_number && (
                                                <button
                                                    onClick={handleCopyPhone}
                                                    className="text-muted-foreground/60 transition-colors hover:text-foreground"
                                                    aria-label={t("vacancyDetail.panel.copyPhoneAria")}
                                                >
                                                    {copied ? (
                                                        <Check className="size-3.5 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="size-3.5" />
                                                    )}
                                                </button>
                                            )
                                        }
                                    />
                                </div>
                            </section>

                            {/* Resume */}
                            {resume && (
                                <section>
                                    <SectionTitle>{t("vacancyDetail.panel.resume")}</SectionTitle>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <InfoCard icon={Cake} label={t("vacancyDetail.panel.birthDate")} value={birthDate ?? "—"} />
                                        <InfoCard
                                            icon={Award}
                                            label={t("vacancyDetail.panel.experience")}
                                            value={
                                                resume.experience_years !== null
                                                    ? t("vacancyDetail.panel.experienceYears", { count: resume.experience_years })
                                                    : "—"
                                            }
                                        />
                                        <InfoCard icon={Banknote} label={t("vacancyDetail.panel.desiredSalary")} value={desiredSalary ?? "—"} />
                                        <InfoCard icon={MapPin} label={t("vacancyDetail.panel.address")} value={resume.address ?? "—"} />
                                    </div>

                                    {resume.description && (
                                        <div className="mt-3 rounded-2xl border bg-muted/30 p-4">
                                            <p className="text-sm leading-6 text-foreground/80">
                                                {resume.description}
                                            </p>
                                        </div>
                                    )}

                                    {resume.transport_types?.length > 0 && (
                                        <div className="mt-3">
                                            <SectionTitle><Truck size={20} /> {t("vacancyDetail.panel.transportTypes")}</SectionTitle>
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {resume.transport_types.map((tType) => (
                                                    <Badge key={tType.id} className="rounded-full px-2.5 py-0.5 text-xs font-normal">
                                                        {tType.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {resume.work_formats?.length > 0 && (
                                        <div className="mt-3">
                                            <SectionTitle><Briefcase size={20} /> {t("vacancyDetail.panel.workFormat")}</SectionTitle>

                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {resume.work_formats.map((w) => (
                                                    <Badge key={w.id} className="rounded-full px-2.5 py-0.5 text-xs font-normal capitalize">
                                                        {w.name_key.replace("_", " ")}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Application */}
                            <section>
                                <SectionTitle>{t("vacancyDetail.panel.application")}</SectionTitle>

                                <div className="mt-3 overflow-hidden rounded-2xl border bg-card">
                                    <DetailRow
                                        icon={Clock}
                                        label={t("vacancyDetail.applicationsSection.columns.status")}
                                        value={
                                            appStyle && (
                                                <Badge variant="outline" className={cn("border-0 px-2 py-0.5 text-xs font-medium", appStyle.badge)}>
                                                    {getApplicationStatusLabel(application.status)}
                                                </Badge>
                                            )
                                        }
                                    />
                                    <DetailRow icon={CalendarClock} label={t("vacancyDetail.panel.appliedAt")} value={formatDateTime(application.applied_at) ?? "—"} />
                                    <DetailRow icon={CalendarClock} label={t("vacancyDetail.panel.lastUpdated")} value={formatDateTime(application.updated_at) ?? "—"} />
                                    {application.rejection_reason && (
                                        <DetailRow icon={UserX} label={t("vacancyDetail.panel.rejectionReason")} value={application.rejection_reason} />
                                    )}
                                </div>
                            </section>

                            {/* Message */}
                            {application.message && (
                                <section>
                                    <SectionTitle>{t("vacancyDetail.panel.applicantMessage")}</SectionTitle>
                                    <div className="mt-3 rounded-2xl border bg-muted/30 p-4">
                                        <div className="flex gap-3">
                                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background">
                                                <MessageSquare className="size-3.5 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm leading-6 text-foreground/80">
                                                {application.message}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

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
    label: React.ReactNode
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
    label: React.ReactNode
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