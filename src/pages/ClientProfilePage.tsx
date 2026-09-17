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
  Package,
  Pencil,
  Phone,
  RefreshCw,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import type { ClientStatus } from "@/types"
import { useClientProfile, useUpdateClientAvatar } from "@/features/client-profile"
import { ClientProfileInfoDialog } from "@/components/ClientProfileInfoDialog"
import { ClientChangePasswordDialog } from "@/components/ClientChangePasswordDialog"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

const MAX_AVATAR_SIZE_MB = 5
const ACCEPTED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"]

const statusMeta: Record<
  ClientStatus,
  { icon: React.ElementType; iconClass: string; text: string; bg: string; border: string }
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

export default function ClientProfilePage() {
  const { t } = useTranslation()
  const { data: profile, isLoading, isError, refetch, isRefetching } = useClientProfile()
  const updateAvatar = useUpdateClientAvatar()

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""

    if (!file) return

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      toast.error(t("clientProfile.avatar.invalidType"))
      return
    }

    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      toast.error(t("clientProfile.avatar.tooLarge", { size: MAX_AVATAR_SIZE_MB }))
      return
    }

    updateAvatar.mutate(file, {
      onSuccess: () => toast.success(t("clientProfile.avatar.success")),
      onError: () => toast.error(t("clientProfile.avatar.error")),
    })
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/10">
          <CircleX className="size-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{t("clientProfile.error.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("clientProfile.error.description")}</p>
        </div>
        <Button variant="outline" className="mt-2" onClick={() => refetch()}>
          <RefreshCw className={cn("mr-2 size-4", isRefetching && "animate-spin")} />
          {t("clientProfile.error.retry")}
        </Button>
      </div>
    )
  }

  const meta = statusMeta[profile?.status ?? "pending"]
  const Icon = meta.icon
  const initials = profile?.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("clientProfile.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("clientProfile.subtitle")}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {isLoading || !profile ? (
        <ProfileHeaderSkeleton />
      ) : (
        <Card className="rounded-2xl border shadow-none">
          <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="group relative">
                <Avatar className="size-20 border">
                  <AvatarImage src={profile.avatar?.url ?? undefined} alt={profile.name} />
                  <AvatarFallback className="bg-muted text-base font-semibold text-muted-foreground">
                    {initials || <Package className="size-6" />}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={updateAvatar.isPending}
                  aria-label={t("clientProfile.avatar.changeAria")}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:opacity-100 disabled:cursor-not-allowed"
                >
                  {updateAvatar.isPending ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Camera className="size-5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_AVATAR_TYPES.join(",")}
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight">{profile.name}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
                      meta.bg,
                      meta.border,
                      meta.text
                    )}
                  >
                    <Icon className={cn("h-4 w-4", meta.iconClass)} />
                    <span>{t(`clientProfile.status.${profile.status}`)}</span>
                  </div>
                  <span className="rounded-full border px-3 py-1.5 text-sm font-medium text-muted-foreground">
                    {t(`auth.client_type_${profile.type}`)}
                  </span>
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
              <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
                <KeyRound className="mr-2 size-4" />
                {t("clientProfile.changePassword")}
              </Button>
              <Button onClick={() => setInfoDialogOpen(true)}>
                <Pencil className="mr-2 size-4" />
                {t("clientProfile.edit")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading || !profile ? (
        <Skeleton className="h-44 w-full rounded-2xl" />
      ) : (
        <Card className="rounded-2xl border shadow-none">
          <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow icon={Mail} label={t("clientProfile.email")} value={profile.email} />
            <InfoRow
              icon={Phone}
              label={t("auth.phone_number")}
              value={profile.phone_number || t("clientProfile.notProvided")}
            />
            <InfoRow label={t("auth.client_inn")} value={profile.inn} />
            <InfoRow
              icon={User}
              label={t("auth.contact_person_name")}
              value={profile.contact_person_name || t("clientProfile.notProvided")}
            />
            <InfoRow
              icon={Phone}
              label={t("auth.contact_person_phone")}
              value={profile.contact_person_phone || t("clientProfile.notProvided")}
            />
            <InfoRow
              icon={MapPin}
              label={t("auth.address")}
              value={profile.address || t("clientProfile.notProvided")}
            />
          </CardContent>
        </Card>
      )}

      {profile && (
        <>
          <ClientProfileInfoDialog
            open={infoDialogOpen}
            onOpenChange={setInfoDialogOpen}
            profile={profile}
          />
          <ClientChangePasswordDialog
            open={passwordDialogOpen}
            onOpenChange={setPasswordDialogOpen}
          />
        </>
      )}
    </div>
  )
}

function ProfileHeaderSkeleton() {
  return (
    <Card className="rounded-2xl border shadow-none">
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
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
