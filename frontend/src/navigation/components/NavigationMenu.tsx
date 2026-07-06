"use client";

import { NAVIGATION } from "@/config/navigation";
import NavigationGroup from "./NavigationGroup";

import {
  SidebarContent,
} from "@/components/ui/sidebar";

export default function NavigationMenu() {
  return (
    <SidebarContent className="py-2">
      {NAVIGATION.map((group) => (
        <NavigationGroup
          key={group.id}
          group={group}
        />
      ))}
    </SidebarContent>
  );
}