import { useState } from "react"
import {
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Eye,
    Loader2,
    MoreHorizontal,
    Search,
    ThumbsDown,
    ThumbsUp,
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
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

import { useDebouncedValue } from "@/hooks/use-debounced-value"
import type { Application, ApplicationStatus } from "@/types"

import { cn } from "@/lib/utils"
import { useApplications, useChangeApplicationStatus } from "@/features/applications/useApplications"
import { useNavigate } from "react-router-dom"

const statusMeta: Record<
    ApplicationStatus,
    { label: string; dot: string; text: string }
> = {
    pending: {
        label: "Kutilmoqda",
        dot: "bg-amber-400",
        text: "text-amber-700 dark:text-amber-400",
    },
    invited: {
        label: "Taklif qilingan",
        dot: "bg-emerald-500",
        text: "text-emerald-700 dark:text-emerald-400",
    },
    rejected: {
        label: "Rad etilgan",
        dot: "bg-rose-400",
        text: "text-rose-700 dark:text-rose-400",
    },
}

const employmentLabels: Record<string, string> = {
    full_time: "To'liq stavka",
    part_time: "Yarim stavka",
}

export default function ApplicationsPage() {
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState<ApplicationStatus | undefined>()
    const [page, setPage] = useState(1)
    const debouncedSearch = useDebouncedValue(search, 400)

    const hasActiveFilters = Boolean(search || status)
    const clearFilters = () => {
        setSearch("")
        setStatus(undefined)
        setPage(1)
    }

    const { data, isLoading, isFetching } = useApplications({
        search: debouncedSearch || undefined,
        status,
        page,
    })

    const changeStatusMutation = useChangeApplicationStatus()

    const [actionTarget, setActionTarget] = useState<{
        application: Application
        status: Extract<ApplicationStatus, "invited" | "rejected">
    } | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")

    const requestStatusChange = (
        application: Application,
        newStatus: Extract<ApplicationStatus, "invited" | "rejected">
    ) => {
        setRejectionReason("")
        setActionTarget({ application, status: newStatus })
    }

    const navigate = useNavigate()
    const confirmStatusChange = () => {
        if (!actionTarget) return
        changeStatusMutation.mutate(
            {
                id: actionTarget.application.id,
                status: actionTarget.status,
                rejection_reason:
                    actionTarget.status === "rejected" ? rejectionReason || undefined : undefined,
            },
            { onSuccess: () => setActionTarget(null) }
        )
    }

    const applications = data?.data ?? []
    const pagination = data?.pagination
    const total = pagination?.total ?? 0

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Arizalar</h2>
                <p className="text-sm text-muted-foreground">
                    Vakansiyalarga tushgan arizalarni ko'rib chiqish
                </p>
            </div>

            {/* Filterlar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative max-w-sm flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Haydovchi yoki vakansiya bo'yicha qidirish..."
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
                        setStatus(v === "all" ? undefined : (v as ApplicationStatus))
                        setPage(1)
                    }}
                >
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Barcha statuslar</SelectItem>
                        <SelectItem value="pending">Kutilmoqda</SelectItem>
                        <SelectItem value="invited">Taklif qilingan</SelectItem>
                        <SelectItem value="rejected">Rad etilgan</SelectItem>
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                        <X className="mr-1 size-3.5" />
                        Tozalash
                    </Button>
                )}

                {!isLoading && (
                    <p className="ml-auto shrink-0 text-sm text-muted-foreground">
                        Jami <span className="font-medium text-foreground">{total}</span> ta ariza
                    </p>
                )}
            </div>

            {isLoading && (
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                </div>
            )}

            {!isLoading && applications.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center text-muted-foreground">
                    <ClipboardList className="mb-3 size-10 opacity-40" />
                    <p className="font-medium text-foreground">Arizalar topilmadi</p>
                    <p className="text-sm">Qidiruv yoki filtrni o'zgartirib ko'ring</p>
                </div>
            )}

            {!isLoading && applications.length > 0 && (
                <div className="rounded-2xl border">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Nomzod</TableHead>
                                <TableHead>Vakansiya</TableHead>
                                <TableHead>Ish turi</TableHead>
                                <TableHead>Maosh</TableHead>
                                <TableHead>Sana</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amallar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.map((application) => {
                                const meta = statusMeta[application.status] ?? statusMeta.pending
                                const canAct = application.status === "pending"

                                return (
                                    <TableRow key={application.id}>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <p className="font-medium text-foreground">
                                                    {application.driver.fio ?? "Ism kiritilmagan"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {application.driver.phone_number}
                                                </p>
                                            </div>
                                        </TableCell>

                                        <TableCell className="max-w-[220px]">
                                            <p className="truncate font-medium text-muted-foreground">
                                                {application.vacancy.title}
                                            </p>
                                            {application.message && (
                                                <p className="truncate text-xs text-muted-foreground/70">
                                                    {application.message}
                                                </p>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-muted-foreground">
                                            {employmentLabels[application.vacancy.employment_type] ??
                                                application.vacancy.employment_type}
                                        </TableCell>

                                        <TableCell className="tabular-nums">
                                            {application.vacancy.salary_from.toLocaleString()} –{" "}
                                            {application.vacancy.salary_to.toLocaleString()}{" "}
                                            <span className="text-xs text-muted-foreground">
                                                {application.vacancy.salary_currency}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-muted-foreground">
                                            {new Date(application.applied_at).toLocaleDateString("uz-UZ")}
                                        </TableCell>

                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn("border-0 bg-muted px-2 py-0.5 text-xs font-medium", meta.text)}
                                            >
                                                <span className={cn("mr-1.5 size-1.5 rounded-full", meta.dot)} />
                                                {meta.label}
                                            </Badge>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center justify-end">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="cursor-pointer text-muted-foreground hover:text-foreground"
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <DropdownMenuItem
                                                            onClick={() => navigate(`/vacancies/${application?.vacancy_id}`)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Eye className="mr-2 size-4" />
                                                            Ko'rish
                                                        </DropdownMenuItem>

                                                        {canAct && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={() => requestStatusChange(application, "invited")}
                                                                    className="cursor-pointer text-emerald-700 focus:text-emerald-700 dark:text-emerald-400"
                                                                >
                                                                    <ThumbsUp className="mr-2 size-4" />
                                                                    Taklif qilish
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => requestStatusChange(application, "rejected")}
                                                                    className="cursor-pointer text-rose-700 focus:text-rose-700 dark:text-rose-400"
                                                                >
                                                                    <ThumbsDown className="mr-2 size-4" />
                                                                    Rad etish
                                                                </DropdownMenuItem>
                                                            </>
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

            {/* Paginatsiya */}
            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {pagination.from}–{pagination.to} / jami {pagination.total} ta
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.current_page <= 1 || isFetching}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="cursor-pointer"
                        >
                            <ChevronLeft className="mr-1 size-4" />
                            Oldingi
                        </Button>

                        <span className="text-sm text-muted-foreground">
                            {pagination.current_page} / {pagination.last_page}
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.current_page >= pagination.last_page || isFetching}
                            onClick={() => setPage((p) => p + 1)}
                            className="cursor-pointer"
                        >
                            Keyingi
                            <ChevronRight className="ml-1 size-4" />
                        </Button>
                    </div>
                </div>
            )}

            {isFetching && !isLoading && (
                <div className="flex justify-center">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
            )}

            <AlertDialog open={!!actionTarget} onOpenChange={(open) => !open && setActionTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionTarget?.status === "invited"
                                ? "Nomzodni taklif qilishni tasdiqlaysizmi?"
                                : "Arizani rad etishni tasdiqlaysizmi?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            "{actionTarget?.application.driver.fio ?? actionTarget?.application.driver.phone_number}"
                            ning "{actionTarget?.application.vacancy.title}" vakansiyasiga yuborgan arizasi{" "}
                            <span className="font-medium text-foreground">
                                {actionTarget && statusMeta[actionTarget.status].label}
                            </span>{" "}
                            ga o'zgartiriladi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {actionTarget?.status === "rejected" && (
                        <Textarea
                            placeholder="Rad etish sababi (ixtiyoriy)"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="min-h-20"
                        />
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmStatusChange}
                            disabled={changeStatusMutation.isPending}
                        >
                            Tasdiqlash
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    )
}