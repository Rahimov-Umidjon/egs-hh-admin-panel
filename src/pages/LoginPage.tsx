import { useState } from "react"
import type { FormEvent } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { Eye, EyeOff, Loader2, Package, Truck } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/features/auth/AuthContext"
import { useLogin } from "@/features/auth/useLogin"
import { useRegister } from "@/features/auth/useRegister"
import type { RegisterPayload } from "@/features/auth/useRegister"
import { useClientRegister } from "@/features/auth/useClientRegister"
import type { ClientRegisterPayload } from "@/features/auth/useClientRegister"
import type { ActorType, ClientType } from "@/types"
import { cn } from "@/lib/utils"

import {
  flattenApiErrors,
  useErrorCountSummary,
  useFieldErrorTranslator,
} from "@/hooks/useFieldErrorTranslator"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const REGISTER_INITIAL_STATE: RegisterPayload = {
  company_name: "",
  obo_company_name: "",
  state_incorporated: "",
  website: "",
  business_started_at: "",

  email: "",
  username: "",

  tin: null,

  password: "",
  password_confirmation: "",

  security_question: "",
  security_answer: "",
 

  location: {
    name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    region: "",
    zip: "",
    phone: "",
    email: "",
  },
}

const CLIENT_REGISTER_INITIAL_STATE: ClientRegisterPayload = {
  name: "",
  inn: "",
  email: "",
  password: "",
  password_confirmation: "",
  type: "cargo_owner",
  website: "",
  contact_person_name: "",
  contact_person_phone: "",
  phone_number: "",
  address: "",
}

function extractErrorMessage(error: unknown, fallback: string): string {
  
  const err = error as {
    response?: { data?: { message?: string } }
    message?: string
  }

  return err?.response?.data?.message ?? err?.message ?? fallback
}

function extractFieldErrors(error: unknown): Record<string, string[]> | undefined {
  const err = error as {
    response?: { data?: { errors?: Record<string, string[]> } }
  }

  return err?.response?.data?.errors
}

function homeFor(actorType: ActorType) {
  return actorType === "client" ? "/client" : "/"
}

export default function LoginPage() {
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()

  // Foydalanuvchi login qilishdan oldin qaysi aktyor sifatida kirayotganini
  // tanlaydi (Carrier — tashuvchi kompaniya, yoki Client — yuk beruvchi).
  // Bu tanlovga qarab har xil backend endpointi chaqiriladi.
  const [accountType, setAccountType] = useState<ActorType>("carrier")

  // Oddiy saytlardagidek: yagona sahifada login shakli ko'rsatiladi, pastida
  // "Ro'yxatdan o'tish" matni orqali register shakliga o'tiladi (tab/tugmalar guruhi emas)
  const [mode, setMode] = useState<"login" | "register">("login")

  const loginMutation = useLogin(accountType)
  const registerMutation = useRegister()
  const clientRegisterMutation = useClientRegister()

  const translateFieldError = useFieldErrorTranslator()
  const summarizeErrorCount = useErrorCountSummary()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [registerForm, setRegisterForm] = useState<RegisterPayload>(
    REGISTER_INITIAL_STATE
  )
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegPasswordConfirm, setShowRegPasswordConfirm] = useState(false)

  // fieldPath -> backenddan kelgan xom xabar (masalan "validation.company_name_required")
  const [rawFieldErrors, setRawFieldErrors] = useState<Record<string, string>>({})

  const [clientRegisterForm, setClientRegisterForm] = useState<ClientRegisterPayload>(
    CLIENT_REGISTER_INITIAL_STATE
  )
  const [showClientRegPassword, setShowClientRegPassword] = useState(false)
  const [showClientRegPasswordConfirm, setShowClientRegPasswordConfirm] = useState(false)
  const [clientRawFieldErrors, setClientRawFieldErrors] = useState<Record<string, string>>({})

  if (isAuthenticated) {
    const redirect =
      (location.state as { from?: string })?.from ?? homeFor(user?.actorType ?? "carrier")

    return <Navigate replace to={redirect} />
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    loginMutation.mutate(
      { email, password },
      {
        onSuccess() {
          toast.success(t("auth.login_success"))

          const redirect =
            (location.state as { from?: string })?.from ?? homeFor(accountType)

          navigate(redirect, { replace: true })
        },
        onError(error) {
          toast.error(
            t(extractErrorMessage(error, 'auth.login_error_default'))
          )
        },
      }
    )
  }

  function updateRegisterField<K extends keyof RegisterPayload>(
    field: K,
    value: RegisterPayload[K]
  ) {
    setRegisterForm((prev) => ({ ...prev, [field]: value }))
    clearFieldError(field as string)
  }

  function updateLocationField<K extends keyof RegisterPayload["location"]>(
    field: K,
    value: RegisterPayload["location"][K]
  ) {
    setRegisterForm((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }))
    clearFieldError(`location.${field as string}`)
  }

  function clearFieldError(fieldPath: string) {
    setRawFieldErrors((prev) => {
      if (!(fieldPath in prev)) return prev
      const next = { ...prev }
      delete next[fieldPath]
      return next
    })
  }

  function fieldError(fieldPath: string): string | undefined {
    const raw = rawFieldErrors[fieldPath]
    if (!raw) return undefined
    return translateFieldError(fieldPath, raw)
  }

  function handleRegisterSubmit(e: FormEvent) {
    e.preventDefault()

    if (registerForm.password !== registerForm.password_confirmation) {
      toast.error(t("auth.passwords_mismatch"))
      return
    }

    

    registerMutation.mutate(registerForm, {
      onSuccess() {
        toast.success(t("auth.register_success"))
        setRawFieldErrors({})
        setRegisterForm(REGISTER_INITIAL_STATE)
      },
      onError(error) {
        const apiErrors = extractFieldErrors(error)
        const flattened = flattenApiErrors(apiErrors)

        if (Object.keys(flattened).length > 0) {
          setRawFieldErrors(flattened)
          toast.error(summarizeErrorCount(Object.keys(flattened).length))
          return
        }

        toast.error(
          extractErrorMessage(error, t("auth.register_error_default"))
        )
      },
    })
  }

  function updateClientRegisterField<K extends keyof ClientRegisterPayload>(
    field: K,
    value: ClientRegisterPayload[K]
  ) {
    setClientRegisterForm((prev) => ({ ...prev, [field]: value }))
    clearClientFieldError(field as string)
  }

  function clearClientFieldError(fieldPath: string) {
    setClientRawFieldErrors((prev) => {
      if (!(fieldPath in prev)) return prev
      const next = { ...prev }
      delete next[fieldPath]
      return next
    })
  }

  function clientFieldError(fieldPath: string): string | undefined {
    const raw = clientRawFieldErrors[fieldPath]
    if (!raw) return undefined
    return translateFieldError(fieldPath, raw)
  }

  function handleClientRegisterSubmit(e: FormEvent) {
    e.preventDefault()

    if (clientRegisterForm.password !== clientRegisterForm.password_confirmation) {
      toast.error(t("auth.passwords_mismatch"))
      return
    }

    clientRegisterMutation.mutate(clientRegisterForm, {
      onSuccess() {
        toast.success(t("auth.register_success"))
        setClientRawFieldErrors({})
        setClientRegisterForm(CLIENT_REGISTER_INITIAL_STATE)
        setMode("login")
      },
      onError(error) {
        const apiErrors = extractFieldErrors(error)
        const flattened = flattenApiErrors(apiErrors)

        if (Object.keys(flattened).length > 0) {
          setClientRawFieldErrors(flattened)
          toast.error(summarizeErrorCount(Object.keys(flattened).length))
          return
        }

        toast.error(
          extractErrorMessage(error, t("auth.register_error_default"))
        )
      },
    })
  }

  const clientPasswordsMismatch =
    clientRegisterForm.password.length > 0 &&
    clientRegisterForm.password_confirmation.length > 0 &&
    clientRegisterForm.password !== clientRegisterForm.password_confirmation

  const passwordsMismatch =
    registerForm.password.length > 0 &&
    registerForm.password_confirmation.length > 0 &&
    registerForm.password !== registerForm.password_confirmation

  return (
    <div className="relative flex h-screen overflow-hidden">

      <div className="hidden lg:flex w-1/2 flex-col  justify-center bg-linear-to-br from-indigo-700 via-violet-700 to-sky-600 p-16 text-white">
        <div className="flex items-center   ">

          <div className="flex  items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <img src="./logo.png" alt="" />
          </div>
        </div>
      </div>


      <div className="flex flex-1 justify-center overflow-y-auto min-h-0">
        <div className="w-full max-w-4xl  py-10 px-6 my-auto">
          <Card className=" border-0 shadow-2xl">
            <CardContent className="p-8">

              <div className="mb-4 flex justify-end">
                <LanguageSwitcher />
              </div>

              <div className="mx-auto mb-6 grid w-2/3 grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType("carrier")}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 text-sm font-medium transition-colors",
                    accountType === "carrier"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-muted text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Truck className="size-5" />
                  {t("auth.account_type_carrier")}
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType("client")}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 text-sm font-medium transition-colors",
                    accountType === "client"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-muted text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Package className="size-5" />
                  {t("auth.account_type_client")}
                </button>
              </div>

              {mode === "login" ? (
                <div className="mt-6 w-1/2 mx-auto">

                  <div className="mb-6 text-center">
                    <h2 className="text-3xl font-bold">
                      {t("auth.welcome_title")}
                    </h2>

                    <p className="text-muted-foreground">
                      {t("auth.welcome_subtitle")}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">

                    <div className="space-y-2">
                      <Label>{t("auth.email")}</Label>

                      <Input
                        type="email"
                        placeholder="admin@company.uz"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">

                      <Label>{t("auth.password")}</Label>

                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          placeholder="********"
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                    </div>

                    <Button className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("auth.login_button")}
                    </Button>

                  </form>

                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    {t("auth.no_account_prompt")}{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="font-medium text-primary hover:underline"
                    >
                      {t("auth.register_tab")}
                    </button>
                  </p>

                </div>
              ) : (
                <div className="mt-6 w-[90%] mx-auto">
                {accountType === "client" ? (
                <>
                  <div className="mb-6 text-center">
                    <h2 className="text-3xl font-bold">
                      {t("auth.client_register_title")}
                    </h2>

                    <p className="text-muted-foreground">
                      {t("auth.client_register_subtitle")}
                    </p>
                  </div>

                  <form onSubmit={handleClientRegisterSubmit} className="space-y-6">

                    {/* Mijoz ma'lumotlari */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("auth.section_company")}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("auth.client_name")}</Label>
                          <Input
                            placeholder="ABC Trade LLC"
                            value={clientRegisterForm.name}
                            onChange={(e) =>
                              updateClientRegisterField("name", e.target.value)
                            }
                            className={cn(clientFieldError("name") && "border-red-500")}
                          />
                          {clientFieldError("name") && (
                            <p className="text-xs text-red-600">{clientFieldError("name")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.client_inn")}</Label>
                          <Input
                            placeholder="123456789"
                            value={clientRegisterForm.inn}
                            onChange={(e) =>
                              updateClientRegisterField("inn", e.target.value)
                            }
                            className={cn(clientFieldError("inn") && "border-red-500")}
                          />
                          {clientFieldError("inn") && (
                            <p className="text-xs text-red-600">{clientFieldError("inn")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.client_type")}</Label>
                          <Select
                            value={clientRegisterForm.type}
                            onValueChange={(value) =>
                              updateClientRegisterField("type", value as ClientType)
                            }
                          >
                            <SelectTrigger className={cn("w-full", clientFieldError("type") && "border-red-500")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cargo_owner">
                                {t("auth.client_type_cargo_owner")}
                              </SelectItem>
                              <SelectItem value="broker">
                                {t("auth.client_type_broker")}
                              </SelectItem>
                              <SelectItem value="expeditor">
                                {t("auth.client_type_expeditor")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {clientFieldError("type") && (
                            <p className="text-xs text-red-600">{clientFieldError("type")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.website")}</Label>
                          <Input
                            type="url"
                            placeholder="https://abctrade.uz"
                            value={clientRegisterForm.website}
                            onChange={(e) =>
                              updateClientRegisterField("website", e.target.value)
                            }
                            className={cn(clientFieldError("website") && "border-red-500")}
                          />
                          {clientFieldError("website") && (
                            <p className="text-xs text-red-600">{clientFieldError("website")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.contact_person_name")}</Label>
                          <Input
                            placeholder="Aziz Karimov"
                            value={clientRegisterForm.contact_person_name}
                            onChange={(e) =>
                              updateClientRegisterField("contact_person_name", e.target.value)
                            }
                            className={cn(clientFieldError("contact_person_name") && "border-red-500")}
                          />
                          {clientFieldError("contact_person_name") && (
                            <p className="text-xs text-red-600">{clientFieldError("contact_person_name")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.contact_person_phone")}</Label>
                          <Input
                            placeholder="+998901234567"
                            value={clientRegisterForm.contact_person_phone}
                            onChange={(e) =>
                              updateClientRegisterField("contact_person_phone", e.target.value)
                            }
                            className={cn(clientFieldError("contact_person_phone") && "border-red-500")}
                          />
                          {clientFieldError("contact_person_phone") && (
                            <p className="text-xs text-red-600">{clientFieldError("contact_person_phone")}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hisob ma'lumotlari */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("auth.section_account")}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("auth.email")}</Label>
                          <Input
                            type="email"
                            placeholder="client@example.com"
                            value={clientRegisterForm.email}
                            onChange={(e) =>
                              updateClientRegisterField("email", e.target.value)
                            }
                            className={cn(clientFieldError("email") && "border-red-500")}
                          />
                          {clientFieldError("email") && (
                            <p className="text-xs text-red-600">{clientFieldError("email")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.phone_number")}</Label>
                          <Input
                            placeholder="+998901234567"
                            value={clientRegisterForm.phone_number}
                            onChange={(e) =>
                              updateClientRegisterField("phone_number", e.target.value)
                            }
                            className={cn(clientFieldError("phone_number") && "border-red-500")}
                          />
                          {clientFieldError("phone_number") && (
                            <p className="text-xs text-red-600">{clientFieldError("phone_number")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.password")}</Label>
                          <div className="relative">
                            <Input
                              type={showClientRegPassword ? "text" : "password"}
                              placeholder="********"
                              value={clientRegisterForm.password}
                              onChange={(e) =>
                                updateClientRegisterField("password", e.target.value)
                              }
                              className={cn("pr-10", clientFieldError("password") && "border-red-500")}
                            />
                            <button
                              type="button"
                              onClick={() => setShowClientRegPassword((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              {showClientRegPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                          {clientFieldError("password") && (
                            <p className="text-xs text-red-600">{clientFieldError("password")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.password_confirmation")}</Label>
                          <div className="relative">
                            <Input
                              type={showClientRegPasswordConfirm ? "text" : "password"}
                              placeholder="********"
                              value={clientRegisterForm.password_confirmation}
                              onChange={(e) =>
                                updateClientRegisterField(
                                  "password_confirmation",
                                  e.target.value
                                )
                              }
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowClientRegPasswordConfirm((v) => !v)
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              {showClientRegPasswordConfirm ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {clientPasswordsMismatch && (
                        <p className="text-sm text-red-600">
                          {t("auth.passwords_mismatch")}
                        </p>
                      )}
                    </div>

                    {/* Manzil */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("auth.section_location")}
                      </h3>

                      <div className="space-y-2">
                        <Label>{t("auth.address")}</Label>
                        <Input
                          placeholder="Toshkent, Amir Temur ko'chasi 10"
                          value={clientRegisterForm.address}
                          onChange={(e) =>
                            updateClientRegisterField("address", e.target.value)
                          }
                          className={cn(clientFieldError("address") && "border-red-500")}
                        />
                        {clientFieldError("address") && (
                          <p className="text-xs text-red-600">{clientFieldError("address")}</p>
                        )}
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      disabled={clientRegisterMutation.isPending}
                    >
                      {clientRegisterMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("auth.register_button")}
                    </Button>

                  </form>

                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    {t("auth.have_account_prompt")}{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="font-medium text-primary hover:underline"
                    >
                      {t("auth.login_tab")}
                    </button>
                  </p>
                </>
                ) : (
                <>
                  <div className="mb-6 text-center">
                    <h2 className="text-3xl font-bold">
                      {t("auth.register_title")}
                    </h2>

                    <p className="text-muted-foreground">
                      {t("auth.register_subtitle")}
                    </p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-6">

                    {/* Kompaniya ma'lumotlari */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("auth.section_company")}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("auth.company_name")}</Label>
                          <Input
                            placeholder="ABC Logistics LLC"
                            value={registerForm.company_name}
                            onChange={(e) =>
                              updateRegisterField("company_name", e.target.value)
                            }
                            className={cn(fieldError("company_name") && "border-red-500")}
                          />
                          {fieldError("company_name") && (
                            <p className="text-xs text-red-600">{fieldError("company_name")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.obo_company_name")}</Label>
                          <Input
                            placeholder="ABC Transport"
                            value={registerForm.obo_company_name}
                            onChange={(e) =>
                              updateRegisterField(
                                "obo_company_name",
                                e.target.value
                              )
                            }
                            className={cn(fieldError("obo_company_name") && "border-red-500")}
                          />
                          {fieldError("obo_company_name") && (
                            <p className="text-xs text-red-600">{fieldError("obo_company_name")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.state_incorporated")}</Label>
                          <Input
                            placeholder="Toshkent"
                            value={registerForm.state_incorporated}
                            onChange={(e) =>
                              updateRegisterField(
                                "state_incorporated",
                                e.target.value
                              )
                            }
                            className={cn(fieldError("state_incorporated") && "border-red-500")}
                          />
                          {fieldError("state_incorporated") && (
                            <p className="text-xs text-red-600">{fieldError("state_incorporated")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.website")}</Label>
                          <Input
                            type="url"
                            placeholder="https://abclogistics.uz"
                            value={registerForm.website}
                            onChange={(e) =>
                              updateRegisterField("website", e.target.value)
                            }
                            className={cn(fieldError("website") && "border-red-500")}
                          />
                          {fieldError("website") && (
                            <p className="text-xs text-red-600">{fieldError("website")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.business_started_at")}</Label>
                          <Input
                            type="date"
                            value={registerForm.business_started_at}
                            onChange={(e) =>
                              updateRegisterField(
                                "business_started_at",
                                e.target.value
                              )
                            }
                            className={cn(fieldError("business_started_at") && "border-red-500")}
                          />
                          {fieldError("business_started_at") && (
                            <p className="text-xs text-red-600">{fieldError("business_started_at")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.tin")}</Label>
                          <Input
                            placeholder="123456789"
                            value={registerForm.tin ?? ''}
                            onChange={(e) =>
                              updateRegisterField("tin", Number(e.target.value))
                            }
                            className={cn(fieldError("tin") && "border-red-500")}
                          />
                          {fieldError("tin") && (
                            <p className="text-xs text-red-600">{fieldError("tin")}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hisob ma'lumotlari */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("auth.section_account")}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("auth.email")}</Label>
                          <Input
                            type="email"
                            placeholder="carrier@example.com"
                            value={registerForm.email}
                            onChange={(e) =>
                              updateRegisterField("email", e.target.value)
                            }
                            className={cn(fieldError("email") && "border-red-500")}
                          />
                          {fieldError("email") && (
                            <p className="text-xs text-red-600">{fieldError("email")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.username")}</Label>
                          <Input
                            placeholder="abclogistics"
                            value={registerForm.username}
                            onChange={(e) =>
                              updateRegisterField("username", e.target.value)
                            }
                            className={cn(fieldError("username") && "border-red-500")}
                          />
                          {fieldError("username") && (
                            <p className="text-xs text-red-600">{fieldError("username")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.password")}</Label>
                          <div className="relative">
                            <Input
                              type={showRegPassword ? "text" : "password"}
                              placeholder="********"
                              value={registerForm.password}
                              onChange={(e) =>
                                updateRegisterField("password", e.target.value)
                              }
                              className={cn("pr-10", fieldError("password") && "border-red-500")}
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              {showRegPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                          {fieldError("password") && (
                            <p className="text-xs text-red-600">{fieldError("password")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.password_confirmation")}</Label>
                          <div className="relative">
                            <Input
                              type={showRegPasswordConfirm ? "text" : "password"}
                              placeholder="********"
                              value={registerForm.password_confirmation}
                              onChange={(e) =>
                                updateRegisterField(
                                  "password_confirmation",
                                  e.target.value
                                )
                              }
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowRegPasswordConfirm((v) => !v)
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              {showRegPasswordConfirm ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {passwordsMismatch && (
                        <p className="text-sm text-red-600">
                          {t("auth.passwords_mismatch")}
                        </p>
                      )}

                      {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("auth.security_question")}</Label>
                          <Input
                            placeholder="Kompaniya kodingiz nima?"
                            value={registerForm.security_question}
                            onChange={(e) =>
                              updateRegisterField(
                                "security_question",
                                e.target.value
                              )
                            }
                            className={cn(fieldError("security_question") && "border-red-500")}
                          />
                          {fieldError("security_question") && (
                            <p className="text-xs text-red-600">{fieldError("security_question")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.security_answer")}</Label>
                          <Input
                            placeholder="ABC123"
                            value={registerForm.security_answer}
                            onChange={(e) =>
                              updateRegisterField(
                                "security_answer",
                                e.target.value
                              )
                            }
                            className={cn(fieldError("security_answer") && "border-red-500")}
                          />
                          {fieldError("security_answer") && (
                            <p className="text-xs text-red-600">{fieldError("security_answer")}</p>
                          )}
                        </div>
                      </div> */}
                    </div>

                    {/* Manzil ma'lumotlari */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("auth.section_location")}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 sm:col-span-2">
                          <Label>{t("auth.location_name")}</Label>
                          <Input
                            placeholder="Toshkent Bosh Ofisi"
                            value={registerForm.location.name}
                            onChange={(e) =>
                              updateLocationField("name", e.target.value)
                            }
                            className={cn(fieldError("location.name") && "border-red-500")}
                          />
                          {fieldError("location.name") && (
                            <p className="text-xs text-red-600">{fieldError("location.name")}</p>
                          )}
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <Label>{t("auth.address_line1")}</Label>
                          <Input
                            placeholder="Amir Temur ko'chasi 10"
                            value={registerForm.location.address_line1}
                            onChange={(e) =>
                              updateLocationField(
                                "address_line1",
                                e.target.value
                              )
                            }
                            className={cn(fieldError("location.address_line1") && "border-red-500")}
                          />
                          {fieldError("location.address_line1") && (
                            <p className="text-xs text-red-600">{fieldError("location.address_line1")}</p>
                          )}
                        </div>

                        

                        <div className="space-y-2">
                          <Label>{t("auth.city")}</Label>
                          <Input
                            placeholder="Toshkent"
                            value={registerForm.location.city}
                            onChange={(e) =>
                              updateLocationField("city", e.target.value)
                            }
                            className={cn(fieldError("location.city") && "border-red-500")}
                          />
                          {fieldError("location.city") && (
                            <p className="text-xs text-red-600">{fieldError("location.city")}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("auth.region")}</Label>
                          <Input
                            placeholder="Toshkent shahri"
                            value={registerForm.location.region}
                            onChange={(e) =>
                              updateLocationField("region", e.target.value)
                            }
                            className={cn(fieldError("location.region") && "border-red-500")}
                          />
                          {fieldError("location.region") && (
                            <p className="text-xs text-red-600">{fieldError("location.region")}</p>
                          )}
                        </div>

                        {/* <div className="space-y-2">
                          <Label>{t("auth.zip")}</Label>
                          <Input
                            placeholder="100000"
                            value={registerForm.location.zip}
                            onChange={(e) =>
                              updateLocationField("zip", e.target.value)
                            }
                            className={cn(fieldError("location.zip") && "border-red-500")}
                          />
                          {fieldError("location.zip") && (
                            <p className="text-xs text-red-600">{fieldError("location.zip")}</p>
                          )}
                        </div> */}

                        <div className="space-y-2">
                          <Label>{t("auth.phone")}</Label>
                          <Input
                            placeholder="+998945205522"
                            value={registerForm.location.phone}
                            onChange={(e) =>
                              updateLocationField("phone", e.target.value)
                            }
                            className={cn(fieldError("location.phone") && "border-red-500")}
                          />
                          {fieldError("location.phone") && (
                            <p className="text-xs text-red-600">{fieldError("location.phone")}</p>
                          )}
                        </div>

                        {/* <div className="space-y-2 sm:col-span-2">
                          <Label>{t("auth.office_email")}</Label>
                          <Input
                            type="email"
                            placeholder="office@abclogistics.uz"
                            value={registerForm.location.email}
                            onChange={(e) =>
                              updateLocationField("email", e.target.value)
                            }
                            className={cn(fieldError("location.email") && "border-red-500")}
                          />
                          {fieldError("location.email") && (
                            <p className="text-xs text-red-600">{fieldError("location.email")}</p>
                          )}
                        </div> */}
                      </div>
                    </div>

                    {/* <div className="flex items-start gap-2">
                      <Checkbox
                        id="agreed_terms"
                        checked={registerForm.agreed_terms}
                        onCheckedChange={(checked) =>
                          updateRegisterField("agreed_terms", checked === true)
                        }
                      />
                      <Label
                        htmlFor="agreed_terms"
                        className="text-sm font-normal leading-snug"
                      >
                        {t("auth.terms_agree")}
                      </Label>
                    </div> */}

                    <Button
                      className="w-full"
                      disabled={
                        registerMutation.isPending 
                      }
                    >
                      {registerMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("auth.register_button")}
                    </Button>

                  </form>

                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    {t("auth.have_account_prompt")}{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="font-medium text-primary hover:underline"
                    >
                      {t("auth.login_tab")}
                    </button>
                  </p>
                </>
                )}

                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

 

    </div>
  )
}