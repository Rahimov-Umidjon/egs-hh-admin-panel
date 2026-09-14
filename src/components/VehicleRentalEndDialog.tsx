import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2 } from "lucide-react"

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
import { useUpdateVehicleRental } from "@/features/vehicles/Usevehiclerentals"
import type { VehicleRental } from "@/types"

interface VehicleRentalEndDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rental: VehicleRental | null
  vehicleId: number | null
}

export function VehicleRentalEndDialog({
  open,
  onOpenChange,
  rental,
  vehicleId,
}: VehicleRentalEndDialogProps) {
  const { t } = useTranslation()
  const updateMutation = useUpdateVehicleRental()

  const [endedAt, setEndedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!open) return
    setEndedAt(new Date().toISOString().slice(0, 10))
    setNotes(rental?.notes ?? "")
  }, [open, rental])

  const handleSubmit = async () => {
    if (!rental || !vehicleId) return
    await updateMutation.mutateAsync({
      id: rental.id,
      vehicleId,
      payload: {
        ended_at: endedAt,
        status: "completed",
        notes: notes.trim() || undefined,
      },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !updateMutation.isPending && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Vehicles.rentals.endTitle")}</DialogTitle>
          <DialogDescription>{t("Vehicles.rentals.endDescription")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ended_at">{t("Vehicles.rentals.endedAt")}</Label>
            <Input
              id="ended_at"
              type="date"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="end_notes">{t("Vehicles.form.notes.label")}</Label>
            <Textarea
              id="end_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateMutation.isPending}>
            {t("Vehicles.form.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("Vehicles.rentals.endConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}