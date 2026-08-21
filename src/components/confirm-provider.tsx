import { createContext, useContext, useState } from "react"
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
import { cn } from "@/lib/utils"

type InputConfig = {
    label?: string
    placeholder?: string
    required?: boolean
    defaultValue?: string
    multiline?: boolean
}

type ConfirmOptions = {
    title: string
    description?: React.ReactNode
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
    input?: InputConfig
}

type ConfirmResult = { confirmed: boolean; value: string }

// Ikkita overload: input bo'lsa {confirmed, value} qaytaradi, bo'lmasa oddiy boolean
type ConfirmFn = {
    (options: ConfirmOptions & { input: InputConfig }): Promise<ConfirmResult>
    (options: ConfirmOptions & { input?: undefined }): Promise<boolean>
}

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<{
        options: ConfirmOptions
        resolve: (value: ConfirmResult) => void
    } | null>(null)
    const [inputValue, setInputValue] = useState("")

    const confirm = ((options: ConfirmOptions) => {
        return new Promise<ConfirmResult>((resolve) => {
            setInputValue(options.input?.defaultValue ?? "")
            setState({ options, resolve })
        })
    }) as ConfirmFn

    const handleClose = (confirmed: boolean) => {
        state?.resolve({ confirmed, value: inputValue })
        setState(null)
        setInputValue("")
    }

    const requiresInput = !!state?.options.input?.required
    const isConfirmDisabled = requiresInput && !inputValue.trim()

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}

            <AlertDialog open={!!state} onOpenChange={(open) => !open && handleClose(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{state?.options.title}</AlertDialogTitle>
                        {state?.options.description && (
                            <AlertDialogDescription>{state.options.description}</AlertDialogDescription>
                        )}
                    </AlertDialogHeader>

                    {state?.options.input && (
                        <div className="space-y-2 py-1">
                            {state.options.input.label && (
                                <Label htmlFor="confirm-input">{state.options.input.label}</Label>
                            )}
                            {state.options.input.multiline ? (
                                <Textarea
                                    id="confirm-input"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={state.options.input.placeholder}
                                    autoFocus
                                    rows={3}
                                />
                            ) : (
                                <Input
                                    id="confirm-input"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={state.options.input.placeholder}
                                    autoFocus
                                />
                            )}
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => handleClose(false)}>
                            {state?.options.cancelText ?? "Bekor qilish"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleClose(true)}
                            disabled={isConfirmDisabled}
                            className={cn(
                                state?.options.variant === "destructive" &&
                                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            )}
                        >
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