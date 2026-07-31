import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar" 

// Route -> sarlavha mosligi (breadcrumb/header uchun)
// const pageTitles: Record<string, string> = {
//   "/": "Boshqaruv paneli",
//   "/loads": "Yuklar",
//   "/drivers": "Haydovchilar",
//   "/verification": "Tekshiruv",
//   "/statistics": "Statistika",
//   "/vacancies": "Vakansiyalar",
// }

export function AdminLayout() {
  // const location = useLocation()
  // const title = pageTitles[location.pathname] ?? ""

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-base font-medium">{title}</h1>
        </header> */}
        <div className="flex flex-1 flex-col gap-4 p-4 h-screen overflow-y-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}