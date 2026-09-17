import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
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
import { useUpdateClientPassword } from "@/features/client-profile"

interface ClientChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientChangePasswordDialog({
  open,
  onOpenChange,
}: ClientChangePasswordDialogProps) {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const updatePassword = useUpdateClientPassword()

  const reset = () => {
    setCurrentPassword("")
    setPassword("")
    setPasswordConfirmation("")
    setShowPassword(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const handleSubmit = () => {
    if (password !== passwordConfirmation) {
      toast.error(t("clientChangePasswordDialog.errors.mismatch"))
      return
    }
    if (password.length < 8) {
      toast.error(t("clientChangePasswordDialog.errors.tooShort"))
      return
    }

    updatePassword.mutate(
      {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      },
      { onSuccess: () => handleOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("clientChangePasswordDialog.title")}</DialogTitle>
          <DialogDescription>{t("clientChangePasswordDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="current_password">
              {t("clientChangePasswordDialog.currentPassword")}
            </Label>
            <Input
              id="current_password"
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("clientChangePasswordDialog.newPassword")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirmation">
              {t("clientChangePasswordDialog.confirmPassword")}
            </Label>
            <Input
              id="password_confirmation"
              type={showPassword ? "text" : "password"}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={updatePassword.isPending}
          >
            {t("clientChangePasswordDialog.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={updatePassword.isPending}>
            {t("clientChangePasswordDialog.update")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
