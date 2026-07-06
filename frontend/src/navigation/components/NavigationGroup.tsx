"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import type { NavigationGroup as NavigationGroupType } from "@/config/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface NavigationGroupProps {
  group: NavigationGroupType;
}

export default function NavigationGroup({
  group,
}: NavigationGroupProps) {
  const pathname = usePathname();

  const [open, setOpen] = useState(group.defaultOpen ?? false);

  const Icon = group.icon;

  return (
    <SidebarGroup>
      <SidebarGroupLabel
        className="cursor-pointer"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span>{group.title}</span>
          </div>

          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </SidebarGroupLabel>

      {open && (
        <SidebarGroupContent>
          <SidebarMenu>
            {group.children.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}