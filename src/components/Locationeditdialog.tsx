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
 
import type { CompanyLocation } from "@/types"
import { useUpdateLocation } from "@/features/profile"

interface LocationEditDialogProps {
  location: CompanyLocation | null
  onOpenChange: (open: boolean) => void
}

export function LocationEditDialog({
  location,
  onOpenChange,
}: LocationEditDialogProps) {
  const [name, setName] = useState("")
  const [addressLine1, setAddressLine1] = useState("")
  const [city, setCity] = useState("")
  const [region, setRegion] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  const updateLocation = useUpdateLocation()

  useEffect(() => {
    if (location) {
      setName(location.name)
      setAddressLine1(location.address_line1)
      setCity(location.city)
      setRegion(location.region)
      setPhone(location.phone)
      setEmail("")
    }
  }, [location])

  const handleSubmit = () => {
    if (!location) return
    updateLocation.mutate(
      {
        id: location.id,
        payload: {
          name,
          address_line1: addressLine1,
          city,
          region,
          phone,
          ...(email ? { email } : {}),
        },
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={!!location} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Filialni tahrirlash</DialogTitle>
          <DialogDescription>
            "{location?.name}" filiali ma'lumotlarini yangilang.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="loc_name">Filial nomi</Label>
            <Input
              id="loc_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="loc_address">Manzil</Label>
            <Input
              id="loc_address"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc_city">Shahar</Label>
            <Input
              id="loc_city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc_region">Viloyat</Label>
            <Input
              id="loc_region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc_phone">Telefon</Label>
            <Input
              id="loc_phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc_email">Email (ixtiyoriy)</Label>
            <Input
              id="loc_email"
              type="email"
              placeholder="office@kompaniya.uz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateLocation.isPending}
          >
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={updateLocation.isPending}>
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}