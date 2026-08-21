import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
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

import { useEmployee, useUpdateEmployee } from "@/features/employees/useEmployees"
import type { EmployeePayload } from "@/types"

const employeeSchema = z.object({
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
  ended_at: z.string().optional(),
  notes: z.string().optional(),
})

type EmployeeFormInput = z.input<typeof employeeSchema>
type EmployeeFormValues = z.output<typeof employeeSchema>



const emptyValues: EmployeeFormValues = {
  employee_number: "",
  position: "",
  employment_type: "full_time",
  salary: 0,
  salary_currency: "USD",
  pay_period: "monthly",
  started_at: "",
  ended_at: "",
  notes: "",
}

interface EmployeeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: number | null
}

export function EmployeeFormDialog({ open, onOpenChange, employeeId }: EmployeeFormDialogProps) {
  const { data: employee, isLoading } = useEmployee(open ? employeeId : null)
  const updateMutation = useUpdateEmployee()

  const form = useForm<EmployeeFormInput, any, EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!open) return
    if (employee) {
      form.reset({
        employee_number: employee.employee_number,
        position: employee.position,
        employment_type: employee.employment_type,
        salary: Number(employee.salary),
        salary_currency: employee.salary_currency,
        pay_period: employee.pay_period,
        started_at: employee.started_at,
        ended_at: employee.ended_at ?? "",
        notes: employee.notes ?? "",
      })
    }
  }, [open, employee, form])

  const onSubmit = (values: EmployeeFormValues) => {
    if (!employeeId) return
    const payload: Partial<EmployeePayload> = {
      employee_number: values.employee_number,
      position: values.position,
      employment_type: values.employment_type,
      salary: values.salary,
      salary_currency: values.salary_currency,
      pay_period: values.pay_period,
      started_at: values.started_at,
      ended_at: values.ended_at || null,
      notes: values.notes || null,
    }
    updateMutation.mutate(
      { id: employeeId, payload },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xodimni tahrirlash</DialogTitle>
          <DialogDescription>Xodim ma'lumotlarini yangilang</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employee_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xodim raqami</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lavozim</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                  control={form.control}
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
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maosh</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
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
                <FormField
                  control={form.control}
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

              <FormField
                control={form.control}
                name="ended_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tugagan sana (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Izoh</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Saqlash
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}