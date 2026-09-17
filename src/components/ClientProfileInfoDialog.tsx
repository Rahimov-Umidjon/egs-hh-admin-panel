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

import { useUpdateClientProfileInfo } from "@/features/client-profile"
import type { ClientProfile } from "@/types"

interface ClientProfileInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: ClientProfile
}

export function ClientProfileInfoDialog({
  open,
  onOpenChange,
  profile,
}: ClientProfileInfoDialogProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(profile.name)
  const [website, setWebsite] = useState(profile.website ?? "")
  const [contactPersonName, setContactPersonName] = useState(profile.contact_person_name ?? "")
  const [contactPersonPhone, setContactPersonPhone] = useState(profile.contact_person_phone ?? "")
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number ?? "")
  const [address, setAddress] = useState(profile.address ?? "")

  const updateInfo = useUpdateClientProfileInfo()

  useEffect(() => {
    if (open) {
      setName(profile.name)
      setWebsite(profile.website ?? "")
      setContactPersonName(profile.contact_person_name ?? "")
      setContactPersonPhone(profile.contact_person_phone ?? "")
      setPhoneNumber(profile.phone_number ?? "")
      setAddress(profile.address ?? "")
    }
  }, [open, profile])

  const handleSubmit = () => {
    updateInfo.mutate(
      {
        name,
        website,
        contact_person_name: contactPersonName,
        contact_person_phone: contactPersonPhone,
        phone_number: phoneNumber,
        address,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("clientProfileInfoDialog.title")}</DialogTitle>
          <DialogDescription>{t("clientProfileInfoDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="client-name">{t("clientProfileInfoDialog.name")}</Label>
            <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-website">{t("clientProfileInfoDialog.website")}</Label>
            <Input
              id="client-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="client-contact-name">
                {t("clientProfileInfoDialog.contactPersonName")}
              </Label>
              <Input
                id="client-contact-name"
                value={contactPersonName}
                onChange={(e) => setContactPersonName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-contact-phone">
                {t("clientProfileInfoDialog.contactPersonPhone")}
              </Label>
              <Input
                id="client-contact-phone"
                value={contactPersonPhone}
                onChange={(e) => setContactPersonPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-phone">{t("clientProfileInfoDialog.phoneNumber")}</Label>
            <Input
              id="client-phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-address">{t("clientProfileInfoDialog.address")}</Label>
            <Input
              id="client-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateInfo.isPending}
          >
            {t("clientProfileInfoDialog.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={updateInfo.isPending}>
            {t("clientProfileInfoDialog.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
