import { useRef, useState } from "react"
import {
  BadgeCheck,
  Building2,
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
  Plus,
  RefreshCw,
  Trash2,
  User,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import type { CompanyLocation, CompanyStatus } from "@/types"
import { cn } from "@/lib/utils"
import { useProfile, useUpdateProfileLogo } from "@/features/profile"
import { ProfileInfoDialog } from "@/components/Profileinfodialog"
import { ChangePasswordDialog } from "@/components/Changepassworddialog"
import { LocationEditDialog } from "@/components/Locationeditdialog"
import { LocationDeleteDialog } from "@/components/LocationDeleteDialog"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

const MAX_LOGO_SIZE_MB = 5
const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]

const statusMeta: Record<
  CompanyStatus,
  {
    icon: React.ElementType
    iconClass: string
    text: string
    bg: string
    border: string
  }
> = {
  pending: {
    icon: Clock3,
    iconClass: "text-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-200 dark:border-amber-500/20",
  },
  approved: {
    icon: BadgeCheck,
    iconClass: "text-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-200 dark:border-emerald-500/20",
  },
  rejected: {
    icon: CircleX,
    iconClass: "text-rose-500",
    text: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    border: "border-rose-200 dark:border-rose-500/20",
  },
}

// Maps the app's i18n language code to an Intl date-formatting locale.
const dateLocaleByLang: Record<string, string> = {
  uz: "uz-Latn-UZ",
  "uz-Cyrl": "uz-Cyrl-UZ",
  ru: "ru-RU",
  en: "en-US",
}

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { data: profile, isLoading, isError, refetch, isRefetching } = useProfile()
  const updateLogo = useUpdateProfileLogo()
  const dateLocale = dateLocaleByLang[i18n.language] ?? "en-US"

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<CompanyLocation | null>(null)
  const [deletingLocation, setDeletingLocation] = useState<CompanyLocation | null>(null)

  const handleLogoClick = () => fileInputRef.current?.click()

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = " // allow re-selecting the same file next time"

    if (!file) return

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      toast.error(t("profile.logo.invalidType.title"), {
        description: t("profile.logo.invalidType.description"),
      })
      return
    }

    if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
      toast.error(t("profile.logo.tooLarge.title"), {
        description: t("profile.logo.tooLarge.description", { size: MAX_LOGO_SIZE_MB }),
      })
      return
    }

    updateLogo.mutate(file, {
      onSuccess: () => {
        toast.success(t("profile.logo.success"))
      },
      onError: () => {
        toast.error(t("profile.logo.error.title"), {
          description: t("profile.logo.error.description"),
        })
      },
    })
  }

  const handleAddLocation = () => {
    setEditingLocation(null)
    setLocationDialogOpen(true)
  }

  const handleEditLocation = (location: CompanyLocation) => {
    setEditingLocation(location)
    setLocationDialogOpen(true)
  }

  // ---- Error state -------------------------------------------------------
  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/10">
          <CircleX className="size-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#54606a]">{t("profile.error.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("profile.error.description")}</p>
        </div>
        <Button variant="outline" className="mt-2 cursor-pointer bg-white" onClick={() => refetch()}>
          <RefreshCw className={cn("mr-2 size-4", isRefetching && "animate-spin")} />
          {t("profile.error.retry")}
        </Button>
      </div>
    )
  }

  const meta = statusMeta[profile?.status || "approved"]
  const Icon = meta.icon
  const initials = profile?.company_name
    ?.split("profile. ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pr-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("profile.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("profile.subtitle")}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {/* ---- Company header card ---- */}
      {isLoading || !profile ? (
        <ProfileHeaderSkeleton />
      ) : (
        <Card className="rounded-2xl border shadow-none bg-white">
          <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="group relative">
                <Avatar className="size-20 border">
                  <AvatarImage src={profile.logo?.url ?? undefined} alt={profile.company_name} />
                  <AvatarFallback className="bg-muted text-base font-semibold text-muted-foreground">
                    {initials || <Building2 className="size-6" />}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={handleLogoClick}
                  disabled={updateLogo.isPending}
                  aria-label={t("profile.logo.changeAria")}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:opacity-100 cursor-pointer disabled:cursor-not-allowed"
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
                  accept={ACCEPTED_LOGO_TYPES.join(",")}
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
                  <span>{t(`profile.status.${profile.status}`)}</span>
                </div>
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Globe className="size-3.5" />
                    {profile.website}
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
                {t("profile.changePassword")}
              </Button>
              <Button className="cursor-pointer" onClick={() => setInfoDialogOpen(true)}>
                <Pencil className="mr-2 size-4" />
                {t("profile.edit")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- Company info grid ---- */}
      {isLoading || !profile ? (
        <Skeleton className="h-44 w-full rounded-2xl" />
      ) : (
        <Card className="rounded-2xl border shadow-none bg-white">
          <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow icon={Mail} label={t("profile.email")} value={profile.email} />
            <InfoRow icon={User} label={t("profile.username")} value={profile.username} />
            <InfoRow
              icon={MapPin}
              label={t("profile.stateIncorporated")}
              value={profile.state_incorporated}
            />
            <InfoRow
              label={t("profile.businessStartedAt")}
              value={new Date(profile.business_started_at).toLocaleDateString(dateLocale)}
            />
            <InfoRow label={t("profile.yearsInBusiness")} value={String(profile.years_in_business)} />
            <InfoRow label={t("profile.tin")} value={profile.tin ?? t("profile.tinNotProvided")} />
          </CardContent>
        </Card>
      )}

      {/* ---- Locations ---- */}
      {isLoading || !profile ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">
              {t("profile.locations.title")}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({profile.locations.length})
              </span>
            </h3>
            <Button size="sm" className="cursor-pointer" onClick={handleAddLocation}>
              <Plus className="mr-2 size-4" />
              {t("profile.locations.add")}
            </Button>
          </div>

          {profile.locations.length === 0 ? (
            <Card className="rounded-2xl border border-dashed shadow-none bg-white">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <MapPin className="size-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#54606a]">
                    {t("profile.locations.empty.title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("profile.locations.empty.description")}
                  </p>
                </div>
                <Button size="sm" className="cursor-pointer" onClick={handleAddLocation}>
                  <Plus className="mr-2 size-4" />
                  {t("profile.locations.add")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {profile.locations.map((location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  t={t}
                  onEdit={() => handleEditLocation(location)}
                  onDelete={() => setDeletingLocation(location)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {profile && (
        <>
          <ProfileInfoDialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen} profile={profile} />
          <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
          <LocationEditDialog
            open={locationDialogOpen}
            location={editingLocation}
            onOpenChange={(open) => {
              setLocationDialogOpen(open)
              if (!open) setEditingLocation(null)
            }}
          />
          <LocationDeleteDialog
            location={deletingLocation}
            onOpenChange={(open) => !open && setDeletingLocation(null)}
          />
        </>
      )}
    </div>
  )
}

function ProfileHeaderSkeleton() {
  return (
    <Card className="rounded-2xl border shadow-none bg-white">
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-7 w-32 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

function LocationCard({
  location,
  onEdit,
  onDelete,
  t,
}: {
  location: CompanyLocation
  onEdit: () => void
  onDelete: () => void
  t: (key: string) => string
}) {
  return (
    <Card className="rounded-2xl border shadow-none bg-white">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-[#54606a]">{location.name}</h4>
              {location.is_primary && (
                <Badge
                  variant="outline"
                  className="border-0 bg-white px-2 py-0 text-xs font-medium text-muted-foreground"
                >
                  {t("profile.locations.primary")}
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

          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("profile.locations.editAria")}
              className="cursor-pointer bg-muted/60 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("profile.locations.deleteAria")}
              className="cursor-pointer bg-muted/60 text-muted-foreground hover:text-rose-600"
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
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
                        {t("profile.locations.contactPrimary")}
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