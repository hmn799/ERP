"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import ShortcutsService from "@/services/shortcuts/shortcuts.service";
import { ROUTES } from "@/config/routes";

interface CreateShortcutDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  onSuccess(): void;
}

const PAGE_OPTIONS = Object.entries(ROUTES).map(
  ([key, path]) => ({
    label: key
      .toLowerCase()
      .split("_")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" "),
    path,
  }),
);

export default function CreateShortcutDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateShortcutDialogProps) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("");
  const [targetPath, setTargetPath] = useState<string>(
    PAGE_OPTIONS[0]?.path ?? "",
  );
  const [key, setKey] = useState("");
  const [listening, setListening] = useState(false);
  const [saving, setSaving] = useState(false);

  function reset() {
    setLabel("");
    setCategory("");
    setTargetPath(PAGE_OPTIONS[0]?.path ?? "");
    setKey("");
  }

  function startListening() {
    setListening(true);

    function onKeyDown(event: KeyboardEvent) {
      event.preventDefault();

      if (
        ["Control", "Alt", "Shift", "Meta"].includes(
          event.key,
        )
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
      setKey(parts.join("+"));
    }

    window.addEventListener("keydown", onKeyDown, true);
  }

  async function handleSubmit() {
    if (!label.trim()) {
      toast.error("Enter a name for this shortcut.");
      return;
    }

    if (!key) {
      toast.error("Record a key combination.");
      return;
    }

    if (!targetPath) {
      toast.error("Choose a page to jump to.");
      return;
    }

    try {
      setSaving(true);

      await ShortcutsService.create({
        label: label.trim(),
        category: category.trim() || undefined,
        key,
        targetPath,
      });

      toast.success(`Shortcut "${label}" created.`);
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        "Failed to create shortcut.";

      toast.error(
        Array.isArray(message)
          ? message.join(", ")
          : message,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title="New Shortcut"
      loading={saving}
      onClose={() => {
        reset();
        onOpenChange(false);
      }}
      onSubmit={handleSubmit}
    >
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input
          value={label}
          placeholder="e.g. Jump to Purchase"
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Category (optional)</Label>
        <Input
          value={category}
          placeholder="Navigation"
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Jump to Page</Label>
        <select
          value={targetPath}
          onChange={(e) => setTargetPath(e.target.value)}
          className="w-full rounded border bg-white px-2 py-2 text-sm outline-none focus:border-black"
        >
          {PAGE_OPTIONS.map((option) => (
            <option key={option.path} value={option.path}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Key</Label>
        <Button
          type="button"
          variant="outline"
          className="w-full font-mono"
          onClick={startListening}
        >
          {listening
            ? "Press a key..."
            : key || "Click and press a key"}
        </Button>
      </div>
    </ERPFormDialog>
  );
}
