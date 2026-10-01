export type NavItem = { href: string; label: string; icon: string; badgeKey?: string };
export type NavGroup = { label?: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  { items: [{ href: "/", label: "Dashboard", icon: "dashboard" }] },
  {
    label: "Kunden",
    items: [
      { href: "/kunden", label: "Kunden", icon: "users", badgeKey: "leads" },
      { href: "/vertraege", label: "Verträge", icon: "contract", badgeKey: "contracts" },
    ],
  },
  {
    label: "Produktion",
    items: [
      { href: "/content", label: "Content", icon: "content", badgeKey: "content" },
      { href: "/kalender", label: "Kalender", icon: "calendar" },
      { href: "/aufgaben", label: "Aufgaben", icon: "tasks", badgeKey: "tasks" },
    ],
  },
  {
    label: "Performance",
    items: [
      { href: "/performance", label: "Performance", icon: "chart" },
      { href: "/links", label: "Tracking-Links", icon: "link" },
    ],
  },
  {
    label: "Finanzen",
    items: [
      { href: "/angebote", label: "Angebote", icon: "quote" },
      { href: "/rechnungen", label: "Rechnungen", icon: "invoice", badgeKey: "invoices" },
      { href: "/ausgaben", label: "Ausgaben", icon: "expense" },
      { href: "/finanzen", label: "Auswertung", icon: "finance" },
    ],
  },
  {
    label: "Büro",
    items: [
      { href: "/ablage", label: "Ablage", icon: "folder" },
      { href: "/mail", label: "E-Mail", icon: "mail", badgeKey: "mail" },
    ],
  },
];
