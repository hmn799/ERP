"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useEffectiveShortcuts } from "./useEffectiveShortcuts";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;

  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

function eventMatchesKey(
  event: KeyboardEvent,
  key: string,
) {
  const parts = key.split("+").map((p) => p.trim());
  const mainKey = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  if (event.ctrlKey !== modifiers.includes("Ctrl")) {
    return false;
  }

  if (event.altKey !== modifiers.includes("Alt")) {
    return false;
  }

  if (event.shiftKey !== modifiers.includes("Shift")) {
    return false;
  }

  return (
    event.key.toUpperCase() === mainKey.toUpperCase()
  );
}

/*
 * One shared listener for every admin-created "jump to page"
 * shortcut (Shortcut.actionType === "NAVIGATE"), mounted once in
 * the root layout so a new shortcut works app-wide the instant
 * it's created - no per-page wiring needed, unlike the SYSTEM
 * shortcuts driven by useShortcut(). Ignored while the user is
 * typing anywhere, since an admin could assign a plain letter key.
 */
export function useGlobalNavigationShortcuts() {
  const router = useRouter();
  const { data: shortcuts } = useEffectiveShortcuts();

  useEffect(() => {
    if (!shortcuts) {
      return;
    }

    const navShortcuts = shortcuts.filter(
      (s) =>
        s.enabled &&
        s.actionType === "NAVIGATE" &&
        s.targetPath,
    );

    if (navShortcuts.length === 0) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        return;
      }

      const match = navShortcuts.find((s) =>
        eventMatchesKey(event, s.key),
      );

      if (!match?.targetPath) {
        return;
      }

      event.preventDefault();
      router.push(match.targetPath);
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [shortcuts, router]);
}
