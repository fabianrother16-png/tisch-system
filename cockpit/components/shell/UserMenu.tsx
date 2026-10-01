"use client";

import { useEffect, useState } from "react";
import { LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { Dropdown, DropdownItem } from "../ui/Dropdown";
import { Avatar } from "../ui/Avatar";
import { logoutAction } from "@/lib/actions/auth";

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  try {
    if (theme === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", theme);
  } catch {}
}

export function UserMenu({ user }: { user: { name: string; email: string; color: string } }) {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    try {
      const t = localStorage.getItem("theme");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- einmaliges Lesen aus localStorage
      if (t === "light" || t === "dark") setTheme(t);
    } catch {}
  }, []);
  const choose = (t: Theme) => {
    setTheme(t);
    applyTheme(t);
  };
  return (
    <Dropdown
      trigger={({ toggle }) => (
        <button onClick={toggle} className="rounded-full ring-offset-2 ring-offset-bg hover:ring-2 hover:ring-line-strong" aria-label="Benutzermenü">
          <Avatar name={user.name} color={user.color} size="sm" />
        </button>
      )}
      className="w-64"
    >
      {(close) => (
        <>
          <div className="px-2.5 py-2">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <div className="my-1 border-t border-line" />
          <div className="px-2.5 py-1.5">
            <p className="mb-1.5 text-xs text-muted">Darstellung</p>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-3 p-0.5">
              {(
                [
                  ["light", "Hell", Sun],
                  ["dark", "Dunkel", Moon],
                  ["system", "Auto", Monitor],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  onClick={() => choose(value)}
                  className={`flex items-center justify-center gap-1 rounded-md py-1 text-xs ${theme === value ? "bg-surface font-medium shadow-xs" : "text-muted hover:text-fg"}`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="my-1 border-t border-line" />
          <DropdownItem href="/einstellungen" icon={<Settings />} onClick={close}>
            Einstellungen
          </DropdownItem>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-fg hover:bg-surface-3 [&_svg]:size-4 [&_svg]:text-muted"
            >
              <LogOut />
              Abmelden
            </button>
          </form>
        </>
      )}
    </Dropdown>
  );
}
