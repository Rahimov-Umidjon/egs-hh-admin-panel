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

import { useUpdateProfileInfo } from "@/features/profile"
import type { CompanyProfile } from "@/types"

interface ProfileInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: CompanyProfile
}

export function ProfileInfoDialog({
  open,
  onOpenChange,
  profile,
}: ProfileInfoDialogProps) {
  const { t } = useTranslation()
  const [website, setWebsite] = useState(profile.website)
  const [email, setEmail] = useState(profile.email)
  const [username, setUsername] = useState(profile.username)

  const updateInfo = useUpdateProfileInfo()

  useEffect(() => {
    if (open) {
      setWebsite(profile.website)
      setEmail(profile.email)
      setUsername(profile.username)
    }
  }, [open, profile])

  const handleSubmit = () => {
    updateInfo.mutate(
      { website, email, username },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("profileInfoDialog.title")}</DialogTitle>
          <DialogDescription>{t("profileInfoDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="website">{t("profileInfoDialog.website")}</Label>
            <Input
              id="website"
              type="url"
              placeholder={t("profileInfoDialog.websitePlaceholder")}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("profileInfoDialog.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("profileInfoDialog.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">{t("profileInfoDialog.username")}</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateInfo.isPending}
          >
            {t("profileInfoDialog.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={updateInfo.isPending}>
            {t("profileInfoDialog.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}