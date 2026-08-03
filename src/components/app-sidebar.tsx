import { NavLink, useLocation } from "react-router-dom"
import {
    LayoutDashboard,
    Truck,
    Users,
    ShieldCheck,
    BarChart3,
    Briefcase,
    LogOut,
    ChevronsUpDown,
} from "lucide-react"

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
        title: "Boshqaruv paneli",
        url: "/",
        icon: LayoutDashboard,
    },
    // {
    //     title: "Yuklar",
    //     url: "/loads",
    //     icon: Truck,
    // },
    {
        title: "Haydovchilar",
        url: "/drivers",
        icon: Users,
    },
    // {
    //     title: "Tekshiruv",
    //     url: "/verification",
    //     icon: ShieldCheck,
    // },

    {
        title: "Vakansiyalar",
        url: "/vacancies",
        icon: Briefcase,
    },
    {
        title: "Profile",
        url: "/profile",
        icon: BarChart3,
    },
]

export function AppSidebar() {
    const location = useLocation()
    const { user, logout } = useAuth()

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
                                        Admin panel
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
                    <SidebarGroupLabel>Menyu</SidebarGroupLabel>
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
                                            tooltip={item.title}
                                        >
                                            <NavLink to={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
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
                                    Chiqish
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