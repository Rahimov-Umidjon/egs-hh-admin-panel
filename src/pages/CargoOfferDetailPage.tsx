import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Box,
  CheckCircle2,
  ChevronRight,
  MapPin,
  MessageSquare,
  Snowflake,
  Star,
  TriangleAlert,
  UserRound,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useConfirm } from "@/components/confirm-provider"
import { cn, fixAssetUrl } from "@/lib/utils"

import {
  useAcceptCargoOffer,
  useCargoOffer,
  useContactOfferProposer,
  useRejectCargoOffer,
} from "@/features/cargo/useCargoOffers"
import { useDriver } from "@/features/driver/useDriver"
import type { CargoAdministrativeArea, CargoOfferStatus } from "@/types"

const numberFormatter = new Intl.NumberFormat("ru-RU")

const offerStatusBadgeClass: Record<CargoOfferStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
  rejected: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400",
}

const cargoStatusBadgeClass: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  assigned: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  delivered: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
}

function formatArea(area: CargoAdministrativeArea): string {
  const parts = [area.city?.name, area.state?.name, area.country?.name].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : "—"
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2.5 text-center">
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function StarRating({ rating, size = "size-3.5" }: { rating: number; size?: string }) {
  const filled = Math.round(rating)
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(size, i < filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")}
        />
      ))}
    </span>
  )
}

export default function CargoOfferDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const params = useParams<{ id: string; offerId: string }>()
  const cargoId = Number(params.id)
  const offerId = Number(params.offerId)

  const { data: offer, isLoading } = useCargoOffer(cargoId, offerId)
  const acceptOffer = useAcceptCargoOffer(cargoId)
  const rejectOffer = useRejectCargoOffer(cargoId)
  const contactProposer = useContactOfferProposer(cargoId)

  const isDriverProposer = offer?.proposer.type === "driver"
  const { data: driver, isLoading: isDriverLoading } = useDriver(
    isDriverProposer ? offer.proposer.id : null
  )

  const handleAccept = () => {
    if (!offer) return
    confirm({
      title: t("cargoOfferDetail.acceptConfirm.title"),
      description: t("cargoOfferDetail.acceptConfirm.description"),
      confirmText: t("cargoOfferDetail.acceptConfirm.confirm"),
      onConfirm: async () => {
        await acceptOffer.mutateAsync(offer.id)
        toast.success(t("cargoOfferDetail.acceptSuccess"))
        navigate(`/client/cargos/${cargoId}`)
      },
    })
  }

  const handleWriteToChat = async () => {
    if (!offer) return
    try {
      const { conversation_id } = await contactProposer.mutateAsync(offer.id)
      navigate(`/client/chat?conversation=${conversation_id}`)
    } catch {
      toast.error(t("cargoOfferDetail.contactError"))
    }
  }

  const handleReject = () => {
    if (!offer) return
    confirm({
      title: t("cargoOfferDetail.rejectConfirm.title"),
      description: t("cargoOfferDetail.rejectConfirm.description"),
      confirmText: t("cargoOfferDetail.rejectConfirm.confirm"),
      variant: "destructive",
      fields: [
        {
          name: "reason",
          label: t("cargoOfferDetail.rejectConfirm.reasonLabel"),
          placeholder: t("cargoOfferDetail.rejectConfirm.reasonPlaceholder"),
          multiline: true,
        },
      ],
      onConfirm: async (values) => {
        await rejectOffer.mutateAsync({ offerId: offer.id, reason: values.reason || undefined })
        toast.success(t("cargoOfferDetail.rejectSuccess"))
        navigate(`/client/cargos/${cargoId}`)
      },
    })
  }

  if (isLoading || !offer) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  const { cargo } = offer

  return (
    <div className="  w-full max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="shrink-0" asChild>
          <Link to={`/client/cargos/${cargoId}`} aria-label={t("cargoDetail.back")}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("cargoOfferDetail.pageTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("cargoOfferDetail.pageSubtitle", { name: cargo.name })}
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border shadow-none">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0 h-16 w-16">
              <Avatar className="h-16 w-16">
                {offer.proposer.avatar?.url && (
                  <AvatarImage src={fixAssetUrl(offer.proposer.avatar.url) ?? undefined} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary">
                  <UserRound className="size-5" />
                </AvatarFallback>
              </Avatar>
              {offer.proposer.is_online != null && (
                <span className="absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center">
                  {offer.proposer.is_online && (
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60" />
                  )}
                  <span
                    className={cn(
                      "relative size-2.5 rounded-full border-2 border-background",
                      offer.proposer.is_online ? "bg-emerald-500" : "bg-muted-foreground/40"
                    )}
                  />
                </span>
              )}
            </div>
            <div className="space-y-1">
              <Badge
                variant="outline"
                className={cn("rounded-full py-1", offerStatusBadgeClass[offer.status])}
              >
                {t(`cargoOffers.status.${offer.status}`, offer.status_label)}
              </Badge>
              <p className="text-lg font-semibold">{offer.proposer.name}</p>
              <p className="text-xs text-muted-foreground">
                {t(`cargoOffers.proposerType.${offer.proposer.type}`, offer.proposer.type)}{" "}
                {t("cargoOfferDetail.proposalSuffix")}
                {offer.proposer.is_online != null && (
                  <>
                    {" · "}
                    {offer.proposer.is_online
                      ? t("cargoOfferDetail.online")
                      : t("cargoOfferDetail.offline")}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleWriteToChat} disabled={contactProposer.isPending}>
              <MessageSquare className="mr-2 size-4" />
              {t("cargoOfferDetail.writeToChat")}
            </Button>
            {offer.status === "pending" && (
              <>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleAccept}
                  disabled={acceptOffer.isPending}
                >
                  <CheckCircle2 className="mr-2 size-4" />
                  {t("cargoOfferDetail.accept")}
                </Button>
                <Button
                  variant="outline"
                  className="border-rose-200 text-rose-600 hover:bg-rose-50"
                  onClick={handleReject}
                  disabled={rejectOffer.isPending}
                >
                  <XCircle className="mr-2 size-4" />
                  {t("cargoOfferDetail.reject")}
                </Button>
              </>
            )}
          </div>
        </CardContent>


      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="rounded-2xl border shadow-none">
            <CardHeader>
              <CardTitle className="text-sm">{t("cargoOfferDetail.offerInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <Row label={t("cargoOffers.proposer")} value={offer.proposer.name} />
              <Row
                label={t("cargoOffers.amount")}
                value={`${numberFormatter.format(offer.amount)} ${offer.currency.symbol}`}
              />
              {offer.advance_amount != null && (
                <Row
                  label={t("cargoOffers.advanceAmount")}
                  value={`${numberFormatter.format(offer.advance_amount)} ${offer.currency.symbol}`}
                />
              )}
              {offer.payment_terms && (
                <Row label={t("cargoOffers.paymentTerms")} value={offer.payment_terms} />
              )}
              {offer.message && <Row label={t("cargoOffers.message")} value={offer.message} />}
              <Row
                label={t("clientDashboard.table.columns.status")}
                value={
                  <Badge
                    variant="outline"
                    className={cn("rounded-full py-1", offerStatusBadgeClass[offer.status])}
                  >
                    {t(`cargoOffers.status.${offer.status}`, offer.status_label)}
                  </Badge>
                }
              />
              <Row
                label={t("cargoOffers.createdAt")}
                value={new Date(offer.created_at).toLocaleString()}
              />
              {offer.responded_at && (
                <Row
                  label={t("cargoOffers.respondedAt")}
                  value={new Date(offer.responded_at).toLocaleString()}
                />
              )}
              {offer.status === "rejected" && offer.rejection_reason && (
                <Row label={t("cargoOffers.rejectionReason")} value={offer.rejection_reason} />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardHeader>
              <CardTitle className="text-sm">{t("cargoOfferDetail.cargoInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                  {cargo.requirements.transport_type?.image_url ? (
                    <img
                      src={fixAssetUrl(cargo.requirements.transport_type.image_url) ?? undefined}
                      alt={cargo.requirements.transport_type.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Box className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{cargo.name}</p>
                  <Badge variant="outline" className={cn(cargoStatusBadgeClass[cargo.status])}>
                    {t(`cargoStatus.${cargo.status}`)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">{formatArea(cargo.route.from)}</span>
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="font-medium">{formatArea(cargo.route.to)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat
                  value={cargo.requirements.weight != null ? `${cargo.requirements.weight} kg` : "—"}
                  label={t("cargoForm.weight")}
                />
                <Stat
                  value={cargo.requirements.volume != null ? `${cargo.requirements.volume} m³` : "—"}
                  label={t("cargoForm.volume")}
                />
                <Stat
                  value={cargo.requirements.quantity ?? "—"}
                  label={t("cargoForm.quantity")}
                />
                <Stat
                  value={cargo.requirements.transport_type?.name ?? "—"}
                  label={t("cargoForm.transportType")}
                />
              </div>

              {(cargo.requirements.fragile ||
                cargo.requirements.dangerous ||
                cargo.requirements.temperature_controlled) && (
                  <div className="flex flex-wrap gap-2">
                    {cargo.requirements.fragile && (
                      <Badge variant="outline" className="gap-1">
                        <Box className="size-3.5" />
                        {t("cargoForm.fragile")}
                      </Badge>
                    )}
                    {cargo.requirements.dangerous && (
                      <Badge variant="outline" className="gap-1">
                        <TriangleAlert className="size-3.5" />
                        {t("cargoForm.dangerous")}
                      </Badge>
                    )}
                    {cargo.requirements.temperature_controlled && (
                      <Badge variant="outline" className="gap-1">
                        <Snowflake className="size-3.5" />
                        {t("cargoForm.temperatureControlled")}
                      </Badge>
                    )}
                  </div>
                )}

              <div>
                <p className="text-xs text-muted-foreground">{t("cargoForm.additionalInfo")}</p>
                <p className="text-sm">{cargo.additional_info || "—"}</p>
              </div>

              <Link
                to={`/client/cargos/${cargo.id}`}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t("cargoOfferDetail.viewFullCargo")}
                <ChevronRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {isDriverProposer && (
            <Card className="rounded-2xl border shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">{t("cargoOfferDetail.driverInfo")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isDriverLoading || !driver ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar size="lg" className="size-12">
                          {driver.avatar?.url && (
                            <AvatarImage src={fixAssetUrl(driver.avatar.url) ?? undefined} />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <UserRound className="size-5" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center">
                          {driver.is_online && (
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60" />
                          )}
                          <span
                            className={cn(
                              "relative size-2.5 rounded-full border-2 border-background",
                              driver.is_online ? "bg-emerald-500" : "bg-muted-foreground/40"
                            )}
                          />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{driver.name ?? offer.proposer.name}</p>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="rounded-full text-xs">
                            {t("cargoOffers.proposerType.driver")}
                          </Badge>
                          {driver.is_verified && (
                            <BadgeCheck className="size-4 text-blue-500" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {driver.is_online
                              ? t("cargoOfferDetail.online")
                              : t("cargoOfferDetail.offline")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StarRating rating={driver.rating} />
                      <span className="text-sm font-medium">{driver.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">
                        ({t("cargoOfferDetail.reviewsCount", { count: driver.rating_count })})
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Stat
                        value={driver.completed_cargos_count}
                        label={t("cargoOfferDetail.completedCargos")}
                      />
                      <Stat
                        value={`${driver.reliability_rate}%`}
                        label={t("cargoOfferDetail.reliabilityRate")}
                      />
                      <Stat
                        value={driver.cancelled_cargos_count}
                        label={t("cargoOfferDetail.cancelledCargos")}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {t("cargoOfferDetail.memberSince")}:{" "}
                      {new Date(driver.member_since).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isDriverProposer && driver && driver.recent_reviews.length > 0 && (
            <Card className="rounded-2xl border shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">{t("cargoOfferDetail.reviewsTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {driver.recent_reviews.map((review) => (
                  <div key={review.id} className="rounded-lg bg-muted/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {review.is_anonymous
                          ? t("cargoOfferDetail.anonymousReviewer")
                          : review.reviewer.name}
                      </p>
                      <StarRating rating={review.rating} size="size-3" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-sm">{review.comment}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
