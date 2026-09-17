import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import {
  CargoLocationField,
  EMPTY_CARGO_LOCATION,
  cargoLocationDraftToInput,
  cargoLocationFromApi,
  type CargoLocationDraft,
} from "@/components/CargoLocationField"
import { CargoCard, type CargoCardData } from "@/components/CargoCard"
import { TransportTypeCarousel } from "@/components/TransportTypeCarousel"
import { useTransportTypes } from "@/features/lookup/useLookup"
import { useCargo, useCreateCargo, useUpdateCargo } from "@/features/cargo/useCargo"
import type { CargoClass, CreateCargoPayload } from "@/types"

function extractErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string }
  return err?.response?.data?.message ?? err?.message ?? fallback
}

export default function CargoFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const isEdit = Boolean(params.id)
  const cargoId = params.id ? Number(params.id) : NaN

  const { data: existingCargo, isLoading: cargoLoading } = useCargo(cargoId)
  const { data: transportTypes } = useTransportTypes()
  const createCargo = useCreateCargo()
  const updateCargo = useUpdateCargo(cargoId)

  const [name, setName] = useState("")
  const [cargoClass, setCargoClass] = useState<CargoClass>("standard")
  const [transportTypeId, setTransportTypeId] = useState<string>("")
  const [pickup, setPickup] = useState<CargoLocationDraft>(EMPTY_CARGO_LOCATION)
  const [delivery, setDelivery] = useState<CargoLocationDraft>(EMPTY_CARGO_LOCATION)
  const [weight, setWeight] = useState("")
  const [volume, setVolume] = useState("")
  const [quantity, setQuantity] = useState("")
  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const [fragile, setFragile] = useState(false)
  const [dangerous, setDangerous] = useState(false)
  const [temperatureControlled, setTemperatureControlled] = useState(false)
  const [minTemperature, setMinTemperature] = useState("")
  const [maxTemperature, setMaxTemperature] = useState("")
  const [transportRequirements, setTransportRequirements] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [loadingAt, setLoadingAt] = useState("")
  const [unloadingAt, setUnloadingAt] = useState("")

  useEffect(() => {
    if (!existingCargo) return
    setName(existingCargo.name)
    setCargoClass(existingCargo.cargo_class)
    setTransportTypeId(
      existingCargo.transport_type ? String(existingCargo.transport_type.id) : ""
    )
    setPickup(cargoLocationFromApi(existingCargo.pickup_location, existingCargo.from))
    setDelivery(cargoLocationFromApi(existingCargo.delivery_location, existingCargo.to))
    setWeight(existingCargo.weight != null ? String(existingCargo.weight) : "")
    setVolume(existingCargo.volume != null ? String(existingCargo.volume) : "")
    setQuantity(existingCargo.quantity != null ? String(existingCargo.quantity) : "")
    setLength(existingCargo.dimensions.length != null ? String(existingCargo.dimensions.length) : "")
    setWidth(existingCargo.dimensions.width != null ? String(existingCargo.dimensions.width) : "")
    setHeight(existingCargo.dimensions.height != null ? String(existingCargo.dimensions.height) : "")
    setFragile(existingCargo.fragile)
    setDangerous(existingCargo.dangerous)
    setTemperatureControlled(existingCargo.temperature_controlled)
    setMinTemperature(
      existingCargo.min_temperature != null ? String(existingCargo.min_temperature) : ""
    )
    setMaxTemperature(
      existingCargo.max_temperature != null ? String(existingCargo.max_temperature) : ""
    )
    setTransportRequirements(existingCargo.transport_requirements ?? "")
    setAdditionalInfo(existingCargo.additional_info ?? "")
    setLoadingAt(existingCargo.loading_at?.slice(0, 16) ?? "")
    setUnloadingAt(existingCargo.unloading_at?.slice(0, 16) ?? "")
  }, [existingCargo])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const pickupInput = cargoLocationDraftToInput(pickup)
    const deliveryInput = cargoLocationDraftToInput(delivery)

    if (!pickupInput) {
      toast.error(t("cargoForm.errors.pickupIncomplete"))
      return
    }
    if (!deliveryInput) {
      toast.error(t("cargoForm.errors.deliveryIncomplete"))
      return
    }
    if (!loadingAt) {
      toast.error(t("cargoForm.errors.loadingAtRequired"))
      return
    }

    const payload: CreateCargoPayload = {
      name,
      pickup: pickupInput,
      delivery: deliveryInput,
      cargo_class: cargoClass,
      transport_type_id: transportTypeId ? Number(transportTypeId) : undefined,
      weight: weight ? Number(weight) : undefined,
      volume: volume ? Number(volume) : undefined,
      quantity: quantity ? Number(quantity) : undefined,
      length: length ? Number(length) : undefined,
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      fragile,
      dangerous,
      temperature_controlled: temperatureControlled,
      min_temperature: temperatureControlled && minTemperature ? Number(minTemperature) : undefined,
      max_temperature: temperatureControlled && maxTemperature ? Number(maxTemperature) : undefined,
      transport_requirements: transportRequirements || undefined,
      additional_info: additionalInfo || undefined,
      loading_at: loadingAt,
      unloading_at: unloadingAt || undefined,
    }

    const onSuccess = (cargo: { id: number }) => {
      toast.success(isEdit ? t("cargoForm.updateSuccess") : t("cargoForm.createSuccess"))
      navigate(`/client/cargos/${cargo.id}`)
    }
    const onError = (error: unknown) => {
      toast.error(extractErrorMessage(error, t("cargoForm.errorDefault")))
    }

    if (isEdit) {
      updateCargo.mutate(payload, { onSuccess, onError })
    } else {
      createCargo.mutate(payload, { onSuccess, onError })
    }
  }

  const isSubmitting = isEdit ? updateCargo.isPending : createCargo.isPending

  const selectedTransportType = transportTypes?.find((type) => String(type.id) === transportTypeId)

  const previewCargo: CargoCardData = {
    name,
    status: existingCargo?.status ?? "open",
    cargo_class: cargoClass,
    from: {
      country: pickup.countryLabel
        ? { id: pickup.country_id ?? 0, name: pickup.countryLabel }
        : null,
      state: null,
      city: pickup.cityLabel ? { id: pickup.city_id ?? 0, name: pickup.cityLabel } : null,
    },
    to: {
      country: delivery.countryLabel
        ? { id: delivery.country_id ?? 0, name: delivery.countryLabel }
        : null,
      state: null,
      city: delivery.cityLabel ? { id: delivery.city_id ?? 0, name: delivery.cityLabel } : null,
    },
    weight: weight ? Number(weight) : null,
    volume: volume ? Number(volume) : null,
    quantity: quantity ? Number(quantity) : null,
    dimensions: {
      length: length ? Number(length) : null,
      width: width ? Number(width) : null,
      height: height ? Number(height) : null,
    },
    fragile,
    dangerous,
    temperature_controlled: temperatureControlled,
    transport_requirements: transportRequirements || null,
    transport_type: selectedTransportType
      ? {
        id: selectedTransportType.id,
        name: selectedTransportType.name,
        image_url: selectedTransportType.image_url,
      }
      : null,
    additional_info: additionalInfo || null,
    loading_at: loadingAt || new Date().toISOString(),
    unloading_at: unloadingAt || null,
    offers_count: existingCargo?.offers_count ?? 0,
    view_count: existingCargo?.view_count ?? 0,
    created_at: new Date().toISOString(),
  }

  if (isEdit && cargoLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className=" w-full max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="shrink-0" asChild>
          <Link to="/client/cargos" aria-label={t("cargoDetail.back")}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {isEdit ? t("cargoForm.editTitle") : t("cargoForm.createTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("cargoForm.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="space-y-4 ">
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label>{t("cargoForm.name")}</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("cargoForm.cargoClass")}</Label>
                    <Select value={cargoClass} onValueChange={(v) => setCargoClass(v as CargoClass)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">{t("cargoForm.classStandard")}</SelectItem>
                        <SelectItem value="premium">{t("cargoForm.classPremium")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("cargoForm.transportType")}</Label>
                  <TransportTypeCarousel
                    types={transportTypes ?? []}
                    value={transportTypeId}
                    onChange={setTransportTypeId}
                  />
                </div>
              </div>
            </CardContent>
          </Card>


          <CargoLocationField
            title={t("cargoForm.pickup")}
            value={pickup}
            onChange={setPickup}
          />

          <CargoLocationField
            title={t("cargoForm.delivery")}
            value={delivery}
            onChange={setDelivery}
          />

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="space-y-4 ">
              <h4 className="text-sm font-semibold">{t("cargoForm.dimensionsSection")}</h4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>{t("cargoForm.weight")}</Label>
                  <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("cargoForm.volume")}</Label>
                  <Input type="number" value={volume} onChange={(e) => setVolume(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("cargoForm.quantity")}</Label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("cargoForm.length")}</Label>
                  <Input type="number" value={length} onChange={(e) => setLength(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("cargoForm.width")}</Label>
                  <Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("cargoForm.height")}</Label>
                  <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="space-y-4 ">
              <h4 className="text-sm font-semibold">{t("cargoForm.optionsSection")}</h4>

              <div className="flex items-center justify-between">
                <Label htmlFor="fragile">{t("cargoForm.fragile")}</Label>
                <Switch id="fragile" checked={fragile} onCheckedChange={setFragile} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="dangerous">{t("cargoForm.dangerous")}</Label>
                <Switch id="dangerous" checked={dangerous} onCheckedChange={setDangerous} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="temperature_controlled">{t("cargoForm.temperatureControlled")}</Label>
                <Switch
                  id="temperature_controlled"
                  checked={temperatureControlled}
                  onCheckedChange={setTemperatureControlled}
                />
              </div>

              {temperatureControlled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t("cargoForm.minTemperature")}</Label>
                    <Input
                      type="number"
                      value={minTemperature}
                      onChange={(e) => setMinTemperature(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("cargoForm.maxTemperature")}</Label>
                    <Input
                      type="number"
                      value={maxTemperature}
                      onChange={(e) => setMaxTemperature(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>{t("cargoForm.transportRequirements")}</Label>
                <Textarea
                  value={transportRequirements}
                  onChange={(e) => setTransportRequirements(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("cargoForm.additionalInfo")}</Label>
                <Textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="space-y-4 ">
              <h4 className="text-sm font-semibold">{t("cargoForm.datesSection")}</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("cargoForm.loadingAt")}</Label>
                  <Input
                    type="datetime-local"
                    value={loadingAt}
                    onChange={(e) => setLoadingAt(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("cargoForm.unloadingAt")}</Label>
                  <Input
                    type="datetime-local"
                    value={unloadingAt}
                    onChange={(e) => setUnloadingAt(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              {t("cargoForm.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? t("cargoForm.save") : t("cargoForm.create")}
            </Button>
          </div>
        </form>

        <div className="hidden lg:sticky lg:top-6 lg:block">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {t("cargoForm.previewTitle")}
          </p>
          <div className="max-h-[calc(100vh-6rem)] overflow-y-auto">
            <CargoCard cargo={previewCargo} />
          </div>
        </div>
      </div>
    </div>
  )
}
