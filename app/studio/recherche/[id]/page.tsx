import { ResearchView } from "@/components/studio/research/ResearchView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResearchView id={id} />;
}
