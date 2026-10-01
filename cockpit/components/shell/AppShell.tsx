"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { QuickCreate } from "./QuickCreate";
import { UserMenu } from "./UserMenu";
import { Toaster } from "../ui/toast";

export function AppShell({
  children,
  user,
  badges,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; color: string };
  badges: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh">
      <Sidebar badges={badges} open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button
            onClick={() => setOpen(true)}
            className="-ml-1 rounded-md p-1.5 text-fg-2 hover:bg-surface-3 lg:hidden"
            aria-label="Menü öffnen"
          >
            <Menu className="size-5" />
          </button>
          <CommandPalette />
          <div className="ml-auto flex items-center gap-2">
            <QuickCreate />
            <UserMenu user={user} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
