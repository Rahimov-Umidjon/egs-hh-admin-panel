// components/VacancyDetailsDialog.tsx

import {
  Banknote,
  Briefcase,
  Building2,
  CalendarClock,
  ClipboardList,
  ListChecks,
  Loader2,
  MapPin,
  Phone,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useVacancy } from "@/features/vacancies"

// const statusMeta: Record<string, { label: string; dot: string; text: string }> = {
//   draft: { label: "Qoralama", dot: "bg-amber-400", text: "text-amber-700 dark:text-amber-400" },
//   published: { label: "Chop etilgan", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
//   closed: { label: "Yopilgan", dot: "bg-rose-400", text: "text-rose-700 dark:text-rose-400" },
// }

const employmentTypeLabels: Record<string, string> = {
  full_time: "To'liq stavka",
  part_time: "Yarim stavka",
  contract: "Shartnoma asosida",
  internship: "Amaliyot",
}

interface VacancyDetailsDialogProps {
  vacancyId: number | null
  onOpenChange: (open: boolean) => void
}

export function VacancyDetailsDialog({ vacancyId, onOpenChange }: VacancyDetailsDialogProps) {
  const { data: vacancy, isLoading } = useVacancy(vacancyId)
 
  return (
    <Dialog open={!!vacancyId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && vacancy && (
          <>
            <DialogHeader className="space-y-2 ">
              <div className="flex   gap-3   items-center ">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Briefcase className="size-5" />
                </div>
                <div className="space-y-1 ">
                  <DialogTitle className="text-xl">{vacancy.title}</DialogTitle>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              {/* Maosh va bandlik turi */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                  <Banknote className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-semibold tabular-nums">
                    {vacancy.salary_from.toLocaleString()} – {vacancy.salary_to.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">{vacancy.salary_currency}</span>
                </div>
                {vacancy.employment_type && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium">
                    {employmentTypeLabels[vacancy.employment_type] ?? vacancy.employment_type}
                  </div>
                )}
                {vacancy.expires_at && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    {new Date(vacancy.expires_at).toLocaleDateString("uz-UZ")} gacha amal qiladi
                  </div>
                )}
              </div>

              {/* Tavsif */}
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground">Tavsif</h4>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {vacancy.description}
                </p>
              </div>

              {/* Talablar */}
              { vacancy?.requirements && vacancy?.requirements?.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <ListChecks className="size-4" /> Talablar
                  </h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {vacancy.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Majburiyatlar */}
              {vacancy.responsibilities && vacancy.responsibilities?.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <ClipboardList className="size-4" /> Majburiyatlar
                  </h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {vacancy.responsibilities.map((res, i) => (
                      <li key={i}>{res}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator />

              {/* Kompaniya ma'lumotlari */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Building2 className="size-4" /> Kompaniya
                </h4>
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-medium text-foreground">{vacancy.carrier?.company_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Faoliyat davri: {vacancy.carrier?.years_in_business}
                  </p>
                </div>

                {vacancy.carrier?.locations?.length > 0 && (
                  <div className="space-y-2">
                    {vacancy.carrier?.locations.map((loc) => (
                      <div key={loc.id} className="flex items-start gap-2 rounded-lg border border-border/60 p-3 text-sm">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">
                            {loc.name}
                            {loc.is_primary && (
                              <Badge variant="outline" className="ml-2 border-0 bg-primary/10 px-1.5 py-0 text-[10px] text-primary">
                                Asosiy
                              </Badge>
                            )}
                          </p>
                          <p className="text-muted-foreground">
                            {loc.address_line1}, {loc.city}, {loc.region}
                          </p>
                          <p className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="size-3" /> {loc.phone}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}