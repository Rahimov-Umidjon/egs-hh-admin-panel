import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  User,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { ApplicationStatus } from "@/types"
import { useApplication } from "@/features/applications/useApplications"

const statusMeta: Record<
  ApplicationStatus,
  { label: string; dot: string; text: string }
> = {
  pending: {
    label: "Kutilmoqda",
    dot: "bg-amber-400",
    text: "text-amber-700 dark:text-amber-400",
  },
  invited: {
    label: "Taklif qilingan",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  rejected: {
    label: "Rad etilgan",
    dot: "bg-rose-400",
    text: "text-rose-700 dark:text-rose-400",
  },
}

const employmentLabels: Record<string, string> = {
  full_time: "To'liq stavka",
  part_time: "Yarim stavka",
}

function calcAge(birthDate: string | null | undefined) {
  if (!birthDate) return null
  const diff = Date.now() - new Date(birthDate).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

export default function ApplicationShowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const applicationId = id ? Number(id) : null

  const { data: application, isLoading } = useApplication(applicationId)
  const resume = application?.driver.resume
  const age = calcAge(resume?.birth_date)

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
        <p className="font-medium text-foreground">Ariza topilmadi</p>
        <Button variant="ghost" className="mt-3 cursor-pointer" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 size-4" /> Orqaga
        </Button>
      </div>
    )
  }

  const meta = statusMeta[application.status] ?? statusMeta.pending

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="cursor-pointer text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 size-4" /> Orqaga
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {application.driver.fio ?? application.driver.phone_number}
          </h2>
          <p className="text-sm text-muted-foreground">
            "{application.vacancy.title}" vakansiyasiga ariza
          </p>
        </div>
        <Badge variant="outline" className={`border-0 bg-muted px-3 py-1 text-sm font-medium ${meta.text}`}>
          <span className={`mr-1.5 size-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Chap ustun — nomzod va ariza ma'lumotlari */}
        <Card className="rounded-2xl border-none shadow-none md:col-span-1">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <User className="size-6" />
            </div>
            <div>
              <p className="font-semibold">
                {application.driver.fio ?? "Ism kiritilmagan"}
              </p>
              {age !== null && (
                <p className="text-sm text-muted-foreground">{age} yosh</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" />
              {application.driver.phone_number}
            </div>
            {resume?.address && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>{resume.address}</span>
              </div>
            )}
            {resume?.birth_date && (
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                {new Date(resume.birth_date).toLocaleDateString("uz-UZ")}
              </div>
            )}
            <div className="pt-2 text-xs text-muted-foreground">
              Ariza yuborilgan: {new Date(application.applied_at).toLocaleString("uz-UZ")}
            </div>
          </CardContent>
        </Card>

        {/* O'ng ustun — vakansiya, xabar, rad sababi, rezyume */}
        <div className="space-y-6 md:col-span-2">
          <Card className="rounded-2xl border-none shadow-none">
            <CardHeader className="space-y-0 pb-2">
              <h3 className="flex items-center gap-2 font-semibold">
                <Briefcase className="size-4 text-muted-foreground" />
                Vakansiya
              </h3>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <p className="font-medium">{application.vacancy.title}</p>
              <Badge variant="outline" className="rounded-[4px] border-0 bg-muted px-3 py-1.5 text-sm">
                {employmentLabels[application.vacancy.employment_type] ??
                  application.vacancy.employment_type}
              </Badge>
              <Badge variant="outline" className="rounded-[4px] border-0 bg-muted px-3 py-1.5 text-sm">
                <Wallet className="mr-1.5 size-3.5" />
                {application.vacancy.salary_from.toLocaleString()} –{" "}
                {application.vacancy.salary_to.toLocaleString()}{" "}
                {application.vacancy.salary_currency}
              </Badge>
            </CardContent>
          </Card>

          {application.message && (
            <Card className="rounded-2xl border-none shadow-none">
              <CardHeader className="space-y-0 pb-2">
                <h3 className="flex items-center gap-2 font-semibold">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  Nomzod xabari
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {application.message}
                </p>
              </CardContent>
            </Card>
          )}

          {application.rejection_reason && (
            <Card className="rounded-2xl border-none bg-rose-50 shadow-none dark:bg-rose-950/30">
              <CardHeader className="space-y-0 pb-2">
                <h3 className="font-semibold text-rose-700 dark:text-rose-400">
                  Rad etish sababi
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-rose-700 dark:text-rose-400">
                  {application.rejection_reason}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border-none shadow-none">
            <CardHeader className="space-y-0 pb-2">
              <h3 className="font-semibold">Rezyume</h3>
            </CardHeader>
            <CardContent>
              {!resume ? (
                <p className="text-sm text-muted-foreground">
                  Bu nomzod rezyume to'ldirmagan
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="outline" className="rounded-[4px] border-0 bg-muted px-3 py-1.5 text-sm">
                      {resume.experience_years ?? 0} yillik tajriba
                    </Badge>
                    {resume.desired_salary_from && (
                      <Badge variant="outline" className="rounded-[4px] border-0 bg-muted px-3 py-1.5 text-sm">
                        <Wallet className="mr-1.5 size-3.5" />
                        Kutilayotgan: {Number(resume.desired_salary_from).toLocaleString()}{" "}
                        {resume.salary_currency}
                      </Badge>
                    )}
                  </div>

                  {resume.description && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {resume.description}
                    </p>
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