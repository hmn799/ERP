"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Bell,
  Search,
  Settings,
  UserCircle2,
} from "lucide-react";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background">

      <div className="flex h-16 items-center justify-between px-5">

        <div className="flex items-center gap-3">

          <SidebarTrigger />

          <div className="relative w-96">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Search items, customers, bills..."
              className="pl-10"
            />

          </div>

        </div>

        <div className="flex items-center gap-2">

          <Button
            variant="ghost"
            size="icon"
          >
            <Bell className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
          >
            <Settings className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            className="gap-2"
          >
            <UserCircle2 className="h-5 w-5" />

            Administrator
          </Button>

        </div>

      </div>

    </header>
  );
}