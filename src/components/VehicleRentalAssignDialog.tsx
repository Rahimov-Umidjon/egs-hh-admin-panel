import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { getFieldErrors } from "@/lib/Api-error"
import { useCreateVehicleRental } from "@/features/vehicles/Usevehiclerentals"
import { useActiveDrivers } from "@/features/employees/Useactivedrivers"

interface VehicleRentalAssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicleId: number | null
}

export function VehicleRentalAssignDialog({
  open,
  onOpenChange,
  vehicleId,
}: VehicleRentalAssignDialogProps) {
  const { t } = useTranslation()
  const { data: drivers, isLoading: isLoadingDrivers } = useActiveDrivers()
  const createMutation = useCreateVehicleRental()

  const [driverId, setDriverId] = useState<number | undefined>()
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setDriverId(undefined)
    setStartedAt(new Date().toISOString().slice(0, 10))
    setNotes("")
    setFieldErrors({})
  }, [open])

  const handleSubmit = async () => {
    const errors: Record<string, string> = {}
    if (!driverId) errors.driver_id = t("Vehicles.rentals.errors.driver")
    if (!startedAt) errors.started_at = t("Vehicles.rentals.errors.startedAt")
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0 || !vehicleId) return

    try {
      await createMutation.mutateAsync({
        vehicle_id: vehicleId,
        driver_id: driverId!,
        started_at: startedAt,
        notes: notes.trim() || undefined,
      })
      onOpenChange(false)
    } catch (error) {
      setFieldErrors((prev) => ({ ...prev, ...getFieldErrors(error) }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !createMutation.isPending && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Vehicles.rentals.assignTitle")}</DialogTitle>
          <DialogDescription>{t("Vehicles.rentals.assignDescription")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="driver_id">{t("Vehicles.rentals.driver.label")}</Label>
            <Select
              value={driverId ? String(driverId) : undefined}
              onValueChange={(v) => setDriverId(Number(v))}
              disabled={isLoadingDrivers}
            >
              <SelectTrigger id="driver_id" className={cn(fieldErrors.driver_id && "border-destructive")}>
                <SelectValue
                  placeholder={
                    isLoadingDrivers
                      ? t("Vehicles.form.loading")
                      : t("Vehicles.rentals.driver.placeholder")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {drivers?.map((driver) => (
                  <SelectItem key={driver.driver_id} value={String(driver.driver_id)}>
                    <span className="flex items-center gap-2">
                      {driver.avatar?.url ? (
                        <img
                          src={driver.avatar.url}
                          alt={driver.name ?? ""}
                          className="size-5 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted">
                          <UserRound className="size-3 text-muted-foreground" />
                        </span>
                      )}
                      {driver.name ?? t("Vehicles.rentals.driver.unnamed", { id: driver.driver_id })}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.driver_id && <p className="text-xs text-destructive">{fieldErrors.driver_id}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="started_at">{t("Vehicles.rentals.startedAt")}</Label>
            <Input
              id="started_at"
              type="date"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className={cn(fieldErrors.started_at && "border-destructive")}
            />
            {fieldErrors.started_at && <p className="text-xs text-destructive">{fieldErrors.started_at}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("Vehicles.form.notes.label")}</Label>
            <Textarea
              id="notes"
              placeholder={t("Vehicles.form.notes.placeholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>
            {t("Vehicles.form.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("Vehicles.rentals.assign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}