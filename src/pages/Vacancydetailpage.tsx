// pages/VacancyDetailPage.tsx
// Route: /vacancies/:id

import { useState } from "react"
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
// Static maps
// ------------------------------------------------------------------

const statusMeta: Record<string, { label: string; dot: string; text: string; badge: string }> = {
    draft: {
        label: "Draft",
        dot: "bg-amber-400",
        text: "text-amber-700 dark:text-amber-400",
        badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    },
    published: {
        label: "Published",
        dot: "bg-emerald-500",
        text: "text-emerald-700 dark:text-emerald-400",
        badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    closed: {
        label: "Closed",
        dot: "bg-rose-400",
        text: "text-rose-700 dark:text-rose-400",
        badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    },
}

const employmentTypeLabels: Record<EmploymentType, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    contract: "Contract",
    temporary: "Internship",
}

const nextStatusOptions: Record<VacancyStatus, VacancyStatus[]> = {
    draft: ["published", "closed"],
    published: ["draft", "closed"],
    closed: [],
}

// Adjust if your ApplicationStatus enum has more values (e.g. "hired", "withdrawn")
const applicationStatusMeta: Record<string, { label: string; dot: string; text: string; badge: string }> = {
    pending: {
        label: "Pending",
        dot: "bg-amber-400",
        text: "text-amber-700 dark:text-amber-400",
        badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    },
    invited: {
        label: "Invited",
        dot: "bg-emerald-500",
        text: "text-emerald-700 dark:text-emerald-400",
        badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    rejected: {
        label: "Rejected",
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
            title: "Nomzodni taklif qilishni tasdiqlaysizmi?",
            confirmText: "Taklif qilish",
        })
        if (!ok) return
        changeApplicationStatus.mutate({ id: applicationId, status: "invited" })
    }

    const handleReject = async (applicationId: number) => {
        const { confirmed, value } = await confirm({
            title: "Nomzodni rad etishni tasdiqlaysizmi?",
            description: "Rad etish sababini kiritishingiz mumkin (ixtiyoriy).",
            confirmText: "Rad etish",
            variant: "destructive",
            input: {
                label: "Rad etish sababi",
                placeholder: "Masalan: tajriba yetarli emas...",
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

    const meta = vacancy ? statusMeta[vacancy.status] ?? statusMeta.draft : null
    const availableStatuses = vacancy
        ? nextStatusOptions[vacancy.status as VacancyStatus] ?? []
        : []

    const handleDelete = async () => {
        if (!vacancy) return
        const ok = await confirm({
            title: "Vakansiyani o'chirishni tasdiqlaysizmi?",
            description: `"${vacancy.title}" vakansiyasi butunlay o'chiriladi. Bu amalni orqaga qaytarib bo'lmaydi.`,
            confirmText: "O'chirish",
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
            title: "Statusni o'zgartirishni tasdiqlaysizmi?",
            description: (
                <>
                    "{vacancy.title}" vakansiyasi statusi{" "}
                    <span className="font-medium text-foreground">{statusMeta[newStatus].label}</span>
                    {" "}ga o'zgartiriladi.
                </>
            ),
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
                <p className="font-medium text-foreground">Vacancy not found</p>
                <Button variant="link" asChild>
                    <Link to="/vacancies">Back to vacancies</Link>
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
                    Vacancies
                </Link>
                <span>/</span>
                <span className="text-foreground">{vacancy.title}</span>
            </div>

            {/* Title + actions */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">{vacancy.title}</h1>
                        {meta && (
                            <Badge variant="outline" className={cn("border-0 px-2 py-0.5 text-xs font-medium", meta.badge)}>
                                {meta.label}
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">Vacancy ID: #{vacancy.id}</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                        <Pencil className="size-4" />
                        Edit vacancy
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                More
                                <MoreVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            {availableStatuses.length === 0 && (
                                <DropdownMenuItem disabled>No status changes available</DropdownMenuItem>
                            )}
                            {availableStatuses.map((s) => (
                                <DropdownMenuItem
                                    key={s}
                                    className={cn("cursor-pointer", statusMeta[s].text)}
                                    disabled={updateStatusMutation.isPending}
                                    onClick={() => handleStatusChange(s)}
                                >
                                    {s === "closed" ? <X className="size-4" /> : <Check className="size-4" />}
                                    Move to {statusMeta[s].label}
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
                        Delete vacancy
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
                                {employmentTypeLabels[vacancy.employment_type as EmploymentType] ?? vacancy.employment_type}
                            </p>
                        </div>
                    </div>

                    <div className="hidden h-10 w-px bg-border sm:block" />

                    <div>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Banknote className="size-3.5" /> Salary
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                            ${vacancy.salary_from.toLocaleString()} – ${vacancy.salary_to.toLocaleString()}{" "}
                            <span className="text-xs font-normal text-muted-foreground">{vacancy.salary_currency}</span>
                        </p>
                    </div>

                    <div className="hidden h-10 w-px bg-border sm:block" />

                    <div>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock className="size-3.5" /> Published
                        </p>
                        <p className="text-sm font-semibold">{formatDate(vacancy.published_at) ?? "—"}</p>
                    </div>

                    <div className="hidden h-10 w-px bg-border sm:block" />

                    <div>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock className="size-3.5" /> Expires
                        </p>
                        <p className="text-sm font-semibold">{formatDate(vacancy.expires_at) ?? "—"}</p>
                    </div>

                    <div className="hidden h-10 w-px bg-border sm:block" />

                    <div>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock className="size-3.5" /> Created
                        </p>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{formatDate(vacancy.created_at) ?? "—"}</p>
                            {meta && (
                                <Badge variant="outline" className={cn("border-0 px-2 py-0 text-[10px] font-medium", meta.badge)}>
                                    {meta.label}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stat cards */}
            <div className="grid grid-cols-3 max-w-[80%] gap-3">
                <Card className="rounded-2xl border-none bg-muted shadow-none   p-0">
                    <CardContent className="p-4">
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Eye className="size-3.5" /> Views
                        </p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">{vacancy.view_count ?? 0}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none bg-muted shadow-none   p-0">
                    <CardContent className="p-4">
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users className="size-3.5" /> Applications
                        </p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">
                            {vacancy.application_count ?? applicationsTotal}
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none bg-muted shadow-none p-0">
                    <CardContent className="p-4">
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="size-3.5" /> Days remaining
                        </p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">
                            {remaining ?? "—"}
                            {remaining !== null && (
                                <span className="ml-1 text-xs font-normal text-muted-foreground">
                                    until {formatDate(vacancy.expires_at)}
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
                            <h4 className="text-sm font-semibold text-foreground">Job Description</h4>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                                {vacancy.description}
                            </p>
                        </div>

                        {(vacancy.requirements?.length ?? 0) > 0 && (
                            <div className="space-y-1.5">
                                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                    <ListChecks className="size-4" /> Requirements
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
                                <h4 className="text-sm font-semibold text-foreground">Responsibilities</h4>
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
                        <h4 className="mb-3 text-sm font-semibold text-foreground">Vacancy Information</h4>
                        <dl className="space-y-3 text-sm">
                            <InfoRow label="Vacancy ID" value={`#${vacancy.id}`} />
                            <InfoRow
                                label="Status"
                                value={
                                    meta ? (
                                        <Badge variant="outline" className={cn("border-0 px-2 py-0.5 text-xs font-medium", meta.badge)}>
                                            {meta.label}
                                        </Badge>
                                    ) : (
                                        "—"
                                    )
                                }
                            />
                            <InfoRow
                                label="Employment type"
                                value={employmentTypeLabels[vacancy.employment_type as EmploymentType] ?? vacancy.employment_type}
                            />
                            <InfoRow
                                label="Salary"
                                value={`$${vacancy.salary_from.toLocaleString()} – $${vacancy.salary_to.toLocaleString()} ${vacancy.salary_currency}`}
                            />
                            <InfoRow label="Published at" value={formatDateTime(vacancy.published_at) ?? "—"} />
                            <InfoRow label="Expires at" value={formatDateTime(vacancy.expires_at) ?? "—"} />
                            <InfoRow label="Created at" value={formatDateTime(vacancy.created_at) ?? "—"} />
                        </dl>
                    </CardContent>
                </Card>
            </div>

            {/* Applications */}
            <Card className="rounded-2xl shadow-none p-0">
                <CardContent className="p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h4 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
                            Applications
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
                                    placeholder="Search applicants..."
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
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="invited">Invited</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-muted-foreground">
                                    <X className="mr-1 size-3.5" />
                                    Clear
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
                            No applications yet
                        </div>
                    )}

                    {!applicationsLoading && applications.length > 0 && (
                        <div className="overflow-hidden rounded-lg border border-border/60">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead>Applicant</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Applied At</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {applications.map((app) => {
                                        const appMeta = applicationStatusMeta[app?.status] ?? applicationStatusMeta.pending

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
                                                                Driver ID: #{app.driver?.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {app.driver?.phone_number ?? "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn("border-0 px-2 py-0.5 text-xs font-medium", appMeta.badge)}>
                                                        {appMeta.label}
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
                                                                    Invite
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer text-rose-700 focus:text-rose-700 dark:text-rose-400"
                                                                    disabled={changeApplicationStatus.isPending || !canDecide}
                                                                    onClick={() => handleReject(app.id)}
                                                                >
                                                                    <UserX className="size-4" />
                                                                    Reject
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="cursor-pointer" onClick={() => setSelectedAppId(app.id)}>
                                                                    <UserRound className="size-4" />
                                                                    View profile
                                                                </DropdownMenuItem>

                                                                {
                                                                    app.status === 'invited' ? (
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
                                                                            Xodimlarga qo'shish
                                                                        </DropdownMenuItem>
                                                                    ) : ''
                                                                }

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
                                {pagination.from}–{pagination.to} of {pagination.total}
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

                    {/* {applicationsFetching && !applicationsLoading && (
                        <div className="mt-2 flex justify-center">
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {applicationsFetching && !applicationsLoading && (
                        <div className="mt-2 flex justify-center">
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                    )} */}
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
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
    const { data: application, isLoading } = useApplication(applicationId)

    const driver = application?.driver
    const resume = driver?.resume
    const [copied, setCopied] = useState(false)
    const [avatarFailed, setAvatarFailed] = useState(false)

    const appMeta = application
        ? applicationStatusMeta[application.status] ?? applicationStatusMeta.pending
        : null

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
                                "relative  border-b bg-linear-to-b px-6 py-4",
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
                                            {driver?.fio ?? "Unknown"}
                                        </SheetTitle>

                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            Driver #{driver?.id ?? "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </SheetHeader>

                        {/* Content */}
                        <div className="flex-1 space-y-7 p-5">
                            {/* Driver information */}
                            <section>
                                <SectionTitle>Driver information</SectionTitle>

                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    <InfoCard icon={Briefcase} label="Driver number" value={driver?.number ?? "—"} />
                                    <InfoCard
                                        icon={Phone}
                                        label="Phone number"
                                        value={driver?.phone_number ?? "—"}
                                        action={
                                            driver?.phone_number && (
                                                <button
                                                    onClick={handleCopyPhone}
                                                    className="text-muted-foreground/60 transition-colors hover:text-foreground"
                                                    aria-label="Copy phone number"
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
                                    <SectionTitle>Resume</SectionTitle>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <InfoCard icon={Cake} label="Birth date" value={birthDate ?? "—"} />
                                        <InfoCard
                                            icon={Award}
                                            label="Experience"
                                            value={
                                                resume.experience_years !== null
                                                    ? `${resume.experience_years} years`
                                                    : "—"
                                            }
                                        />
                                        <InfoCard icon={Banknote} label="Desired salary" value={desiredSalary ?? "—"} />
                                        <InfoCard icon={MapPin} label="Address" value={resume.address ?? "—"} />
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
                                            <SectionTitle><Truck size={20} /> Transport types</SectionTitle>
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {resume.transport_types.map((t) => (
                                                    <Badge key={t.id} className="rounded-full px-2.5 py-0.5 text-xs font-normal">
                                                        {t.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {resume.work_formats?.length > 0 && (
                                        <div className="mt-3">
                                            <SectionTitle><Briefcase size={20} />  Work format</SectionTitle>

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
                                <SectionTitle>Application</SectionTitle>

                                <div className="mt-3 overflow-hidden rounded-2xl border bg-card">
                                    <DetailRow
                                        icon={Clock}
                                        label="Status"
                                        value={
                                            appMeta && (
                                                <Badge variant="outline" className={cn("border-0 px-2 py-0.5 text-xs font-medium", appMeta.badge)}>
                                                    {appMeta.label}
                                                </Badge>
                                            )
                                        }
                                    />
                                    <DetailRow icon={CalendarClock} label="Applied at" value={formatDateTime(application.applied_at) ?? "—"} />
                                    <DetailRow icon={CalendarClock} label="Last updated" value={formatDateTime(application.updated_at) ?? "—"} />
                                    {application.rejection_reason && (
                                        <DetailRow icon={UserX} label="Rejection reason" value={application.rejection_reason} />
                                    )}
                                </div>
                            </section>

                            {/* Message */}
                            {application.message && (
                                <section>
                                    <SectionTitle>Applicant message</SectionTitle>
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

                        {/* Footer */}
                        {/* <div className="sticky bottom-0 border-t bg-background/80 p-4 backdrop-blur-sm">
                            <p className="text-center text-xs text-muted-foreground">
                                Application details
                                {application.updated_at && (
                                    <span className="text-muted-foreground/60">
                                        {" · "}updated {formatDateTime(application.updated_at)}
                                    </span>
                                )}
                            </p>
                        </div> */}
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

