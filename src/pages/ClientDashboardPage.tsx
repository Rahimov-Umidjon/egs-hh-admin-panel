import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Package, UserRound } from "lucide-react"

import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

// Mijoz (Client) paneli uchun boshlang'ich sahifa — login paytida aktyor turi
// aniqlanib, mijoz sifatida kirilgach shu yerga yo'naltiriladi. To'liq mijoz
// paneli (yuklar, kuzatuv, hujjatlar va h.k.) keyingi bosqichda dizayn
// asosida qo'shiladi.
export default function ClientDashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {t("client.dashboard_welcome_title", { name: user?.name ?? "" })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("client.dashboard_welcome_subtitle")}
          </p>
        </div>
        <LanguageSwitcher />
      </div>

      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Package className="size-8" />
        </div>

        <div className="flex gap-3">
          <Button asChild>
            <Link to="/client/cargos">
              <Package className="mr-2 size-4" />
              {t("clientSidebar.cargos")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/client/profile">
              <UserRound className="mr-2 size-4" />
              {t("clientProfile.title")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
