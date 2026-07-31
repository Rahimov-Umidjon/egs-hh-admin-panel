import { useEffect, useState } from "react"

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
  const [website, setWebsite] = useState(profile.website)
  const [email, setEmail] = useState(profile.email)
  const [username, setUsername] = useState(profile.username)

  const updateInfo = useUpdateProfileInfo()

  // Dialog har safar ochilganda joriy ma'lumotlar bilan qayta to'ldiriladi
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
          <DialogTitle>Ma'lumotlarni tahrirlash</DialogTitle>
          <DialogDescription>
            Kompaniyangizning asosiy aloqa ma'lumotlarini yangilang.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="website">Veb-sayt</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://kompaniya.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="info@kompaniya.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Foydalanuvchi nomi</Label>
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
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={updateInfo.isPending}>
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}