import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import type { Post } from "@/lib/db/schema";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ActionButton } from "@/components/ui/form";
import { CustomerMark } from "@/components/ui/Avatar";
import { deletePost, savePost } from "@/lib/actions/performance";
import { fmtCompact, fmtDate, fmtRate } from "@/lib/format";
import { PostForm } from "./PostForm";

export function PostsTable({
  posts,
  editable,
  today,
  customers,
  viralThreshold,
}: {
  posts: Post[];
  editable?: boolean;
  today: string;
  customers?: Map<number, { name: string; color: string }>;
  viralThreshold?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Beitrag</th>
            {customers && <th>Kunde</th>}
            <th>Datum</th>
            <th className="text-right">Aufrufe</th>
            <th className="text-right">Likes</th>
            <th className="text-right">Komm.</th>
            <th className="text-right">Geteilt</th>
            <th className="text-right">Gespeichert</th>
            <th className="text-right">Engagement</th>
            {editable && <th />}
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => {
            const inter = p.likes + p.comments + p.shares + p.saves;
            const er = p.views ? (inter / p.views) * 100 : null;
            const viral = viralThreshold != null && p.views >= viralThreshold && p.views > 0;
            const c = customers?.get(p.customerId);
            return (
              <tr key={p.id} className="group">
                <td>
                  <div className="flex max-w-80 items-center gap-2.5">
                    <PlatformIcon platform={p.platform} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.caption || p.mediaType || "Beitrag"}</p>
                      <p className="flex items-center gap-1.5 text-xs text-muted">
                        {p.mediaType}
                        {editable && (p.source === "api" ? <Badge tone="blue">automatisch</Badge> : <Badge>manuell</Badge>)}
                        {viral && <Badge tone="accent">🔥 viral</Badge>}
                      </p>
                    </div>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer" className="text-muted hover:text-accent" aria-label="Beitrag öffnen">
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                </td>
                {customers && (
                  <td>
                    {c && (
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <CustomerMark name={c.name} color={c.color} size="sm" />
                        {c.name}
                      </span>
                    )}
                  </td>
                )}
                <td className="whitespace-nowrap">{fmtDate(p.publishedAt)}</td>
                <td className="text-right font-semibold num">{fmtCompact(p.views)}</td>
                <td className="text-right num">{fmtCompact(p.likes)}</td>
                <td className="text-right num">{fmtCompact(p.comments)}</td>
                <td className="text-right num">{fmtCompact(p.shares)}</td>
                <td className="text-right num">{fmtCompact(p.saves)}</td>
                <td className="text-right num">{fmtRate(er, 1)}</td>
                {editable && (
                  <td className="text-right whitespace-nowrap">
                    <span className="inline-flex sm:opacity-0 sm:group-hover:opacity-100">
                      <Modal title="Zahlen aktualisieren" size="lg" trigger={<Button size="icon" variant="ghost" className="size-8" aria-label="Bearbeiten"><Pencil /></Button>}>
                        <PostForm action={savePost.bind(null, p.customerId, p.id)} post={p} today={today} />
                      </Modal>
                      <ActionButton action={deletePost.bind(null, p.customerId, p.id)} confirm="Beitrag aus der Auswertung entfernen?" variant="ghost" title="Entfernen">
                        <Trash2 />
                      </ActionButton>
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
