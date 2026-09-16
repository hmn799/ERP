"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import ShortcutsService from "@/services/shortcuts/shortcuts.service";
import RoleService from "@/services/role/role.service";

import ShortcutRow from "../components/ShortcutRow";

export default function ShortcutsPage() {
  const {
    data: shortcuts = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["shortcuts", "admin"],
    queryFn: ShortcutsService.getAll,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: RoleService.getAll,
  });

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      typeof shortcuts
    >();

    for (const shortcut of shortcuts) {
      const category =
        shortcut.category ?? "General";

      if (!map.has(category)) {
        map.set(category, []);
      }

      map.get(category)!.push(shortcut);
    }

    return Array.from(map.entries());
  }, [shortcuts]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Keyboard Shortcuts
        </h1>

        <p className="text-sm text-muted-foreground">
          Rebind keys, enable or disable actions, and
          control which roles can use each shortcut.
          Click a key to record a new one.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">
          Loading...
        </div>
      ) : (
        grouped.map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>

            <CardContent>
              {items.map((shortcut) => (
                <ShortcutRow
                  key={shortcut.id}
                  shortcut={shortcut}
                  roles={roles}
                  onChanged={refetch}
                />
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
