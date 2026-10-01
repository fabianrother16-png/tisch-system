import { Bot, Globe, Mail, MessageSquare, Phone, StickyNote, Users, Trash2 } from "lucide-react";
import type { Activity } from "@/lib/db/schema";
import { fmtTimestamp } from "@/lib/format";
import { ActionButton } from "@/components/ui/form";
import { deleteActivity } from "@/lib/actions/customers";

const ICON: Record<string, React.ReactNode> = {
  notiz: <StickyNote />,
  anruf: <Phone />,
  meeting: <Users />,
  email: <Mail />,
  anfrage: <Globe />,
  system: <Bot />,
};

export function Timeline({
  items,
  userNames,
  customerId,
}: {
  items: Activity[];
  userNames: Record<number, string>;
  customerId: number;
}) {
  if (!items.length) {
    return <p className="py-6 text-center text-sm text-muted">Noch keine Einträge.</p>;
  }
  return (
    <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-line">
      {items.map((a) => (
        <li key={a.id} className="group relative flex gap-3">
          <span
            className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-line [&_svg]:size-3.5 ${a.kind === "system" ? "bg-surface-2 text-muted" : "bg-accent-soft text-accent-strong"}`}
          >
            {ICON[a.kind] ?? <MessageSquare />}
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm">
                <span className="font-medium">{a.title}</span>
                <span className="text-muted">
                  {" "}
                  · {fmtTimestamp(a.createdAt)}
                  {a.userId && userNames[a.userId] ? ` · ${userNames[a.userId]}` : ""}
                </span>
              </p>
              {a.kind !== "system" && a.kind !== "anfrage" && (
                <span className="opacity-0 transition-opacity group-hover:opacity-100">
                  <ActionButton action={deleteActivity.bind(null, customerId, a.id)} confirm="Eintrag löschen?" variant="ghost" size="sm" title="Löschen">
                    <Trash2 />
                  </ActionButton>
                </span>
              )}
            </div>
            {a.body && <p className="prose-notes mt-1">{a.body}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
