import {
  ChartColumn,
  Clapperboard,
  Compass,
  Globe,
  MapPin,
  Megaphone,
  Search,
  Share2,
  ShieldCheck,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { SegmentSlug } from "@/lib/types";

const ICONS: Record<SegmentSlug, LucideIcon> = {
  strategie: Compass,
  seo: Search,
  "google-profil": MapPin,
  video: Clapperboard,
  social: Share2,
  website: Globe,
  ads: Megaphone,
  reporting: ChartColumn,
  akquise: Target,
  qualitaet: ShieldCheck,
};

export function SegmentIcon({ slug, className = "h-5 w-5" }: { slug: SegmentSlug; className?: string }) {
  const Icon = ICONS[slug];
  return <Icon className={className} aria-hidden />;
}
