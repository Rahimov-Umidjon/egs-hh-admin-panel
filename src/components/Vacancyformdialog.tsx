import { useEffect } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, X } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {  Vacancy, VacancyID, VacancyPayload } from "@/types"
import { useCreateVacancy, useUpdateVacancy } from "@/features/vacancies"





const vacancySchema = z
  .object({
    title: z.string().min(3, "Kamida 3 ta belgi kiriting"),
    description: z.string().min(10, "Kamida 10 ta belgi kiriting"),
    employment_type: z
      .enum(["full_time", "part_time", "contract", "temporary"])
      .optional(),
    salary_from: z.coerce.number().min(0, "Manfiy bo'lishi mumkin emas"),
    salary_to: z.coerce.number().min(0, "Manfiy bo'lishi mumkin emas"),
    salary_currency: z.enum(["USD", "EUR", "UZS"]),
    status: z.enum(["draft", "published", "closed"]),
    expires_at: z.string().optional(),
    requirements: z
      .array(z.object({ value: z.string().min(1, "Bo'sh bo'lishi mumkin emas") }))
      .min(1, "Kamida 1 ta talab kiriting"),
    responsibilities: z
      .array(z.object({ value: z.string().min(1, "Bo'sh bo'lishi mumkin emas") }))
      .min(1, "Kamida 1 ta vazifa kiriting"),
  })
  .refine((data) => data.salary_to >= data.salary_from, {
    message: "Maksimal maosh minimaldan kichik bo'lishi mumkin emas",
    path: ["salary_to"],
  })

type VacancyFormInput = z.input<typeof vacancySchema>   // salary_from/salary_to: unknown (coerce oldidan)
type VacancyFormValues = z.output<typeof vacancySchema> // salary_from/salary_to: number (coerce keyin)

const emptyValues: VacancyFormInput = {
  title: "",
  description: "",
  employment_type: undefined,
  salary_from: 0,
  salary_to: 0,
  salary_currency: "USD",
  status: "draft",
  expires_at: "",
  requirements: [{ value: "" }],
  responsibilities: [{ value: "" }],
}

interface VacancyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vacancy?: VacancyID | Vacancy | null // bo'sh bo'lsa — yaratish rejimi, to'ldirilgan bo'lsa — tahrirlash
}

export function VacancyFormDialog({
  open,
  onOpenChange,
  vacancy,
}: VacancyFormDialogProps) {
  const isEditMode = !!vacancy
  const createMutation = useCreateVacancy()
  const updateMutation = useUpdateVacancy()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<VacancyFormInput, unknown, VacancyFormValues>({
    resolver: zodResolver(vacancySchema),
    defaultValues: emptyValues,
  })

  const requirementsArray = useFieldArray({
    control: form.control,
    name: "requirements",
  })
  const responsibilitiesArray = useFieldArray({
    control: form.control,
    name: "responsibilities",
  })

  // Dialog ochilganda formani kerakli ma'lumot bilan to'ldirish
  useEffect(() => {
    if (!open) return

    if (vacancy) {
      form.reset({
        title: vacancy.title,
        description: vacancy.description,
        employment_type: vacancy.employment_type ?? undefined,
        salary_from: vacancy.salary_from,
        salary_to: vacancy.salary_to,
        salary_currency: vacancy.salary_currency,
        status: vacancy.status,
        expires_at: vacancy.expires_at ?? "",
        requirements: vacancy.requirements?.length
          ? vacancy.requirements.map((value) => ({ value }))
          : [{ value: "" }],
        responsibilities: vacancy.responsibilities?.length
          ? vacancy.responsibilities.map((value) => ({ value }))
          : [{ value: "" }],
      })
    } else {
      form.reset(emptyValues)
    }
  }, [open, vacancy, form])

  const onSubmit = (values: VacancyFormValues) => {
    const payload: VacancyPayload = {
      title: values.title,
      description: values.description,
      employment_type: values.employment_type,
      salary_from: values.salary_from,
      salary_to: values.salary_to,
      salary_currency: values.salary_currency,
      status: values.status,
      expires_at: values.expires_at || undefined,
      requirements: values.requirements.map((r) => r.value),
      responsibilities: values.responsibilities.map((r) => r.value),
    }

    if (isEditMode && vacancy) {
      updateMutation.mutate(
        { id: vacancy.id, payload },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => onOpenChange(false),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Vakansiyani tahrirlash" : "Yangi vakansiya"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Vakansiya ma'lumotlarini yangilang"
              : "Yangi ish o'rni haqida ma'lumot kiriting"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sarlavha</FormLabel>
                  <FormControl>
                    <Input placeholder="Masalan: USA Truck Driver" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tavsif</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Vakansiya haqida batafsil ma'lumot"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bandlik turi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tanlang" />
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
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Holat</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Qoralama</SelectItem>
                        <SelectItem value="published">Chop etilgan</SelectItem>
                        <SelectItem value="closed">Yopilgan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="salary_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maosh (dan)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value as number | string}
                        onChange={(e) => field.onChange(e.target.valueAsNumber ?? e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salary_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maosh (gacha)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value as number | string}
                        onChange={(e) => field.onChange(e.target.valueAsNumber ?? e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
            </div>

            <FormField
              control={form.control}
              name="expires_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amal qilish muddati</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Talablar</FormLabel>
              {requirementsArray.fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`requirements.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Masalan: CE toifali guvohnoma"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => requirementsArray.remove(index)}
                    disabled={requirementsArray.fields.length === 1}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => requirementsArray.append({ value: "" })}
              >
                <Plus className="mr-1 size-4" /> Talab qo'shish
              </Button>
            </div>

            <div className="space-y-2">
              <FormLabel>Vazifalar</FormLabel>
              {responsibilitiesArray.fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`responsibilities.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Masalan: Yukni xavfsiz tashish"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => responsibilitiesArray.remove(index)}
                    disabled={responsibilitiesArray.fields.length === 1}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => responsibilitiesArray.append({ value: "" })}
              >
                <Plus className="mr-1 size-4" /> Vazifa qo'shish
              </Button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Bekor qilish
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isEditMode ? "Saqlash" : "Yaratish"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}