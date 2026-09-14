import { NavLink, useLocation } from "react-router-dom"
import {
    LayoutDashboard,
    Users,
    BarChart3,
    Briefcase,
    LogOut,
    ChevronsUpDown,
    FileUser,
    ShieldCheck,
    MessageSquare,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useUnreadStats } from "@/features/chat/useChat"
import { useUnreadChannel } from "@/features/chat/useUnreadChannel"
import { Badge } from "@/components/ui/badge"

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
import { useAuth } from "@/features/auth/AuthContext"

// Menyu elementlari — loyihangizdagi route'larga mos
const navItems = [
    {
        titleKey: "sidebar.dashboard",
        url: "/",
        icon: LayoutDashboard,
    },
    {
        titleKey: "sidebar.vehicles",
        url: "/vehicles",
        icon: Users,
    },
    {
        titleKey: "sidebar.employees",
        url: "/employees",
        icon: ShieldCheck,
    },
    {
        titleKey: "sidebar.vacancies",
        url: "/vacancies",
        icon: Briefcase,
    },
    {
        titleKey: "sidebar.applications",
        url: "/aplications",
        icon: FileUser,
    },
    {
        titleKey: "sidebar.chat",
        url: "/chat",
        icon: MessageSquare,
    },
    {
        titleKey: "sidebar.profile",
        url: "/profile",
        icon: BarChart3,
    },
]

export function AppSidebar() {
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
                            <NavLink to="/">
                                <div className="flex flex-1 text-left text-sm leading-tight">
                                    <img src="./logo.png" alt="logo" />
                                    <span className="truncate text-xs text-muted-foreground">
                                        {t("sidebar.adminPanel")}
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
                    <SidebarGroupLabel>{t("sidebar.menu")}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => {
                                const isActive =
                                    item.url === "/"
                                        ? location.pathname === "/"
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
                                                    {item.url === "/chat" && (unreadStats?.total ?? 0) > 0 && (
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
                                            {user?.name?.slice(0, 2)?.toUpperCase() ?? "AD"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {user?.name ?? "Administrator"}
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
                                    {t("sidebar.logout")}
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