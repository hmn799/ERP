"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/providers/AuthProvider";

import ShortcutsService, {
  EffectiveShortcut,
} from "@/services/shortcuts/shortcuts.service";

/**
 * The effective shortcut map for whoever is currently
 * using the app. Logged-in users get their role's
 * effective set (global settings + any role-level
 * exclusion). Anonymous users get the global defaults
 * with no role restrictions - the billing screen must
 * keep working without a login, per how auth is scoped
 * in this app.
 */
export function useEffectiveShortcuts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [
      "shortcuts",
      "effective",
      user?.roleId ?? "anonymous",
    ],
    queryFn: async (): Promise<EffectiveShortcut[]> => {
      if (user?.roleId) {
        return ShortcutsService.getEffective(
          user.roleId,
        );
      }

      const all = await ShortcutsService.getAll();

      return all.map((shortcut) => ({
        actionCode: shortcut.actionCode,
        label: shortcut.label,
        category: shortcut.category,
        key: shortcut.currentKey,
        actionType: shortcut.actionType,
        targetPath: shortcut.targetPath,
        enabled: shortcut.isEnabled,
      }));
    },
    staleTime: 60 * 1000,
  });
}
