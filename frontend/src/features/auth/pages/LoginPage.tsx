"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-background p-8 shadow-sm">
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
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Username
            </label>

            <Input
              autoFocus
              value={username}
              disabled={loading}
              onChange={(e) =>
                setUsername(e.target.value)
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Password
            </label>

            <Input
              type="password"
              value={password}
              disabled={loading}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
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
  );
}
