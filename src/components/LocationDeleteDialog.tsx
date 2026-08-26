import { useTranslation } from "react-i18next"

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

import type { CompanyLocation } from "@/types"
import { useDeleteLocation } from "@/features/profile"

interface LocationDeleteDialogProps {
  location: CompanyLocation | null
  onOpenChange: (open: boolean) => void
}

export function LocationDeleteDialog({
  location,
  onOpenChange,
}: LocationDeleteDialogProps) {
  const { t } = useTranslation()
  const deleteLocation = useDeleteLocation()

  const handleConfirm = () => {
    if (!location) return
    deleteLocation.mutate(location.id, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <AlertDialog open={!!location} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("locationDeleteDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("locationDeleteDialog.description", { name: location?.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteLocation.isPending}>
            {t("locationDeleteDialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteLocation.isPending}
            className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600"
          >
            {t("locationDeleteDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}