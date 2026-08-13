// pages/VacancyDetailPage.tsx
// Route: /vacancies/:id

import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
    ArrowLeft,
    Banknote,
    Briefcase,
    CalendarClock,
    Check,
    Clock,
    Eye,
    ListChecks,
    Loader2,
    MessageSquare,
    MoreVertical,
    Pencil,
    Phone,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Trash2,
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
import type { EmploymentType, VacancyStatus } from "@/types"
import {
    useDeleteVacancy,
    useUpdateVacancyStatus,
    useVacancy,
} from "@/features/vacancies"
import {
    useChangeApplicationStatus,
    useInfiniteApplications,
} from "@/features/applications/useApplications"

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

    const { data: vacancy, isLoading } = useVacancy(vacancyId)

    const {
        data: applicationsData,
        isLoading: applicationsLoading,
        isFetchingNextPage: isFetchingNextApplications,
        hasNextPage: hasNextApplicationsPage,
        fetchNextPage: fetchNextApplicationsPage,
    } = useInfiniteApplications({
        vacancy_id: vacancyId ?? undefined,
    } as never)

    const applications = (applicationsData?.pages.flatMap((page) => page.data) ?? []) as Application[]
    const applicationsTotal = applicationsData?.pages[0]?.pagination.total ?? applications.length

    const [search, setSearch] = useState("")
    const filteredApplications = useMemo(() => {
        if (!search.trim()) return applications
        const q = search.trim().toLowerCase()
        return applications.filter((app) => {
            const name = (app.driver?.fio ?? app.full_name ?? "").toLowerCase()
            const phone = (app.driver?.phone_number ?? "").toLowerCase()
            return name.includes(q) || phone.includes(q)
        })
    }, [applications, search])

    const applicationsSentinelRef = useRef<HTMLDivElement | null>(null)
    useEffect(() => {
        const sentinel = applicationsSentinelRef.current
        if (!sentinel) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextApplicationsPage && !isFetchingNextApplications) {
                    fetchNextApplicationsPage()
                }
            },
            { rootMargin: "200px" }
        )
        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [hasNextApplicationsPage, isFetchingNextApplications, fetchNextApplicationsPage])

    const changeApplicationStatus = useChangeApplicationStatus()

    const [selectedApp, setSelectedApp] = useState<Application | null>(null)

    const handleInvite = (applicationId: number) => {
        changeApplicationStatus.mutate({ id: applicationId, status: "invited" })
    }

    const handleReject = (applicationId: number) => {
        const reason = window.prompt("Rejection reason (optional):")
        if (reason === null) return
        changeApplicationStatus.mutate({
            id: applicationId,
            status: "rejected",
            rejection_reason: reason || undefined,
        })
    }

    const deleteMutation = useDeleteVacancy()
    const updateStatusMutation = useUpdateVacancyStatus()

    const meta = vacancy ? statusMeta[vacancy.status] ?? statusMeta.draft : null
    const availableStatuses = vacancy
        ? nextStatusOptions[vacancy.status as VacancyStatus] ?? []
        : []

    const handleDelete = () => {
        if (!vacancy) return
        if (!window.confirm(`"${vacancy.title}" will be permanently deleted. Continue?`)) {
            return
        }
        deleteMutation.mutate(vacancy.id, {
            onSuccess: () => navigate("/vacancies"),
        })
    }

    const handleStatusChange = (newStatus: VacancyStatus) => {
        if (!vacancy) return
        updateStatusMutation.mutate({ id: vacancy.id, status: newStatus })
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
                    <Button variant="outline" size="sm" onClick={() => navigate(`/vacancies/${vacancy.id}/edit`)}>
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
                                {employmentTypeLabels[vacancy.employment_type] ?? vacancy.employment_type}
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
                                value={employmentTypeLabels[vacancy.employment_type] ?? vacancy.employment_type}
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
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <SlidersHorizontal className="size-3.5" />
                                Filter
                            </Button>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search applicants..."
                                    className="h-8 w-56 pl-8 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {applicationsLoading && (
                        <div className="flex justify-center py-8">
                            <Loader2 className="size-5 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {!applicationsLoading && filteredApplications.length === 0 && (
                        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                            No applications yet
                        </div>
                    )}

                    {!applicationsLoading && filteredApplications.length > 0 && (
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
                                    {filteredApplications.map((app) => {
                                        const appMeta = applicationStatusMeta[app.status] ?? applicationStatusMeta.pending
                                        const isOnline = !!app.driver?.is_online

                                        return (
                                            <TableRow key={app.id} className="cursor-pointer" onClick={() => setSelectedApp(app)}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                            {(app.driver?.fio ?? app.full_name ?? "?")
                                                                .split(" ")
                                                                .map((p) => p[0])
                                                                .join("")
                                                                .slice(0, 2)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium leading-none text-foreground">
                                                                {app.driver?.fio ?? app.full_name ?? `Application #${app.id}`}
                                                            </p>
                                                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                                <span className={cn("size-1.5 rounded-full", isOnline ? "bg-emerald-500" : "bg-muted-foreground/40")} />
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
                                                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedApp(app)}>
                                                            View
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                                                                    More
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-44">
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer text-emerald-700 focus:text-emerald-700 dark:text-emerald-400"
                                                                    disabled={changeApplicationStatus.isPending || app.status !== "pending"}
                                                                    onClick={() => handleInvite(app.id)}
                                                                >
                                                                    <UserCheck className="size-4" />
                                                                    Invite
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer text-rose-700 focus:text-rose-700 dark:text-rose-400"
                                                                    disabled={changeApplicationStatus.isPending || app.status !== "pending"}
                                                                    onClick={() => handleReject(app.id)}
                                                                >
                                                                    <UserX className="size-4" />
                                                                    Reject
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/drivers/${app.driver?.id}`)}>
                                                                    <UserRound className="size-4" />
                                                                    View profile
                                                                </DropdownMenuItem>
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

                    <div ref={applicationsSentinelRef} className="flex justify-center py-2">
                        {isFetchingNextApplications && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                    </div>
                </CardContent>
            </Card>

            {/* Side panel: applicant detail */}
            <ApplicantSidePanel
                application={selectedApp}
                onOpenChange={(open) => {
                    if (!open) setSelectedApp(null)
                }}
                onInvite={() => selectedApp && handleInvite(selectedApp.id)}
                onReject={() => selectedApp && handleReject(selectedApp.id)}
                onChangeStatus={() => {
                    /* wire up to a status picker/dialog if you have one */
                }}
                onViewProfile={() => selectedApp && navigate(`/drivers/${selectedApp.driver?.id}`)}
                isPending={changeApplicationStatus.isPending}
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
    application,
    onOpenChange,
    onInvite,
    onReject,
    onChangeStatus,
    onViewProfile,
    isPending,
}: {
    application: Application | null
    onOpenChange: (open: boolean) => void
    onInvite: () => void
    onReject: () => void
    onChangeStatus: () => void
    onViewProfile: () => void
    isPending: boolean
}) {
    const driver = application?.driver
    const appMeta = application
        ? applicationStatusMeta[application.status] ?? applicationStatusMeta.pending
        : null
    const isOnline = !!driver?.is_online
    const canDecide = application?.status === "pending"

    const initials = (driver?.fio ?? "?")
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()

    return (
        <Sheet open={!!application} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[320px] gap-0 overflow-y-auto p-0 sm:max-w-[320px]">
                {application && (
                    <>
                        <SheetHeader className="flex-row items-center gap-3 space-y-0 border-b p-4">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <SheetTitle className="truncate text-left text-base">
                                    {driver?.fio ?? "Unknown"}
                                </SheetTitle>
                                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                    <span className={cn("size-1.5 rounded-full", isOnline ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                                    {isOnline ? "Online" : "Offline"}
                                </p>
                            </div>
                        </SheetHeader>

                        <div className="space-y-4 p-4">
                            <DetailRow icon={UserRound} label="Driver ID" value={`#${driver?.id}`} />
                            <DetailRow icon={Phone} label="Phone" value={driver?.phone_number ?? "—"} />
                            <DetailRow icon={Briefcase} label="Driver number" value={driver?.number ?? "—"} />
                            <DetailRow
                                icon={Clock}
                                label="Application status"
                                value={
                                    appMeta && (
                                        <Badge variant="outline" className={cn("border-0 px-2 py-0.5 text-xs font-medium", appMeta.badge)}>
                                            {appMeta.label}
                                        </Badge>
                                    )
                                }
                            />
                            <DetailRow icon={Clock} label="Last login" value={formatDateTime(driver?.last_login_at) ?? "—"} />
                            {application.message && (
                                <DetailRow icon={MessageSquare} label="Applicant message" value={application.message} />
                            )}
                            <DetailRow icon={CalendarClock} label="Applied at" value={formatDateTime(application.applied_at) ?? "—"} />
                            <DetailRow icon={CalendarClock} label="Last updated" value={formatDateTime(application.updated_at) ?? "—"} />
                        </div>

                        <div className="space-y-2 border-t p-4">
                            <Button className="w-full justify-start" onClick={onViewProfile}>
                                <UserRound className="size-4" />
                                View profile
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                disabled={!canDecide || isPending}
                                onClick={onInvite}
                            >
                                <UserCheck className="size-4" />
                                Invite
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={!canDecide || isPending}
                                onClick={onReject}
                            >
                                <X className="size-4" />
                                Reject
                            </Button>
                            <Button variant="outline" className="w-full justify-start" onClick={onChangeStatus}>
                                <RefreshCw className="size-4" />
                                Change status
                            </Button>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
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
        <div className="flex items-start gap-3 text-sm">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <div className="font-medium text-foreground">{value}</div>
            </div>
        </div>
    )
}

/*
================================================================================
NOTES
================================================================================
1) Sheet komponenti standart shadcn API'siga mos yozildi:
   <Sheet open={...} onOpenChange={...}>
     <SheetContent side="right">
       <SheetHeader><SheetTitle>...</SheetTitle></SheetHeader>
       ...
     </SheetContent>
   </Sheet>
   Agar sizning sheet.tsx faylingiz boshqa proplar talab qilsa
   (masalan className o'rniga boshqa nom, yoki SheetContent standart X
   close tugmasini ko'rsatmasa), fayl kontentini yuboring — moslashtiraman.

2) @/components/ui/table primitivini talab qiladi
   (Table, TableHeader, TableBody, TableRow, TableHead, TableCell).
   Agar yo'q bo'lsa: npx shadcn@latest add table

3) ApplicationListParams'da "vacancy_id" maydoni borligini faraz qildim —
   agar boshqacha nomlangan bo'lsa (masalan vacancyId), useInfiniteApplications
   chaqiruvidagi kalitni moslang.

4) Application status enum'ida "pending" | "invited" | "rejected"dan boshqa
   qiymatlar bo'lsa, applicationStatusMeta ob'ektiga qo'shing.

5) "carrier / company" bo'limi olib tashlandi — sizning vacancy JSON'ingizda
   bunday maydon yo'q edi. Agar API'da bo'lsa, qaytarib qo'shish mumkin.

6) "Change status" tugmasi hozircha no-op — status picker/dialogingiz
   bo'lsa ulab qo'ying.

7) Pagination footer (screenshotdagi "10 per page" va raqamlangan pager)
   kiritilmadi, chunki hook'ingiz infinite scroll ishlatadi.
================================================================================
*/