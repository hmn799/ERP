"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import ShortcutsService, {
  Shortcut,
} from "@/services/shortcuts/shortcuts.service";

import type { Role } from "@/services/role/role.service";

interface ShortcutRowProps {
  shortcut: Shortcut;
  roles: Role[];
  onChanged(): void;
}

export default function ShortcutRow({
  shortcut,
  roles,
  onChanged,
}: ShortcutRowProps) {
  const [listening, setListening] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function startListening() {
    setListening(true);

    function onKeyDown(event: KeyboardEvent) {
      event.preventDefault();

      // A bare modifier isn't a usable combination on
      // its own - wait for the real key.
      if (
        [
          "Control",
          "Alt",
          "Shift",
          "Meta",
        ].includes(event.key)
      ) {
        return;
      }

      const parts: string[] = [];
      if (event.ctrlKey) parts.push("Ctrl");
      if (event.altKey) parts.push("Alt");
      if (event.shiftKey) parts.push("Shift");
      parts.push(event.key.toUpperCase());

      window.removeEventListener(
        "keydown",
        onKeyDown,
        true,
      );

      setListening(false);
      saveKey(parts.join("+"));
    }

    window.addEventListener(
      "keydown",
      onKeyDown,
      true,
    );
  }

  async function saveKey(currentKey: string) {
    try {
      setSaving(true);

      await ShortcutsService.update(shortcut.id, {
        currentKey,
      });

      toast.success(
        `${shortcut.label} rebound to ${currentKey}.`,
      );

      onChanged();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        "Failed to rebind shortcut.";

      toast.error(
        Array.isArray(message)
          ? message.join(", ")
          : message,
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(isEnabled: boolean) {
    try {
      await ShortcutsService.update(shortcut.id, {
        isEnabled,
      });

      onChanged();
    } catch (error) {
      console.error(error);
      toast.error(
        "Failed to update shortcut state.",
      );
    }
  }

  async function resetToDefault() {
    try {
      await ShortcutsService.resetToDefault(
        shortcut.id,
      );

      toast.success(
        `${shortcut.label} reset to ${shortcut.defaultKey}.`,
      );

      onChanged();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        "Failed to reset shortcut.";

      toast.error(
        Array.isArray(message)
          ? message.join(", ")
          : message,
      );
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Delete the "${shortcut.label}" shortcut?`,
      )
    ) {
      return;
    }

    try {
      await ShortcutsService.remove(shortcut.id);
      toast.success(`"${shortcut.label}" deleted.`);
      onChanged();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        "Failed to delete shortcut.";

      toast.error(
        Array.isArray(message)
          ? message.join(", ")
          : message,
      );
    }
  }

  async function toggleRole(
    roleId: string,
    enabledForRole: boolean,
  ) {
    try {
      if (enabledForRole) {
        await ShortcutsService.setRoleOverride(
          shortcut.id,
          roleId,
          false,
        );
      } else {
        await ShortcutsService.removeRoleOverride(
          shortcut.id,
          roleId,
        );
      }

      onChanged();
    } catch (error) {
      console.error(error);
      toast.error(
        "Failed to update role eligibility.",
      );
    }
  }

  const excludedRoleIds = new Set(
    shortcut.roleOverrides
      .filter((o) => !o.isEnabled)
      .map((o) => o.roleId),
  );

  return (
    <div className="border-b py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-48 flex-1">
          <div className="font-medium">
            {shortcut.label}
          </div>

          <div className="text-xs text-muted-foreground">
            {shortcut.actionType === "NAVIGATE" &&
            shortcut.targetPath
              ? `Jumps to ${shortcut.targetPath}`
              : shortcut.actionCode}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={saving}
          onClick={startListening}
          className="min-w-32 font-mono"
        >
          {listening
            ? "Press a key..."
            : shortcut.currentKey}
        </Button>

        {shortcut.currentKey !==
          shortcut.defaultKey && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetToDefault}
          >
            Reset
          </Button>
        )}

        <div className="flex items-center gap-2">
          <Switch
            checked={shortcut.isEnabled}
            onCheckedChange={toggleEnabled}
          />

          <span className="text-xs text-muted-foreground">
            {shortcut.isEnabled
              ? "Enabled"
              : "Disabled"}
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            setRolesOpen((current) => !current)
          }
        >
          Roles
          {excludedRoleIds.size > 0 && (
            <Badge
              variant="secondary"
              className="ml-1.5"
            >
              {excludedRoleIds.size} excluded
            </Badge>
          )}
        </Button>

        {shortcut.actionType === "NAVIGATE" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={handleDelete}
          >
            Delete
          </Button>
        )}
      </div>

      {rolesOpen && (
        <div className="mt-2 flex flex-wrap gap-3 rounded-md border bg-muted/30 p-3">
          {roles.map((role) => {
            const enabledForRole =
              !excludedRoleIds.has(role.id);

            return (
              <label
                key={role.id}
                className="flex items-center gap-2 text-sm"
              >
                <Switch
                  checked={enabledForRole}
                  onCheckedChange={() =>
                    toggleRole(
                      role.id,
                      enabledForRole,
                    )
                  }
                />
                {role.name}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
