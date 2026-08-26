import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Search, X } from "lucide-react"
import { z } from "zod"
import { useTranslation, type TFunction } from "react-i18next"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useApplications } from "@/features/applications/useApplications"
import {
  useCreateEmployee,
  useCreateEmployeeWithDriver,
} from "@/features/employees/useEmployees"

// ------------------------------------------------------------------
// Shared employee fields schema — t() ga bog'liq bo'lgani uchun funksiya ko'rinishida
// ------------------------------------------------------------------

function buildEmployeeFieldsSchema(t: TFunction) {
  return z.object({
    employee_number: z.string().min(1, t("employeeCreate.validation.required")),
    position: z.string().min(2, t("employeeCreate.validation.min2")),
    employment_type: z.enum([
      "full_time",
      "part_time",
      "contract",
      "temporary",
    ]),
    salary: z.number().min(0, t("employeeCreate.validation.negativeSalary")),
    salary_currency: z.enum(["USD", "EUR", "UZS"]),
    pay_period: z.enum(["monthly", "weekly", "daily", "hourly"]),
    started_at: z.string().min(1, t("employeeCreate.validation.dateRequired")),
    notes: z.string().optional(),
  })
}

function buildNewDriverSchema(t: TFunction) {
  return buildEmployeeFieldsSchema(t).extend({
    fio: z.string().min(2, t("employeeCreate.validation.min2")),
    phone_number: z.string().min(9, t("employeeCreate.validation.phoneInvalid")),
    number: z.string().min(1, t("employeeCreate.validation.required")),
    telegram_chat_id: z.string().optional(),
  })
}

type NewDriverFormValues = z.infer<ReturnType<typeof buildNewDriverSchema>>
type FromApplicationFormValues = z.infer<ReturnType<typeof buildEmployeeFieldsSchema>>

const emptyNewDriverValues: NewDriverFormValues = {
  fio: "",
  phone_number: "",
  number: "",
  telegram_chat_id: "",
  employee_number: "",
  position: "",
  employment_type: "full_time",
  salary: 0,
  salary_currency: "UZS",
  pay_period: "monthly",
  started_at: "",
  notes: "",
}

const emptyFromApplicationValues: FromApplicationFormValues = {
  employee_number: "",
  position: "",
  employment_type: "full_time",
  salary: 0,
  salary_currency: "UZS",
  pay_period: "monthly",
  started_at: "",
  notes: "",
}

type Mode = "new_driver" | "from_application"

interface EmployeeCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: Mode
  initialApplication?: SelectedApplication | null
}

export function EmployeeCreateDialog({
  open,
  onOpenChange,
  defaultMode = "new_driver",
  initialApplication = null,
}: EmployeeCreateDialogProps) {
  const { t } = useTranslation()

  const [mode, setMode] = useState<Mode>(defaultMode)
  const [selectedApplication, setSelectedApplication] = useState<SelectedApplication | null>(
    initialApplication
  )

  const createWithDriverMutation = useCreateEmployeeWithDriver()
  const createMutation = useCreateEmployee()
  const isPending = createWithDriverMutation.isPending || createMutation.isPending

  const newDriverSchema = useMemo(() => buildNewDriverSchema(t), [t])
  const fromApplicationSchema = useMemo(() => buildEmployeeFieldsSchema(t), [t])

  const newDriverForm = useForm<NewDriverFormValues>({
    resolver: zodResolver(newDriverSchema),
    defaultValues: emptyNewDriverValues,
  })

  const fromApplicationForm = useForm<FromApplicationFormValues>({
    resolver: zodResolver(fromApplicationSchema),
    defaultValues: emptyFromApplicationValues,
  })

  // Dialog ochilganda holatni tozalash / o'rnatish
  useEffect(() => {
    if (!open) return
    setMode(defaultMode)
    setSelectedApplication(initialApplication)
    newDriverForm.reset(emptyNewDriverValues)
    fromApplicationForm.reset(emptyFromApplicationValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultMode, initialApplication])

  const handleClose = () => onOpenChange(false)

  const onSubmitNewDriver = (values: NewDriverFormValues) => {
    createWithDriverMutation.mutate(
      {
        fio: values.fio,
        phone_number: values.phone_number,
        number: values.number,
        telegram_chat_id: values.telegram_chat_id || undefined,
        employee_number: values.employee_number,
        position: values.position,
        employment_type: values.employment_type,
        salary: values.salary,
        salary_currency: values.salary_currency,
        pay_period: values.pay_period,
        started_at: values.started_at,
        notes: values.notes || undefined,
      },
      { onSuccess: handleClose }
    )
  }

  const onSubmitFromApplication = (values: FromApplicationFormValues) => {
    if (!selectedApplication) {
      fromApplicationForm.setError("root", {
        message: t("employeeCreate.rootError"),
      })
      return
    }

    createMutation.mutate(
      {
        vacancy_application_id: selectedApplication.id,
        source: "vacancy",
        employee_number: values.employee_number,
        position: values.position,
        employment_type: values.employment_type,
        salary: values.salary,
        salary_currency: values.salary_currency,
        pay_period: values.pay_period,
        started_at: values.started_at,
        notes: values.notes || undefined,
      },
      { onSuccess: handleClose }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("employeeCreate.title")}</DialogTitle>
          <DialogDescription>
            {t("employeeCreate.description")}
          </DialogDescription>
        </DialogHeader>

        {mode === "new_driver" ? (
          <Form {...newDriverForm}>
            <form onSubmit={newDriverForm.handleSubmit(onSubmitNewDriver)} className="space-y-5">
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground">{t("employeeCreate.driverSection.title")}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={newDriverForm.control}
                    name="fio"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>{t("employeeCreate.driverSection.fioLabel")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("employeeCreate.driverSection.fioPlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newDriverForm.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("employeeCreate.driverSection.phoneLabel")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("employeeCreate.driverSection.phonePlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newDriverForm.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("employeeCreate.driverSection.numberLabel")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("employeeCreate.driverSection.numberPlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newDriverForm.control}
                    name="telegram_chat_id"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>{t("employeeCreate.driverSection.telegramLabel")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("employeeCreate.driverSection.telegramPlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <EmployeeCommonFields control={newDriverForm.control} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t("employeeCreate.cancel")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {t("employeeCreate.create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...fromApplicationForm}>
            <form
              onSubmit={fromApplicationForm.handleSubmit(onSubmitFromApplication)}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground">{t("employeeCreate.applicationSection.title")}</h4>
                <ApplicationPicker
                  selected={selectedApplication}
                  onSelect={setSelectedApplication}
                />
                {fromApplicationForm.formState.errors.root && (
                  <p className="text-sm font-medium text-destructive">
                    {fromApplicationForm.formState.errors.root.message}
                  </p>
                )}
              </div>

              <EmployeeCommonFields control={fromApplicationForm.control} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t("employeeCreate.cancel")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {t("employeeCreate.create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------------
// Shared employee fields (position, salary, dates...) — bir xil ikkala rejimda
// ------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EmployeeCommonFields({ control }: { control: any }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold text-foreground">{t("employeeCreate.workSection.title")}</h4>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="employee_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("employeeCreate.workSection.employeeNumberLabel")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("employeeCreate.workSection.employeeNumberPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("employeeCreate.workSection.positionLabel")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("employeeCreate.workSection.positionPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="employment_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("employeeCreate.workSection.employmentTypeLabel")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="full_time">{t("vacancies.employmentType.full_time")}</SelectItem>
                    <SelectItem value="part_time">{t("vacancies.employmentType.part_time")}</SelectItem>
                    <SelectItem value="contract">{t("vacancies.employmentType.contract")}</SelectItem>
                    <SelectItem value="temporary">{t("vacancies.employmentType.temporary")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="pay_period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("employeeCreate.workSection.payPeriodLabel")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monthly">{t("employeeCreate.workSection.payPeriod.monthly")}</SelectItem>
                    <SelectItem value="weekly">{t("employeeCreate.workSection.payPeriod.weekly")}</SelectItem>
                    <SelectItem value="daily">{t("employeeCreate.workSection.payPeriod.daily")}</SelectItem>
                    <SelectItem value="hourly">{t("employeeCreate.workSection.payPeriod.hourly")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={control}
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("employeeCreate.workSection.salaryLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber ?? e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="salary_currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("employeeCreate.workSection.currencyLabel")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="UZS">UZS</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="started_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("employeeCreate.workSection.startedAtLabel")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("employeeCreate.workSection.notesLabel")}</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder={t("employeeCreate.workSection.notesPlaceholder")} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

// ------------------------------------------------------------------
// Application picker — search & select an existing vacancy application
// ------------------------------------------------------------------

export interface SelectedApplication {
  id: number
  driverName: string
  vacancyTitle?: string
}

function ApplicationPicker({
  selected,
  onSelect,
}: {
  selected: SelectedApplication | null
  onSelect: (app: SelectedApplication | null) => void
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 400)

  const { data, isLoading } = useApplications({
    search: debouncedSearch || undefined,
    status: "invited",
    page: 1,
  } as never)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = ((data as any)?.data ?? []) as Array<{
    id: number
    status: string
    driver?: { fio?: string }
    vacancy?: { id?: number; title?: string }
    vacancy_id?: number
  }>

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{selected.driverName}</p>
          {selected.vacancyTitle && (
            <p className="truncate text-xs text-muted-foreground">{selected.vacancyTitle}</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={() => onSelect(null)}
          aria-label={t("employeeCreate.applicationSection.clearAria")}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("employeeCreate.applicationSection.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-56 overflow-y-auto rounded-xl border">
        {isLoading && (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            {t("employeeCreate.applicationSection.loading")}
          </div>
        )}

        {!isLoading && results.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {search
              ? t("employeeCreate.applicationSection.noResults")
              : t("employeeCreate.applicationSection.typeToSearch")}
          </p>
        )}

        {!isLoading &&
          results.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() =>
                onSelect({
                  id: app.id,
                  driverName: app.driver?.fio ?? t("employeeCreate.applicationSection.unnamedApplication", { id: app.id }),
                  vacancyTitle:
                    app.vacancy?.title ??
                    (app.vacancy_id
                      ? t("employeeCreate.applicationSection.unnamedVacancy", { id: app.vacancy_id })
                      : undefined),
                })
              }
              className="flex w-full items-center justify-between gap-2 border-b px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {app.driver?.fio ?? t("employeeCreate.applicationSection.unnamedApplication", { id: app.id })}
                </p>
                {(app.vacancy?.title || app.vacancy_id) && (
                  <p className="truncate text-xs text-muted-foreground">
                    {app.vacancy?.title ?? t("employeeCreate.applicationSection.unnamedVacancy", { id: app.vacancy_id })}
                  </p>
                )}
              </div>
              <Badge
                variant="outline"
                className="shrink-0 border-0 bg-emerald-50 px-2 py-0 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              >
                {t("employeeCreate.applicationSection.invitedBadge")}
              </Badge>
            </button>
          ))}
      </div>
    </div>
  )
}