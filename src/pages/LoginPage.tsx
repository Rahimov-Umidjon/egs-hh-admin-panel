import { useState } from "react"
import type { FormEvent } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useAuth } from "@/features/auth/AuthContext"
import { useLogin } from "@/features/auth/useLogin"
import { useRegister } from "@/features/auth/useRegister"
import type { RegisterPayload } from "@/features/auth/useRegister"

import {
  flattenApiErrors,
  useErrorCountSummary,
  useFieldErrorTranslator,
} from "@/hooks/useFieldErrorTranslator"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

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

export default function LoginPage() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()

  const loginMutation = useLogin()
  const registerMutation = useRegister()

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

  if (isAuthenticated) {
    const redirect =
      (location.state as { from?: string })?.from ?? "/"

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
            (location.state as { from?: string })?.from ?? "/"

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

              <Tabs defaultValue="login" className="w-full">

                <TabsList className="grid w-2/3 mx-auto grid-cols-2">
                  <TabsTrigger value="login">
                    {t("auth.login_tab")}
                  </TabsTrigger>

                  <TabsTrigger value="register">
                    {t("auth.register_tab")}
                  </TabsTrigger>
                </TabsList>

                {/* LOGIN */}

                <TabsContent  value="login" className="mt-6 w-1/2 mx-auto">

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

                </TabsContent>

                {/* REGISTER */}
                <TabsContent value="register" className="mt-6 w-[90%] mx-auto">

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

                </TabsContent>

              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

 

    </div>
  )
}