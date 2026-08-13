import { Loader2, Phone, User, Wallet, FileText, MessageSquare } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useApplication } from "@/features/applications/useApplications"
import { Button } from "./ui/button"
import { useNavigate } from "react-router-dom"

const employmentLabels: Record<string, string> = {
    full_time: "To'liq stavka",
    part_time: "Yarim stavka",
}

const statusLabels: Record<string, { label: string; className: string }> = {
    pending: { label: "Kutilmoqda", className: "text-amber-700 dark:text-amber-400" },
    invited: { label: "Taklif qilingan", className: "text-emerald-700 dark:text-emerald-400" },
    rejected: { label: "Rad etilgan", className: "text-rose-700 dark:text-rose-400" },
}

interface ApplicationDetailsDialogProps {
    applicationId: number | null
    onOpenChange: (open: boolean) => void
}

export function ApplicationDetailsDialog({
    applicationId,
    onOpenChange,
}: ApplicationDetailsDialogProps) {
    const { data: application, isLoading } = useApplication(applicationId)
    const navigate = useNavigate()

    return (
        <Dialog open={!!applicationId} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Ariza tafsilotlari</DialogTitle>
                </DialogHeader>

                {isLoading && (
                    <div className="flex justify-center py-10">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {application && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{application.vacancy.title}</h3>
                            <Badge
                                variant="outline"
                                className={`border-0 ${statusLabels[application.status]?.className}`}
                            >
                                {statusLabels[application.status]?.label}
                            </Badge>
                        </div>

                        <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="size-4 text-muted-foreground" />
                                <span>{application.driver.fio ?? "Ism kiritilmagan"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="size-4 text-muted-foreground" />
                                <span>{application.driver.phone_number}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Wallet className="size-4 text-muted-foreground" />
                                <span>
                                    {application.vacancy.salary_from.toLocaleString()} –{" "}
                                    {application.vacancy.salary_to.toLocaleString()}{" "}
                                    {application.vacancy.salary_currency}
                                </span>
                            </div>
                            <div className="text-muted-foreground">
                                {employmentLabels[application.vacancy.employment_type] ??
                                    application.vacancy.employment_type}
                            </div>
                        </div>

                        {application.message && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <MessageSquare className="size-4" /> Xabar
                                </div>
                                <p className="rounded-lg bg-muted/50 p-3 text-sm">{application.message}</p>
                            </div>
                        )}

                        {application.rejection_reason && (
                            <div className="space-y-1">
                                <div className="text-sm font-medium text-rose-600">Rad etish sababi</div>
                                <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                                    {application.rejection_reason}
                                </p>
                            </div>
                        )}

                        {application.driver.resume && (
                            <Button
                                variant="outline"
                                className="w-full cursor-pointer justify-start gap-2 rounded-[4px]"
                                onClick={() => navigate(`/applications/${application.id}/resume`)}
                            >
                                <FileText className="size-4" />
                                Rezyumeni to'liq ko'rish
                            </Button>
                        )}

                        <p className="text-xs text-muted-foreground">
                            Ariza yuborilgan sana:{" "}
                            {new Date(application.applied_at).toLocaleString("uz-UZ")}
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}