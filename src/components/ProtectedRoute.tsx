import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/features/auth/AuthContext"
import type { ActorType } from "@/types"

interface ProtectedRouteProps {
  // Berilsa, faqat shu aktyor turi (carrier/client) kirgan bo'lsa Outlet ko'rsatiladi —
  // boshqa aktyor turi o'ziga tegishli bosh sahifaga qaytariladi (masalan client
  // tokeni bilan carrier'ga tegishli marshrutga kirishga urinish oldini olinadi).
  allow?: ActorType
}

export function ProtectedRoute({ allow }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  // Sahifa refresh qilinganda "/auth/me" so'rovi hali tugamagan bo'lishi mumkin —
  // shu payt isAuthenticated hali false, lekin buni "tizimga kirilmagan" deb hisoblab
  // /login ga o'tkazib yuborsak, sidebar (va undagi Pusher ulanishi) umuman
  // mount bo'lmay qoladi. Shuning uchun tekshiruv tugaguncha kutamiz.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (allow && user?.actorType !== allow) {
    return <Navigate to={user?.actorType === "client" ? "/client" : "/"} replace />
  }

  return <Outlet />
}
