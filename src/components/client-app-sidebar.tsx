import { NavLink, useLocation } from "react-router-dom"
import {
    LayoutDashboard,
    Package,
    UserRound,
    LogOut,
    ChevronsUpDown,
    MessageSquare,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/features/auth/AuthContext"
import { useUnreadStats } from "@/features/chat/useChat"
import { useUnreadChannel } from "@/features/chat/useUnreadChannel"

// Client (mijoz) paneli uchun menyu — Dashboard, Yuklar, Chat va Profil.
const navItems = [
    {
        titleKey: "clientSidebar.dashboard",
        url: "/client",
        icon: LayoutDashboard,
    },
    {
        titleKey: "clientSidebar.cargos",
        url: "/client/cargos",
        icon: Package,
    },
    {
        titleKey: "clientSidebar.chat",
        url: "/client/chat",
        icon: MessageSquare,
    },
    {
        titleKey: "clientSidebar.profile",
        url: "/client/profile",
        icon: UserRound,
    },
]

export function ClientAppSidebar() {
    const location = useLocation()
    const { user, logout } = useAuth()
    const { t } = useTranslation()
    const { data: unreadStats } = useUnreadStats()
    useUnreadChannel()

    return (
        <Sidebar className="rounded-2xl overflow-hidden" collapsible="icon">
            <SidebarHeader className="border-b bg-white">
                <SidebarMenu>
                    <SidebarMenuItem className="flex items-center justify-center">
                        <SidebarMenuButton size="lg" asChild>
                            <NavLink to="/client">
                                <div className="flex flex-1 text-left text-sm leading-tight">
                                    <img src="./logo.png" alt="logo" />
                                    <span className="truncate text-xs text-muted-foreground">
                                        {t("clientSidebar.panelName")}
                                    </span>
                                </div>
                            </NavLink>
                        </SidebarMenuButton>
                        <SidebarTrigger className="cursor-pointer" />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="bg-white">
                <SidebarGroup>
                    <SidebarGroupLabel>{t("clientSidebar.menu")}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => {
                                const isActive =
                                    item.url === "/client"
                                        ? location.pathname === "/client"
                                        : location.pathname.startsWith(item.url)

                                return (
                                    <SidebarMenuItem key={item.url}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={t(item.titleKey)}
                                        >
                                            <NavLink to={item.url}>
                                                <item.icon />
                                                <span className="flex flex-1 items-center justify-between">
                                                    {t(item.titleKey)}
                                                    {item.url === "/client/chat" && (unreadStats?.total ?? 0) > 0 && (
                                                        <Badge className="ml-2 h-4 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                                                            {unreadStats!.total}
                                                        </Badge>
                                                    )}
                                                </span>
                                            </NavLink>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t bg-white">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg">
                                            {user?.name?.slice(0, 2)?.toUpperCase() ?? "MI"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {user?.name ?? ""}
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {user?.email ?? ""}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                                side="top"
                                align="start"
                            >
                                <DropdownMenuItem onClick={logout}>
                                    <LogOut className="mr-2 size-4" />
                                    {t("clientSidebar.logout")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}
