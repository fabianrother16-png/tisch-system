import Link from "next/link";
import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { ListTodo, Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { customers, tasks, users, type Task } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionButton } from "@/components/ui/form";
import { TaskForm, QuickTaskForm } from "@/components/tasks/TaskForm";
import { TaskCheck } from "@/components/tasks/TaskCheck";
import { deleteTask, saveTask } from "@/lib/actions/tasks";
import { addDays, diffDays, todayISO } from "@/lib/dates";
import { fmtDate, relativeDays } from "@/lib/format";

export const metadata = { title: "Aufgaben" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ filter?: string; neu?: string; kunde?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const filter = sp.filter ?? "meine";
  const today = todayISO();

  const [rows, customerRows, team] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(
        filter === "erledigt"
          ? eq(tasks.status, "erledigt")
          : and(eq(tasks.status, "offen"), filter === "meine" ? or(eq(tasks.assigneeId, me.id), isNull(tasks.assigneeId)) : undefined),
      )
      .orderBy(filter === "erledigt" ? desc(tasks.completedAt) : asc(tasks.dueDate))
      .limit(300),
    db.select({ id: customers.id, name: customers.name, color: customers.color }).from(customers).where(inArray(customers.status, ["aktiv", "lead", "pausiert"])).orderBy(asc(customers.name)),
    db.select({ id: users.id, name: users.name, color: users.color }).from(users).where(eq(users.active, true)),
  ]);
  const cmap = new Map(customerRows.map((c) => [c.id, c]));
  const umap = new Map(team.map((u) => [u.id, u]));

  const weekEnd = addDays(today, 7);
  const groups: { label: string; items: Task[]; tone?: string }[] =
    filter === "erledigt"
      ? [{ label: "Erledigt", items: rows }]
      : [
          { label: "Überfällig", items: rows.filter((t) => t.dueDate && t.dueDate < today), tone: "text-red-600 dark:text-red-400" },
          { label: "Heute", items: rows.filter((t) => t.dueDate === today) },
          { label: "Nächste 7 Tage", items: rows.filter((t) => t.dueDate && t.dueDate > today && t.dueDate <= weekEnd) },
          { label: "Später", items: rows.filter((t) => t.dueDate && t.dueDate > weekEnd) },
          { label: "Ohne Termin", items: rows.filter((t) => !t.dueDate) },
        ];

  const customerOptions = customerRows.map((c) => ({ id: c.id, name: c.name }));
  const userOptions = team.map((u) => ({ id: u.id, name: u.name }));

  return (
    <>
      <PageHeader
        title="Aufgaben"
        description="Alles, was noch zu tun ist – für euch beide oder pro Kunde."
        actions={
          <Modal title="Neue Aufgabe" defaultOpen={sp.neu === "1"} trigger={<Button><Plus /> Aufgabe</Button>}>
            <TaskForm action={saveTask.bind(null, null)} customers={customerOptions} users={userOptions} defaults={{ userId: me.id, customerId: sp.kunde ? Number(sp.kunde) : undefined }} />
          </Modal>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          active={filter}
          items={[
            { key: "meine", label: "Meine", href: "/aufgaben" },
            { key: "alle", label: "Alle offenen", href: "/aufgaben?filter=alle" },
            { key: "erledigt", label: "Erledigt", href: "/aufgaben?filter=erledigt" },
          ]}
        />
      </div>
      {filter !== "erledigt" && (
        <Card className="mb-6 p-3">
          <QuickTaskForm action={saveTask.bind(null, null)} userId={me.id} />
        </Card>
      )}
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={<ListTodo />} title={filter === "erledigt" ? "Noch nichts erledigt" : "Keine offenen Aufgaben 🎉"} />
        </Card>
      ) : (
        <div className="space-y-6">
          {groups
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <div key={g.label}>
                <h2 className={`mb-2 text-sm font-semibold ${g.tone ?? ""}`}>
                  {g.label} <span className="font-normal text-muted">({g.items.length})</span>
                </h2>
                <Card className="divide-y divide-line">
                  {g.items.map((t) => {
                    const c = t.customerId ? cmap.get(t.customerId) : null;
                    const u = t.assigneeId ? umap.get(t.assigneeId) : null;
                    return (
                      <div key={t.id} className="group flex items-center gap-3 px-4 py-3">
                        <TaskCheck id={t.id} done={t.status === "erledigt"} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${t.status === "erledigt" ? "text-muted line-through" : ""}`}>
                            {t.title}
                            {t.priority === "hoch" && <Badge tone="red" className="ml-2">Wichtig</Badge>}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                            {c && (
                              <Link href={`/kunden/${c.id}`} className="inline-flex items-center gap-1 hover:text-fg">
                                <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                                {c.name}
                              </Link>
                            )}
                            {t.dueDate && (
                              <span className={t.dueDate < today && t.status === "offen" ? "font-medium text-red-600 dark:text-red-400" : ""}>
                                {fmtDate(t.dueDate)} ({relativeDays(diffDays(t.dueDate, today))})
                              </span>
                            )}
                            {t.description && <span className="truncate">{t.description}</span>}
                          </div>
                        </div>
                        {u && <Avatar name={u.name} color={u.color} size="sm" />}
                        <div className="flex opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                          <Modal title="Aufgabe bearbeiten" trigger={<Button size="icon" variant="ghost" className="size-8" aria-label="Bearbeiten"><Pencil /></Button>}>
                            <TaskForm action={saveTask.bind(null, t.id)} task={t} customers={customerOptions} users={userOptions} defaults={{ userId: me.id }} />
                          </Modal>
                          <ActionButton action={deleteTask.bind(null, t.id)} variant="ghost" title="Löschen" confirm="Aufgabe löschen?">
                            <Trash2 />
                          </ActionButton>
                        </div>
                      </div>
                    );
                  })}
                </Card>
              </div>
            ))}
        </div>
      )}
    </>
  );
}
