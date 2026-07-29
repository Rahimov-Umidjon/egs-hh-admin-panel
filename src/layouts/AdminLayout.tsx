import { NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Package,
  Truck,
  ShieldCheck,
  BarChart3,
  Briefcase,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"

const navItems = [
  { to: "/", label: "Bosh sahifa", icon: LayoutDashboard, end: true },
  { to: "/loads", label: "Yuklar", icon: Package },
  { to: "/drivers", label: "Vaditellar", icon: Truck },
  { to: "/verification", label: "Verifikatsiya", icon: ShieldCheck },
  { to: "/statistics", label: "Statistika", icon: BarChart3 },
  { to: "/vacancies", label: "Vakansiyalar", icon: Briefcase },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="flex w-60 shrink-0 flex-col justify-between border-r bg-card px-3 py-4">
        <div>
          <div className="mb-6 px-2">
            <h1 className="text-base font-semibold">Logistika Admin</h1>
            <p className="text-xs text-muted-foreground">Boshqaruv paneli</p>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t pt-3">
          {user && (
            <div className="px-2 text-xs">
              <p className="truncate font-medium">{user.name}</p>
              <p className="truncate text-muted-foreground">{user.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
