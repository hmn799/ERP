"use client";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { NAVIGATION } from "@/config/navigation";

/*
 * Every feature in the app is already described once, in
 * NAVIGATION (the sidebar's own data) - rendering the dashboard's
 * quick-access grid from that same source means a feature added to
 * the sidebar later shows up here automatically, with nothing to
 * keep in sync by hand. The "Dashboard" group itself is skipped
 * since we're already on it.
 */
export default function QuickAccess() {
  const groups = NAVIGATION.filter(
    (group) => group.id !== "dashboard",
  );

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">
        Quick Access
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => {
          const Icon = group.icon;

          return (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {group.title}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {group.children.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="rounded-md border px-2.5 py-1 text-xs hover:bg-muted"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
