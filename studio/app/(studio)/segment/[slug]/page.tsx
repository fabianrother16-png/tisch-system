import { notFound } from "next/navigation";
import { Workspace } from "@/components/Workspace";
import { getOutput, listClients, listOutputs } from "@/lib/db";
import { getSegment } from "@/lib/segments";
import { availableStudioTools } from "@/lib/tools";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return { title: getSegment((await params).slug)?.label ?? "Segment" };
}

export default async function SegmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ kunde?: string; aufgabe?: string; auftrag?: string; start?: string }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const segment = getSegment(slug);
  if (!segment) notFound();

  const [clients, recent, task] = await Promise.all([
    listClients(),
    listOutputs({ segment: segment.slug }),
    sp.aufgabe ? getOutput(sp.aufgabe) : Promise.resolve(null),
  ]);
  const available = availableStudioTools(segment.tools);

  return (
    <Workspace
      slug={segment.slug}
      clients={clients.map((c) => ({ id: c.id, name: c.name, ort: c.ort }))}
      initialClientId={task?.clientId ?? sp.kunde ?? ""}
      initialPrompt={sp.auftrag?.slice(0, 6000)}
      autoStart={sp.start === "1" && Boolean(sp.auftrag?.trim())}
      task={task && task.segment === segment.slug ? { id: task.id, title: task.title, prompt: task.prompt, clientId: task.clientId } : null}
      tools={segment.tools.map((t) => ({ tool: t, available: available.includes(t) }))}
      recent={recent.slice(0, 30).map((o) => ({ id: o.id, title: o.title, clientId: o.clientId, status: o.status, createdAt: o.createdAt }))}
    />
  );
}
