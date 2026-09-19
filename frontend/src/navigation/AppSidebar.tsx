"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";

import NavigationMenu from "./components/NavigationMenu";

import {
  Building2,
  UserCircle2,
} from "lucide-react";

export default function AppSidebar() {
  return (
    <Sidebar collapsible="icon">

      <SidebarHeader className="border-b border-sidebar-border">

        <div className="flex items-center gap-3 p-2">

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">

            <Building2 className="h-6 w-6" />

          </div>

          <div className="flex flex-col">

            <span className="font-semibold text-sidebar-foreground">
              ERP Pro
            </span>

            <span className="text-xs text-sidebar-foreground/60">
              Business Management
            </span>

          </div>

        </div>

      </SidebarHeader>

      <SidebarContent>

        <NavigationMenu />

      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">

        <div className="flex items-center gap-3 p-2">

          <UserCircle2 className="h-9 w-9 text-sidebar-foreground/80" />

          <div className="flex flex-col">

            <span className="text-sm font-medium text-sidebar-foreground">
              Administrator
            </span>

            <span className="text-xs text-sidebar-foreground/60">
              admin@erp.local
            </span>

          </div>

        </div>

      </SidebarFooter>

    </Sidebar>
  );
}