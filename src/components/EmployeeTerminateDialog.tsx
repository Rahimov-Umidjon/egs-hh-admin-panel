import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, AlertTriangle } from "lucide-react"
import { z } from "zod"
import { useTranslation } from "react-i18next"

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
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useUpdateEmployee } from "@/features/employees/useEmployees"
import type { EmployeeTerminatePayload } from "@/types"

const terminationSchema = z.object({
    termination_type: z.enum([
        "resigned",
        "fired",
        "contract_expired",
        "mutual_agreement",
        "other",
    ]),
    termination_reason: z.string().min(3),
})

type TerminationFormValues = z.infer<typeof terminationSchema>

const terminationTypeKeys: TerminationFormValues["termination_type"][] = [
    "resigned",
    "fired",
    "contract_expired",
    "mutual_agreement",
    "other",
]

interface EmployeeTerminateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employeeId: number | null
    employeeName?: string
}

export function EmployeeTerminateDialog({
    open,
    onOpenChange,
    employeeId,
    employeeName,
}: EmployeeTerminateDialogProps) {
    const { t } = useTranslation()
    const updateMutation = useUpdateEmployee()
    const [confirmStep, setConfirmStep] = useState(false)

    // zod xato xabarini t() bilan olib kelamiz (schema statik bo'lgani uchun
    // resolver darajasida emas, submit paytida tekshiramiz)
    const form = useForm<TerminationFormValues>({
        resolver: zodResolver(terminationSchema),
        defaultValues: {
            termination_type: "resigned",
            termination_reason: "",
        },
    })

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            form.reset()
            setConfirmStep(false)
        }
        onOpenChange(isOpen)
    }

    const onSubmit = (values: TerminationFormValues) => {
        if (!employeeId) return
        if (!confirmStep) {
            setConfirmStep(true)
            return
        }
        const payload: EmployeeTerminatePayload = {
            status: "ended",
            termination_type: values.termination_type,
            termination_reason: values.termination_reason,
        }
        updateMutation.mutate(
            { id: employeeId, payload },
            { onSuccess: () => handleClose(false) }
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-rose-600">
                        <AlertTriangle className="size-5" />
                        {t("employeeTerminateDialog.title")}
                    </DialogTitle>
                    <DialogDescription>
                        {employeeName
                            ? t("employeeTerminateDialog.descriptionWithName", { name: employeeName })
                            : t("employeeTerminateDialog.descriptionGeneric")}{" "}
                        {t("employeeTerminateDialog.descriptionSuffix")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="termination_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("employeeTerminateDialog.typeLabel")}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {terminationTypeKeys.map((value) => (
                                                <SelectItem key={value} value={value}>
                                                    {t(`employees.terminationTypes.${value}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="termination_reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("employeeTerminateDialog.reasonLabel")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={3}
                                            placeholder={t("employeeTerminateDialog.reasonPlaceholder")}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {confirmStep && (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                                {t("employeeTerminateDialog.confirmWarning")}
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                                {t("employeeTerminateDialog.cancel")}
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending && (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                )}
                                {confirmStep
                                    ? t("employeeTerminateDialog.confirmSecond")
                                    : t("employeeTerminateDialog.confirmFirst")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}