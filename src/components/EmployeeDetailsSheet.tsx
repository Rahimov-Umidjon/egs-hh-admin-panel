import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
    Award,
    Banknote,
    Briefcase,
    Building2,
    CalendarClock,
    Check,
    Clock,
    Copy,
    FileText,
    Hash,
    Phone,
    Tag,
} from "lucide-react"

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useEmployee } from "@/features/employees/useEmployees"
import type { EmploymentType } from "@/types"

// ------------------------------------------------------------------
// Static styles
// ------------------------------------------------------------------

const sourceStyles: Record<string, { badge: string }> = {
    manual: { badge: "bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300" },
    vacancy: { badge: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400" },
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

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

interface EmployeeDetailsSheetProps {
    employeeId: number | null
    onOpenChange: (open: boolean) => void
}

export function EmployeeDetailsSheet({ employeeId, onOpenChange }: EmployeeDetailsSheetProps) {
    const { t } = useTranslation()
    const { data: employee, isLoading } = useEmployee(employeeId)

    const driver = employee?.driver
    const [copied, setCopied] = useState(false)
    const [avatarFailed, setAvatarFailed] = useState(false)

    const srcStyle = employee ? sourceStyles[employee.source] ?? sourceStyles.manual : null

    const getSourceLabel = (src: string) => t(`employeeDetails.sourceValues.${src}`, { defaultValue: src })
    const getEmploymentTypeLabel = (type: string) =>
        t(`employeeDetails.employmentTypeValues.${type}`, { defaultValue: type })
    const getPayPeriodLabel = (period: string) =>
        t(`employeeDetails.payPeriodValues.${period}`, { defaultValue: period })

    const isOnline = !!driver?.is_online

    const initials = (driver?.fio ?? employee?.employee_number ?? "?")
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

    return (
        <Sheet open={employeeId !== null} onOpenChange={onOpenChange}>
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

                {!isLoading && employee && (
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

                                        {driver && (
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
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <SheetTitle className="truncate text-lg font-semibold tracking-tight">
                                            {driver?.fio ?? employee.employee_number}
                                        </SheetTitle>

                                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Hash className="size-3.5" />
                                            {employee.employee_number}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </SheetHeader>

                        {/* Content */}
                        <div className="flex-1 space-y-7 p-5">
                            {/* Driver information */}
                            {driver && (
                                <section>
                                    <SectionTitle>{t("employeeDetails.sections.driverInformation")}</SectionTitle>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <InfoCard icon={Briefcase} label={t("employeeDetails.driverNumber")} value={driver.number ?? "—"} />
                                        <InfoCard
                                            icon={Phone}
                                            label={t("employeeDetails.phoneNumber")}
                                            value={driver.phone_number ?? "—"}
                                            action={
                                                driver.phone_number && (
                                                    <button
                                                        onClick={handleCopyPhone}
                                                        className="text-muted-foreground/60 transition-colors hover:text-foreground"
                                                        aria-label={t("employeeDetails.copyPhoneAria")}
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
                            )}

                            {/* Employment */}
                            <section>
                                <SectionTitle>{t("employeeDetails.sections.employment")}</SectionTitle>

                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    <InfoCard icon={Briefcase} label={t("employeeDetails.position")} value={employee.position} />
                                    <InfoCard
                                        icon={Award}
                                        label={t("employeeDetails.employmentType")}
                                        value={getEmploymentTypeLabel(employee.employment_type as EmploymentType)}
                                    />
                                    <InfoCard
                                        icon={Banknote}
                                        label={t("employeeDetails.salary")}
                                        value={`${Number(employee.salary).toLocaleString()} ${employee.salary_currency}`}
                                    />
                                    <InfoCard
                                        icon={Clock}
                                        label={t("employeeDetails.payPeriod")}
                                        value={getPayPeriodLabel(employee.pay_period)}
                                    />
                                </div>
                            </section>

                            {/* Timeline */}
                            <section>
                                <SectionTitle>{t("employeeDetails.sections.timeline")}</SectionTitle>

                                <div className="mt-3 overflow-hidden rounded-2xl border bg-card">
                                    <DetailRow
                                        icon={Tag}
                                        label={t("employeeDetails.source")}
                                        value={
                                            srcStyle && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn("border-0 px-2 py-0.5 text-xs font-medium", srcStyle.badge)}
                                                >
                                                    {getSourceLabel(employee.source)}
                                                </Badge>
                                            )
                                        }
                                    />
                                    <DetailRow
                                        icon={CalendarClock}
                                        label={t("employeeDetails.startedAt")}
                                        value={formatDate(employee.started_at) ?? "—"}
                                    />
                                    {employee.ended_at && (
                                        <DetailRow
                                            icon={CalendarClock}
                                            label={t("employeeDetails.endedAt")}
                                            value={formatDate(employee.ended_at) ?? "—"}
                                        />
                                    )}
                                    {employee.termination_reason && (
                                        <DetailRow
                                            icon={Building2}
                                            label={t("employeeDetails.terminationReason")}
                                            value={employee.termination_reason}
                                        />
                                    )}
                                    <DetailRow
                                        icon={CalendarClock}
                                        label={t("employeeDetails.createdAt")}
                                        value={formatDateTime(employee.created_at) ?? "—"}
                                    />
                                    <DetailRow
                                        icon={CalendarClock}
                                        label={t("employeeDetails.lastUpdated")}
                                        value={formatDateTime(employee.updated_at) ?? "—"}
                                    />
                                </div>
                            </section>

                            {/* Notes */}
                            {employee.notes && (
                                <section>
                                    <SectionTitle>{t("employeeDetails.sections.notes")}</SectionTitle>
                                    <div className="mt-3 rounded-2xl border bg-muted/30 p-4">
                                        <div className="flex gap-3">
                                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background">
                                                <FileText className="size-3.5 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm leading-6 text-foreground/80">
                                                {employee.notes}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Meta */}
                            {employee.meta && Object.keys(employee.meta).length > 0 && (
                                <section>
                                    <SectionTitle>{t("employeeDetails.sections.additionalInfo")}</SectionTitle>
                                    <div className="mt-3 overflow-hidden rounded-2xl border bg-card">
                                        {Object.entries(employee.meta).map(([key, value]) => (
                                            <DetailRow
                                                key={key}
                                                icon={Tag}
                                                label={key.replace(/_/g, " ")}
                                                value={
                                                    Array.isArray(value) ? value.join(", ") : String(value ?? "—")
                                                }
                                            />
                                        ))}
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

// ------------------------------------------------------------------
// Shared sub-components (identical style to ApplicantSidePanel)
// ------------------------------------------------------------------

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
        <div className="flex items-center gap-3 border-b px-4 py-3.5 capitalize transition-colors last:border-b-0 hover:bg-muted/20">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/5">
                <Icon className="size-4 text-primary/70" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                    {label}
                </p>

                <div className="mt-0.5 truncate text-sm font-medium text-foreground normal-case">
                    {value}
                </div>
            </div>
        </div>
    )
}