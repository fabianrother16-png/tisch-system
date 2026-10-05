import { Shell } from "@/components/Shell";
import { passwordConfigured } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { higgsfieldConfigured } from "@/lib/tools/higgsfield";

export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <Shell
      agenturName={settings.agenturName || "SICHTWERK"}
      passwordProtected={passwordConfigured()}
      info={{ higgsfield: higgsfieldConfigured(), team: settings.team }}
    >
      {children}
    </Shell>
  );
}
