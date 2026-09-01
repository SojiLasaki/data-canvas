import {
  BarChart3,
  Combine,
  Database,
  Download,
  FileText,
  Filter,
  MapPin,
  Plug,
  Timer,
  Wand2,
} from "lucide-react";
import type { CompatibilityState, NodeKind } from "@/lib/canvas/types";

export const NODE_ICON: Record<NodeKind, typeof Database> = {
  dataSource: Plug,
  dataset: Database,
  location: MapPin,
  timeRange: Timer,
  filter: Filter,
  transform: Wand2,
  compare: Combine,
  document: FileText,
  visualization: BarChart3,
  output: Download,
};

export const STATE_TOKEN: Record<
  CompatibilityState,
  { color: string; stroke: string; icon: string; label: string }
> = {
  valid: { color: "text-valid", stroke: "var(--valid)", icon: "✓", label: "Compatible" },
  invalid: { color: "text-invalid", stroke: "var(--invalid)", icon: "×", label: "Incompatible" },
  uncertain: { color: "text-uncertain", stroke: "var(--uncertain)", icon: "!", label: "Needs review" },
};
