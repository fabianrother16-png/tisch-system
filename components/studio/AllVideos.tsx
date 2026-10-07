"use client";

import { Clapperboard } from "lucide-react";
import { useCollection } from "@/lib/studio/db";
import { VideoList } from "./ClientPage";
import { Empty, SectionTitle } from "./ui";

export function AllVideos() {
  const videos = useCollection("videos");
  const clients = useCollection("clients");
  const name = (id: string) => clients?.find((c) => c.id === id)?.name ?? "–";
  return (
    <div className="mx-auto max-w-6xl">
      <SectionTitle eyebrow="Produktion" title="Alle Videos">
        Alle Videoprojekte über alle Kunden.
      </SectionTitle>
      {videos === null ? null : videos.length === 0 ? (
        <Empty icon={<Clapperboard className="h-8 w-8" />} title="Noch keine Videos">
          Videos legst du beim jeweiligen Kunden an.
        </Empty>
      ) : (
        <VideoList videos={videos} clientName={name} />
      )}
    </div>
  );
}
