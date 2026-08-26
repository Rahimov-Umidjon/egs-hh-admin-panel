import type { VehicleStatus } from "@/types"

 

const statusClasses: Record<VehicleStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  inactive: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400",
  maintenance: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  repair: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
}

const fallbackClass = "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400"

export function statusBadgeClass(status: string): string {
  return statusClasses[status as VehicleStatus] ?? fallbackClass
}