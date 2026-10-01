import { Download, ExternalLink, FileImage, FileText, File, FileSpreadsheet, Lock, Pencil, Trash2, FileVideo } from "lucide-react";
import type { StoredFile } from "@/lib/db/schema";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/form";
import { FILE_CATEGORY_MAP } from "@/lib/constants";
import { removeFile, updateFileMeta } from "@/lib/actions/files";
import { fmtBytes, fmtTimestamp } from "@/lib/format";
import { FileEditForm } from "./FileEditForm";

function Icon({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) return <FileImage className="size-4 text-violet-600" />;
  if (mime.startsWith("video/")) return <FileVideo className="size-4 text-violet-600" />;
  if (mime === "application/pdf") return <FileText className="size-4 text-red-600" />;
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) return <FileSpreadsheet className="size-4 text-emerald-600" />;
  return <File className="size-4 text-muted" />;
}

export function FileTable({
  rows,
  customers,
  userNames,
  showCustomer = true,
}: {
  rows: { file: StoredFile; customerName: string | null }[];
  customers: { id: number; name: string }[];
  userNames: Record<number, string>;
  showCustomer?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Datei</th>
            {showCustomer && <th>Kunde</th>}
            <th>Ordner</th>
            <th className="text-right">Größe</th>
            <th>Hochgeladen</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ file: f, customerName }) => (
            <tr key={f.id} className="group">
              <td>
                <a href={`/api/files/${f.id}`} target="_blank" className="flex max-w-96 items-center gap-2.5 hover:text-accent">
                  <Icon mime={f.mimeType} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{f.name}</span>
                    {f.notes && <span className="block truncate text-xs text-muted">{f.notes}</span>}
                  </span>
                  {f.refType === "invoice" && <Lock className="size-3.5 shrink-0 text-muted" aria-label="archiviert" />}
                </a>
              </td>
              {showCustomer && <td className="text-fg-2">{customerName ?? <span className="text-muted">intern</span>}</td>}
              <td><Badge>{FILE_CATEGORY_MAP[f.category]?.label ?? f.category}</Badge></td>
              <td className="text-right whitespace-nowrap text-muted num">{fmtBytes(f.size)}</td>
              <td className="whitespace-nowrap text-xs text-muted">
                {fmtTimestamp(f.createdAt)}
                {f.uploadedBy && userNames[f.uploadedBy] ? <span className="block">{userNames[f.uploadedBy]}</span> : null}
              </td>
              <td className="text-right whitespace-nowrap">
                <span className="inline-flex sm:opacity-0 sm:group-hover:opacity-100">
                  <LinkButton href={`/api/files/${f.id}`} target="_blank" size="icon" variant="ghost" className="size-8" aria-label="Öffnen"><ExternalLink /></LinkButton>
                  <LinkButton href={`/api/files/${f.id}?download=1`} size="icon" variant="ghost" className="size-8" aria-label="Herunterladen"><Download /></LinkButton>
                  {f.refType !== "invoice" && (
                    <>
                      <Modal title="Datei bearbeiten" trigger={<Button size="icon" variant="ghost" className="size-8" aria-label="Bearbeiten"><Pencil /></Button>}>
                        <FileEditForm action={updateFileMeta.bind(null, f.id)} file={f} customers={customers} />
                      </Modal>
                      <ActionButton action={removeFile.bind(null, f.id)} confirm={`„${f.name}“ löschen?`} variant="ghost" title="Löschen">
                        <Trash2 />
                      </ActionButton>
                    </>
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
