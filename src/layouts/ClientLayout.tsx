import { Outlet } from "react-router-dom"
import { ClientAppSidebar } from "@/components/client-app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export function ClientLayout() {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <ClientAppSidebar />
      <SidebarInset>
        <div className="flex flex-col gap-4 p-4 h-screen overflow-y-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
