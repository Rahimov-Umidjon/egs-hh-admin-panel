import { useRef, useState } from "react"
import {
  BadgeCheck,
  Camera,
  CircleX,
  Clock3,
  Globe,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  User,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import type { CompanyLocation, CompanyStatus } from "@/types"
import { cn } from "@/lib/utils"
import { useProfile, useUpdateProfileLogo } from "@/features/profile"
import { ProfileInfoDialog } from "@/components/Profileinfodialog"
import { ChangePasswordDialog } from "@/components/Changepassworddialog"
import { LocationEditDialog } from "@/components/Locationeditdialog"


const statusMeta: Record<
  CompanyStatus,
  {
    label: string;
    icon: React.ElementType;
    iconClass: string;
    text: string;
    bg: string;
    border: string;
  }
> = {
  pending: {
    label: "Ko'rib chiqilmoqda",
    icon: Clock3,
    iconClass: "text-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-200 dark:border-amber-500/20",
  },
  approved: {
    label: "Tasdiqlangan",
    icon: BadgeCheck,
    iconClass: "text-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-200 dark:border-emerald-500/20",
  },
  rejected: {
    label: "Rad etilgan",
    icon: CircleX,
    iconClass: "text-rose-500",
    text: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    border: "border-rose-200 dark:border-rose-500/20",
  },
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
}

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile()
  const updateLogo = useUpdateProfileLogo()

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] =
    useState<CompanyLocation | null>(null)

  const handleLogoClick = () => fileInputRef.current?.click()

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) updateLogo.mutate(file)
    e.target.value = ""
  }



  const meta = statusMeta[profile?.status || 'approved']
  const Icon = meta.icon;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Profil</h2>
        <p className="text-sm text-muted-foreground">
          Kompaniya ma'lumotlarini va filiallarni boshqarish
        </p>
      </div>



      {
        (isLoading || !profile) ? <Skeleton className="h-32 w-full rounded-2xl" /> : (
          <>
            {/* Kompaniya sarlavhasi */}
            <Card className="rounded-2xl border shadow-none bg-white">
              <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4 ">
                  <div className="group relative">
                    <Avatar className="size-20 border">
                      <AvatarImage src={profile?.logo?.url ?? undefined} alt={profile.company_name} />
                      {/* <AvatarFallback className="text-lg font-semibold">
                        {profile.logo.url}
                      </AvatarFallback> */}
                    </Avatar>
                    <button
                      type="button"
                      onClick={handleLogoClick}
                      disabled={updateLogo.isPending}
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {updateLogo.isPending ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <Camera className="size-5" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl font-bold tracking-tight text-[#54606a]">
                      {profile.company_name}
                    </h3>
                    <div
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
                        meta.bg,
                        meta.border,
                        meta.text
                      )}
                    >
                      <Icon className={cn("h-4 w-4", meta.iconClass)} />
                      <span>{meta.label}</span>
                    </div>
                    {profile?.website && (
                      <a
                        href={profile?.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Globe className="size-3.5" />
                        {profile?.website}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    className="cursor-pointer bg-white"
                    onClick={() => setPasswordDialogOpen(true)}
                  >
                    <KeyRound className="mr-2 size-4" />
                    Parolni almashtirish
                  </Button>
                  <Button className="cursor-pointer" onClick={() => setInfoDialogOpen(true)}>
                    <Pencil className="mr-2 size-4" />
                    Tahrirlash
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )
      }


      {
        (isLoading || !profile) ? <Skeleton className="h-44 w-full rounded-2xl" /> : (
          <>
            {/* Asosiy ma'lumotlar */}
            <Card className="rounded-2xl border shadow-none bg-white">
              <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow icon={Mail} label="Email" value={profile.email} />
                <InfoRow icon={User} label="Foydalanuvchi nomi" value={profile.username} />
                <InfoRow
                  icon={MapPin}
                  label="Ro'yxatdan o'tgan hudud"
                  value={profile.state_incorporated}
                />
                <InfoRow
                  label="Faoliyat boshlangan sana"
                  value={new Date(profile.business_started_at).toLocaleDateString("uz-UZ")}
                />
                <InfoRow label="Faoliyat davri" value={profile.years_in_business} />
                <InfoRow label="STIR" value={profile.tin ?? "Kiritilmagan"} />
              </CardContent>
            </Card>
          </>
        )
      }





      {
        (isLoading || !profile) ? <div className="flex items-center gap-6">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div> : (
          <>
            {/* Filiallar */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold tracking-tight">
                Filiallar{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({profile.locations.length})
                </span>
              </h3>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {profile.locations.map((location) => (
                  <Card
                    key={location.id}
                    className="rounded-2xl border shadow-none bg-white"
                  >
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-[#54606a]">{location.name}</h4>
                            {location.is_primary && (
                              <Badge variant="outline" className="border-0 bg-white px-2 py-0 text-xs font-medium text-muted-foreground">
                                Bosh ofis
                              </Badge>
                            )}
                          </div>
                          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="mt-0.5 size-3.5 shrink-0" />
                            {location.address_line1}, {location.city}, {location.region}
                          </p>
                          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="size-3.5 shrink-0" />
                            {location.phone}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 cursor-pointer  bg-muted/60 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingLocation(location)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </div>

                      {location.contacts.length > 0 && (
                        <div className="space-y-2 border-t border-border/50 pt-3">
                          {location.contacts.map((contact) => (
                            <div
                              key={contact.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-[#54606a]">
                                  {contact.first_name} {contact.last_name}
                                  {contact.is_primary && (
                                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                      (asosiy)
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">{contact.title}</p>
                              </div>
                              <div className="text-right text-xs text-muted-foreground">
                                <p>{contact.phone}</p>
                                <p>{contact.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )
      }




      {
        profile && <>
          <ProfileInfoDialog
            open={infoDialogOpen}
            onOpenChange={setInfoDialogOpen}
            profile={profile}
          />
          <ChangePasswordDialog
            open={passwordDialogOpen}
            onOpenChange={setPasswordDialogOpen}
          />
          <LocationEditDialog
            location={editingLocation}
            onOpenChange={(open) => !open && setEditingLocation(null)}
          />
        </>
      }
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5">
      {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-[#54606a]">{value}</p>
      </div>
    </div>
  )
}