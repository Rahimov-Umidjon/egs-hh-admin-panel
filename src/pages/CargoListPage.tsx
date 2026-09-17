import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  CircleDot,
  CircleX,
  Loader2,
  Package,
  PackageCheck,
  Plus,
  Truck,
  UserCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useConfirm } from "@/components/confirm-provider"
import { CargoCard } from "@/components/CargoCard"
import { cn } from "@/lib/utils"

import {
  useCancelCargo,
  useCargoStatusCounts,
  useDeleteCargo,
  useInfiniteCargos,
} from "@/features/cargo/useCargo"
import type { CargoStatus } from "@/types"

const STATUS_SUMMARY = [
  { status: "open", icon: CircleDot, color: "text-emerald-600", bg: "bg-emerald-50" },
  { status: "assigned", icon: UserCheck, color: "text-violet-600", bg: "bg-violet-50" },
  { status: "in_progress", icon: Truck, color: "text-blue-600", bg: "bg-blue-50" },
  { status: "delivered", icon: PackageCheck, color: "text-green-600", bg: "bg-green-50" },
  { status: "cancelled", icon: CircleX, color: "text-red-600", bg: "bg-red-50" },
] as const

interface CargoListResultsProps {
  status: CargoStatus | "all"
  onCancel: (id: number, name: string) => void
  onDelete: (id: number, name: string) => void
}

// Status filtri o'zgarganda ushbu komponent butunlay qayta yaratiladi (ota
// komponentda `key={status}` orqali) — shu bilan `useInfiniteCargos` so'rovi,
// IntersectionObserver va scroll holati har safar mutlaqo toza boshlanishini
// kafolatlaymiz, oldingi filtrning hech qanday qoldiq holati (eski sahifalar,
// eski observer closure'lari) yangi filtrga o'tib ketmaydi.
function CargoListResults({ status, onCancel, onDelete }: CargoListResultsProps) {
  const { t } = useTranslation()

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteCargos({
    status: status === "all" ? undefined : status,
    per_page: 16,
  })

  const cargos = data?.pages.flatMap((page) => page.data) ?? []

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-96 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  if (cargos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Package className="size-6" />
        </div>
        <p className="text-sm font-medium">{t("cargoList.empty.title")}</p>
        <p className="text-sm text-muted-foreground">{t("cargoList.empty.description")}</p>
        <Button asChild size="sm">
          <Link to="/client/cargos/new">
            <Plus className="mr-2 size-4" />
            {t("cargoList.create")}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
        {cargos.map((cargo) => {
          const canEdit = cargo.status === "open"
          const canCancel = cargo.status === "assigned" || cargo.status === "in_progress"
          const canDelete = cargo.status === "open"
          const closeAction = canDelete
            ? () => onDelete(cargo.id, cargo.name)
            : canCancel
              ? () => onCancel(cargo.id, cargo.name)
              : undefined

          return (
            <CargoCard
              key={cargo.id}
              cargo={cargo}
              detailHref={`/client/cargos/${cargo.id}`}
              editHref={canEdit ? `/client/cargos/${cargo.id}/edit` : undefined}
              onClose={closeAction}
            />
          )
        })}
      </div>

      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        {!hasNextPage && cargos.length > 0 && (
          <p className="text-sm text-muted-foreground">{t("cargoList.loadedAll")}</p>
        )}
      </div>
    </>
  )
}

export default function CargoListPage() {
  const { t } = useTranslation()
  const confirm = useConfirm()

  const [status, setStatus] = useState<CargoStatus | "all">("open")
  const { counts } = useCargoStatusCounts()

  const cancelCargo = useCancelCargo()
  const deleteCargo = useDeleteCargo()

  const statusTabs: (CargoStatus | "all")[] = [
    "all",
    "open",
    "assigned",
    "in_progress",
    "delivered",
    "cancelled",
  ]

  const handleCancel = (id: number, name: string) => {
    confirm({
      title: t("cargoList.cancelConfirm.title"),
      description: t("cargoList.cancelConfirm.description", { name }),
      confirmText: t("cargoList.cancelConfirm.confirm"),
      variant: "destructive",
      fields: [
        {
          name: "reason",
          label: t("cargoList.cancelConfirm.reasonLabel"),
          placeholder: t("cargoList.cancelConfirm.reasonPlaceholder"),
          multiline: true,
        },
      ],
      onConfirm: async (values) => {
        await cancelCargo.mutateAsync({ id, reason: values.reason || undefined })
        toast.success(t("cargoList.cancelSuccess"))
      },
    })
  }

  const handleDelete = (id: number, name: string) => {
    confirm({
      title: t("cargoList.deleteConfirm.title"),
      description: t("cargoList.deleteConfirm.description", { name }),
      confirmText: t("cargoList.deleteConfirm.confirm"),
      variant: "destructive",
      onConfirm: async () => {
        await deleteCargo.mutateAsync(id)
        toast.success(t("cargoList.deleteSuccess"))
      },
    })
  }

  return (
    <div className="space-y-6">


      <div className="flex items-center justify-between">



        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("cargoList.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("cargoList.subtitle")}</p>
        </div>
        <Button asChild>
          <Link to="/client/cargos/new">
            <Plus className="mr-2 size-4" />
            {t("cargoList.create")}
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border p-4">
        {STATUS_SUMMARY.map(({ status: s, icon: Icon, color, bg }) => (
          <div key={s} className="flex items-center gap-3">
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", bg)}>
              <Icon className={cn("size-5", color)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t(`cargoStatus.${s}`)}</p>
              <p className="text-lg font-semibold">{counts[s] ?? "—"}</p>
            </div>
          </div>
        ))}
      </div>


      <div className="flex justify-end">
        <Tabs value={status} onValueChange={(v) => setStatus(v as CargoStatus | "all")}>
          <TabsList className="flex-wrap h-auto">
            {statusTabs.map((s) => (
              <TabsTrigger key={s} value={s}>
                {t(`cargoStatus.${s}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <CargoListResults
        key={status}
        status={status}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />


    </div>
  )
}
