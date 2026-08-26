import { createContext, useContext, useState } from "react"
import { Loader2 } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type FieldConfig = {
    name: string
    label?: string
    placeholder?: string
    required?: boolean
    defaultValue?: string
    multiline?: boolean
    options?: { value: string; label: string }[]
}

type ConfirmOptions = {
    title: string
    description?: React.ReactNode
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
    fields?: FieldConfig[]
    /** Berilsa, dialog so'rov tugaguncha ochiq turadi va tugma loading holatini ko'rsatadi. */
    onConfirm?: (values: Record<string, string>) => Promise<void>
}

type ConfirmResult = { confirmed: boolean; values: Record<string, string> }

type ConfirmFn = {
    (options: ConfirmOptions & { fields: FieldConfig[] }): Promise<ConfirmResult>
    (options: ConfirmOptions & { fields?: undefined }): Promise<boolean>
}

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<{
        options: ConfirmOptions
        resolve: (value: ConfirmResult) => void
    } | null>(null)
    const [values, setValues] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)

    const confirm = ((options: ConfirmOptions) => {
        return new Promise<ConfirmResult>((resolve) => {
            const initial: Record<string, string> = {}
            options.fields?.forEach((f) => {
                initial[f.name] = f.defaultValue ?? ""
            })
            setValues(initial)
            setState({ options, resolve })
        })
    }) as ConfirmFn

    const reset = () => {
        setState(null)
        setValues({})
        setLoading(false)
    }

    const handleCancel = () => {
        if (loading) return
        state?.resolve({ confirmed: false, values })
        reset()
    }

    const handleConfirm = async () => {
        if (!state) return

        if (state.options.onConfirm) {
            setLoading(true)
            try {
                await state.options.onConfirm(values)
                state.resolve({ confirmed: true, values })
                reset()
            } catch {
                // so'rov muvaffaqiyatsiz tugadi — dialog ochiq qoladi, user qayta urinishi mumkin
                setLoading(false)
            }
            return
        }

        state.resolve({ confirmed: true, values })
        reset()
    }

    const requiredMissing = state?.options.fields?.some(
        (f) => f.required && !values[f.name]?.trim()
    )
    const isConfirmDisabled = !!requiredMissing || loading

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}

            <AlertDialog
                open={!!state}
                onOpenChange={(open) => !open && handleCancel()}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{state?.options.title}</AlertDialogTitle>
                        {state?.options.description && (
                            <AlertDialogDescription>{state.options.description}</AlertDialogDescription>
                        )}
                    </AlertDialogHeader>

                    {state?.options.fields && state.options.fields.length > 0 && (
                        <div className="space-y-4 py-1">
                            {state.options.fields.map((field) => (
                                <div key={field.name} className="space-y-2">
                                    {field.label && (
                                        <Label htmlFor={`confirm-${field.name}`}>{field.label}</Label>
                                    )}

                                    {field.options ? (
                                        <Select
                                            value={values[field.name]}
                                            onValueChange={(v) =>
                                                setValues((prev) => ({ ...prev, [field.name]: v }))
                                            }
                                            disabled={loading}
                                        >
                                            <SelectTrigger id={`confirm-${field.name}`}>
                                                <SelectValue placeholder={field.placeholder} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {field.options.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : field.multiline ? (
                                        <Textarea
                                            id={`confirm-${field.name}`}
                                            value={values[field.name] ?? ""}
                                            onChange={(e) =>
                                                setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                                            }
                                            placeholder={field.placeholder}
                                            rows={3}
                                            disabled={loading}
                                        />
                                    ) : (
                                        <Input
                                            id={`confirm-${field.name}`}
                                            value={values[field.name] ?? ""}
                                            onChange={(e) =>
                                                setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                                            }
                                            placeholder={field.placeholder}
                                            disabled={loading}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel} disabled={loading}>
                            {state?.options.cancelText ?? "Bekor qilish"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault() // AlertDialogAction'ning avtomatik yopilishini oldini olish
                                handleConfirm()
                            }}
                            disabled={isConfirmDisabled}
                            className={cn(
                                state?.options.variant === "destructive" &&
                                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            )}
                        >
                            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {state?.options.confirmText ?? "Tasdiqlash"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    )
}

export function useConfirm() {
    const ctx = useContext(ConfirmContext)
    if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider")
    return ctx
}