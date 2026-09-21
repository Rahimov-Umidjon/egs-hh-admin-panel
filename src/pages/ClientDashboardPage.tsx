import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  CircleX,
  FolderOpen,
  PieChart,
  RefreshCw,
  Truck,
  Users,
} from "lucide-react"

import { useAuth } from "@/features/auth/AuthContext"
import { useClientDashboard } from "@/features/cargo/useCargo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { StatusDonutChart } from "@/components/dashboard/StatusDonutChart"
import { WeightVolumeChart } from "@/components/dashboard/WeightVolumeChart"
import { cn } from "@/lib/utils"
import type {
  CargoAdministrativeArea,
  CargoStatus,
  DashboardPublicCargo,
  DashboardRecentCargo,
} from "@/types"

const numberFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 })

const statusBadgeClass: Record<CargoStatus, string> = {
  open: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
  assigned: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400",
  delivered: "border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400",
  cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  iconClass: string
  title: string
  value: number
  tag?: string
  tagClass?: string
  detail?: string
  subtitle: string
}

function StatCard({ icon: Icon, iconClass, title, value, tag, tagClass, detail, subtitle }: StatCardProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconClass)}>
            <Icon className="size-5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold">{numberFormatter.format(value)}</span>
          {tag && (
            <Badge variant="outline" className={cn("rounded-full border-transparent", tagClass)}>
              {tag}
            </Badge>
          )}
          {detail && <span className="text-sm text-muted-foreground">{detail}</span>}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  )
}

function formatWeight(value: number) {
  return `${numberFormatter.format(value)} kg`
}

function formatVolume(value: number) {
  return `${numberFormatter.format(value)} m³`
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString()
}

// Backend hozircha `from`/`to`ni ba'zan bo'sh massiv qilib qaytaradi (tuzatilmoqda) —
// tuzatilgandan keyingi haqiqiy shakl (bitta ob'ekt) bilan ham ishlashi uchun ikkisini
// ham qabul qiladi.
function routePart(area: CargoAdministrativeArea[] | CargoAdministrativeArea | null | undefined) {
  const resolved = Array.isArray(area) ? area[0] : area
  if (!resolved) return "—"
  return [resolved.city?.name, resolved.state?.name, resolved.country?.name].filter(Boolean).join(", ") || "—"
}

type CargoRow = DashboardRecentCargo | DashboardPublicCargo

export default function ClientDashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data, isLoading, isError, refetch, isRefetching } = useClientDashboard()

  const [tab, setTab] = useState<"mine" | "public">("mine")

  const rows: CargoRow[] = tab === "mine" ? data?.recent_cargos ?? [] : data?.recent_public_cargos ?? []

  const donutSegments = useMemo(() => {
    if (!data) return []
    return [
      { key: "open", value: data.cargos.open, fillClass: "fill-emerald-500", dotClass: "bg-emerald-500", label: t("cargoStatus.open") },
      { key: "assigned", value: data.cargos.assigned, fillClass: "fill-violet-500", dotClass: "bg-violet-500", label: t("cargoStatus.assigned") },
      { key: "in_progress", value: data.cargos.in_progress, fillClass: "fill-blue-500", dotClass: "bg-blue-500", label: t("cargoStatus.in_progress") },
      { key: "delivered", value: data.cargos.delivered, fillClass: "fill-green-500", dotClass: "bg-green-500", label: t("cargoStatus.delivered") },
      { key: "cancelled", value: data.cargos.cancelled, fillClass: "fill-red-500", dotClass: "bg-red-500", label: t("cargoStatus.cancelled") },
    ]
  }, [data, t])

  const barData = useMemo(
    () =>
      (data?.recent_cargos ?? []).map((cargo) => ({
        key: String(cargo.id),
        label: cargo.name,
        weight: cargo.weight ?? 0,
        volume: cargo.volume ?? 0,
      })),
    [data]
  )

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/10">
          <CircleX className="size-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{t("clientDashboard.error.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("clientDashboard.error.description")}</p>
        </div>
        <Button variant="outline" className="mt-2" onClick={() => refetch()}>
          <RefreshCw className={cn("mr-2 size-4", isRefetching && "animate-spin")} />
          {t("clientDashboard.error.retry")}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {t("client.dashboard_welcome_title", { name: user?.name ?? "" })}
          </h2>
          <p className="text-sm text-muted-foreground">{t("client.dashboard_welcome_subtitle")}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {/* Statistika kartalari */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {isLoading || !data ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              icon={Boxes}
              iconClass="bg-slate-100 text-slate-600"
              title={t("clientDashboard.stats.total")}
              value={data.cargos.total}
              tag={t("clientDashboard.stats.totalTag")}
              tagClass="bg-emerald-50 text-emerald-700"
              subtitle={t("clientDashboard.stats.totalSubtitle")}
            />
            <StatCard
              icon={FolderOpen}
              iconClass="bg-amber-100 text-amber-600"
              title={t("clientDashboard.stats.open")}
              value={data.cargos.open}
              tag={t("clientDashboard.stats.openTag")}
              tagClass="bg-blue-50 text-blue-700"
              subtitle={t("clientDashboard.stats.openSubtitle")}
            />
            <StatCard
              icon={Truck}
              iconClass="bg-blue-100 text-blue-600"
              title={t("clientDashboard.stats.inProgress")}
              value={data.cargos.assigned + data.cargos.in_progress}
              detail={t("clientDashboard.stats.inProgressBreakdown", {
                assigned: data.cargos.assigned,
                inProgress: data.cargos.in_progress,
              })}
              subtitle={t("clientDashboard.stats.inProgressSubtitle")}
            />
            <StatCard
              icon={CheckCircle2}
              iconClass="bg-emerald-100 text-emerald-600"
              title={t("clientDashboard.stats.delivered")}
              value={data.cargos.delivered}
              tag={t("clientDashboard.stats.deliveredTag")}
              tagClass="bg-green-50 text-green-700"
              subtitle={t("clientDashboard.stats.deliveredSubtitle")}
            />
            <StatCard
              icon={Users}
              iconClass="bg-violet-100 text-violet-600"
              title={t("clientDashboard.stats.carriers")}
              value={data.carriers.total_approved}
              tag={t("clientDashboard.stats.carriersTag")}
              tagClass="bg-violet-50 text-violet-700"
              subtitle={t("clientDashboard.stats.carriersSubtitle")}
            />
          </>
        )}
      </div>

      {/* Diagrammalar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>{t("clientDashboard.statusChart.title")}</CardTitle>
              <CardDescription>{t("clientDashboard.statusChart.subtitle")}</CardDescription>
            </div>
            <PieChart className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="size-44 rounded-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <StatusDonutChart
                  segments={donutSegments}
                  centerLabel={t("clientDashboard.statusChart.centerLabel")}
                />
                <div className="grid w-full grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {donutSegments.map((segment) => (
                    <div key={segment.key} className="flex items-center gap-2">
                      <span className={cn("size-2.5 shrink-0 rounded-full", segment.dotClass)} />
                      <span className="text-muted-foreground">{segment.label}:</span>
                      <span className="font-medium">{segment.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none lg:col-span-3">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>{t("clientDashboard.weightVolumeChart.title")}</CardTitle>
              <CardDescription>{t("clientDashboard.weightVolumeChart.subtitle")}</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-blue-500" />
                {t("clientDashboard.weightVolumeChart.weightLegend")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-violet-500" />
                {t("clientDashboard.weightVolumeChart.volumeLegend")}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 w-full">
                <WeightVolumeChart data={barData} formatWeight={formatWeight} formatVolume={formatVolume} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Yuklar ro'yxati */}
      <Card className="shadow-none">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "mine" | "public")}>
              <TabsList>
                <TabsTrigger value="mine">
                  {t("clientDashboard.table.mineTab", { count: data?.recent_cargos.length ?? 0 })}
                </TabsTrigger>
                <TabsTrigger value="public">
                  {t("clientDashboard.table.publicTab", { count: data?.recent_public_cargos.length ?? 0 })}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button variant="outline" size="sm" asChild>
              <Link to="/client/cargos">
                {t("clientDashboard.table.viewAll")}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("clientDashboard.table.columns.id")}</TableHead>
                <TableHead>{t("clientDashboard.table.columns.route")}</TableHead>
                <TableHead>{t("clientDashboard.table.columns.status")}</TableHead>
                <TableHead>{t("clientDashboard.table.columns.weight")}</TableHead>
                <TableHead>{t("clientDashboard.table.columns.volume")}</TableHead>
                <TableHead>{t("clientDashboard.table.columns.quantity")}</TableHead>
                <TableHead>{t("clientDashboard.table.columns.dates")}</TableHead>
                <TableHead className="text-right">{t("clientDashboard.table.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || !data ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    {t("clientDashboard.table.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <span className="font-medium text-muted-foreground">#{row.id}</span>{" "}
                      <span className="font-medium">{row.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-xs">
                        <span>{routePart(row.from)}</span>
                        <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                        <span>{routePart(row.to)}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("rounded py-1", statusBadgeClass[row.status])}>
                        {t(`cargoStatus.${row.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.weight != null ? formatWeight(row.weight) : "—"}</TableCell>
                    <TableCell>{row.volume != null ? formatVolume(row.volume) : "—"}</TableCell>
                    <TableCell>{row.quantity ?? "—"}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p>
                          {t("clientDashboard.table.loadingLabel")}: {formatDate(row.loading_at)}
                        </p>
                        <p className="text-muted-foreground">
                          {t("clientDashboard.table.unloadingLabel")}: {formatDate(row.unloading_at)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-md"
                        asChild
                        aria-label={t("clientDashboard.table.viewAria")}
                      >
                        <Link to={`/client/cargos/${row.id}`}>
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
