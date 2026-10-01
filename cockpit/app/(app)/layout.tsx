import { AppShell } from "@/components/shell/AppShell";
import { requireUser } from "@/lib/auth";
import { getNavBadges } from "@/lib/domain/badges";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const badges = await getNavBadges(user.id);
  return (
    <AppShell user={{ name: user.name, email: user.email, color: user.color }} badges={badges}>
      {children}
    </AppShell>
  );
}
