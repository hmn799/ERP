"use client";

import { ReactNode } from "react";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import AppSidebar from "@/navigation/AppSidebar";
import AppHeader from "@/navigation/AppHeader";

interface ERPLayoutProps {
  children: ReactNode;
}

export default function ERPLayout({
  children,
}: ERPLayoutProps) {
  return (
    <SidebarProvider defaultOpen>

      <AppSidebar />

      <SidebarInset>

        <AppHeader />

        <main className="flex-1 overflow-auto bg-muted/20 p-6">
          {children}
        </main>

      </SidebarInset>

    </SidebarProvider>
  );
}