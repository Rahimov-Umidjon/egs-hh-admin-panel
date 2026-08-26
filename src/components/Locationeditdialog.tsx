import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

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

import type { CompanyLocation } from "@/types"
import { useCreateLocation, useUpdateLocation } from "@/features/profile"

interface LocationEditDialogProps {
  open: boolean
  location: CompanyLocation | null
  onOpenChange: (open: boolean) => void
}

const emptyForm = {
  name: "",
  addressLine1: "",
  city: "",
  region: "",
  phone: "",
  email: "",
}

export function LocationEditDialog({
  open,
  location,
  onOpenChange,
}: LocationEditDialogProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState(emptyForm)

  const isEditMode = !!location

  const updateLocation = useUpdateLocation()
  const createLocation = useCreateLocation()
  const isPending = updateLocation.isPending || createLocation.isPending

  useEffect(() => {
    if (!open) return

    if (location) {
      setForm({
        name: location.name,
        addressLine1: location.address_line1,
        city: location.city,
        region: location.region,
        phone: location.phone,
        email: "",
      })
    } else {
      setForm(emptyForm)
    }
  }, [open, location])

  const setField =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = () => {
    if (isEditMode && location) {
      updateLocation.mutate(
        {
          id: location.id,
          payload: {
            name: form.name,
            address_line1: form.addressLine1,
            city: form.city,
            region: form.region,
            phone: form.phone,
            ...(form.email ? { email: form.email } : {}),
          },
        },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createLocation.mutate(
        {
          name: form.name,
          address_line1: form.addressLine1,
          city: form.city,
          region: form.region,
          phone: form.phone,
          ...(form.email ? { email: form.email } : {}),
        },
        { onSuccess: () => onOpenChange(false) }
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("locationDialog.editTitle") : t("locationDialog.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t("locationDialog.editDescription", { name: location?.name })
              : t("locationDialog.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="loc_name">{t("locationDialog.name")}</Label>
            <Input id="loc_name" value={form.name} onChange={setField("name")} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="loc_address">{t("locationDialog.address")}</Label>
            <Input
              id="loc_address"
              value={form.addressLine1}
              onChange={setField("addressLine1")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc_city">{t("locationDialog.city")}</Label>
            <Input id="loc_city" value={form.city} onChange={setField("city")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc_region">{t("locationDialog.region")}</Label>
            <Input id="loc_region" value={form.region} onChange={setField("region")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc_phone">{t("locationDialog.phone")}</Label>
            <Input id="loc_phone" value={form.phone} onChange={setField("phone")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc_email">{t("locationDialog.email")}</Label>
            <Input
              id="loc_email"
              type="email"
              placeholder={t("locationDialog.emailPlaceholder")}
              value={form.email}
              onChange={setField("email")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("locationDialog.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isEditMode ? t("locationDialog.save") : t("locationDialog.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}