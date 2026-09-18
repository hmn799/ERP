"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import CompanyService from "@/services/company/company.service";

/*
 * The shop's own profile - name, GSTIN, address, phone - shown on
 * every printed sale receipt. Singleton: there is exactly one
 * profile per install, so this page always edits "the" company
 * rather than picking one from a list.
 */
export default function CompanySettingsPage() {
  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [receiptFontSize, setReceiptFontSize] =
    useState(13);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const profile =
          await CompanyService.getProfile();

        if (cancelled || !profile) {
          return;
        }

        setName(profile.name ?? "");
        setGstin(profile.gstin ?? "");
        setAddress(profile.address ?? "");
        setPhone(profile.phone ?? "");
        setEmail(profile.email ?? "");
        setReceiptFontSize(
          profile.receiptFontSize ?? 13,
        );
      } catch (error) {
        console.error(
          "Failed to load company profile:",
          error,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (!name.trim()) {
      toast.error(
        "Shop name is required.",
      );
      return;
    }

    try {
      setSaving(true);

      await CompanyService.updateProfile({
        name: name.trim(),
        gstin: gstin.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        receiptFontSize,
      });

      toast.success(
        "Company profile saved.",
      );
    } catch (error) {
      console.error(
        "Failed to save company profile:",
        error,
      );

      toast.error(
        "Failed to save company profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          Company Profile
        </h2>

        <p className="text-sm text-gray-500">
          Shown on every printed sale receipt.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border bg-white p-5 shadow-sm">
        <div className="space-y-2">
          <Label required>Shop Name</Label>
          <Input
            value={name}
            disabled={saving}
            placeholder="Your shop name"
            onChange={(event) =>
              setName(event.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label>GSTIN</Label>
          <Input
            value={gstin}
            disabled={saving}
            placeholder="22AAAAA0000A1Z5"
            onChange={(event) =>
              setGstin(event.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Address</Label>
          <Input
            value={address}
            disabled={saving}
            placeholder="Shop address"
            onChange={(event) =>
              setAddress(event.target.value)
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={phone}
              disabled={saving}
              placeholder="Phone number"
              onChange={(event) =>
                setPhone(event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={email}
              disabled={saving}
              placeholder="Email address"
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />
          </div>
        </div>

      </div>

      <div>
        <h2 className="text-lg font-semibold">
          Receipt Print Settings
        </h2>

        <p className="text-sm text-gray-500">
          Controls the text size on the printed 3-inch sale
          receipt.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border bg-white p-5 shadow-sm">
        <div className="space-y-2">
          <Label>Receipt Font Size</Label>

          <select
            value={receiptFontSize}
            disabled={saving}
            onChange={(event) =>
              setReceiptFontSize(
                Number(event.target.value),
              )
            }
            className="h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          >
            <option value={11}>
              Small
            </option>
            <option value={13}>
              Medium (Default)
            </option>
            <option value={15}>
              Large
            </option>
            <option value={17}>
              Extra Large
            </option>
          </select>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
