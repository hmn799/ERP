"use client";

import { useEffect, useMemo, useState } from "react";
import { Keyboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

import { useEffectiveShortcuts } from "@/hooks/useEffectiveShortcuts";

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

/*
 * Header button (and "?" key, like most web apps use for this)
 * that opens a cheat-sheet of every shortcut the current user can
 * actually use right now - reads the same effective-shortcuts data
 * every useShortcut() call checks, so it never drifts from what
 * actually fires.
 */
export default function ShortcutsHelpSheet() {
  const [open, setOpen] = useState(false);
  const { data: shortcuts = [] } = useEffectiveShortcuts();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        return;
      }

      if (
        event.key === "?" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () =>
      window.removeEventListener("keydown", onKeyDown);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      typeof shortcuts
    >();

    for (const shortcut of shortcuts) {
      if (!shortcut.enabled) continue;

      const category = shortcut.category ?? "General";

      if (!map.has(category)) {
        map.set(category, []);
      }

      map.get(category)!.push(shortcut);
    }

    return Array.from(map.entries());
  }, [shortcuts]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        title="Keyboard shortcuts (?)"
        onClick={() => setOpen(true)}
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-96">
          <SheetHeader>
            <SheetTitle>Keyboard Shortcuts</SheetTitle>
            <SheetDescription>
              Every shortcut you can use right now. Press{" "}
              <span className="font-mono">?</span> anytime
              to toggle this panel.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 overflow-y-auto px-4 pb-6">
            {grouped.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No shortcuts are available to you.
              </div>
            )}

            {grouped.map(([category, items]) => (
              <div key={category} className="space-y-2">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  {category}
                </div>

                <div className="space-y-1.5">
                  {items.map((shortcut) => (
                    <div
                      key={shortcut.actionCode}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-sm">
                        {shortcut.label}
                      </span>

                      <Badge
                        variant="outline"
                        className="font-mono"
                      >
                        {shortcut.key}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
