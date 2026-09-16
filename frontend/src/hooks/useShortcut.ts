"use client";

import { useEffect } from "react";

import { useEffectiveShortcuts } from "./useEffectiveShortcuts";

/**
 * True if a KeyboardEvent matches a normalized key
 * combination like "F6" or "Ctrl+Shift+I" (as returned by
 * the shortcut registry - modifiers first, in Ctrl/Alt/Shift
 * order, then the key).
 */
function eventMatchesKey(
  event: KeyboardEvent,
  key: string,
): boolean {
  const parts = key.split("+").map((p) => p.trim());
  const mainKey = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  if (
    event.ctrlKey !== modifiers.includes("Ctrl")
  ) {
    return false;
  }

  if (event.altKey !== modifiers.includes("Alt")) {
    return false;
  }

  if (
    event.shiftKey !== modifiers.includes("Shift")
  ) {
    return false;
  }

  return (
    event.key.toUpperCase() ===
    mainKey.toUpperCase()
  );
}

/**
 * Fires `handler` when the user presses whatever key is
 * currently bound to `actionCode` in the shortcut
 * registry - respecting global enable/disable and the
 * current user's role eligibility. Does nothing while the
 * registry is still loading or the action is disabled.
 */
export function useShortcut(
  actionCode: string,
  handler: (event: KeyboardEvent) => void,
  options?: { enabled?: boolean },
) {
  const { data: shortcuts } =
    useEffectiveShortcuts();

  const active = options?.enabled ?? true;

  useEffect(() => {
    if (!active || !shortcuts) {
      return;
    }

    const shortcut = shortcuts.find(
      (s) => s.actionCode === actionCode,
    );

    if (!shortcut || !shortcut.enabled) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (
        eventMatchesKey(event, shortcut!.key)
      ) {
        event.preventDefault();
        handler(event);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionCode, active, shortcuts, handler]);
}
