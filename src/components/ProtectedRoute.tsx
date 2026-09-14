import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/features/auth/AuthContext"

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
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

  return <Outlet />
}
