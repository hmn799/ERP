"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ShieldCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    setError(null);
    setLoading(true);

    try {
      await login(username, password);

      router.push("/dashboard");
    } catch (err) {
      setError(
        "Invalid username or password.",
      );

      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 15%, var(--sidebar-primary) 0%, transparent 45%), radial-gradient(circle at 85% 85%, var(--sidebar-primary) 0%, transparent 40%)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>

          <div className="flex flex-col">
            <span className="font-semibold">
              Muljibhai Harjibhai ERP
            </span>

            <span className="text-xs text-sidebar-foreground/60">
              Wholesale &amp; Retail Management
            </span>
          </div>
        </div>

        <div className="relative max-w-md space-y-4">
          <h2 className="text-3xl leading-tight font-bold text-balance">
            Everything your business runs on, in one place.
          </h2>

          <p className="text-sm text-sidebar-foreground/70">
            Sales, purchases, stock, ledgers, and GST reporting &mdash;
            kept in sync from billing counter to balance sheet.
          </p>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-sidebar-foreground/60">
          <ShieldCheck className="h-4 w-4" />
          Role-based access &middot; Audit logged &middot; Encrypted backups
        </div>
      </div>

      <div className="flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>

            <span className="font-semibold">
              Muljibhai Harjibhai ERP
            </span>
          </div>

          <h1 className="text-xl font-bold">
            Sign in
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Log in for rate overrides, discounts, and
            cancellations.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={handleSubmit}
          >
            <div className="space-y-1.5">
              <Label htmlFor="login-username">
                Username
              </Label>

              <Input
                id="login-username"
                autoFocus
                value={username}
                disabled={loading}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password">
                Password
              </Label>

              <Input
                id="login-password"
                type="password"
                value={password}
                disabled={loading}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
