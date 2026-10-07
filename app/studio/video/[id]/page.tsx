import { VideoStudio } from "@/components/studio/video/VideoStudio";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VideoStudio id={id} />;
}
