"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/providers/AuthProvider";

import {
  Bell,
  Search,
  Settings,
  UserCircle2,
} from "lucide-react";

export default function AppHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

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

          {user ? (
            <div className="relative">
              <Button
                variant="ghost"
                className="gap-2"
                onClick={() =>
                  setMenuOpen((current) => !current)
                }
              >
                <UserCircle2 className="h-5 w-5" />

                {user.fullName}
              </Button>

              {menuOpen && (
                <div className="absolute right-0 z-50 mt-1 w-48 rounded-md border bg-background p-2 shadow-md">
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    {user.roleName}
                  </div>

                  <button
                    type="button"
                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                      router.push("/login");
                    }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => router.push("/login")}
            >
              <UserCircle2 className="h-5 w-5" />

              Log in
            </Button>
          )}

        </div>

      </div>

    </header>
  );
}