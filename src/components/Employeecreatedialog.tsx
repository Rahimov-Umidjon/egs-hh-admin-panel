import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Search, X } from "lucide-react"
import { z } from "zod"

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
// Shared employee fields schema
// ------------------------------------------------------------------

const employeeFieldsSchema = z.object({
  employee_number: z.string().min(1, "Kiritilishi shart"),
  position: z.string().min(2, "Kamida 2 ta belgi"),
  employment_type: z.enum([
    "full_time",
    "part_time",
    "contract",
    "temporary",
  ]),
  salary: z.number().min(0, "Manfiy bo'lishi mumkin emas"),
  salary_currency: z.enum(["USD", "EUR", "UZS"]),
  pay_period: z.enum(["monthly", "weekly", "daily", "hourly"]),
  started_at: z.string().min(1, "Sana tanlang"),
  notes: z.string().optional(),
})




// New driver mode
const newDriverSchema = employeeFieldsSchema.extend({
  fio: z.string().min(2, "Kamida 2 ta belgi"),
  phone_number: z.string().min(9, "Telefon raqamni to'g'ri kiriting"),
  number: z.string().min(1, "Kiritilishi shart"),
  telegram_chat_id: z.string().optional(),
})
type NewDriverFormValues = z.infer<typeof newDriverSchema>

// From application mode
const fromApplicationSchema = employeeFieldsSchema
type FromApplicationFormValues = z.infer<typeof fromApplicationSchema>

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

export function EmployeeCreateDialog({ open,
  onOpenChange,
  defaultMode = "new_driver",
  initialApplication = null
}: EmployeeCreateDialogProps) {

  const [mode, setMode] = useState<Mode>(defaultMode)
  const [selectedApplication, setSelectedApplication] = useState<SelectedApplication | null>(
    initialApplication
  )

  const createWithDriverMutation = useCreateEmployeeWithDriver()
  const createMutation = useCreateEmployee()
  const isPending = createWithDriverMutation.isPending || createMutation.isPending


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
        message: "Vakansiya arizasini tanlang",
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
          <DialogTitle>Yangi xodim</DialogTitle>
          <DialogDescription>
            Yangi haydovchi qo'shib yoki mavjud vakansiya arizasidan xodim yarating
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        {/* <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setMode("new_driver")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors",
              mode === "new_driver"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserPlus className="size-4" />
            Yangi haydovchi
          </button>
          <button
            type="button"
            onClick={() => setMode("from_application")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors",
              mode === "from_application"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="size-4" />
            Vakansiya arizasidan
          </button>
        </div> */}

        {mode === "new_driver" ? (
          <Form {...newDriverForm}>
            <form onSubmit={newDriverForm.handleSubmit(onSubmitNewDriver)} className="space-y-5">
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground">Haydovchi ma'lumotlari</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={newDriverForm.control}
                    name="fio"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>F.I.Sh</FormLabel>
                        <FormControl>
                          <Input placeholder="Masalan: Muhammad Aliyev" {...field} />
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
                        <FormLabel>Telefon raqami</FormLabel>
                        <FormControl>
                          <Input placeholder="+998901234567" {...field} />
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
                        <FormLabel>Haydovchi raqami</FormLabel>
                        <FormControl>
                          <Input placeholder="DRV-001" {...field} />
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
                        <FormLabel>Telegram chat ID (ixtiyoriy)</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789" {...field} />
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
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Yaratish
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
                <h4 className="text-sm font-semibold text-foreground">Vakansiya arizasi</h4>
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
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Yaratish
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
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold text-foreground">Ish ma'lumotlari</h4>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="employee_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Xodim raqami</FormLabel>
                <FormControl>
                  <Input placeholder="EMP-0001" {...field} />
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
                <FormLabel>Lavozim</FormLabel>
                <FormControl>
                  <Input placeholder="Driver" {...field} />
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
                <FormLabel>Bandlik turi</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="full_time">To'liq stavka</SelectItem>
                    <SelectItem value="part_time">Yarim stavka</SelectItem>
                    <SelectItem value="contract">Shartnoma</SelectItem>
                    <SelectItem value="temporary">Vaqtinchalik</SelectItem>
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
                <FormLabel>To'lov davri</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monthly">Oylik</SelectItem>
                    <SelectItem value="weekly">Haftalik</SelectItem>
                    <SelectItem value="daily">Kunlik</SelectItem>
                    <SelectItem value="hourly">Soatlik</SelectItem>
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
                <FormLabel>Maosh</FormLabel>
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
                <FormLabel>Valyuta</FormLabel>
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
                <FormLabel>Boshlangan sana</FormLabel>
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
            <FormLabel>Izoh (ixtiyoriy)</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="Qo'shimcha izoh..." {...field} />
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
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 400)

  const { data, isLoading } = useApplications({
    search: debouncedSearch || undefined,
    status: "invited",
    page: 1,
  } as never)

  // NOTE: `useApplications` javobidagi element shakli loyihangizdagi haqiqiy
  // Application tipiga qarab moslashtirilishi kerak bo'lishi mumkin
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
          placeholder="Haydovchi ismi bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-56 overflow-y-auto rounded-xl border">
        {isLoading && (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Yuklanmoqda...
          </div>
        )}

        {!isLoading && results.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {search ? "Hech narsa topilmadi" : "Qidiruv uchun yozing"}
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
                  driverName: app.driver?.fio ?? `Ariza #${app.id}`,
                  vacancyTitle:
                    app.vacancy?.title ?? (app.vacancy_id ? `Vakansiya #${app.vacancy_id}` : undefined),
                })
              }
              className="flex w-full items-center justify-between gap-2 border-b px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {app.driver?.fio ?? `Ariza #${app.id}`}
                </p>
                {(app.vacancy?.title || app.vacancy_id) && (
                  <p className="truncate text-xs text-muted-foreground">
                    {app.vacancy?.title ?? `Vakansiya #${app.vacancy_id}`}
                  </p>
                )}
              </div>
              <Badge
                variant="outline"
                className="shrink-0 border-0 bg-emerald-50 px-2 py-0 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              >
                Invited
              </Badge>
            </button>
          ))}
      </div>
    </div>
  )
}