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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { getFieldErrors } from "@/lib/Api-error"
import { useCreateVehicle, useUpdateVehicle, useVehicle, useTransportTypes } from "@/features/vehicles/Usevehicles"
import type { VehiclePayload, VehicleStatus } from "@/types"

const emptyForm: VehiclePayload = {
  transport_type_id: 0,
  plate_number: "",
  vin: "",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  mileage: 0,
  status: "active",
  is_available: true,
  notes: "",
}

interface VehicleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicleId: number | null
}

export function VehicleFormDialog({ open, onOpenChange, vehicleId }: VehicleFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = vehicleId !== null

  const statusOptions: { value: VehicleStatus; label: string }[] = [
    { value: "active", label: t("Vehicles.status.active") },
    { value: "inactive", label: t("Vehicles.status.inactive") },
    { value: "repair", label: t("Vehicles.status.repair") },
    { value: "sold", label: t("Vehicles.status.sold") },
  ]

  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(vehicleId)
  const { data: transportTypes, isLoading: isLoadingTypes } = useTransportTypes()

  const createMutation = useCreateVehicle()
  const updateMutation = useUpdateVehicle()

  const [form, setForm] = useState<VehiclePayload>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const isSaving = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    if (isEdit && vehicle) {
      setForm({
        transport_type_id: vehicle.transport_type_id,
        plate_number: vehicle.plate_number,
        vin: vehicle.vin,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        mileage: Number(vehicle.mileage),
        status: vehicle.status,
        is_available: vehicle.is_available,
        notes: vehicle.notes ?? "",
      })
    } else if (!isEdit) {
      setForm(emptyForm)
    }
  }, [open, isEdit, vehicle])

  const setField = <K extends keyof VehiclePayload>(key: K, value: VehiclePayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!form.transport_type_id) errors.transport_type_id = t("Vehicles.form.errors.transportType")
    if (!form.plate_number.trim()) errors.plate_number = t("Vehicles.form.errors.plateNumber")
    if (!form.vin.trim()) errors.vin = t("Vehicles.form.errors.vinRequired")
    else if (form.vin.trim().length !== 17) errors.vin = t("Vehicles.form.errors.vinLength")
    if (!form.brand.trim()) errors.brand = t("Vehicles.form.errors.brand")
    if (!form.model.trim()) errors.model = t("Vehicles.form.errors.model")
    if (!form.year || form.year < 1950 || form.year > new Date().getFullYear() + 1) {
      errors.year = t("Vehicles.form.errors.year")
    }
    if (form.mileage < 0) errors.mileage = t("Vehicles.form.errors.mileage")

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    const payload: VehiclePayload = {
      ...form,
      plate_number: form.plate_number.trim().toUpperCase(),
      vin: form.vin.trim().toUpperCase(),
      notes: form.notes?.trim() || undefined,
    }

    try {
      if (isEdit && vehicleId) {
        await updateMutation.mutateAsync({ id: vehicleId, payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch (error) {
      // Xatolik toast orqali hooklarda ko'rsatiladi; bu yerda faqat
      // maydon bo'yicha xatoliklarni formaga bog'laymiz.
      setFieldErrors((prev) => ({ ...prev, ...getFieldErrors(error) }))
    }
  }

  const showLoadingState = isEdit && isLoadingVehicle

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("Vehicles.form.editTitle") : t("Vehicles.form.createTitle")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("Vehicles.form.editDescription") : t("Vehicles.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        {showLoadingState ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            {t("Vehicles.form.loading")}
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="transport_type_id">{t("Vehicles.form.transportType.label")}</Label>
                <Select
                  value={form.transport_type_id ? String(form.transport_type_id) : undefined}
                  onValueChange={(v) => setField("transport_type_id", Number(v))}
                  disabled={isLoadingTypes}
                >
                  <SelectTrigger
                    id="transport_type_id"
                    className={cn(fieldErrors.transport_type_id && "border-destructive")}
                  >
                    <SelectValue
                      placeholder={isLoadingTypes ? t("Vehicles.form.loading") : t("Vehicles.form.transportType.placeholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {transportTypes?.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        <span className="flex items-center gap-2">
                          {type.image_url ? (
                            <img
                              src={type.image_url}
                              alt={type.name}
                              className="size-5 shrink-0 rounded object-contain"
                            />
                          ) : (
                            <span className="size-5 shrink-0 rounded bg-muted" />
                          )}
                          {type.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.transport_type_id && (
                  <p className="text-xs text-destructive">{fieldErrors.transport_type_id}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">{t("Vehicles.form.statusLabel")}</Label>
                <Select value={form.status} onValueChange={(v) => setField("status", v as VehicleStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plate_number">{t("Vehicles.form.plateNumber.label")}</Label>
                <Input
                  id="plate_number"
                  placeholder={t("Vehicles.form.plateNumber.placeholder")}
                  value={form.plate_number}
                  onChange={(e) => setField("plate_number", e.target.value)}
                  className={cn(fieldErrors.plate_number && "border-destructive")}
                />
                {fieldErrors.plate_number && (
                  <p className="text-xs text-destructive">{fieldErrors.plate_number}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vin">{t("Vehicles.form.vin.label")}</Label>
                <Input
                  id="vin"
                  placeholder={t("Vehicles.form.vin.placeholder")}
                  maxLength={17}
                  value={form.vin}
                  onChange={(e) => setField("vin", e.target.value)}
                  className={cn(fieldErrors.vin && "border-destructive")}
                />
                {fieldErrors.vin && <p className="text-xs text-destructive">{fieldErrors.vin}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="brand">{t("Vehicles.form.brand.label")}</Label>
                <Input
                  id="brand"
                  placeholder={t("Vehicles.form.brand.placeholder")}
                  value={form.brand}
                  onChange={(e) => setField("brand", e.target.value)}
                  className={cn(fieldErrors.brand && "border-destructive")}
                />
                {fieldErrors.brand && <p className="text-xs text-destructive">{fieldErrors.brand}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="model">{t("Vehicles.form.model.label")}</Label>
                <Input
                  id="model"
                  placeholder={t("Vehicles.form.model.placeholder")}
                  value={form.model}
                  onChange={(e) => setField("model", e.target.value)}
                  className={cn(fieldErrors.model && "border-destructive")}
                />
                {fieldErrors.model && <p className="text-xs text-destructive">{fieldErrors.model}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="year">{t("Vehicles.form.year")}</Label>
                <Input
                  id="year"
                  type="number"
                  value={form.year}
                  onChange={(e) => setField("year", Number(e.target.value))}
                  className={cn(fieldErrors.year && "border-destructive")}
                />
                {fieldErrors.year && <p className="text-xs text-destructive">{fieldErrors.year}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mileage">{t("Vehicles.form.mileage")}</Label>
                <Input
                  id="mileage"
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.mileage}
                  onChange={(e) => setField("mileage", Number(e.target.value))}
                  className={cn(fieldErrors.mileage && "border-destructive")}
                />
                {fieldErrors.mileage && <p className="text-xs text-destructive">{fieldErrors.mileage}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="is_available">{t("Vehicles.form.isAvailable.label")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("Vehicles.form.isAvailable.description")}
                </p>
              </div>
              <Switch
                id="is_available"
                checked={form.is_available}
                onCheckedChange={(v) => setField("is_available", v)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">{t("Vehicles.form.notes.label")}</Label>
              <Textarea
                id="notes"
                placeholder={t("Vehicles.form.notes.placeholder")}
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t("Vehicles.form.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || showLoadingState}>
            {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEdit ? t("Vehicles.form.save") : t("Vehicles.form.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}