import { makeNode } from "@/lib/canvas/nodeFactory";
import type { CanvasResource, MisoNodeData } from "@/lib/canvas/types";

/**
 * Mock MISO resource catalog.
 * Swap the bodies of these functions for FastAPI / MISO API calls later —
 * the return shapes are what the canvas depends on.
 */

export interface DatasetPreviewRow {
  timestamp: string;
  location: string;
  metric: string;
  value: number;
  unit: string;
}

export const CATALOG: CanvasResource[] = [
  {
    id: "miso-load-api",
    title: "MISO Load API",
    subtitle: "Public · Real-time",
    kind: "dataSource",
    keywords: ["load", "api", "real-time", "indiana", "michigan"],
    build: () =>
      makeNode("dataSource", "MISO Load API", {
        description: "Real-time and historical system load endpoint",
        tags: ["Public", "Real-time"],
        meta: { unit: "MW" },
      }),
  },
  {
    id: "miso-lmp-api",
    title: "MISO Pricing API",
    subtitle: "Public · LMP",
    kind: "dataSource",
    keywords: ["price", "lmp", "market", "api"],
    build: () =>
      makeNode("dataSource", "MISO Pricing API", {
        description: "Day-ahead and real-time locational marginal prices",
        tags: ["Public", "LMP"],
        meta: { dataType: "pricing", unit: "$/MWh", supportedOutputs: ["pricing", "time-series"] },
      }),
  },
  {
    id: "indiana-load",
    title: "Indiana Load Dataset",
    subtitle: "Hourly · MW",
    kind: "dataset",
    keywords: ["indiana", "load", "hourly", "mw"],
    build: () =>
      makeNode("dataset", "Indiana Load", {
        description: "Hourly metered load for the Indiana footprint",
        tags: ["Hourly", "MW"],
        meta: { geographic: true },
      }),
  },
  {
    id: "michigan-load",
    title: "Michigan Load Dataset",
    subtitle: "Hourly · MW",
    kind: "dataset",
    keywords: ["michigan", "load", "hourly", "mw"],
    build: () =>
      makeNode("dataset", "Michigan Load", {
        description: "Hourly metered load for the Michigan footprint",
        tags: ["Hourly", "MW"],
        meta: { geographic: true },
      }),
  },
  {
    id: "wind-generation",
    title: "Wind Generation Dataset",
    subtitle: "5-minute · MW",
    kind: "dataset",
    keywords: ["wind", "generation", "renewable"],
    build: () =>
      makeNode("dataset", "Wind Generation", {
        description: "Aggregate wind output across the MISO footprint",
        tags: ["5-minute", "MW"],
      }),
  },
  {
    id: "market-report",
    title: "MISO Market Report",
    subtitle: "PDF · 128 pages",
    kind: "document",
    keywords: ["report", "document", "market", "pdf"],
    build: () =>
      makeNode("document", "MISO Market Report", {
        description: "Quarterly market performance report",
        tags: ["PDF", "128 pages"],
      }),
  },
  {
    id: "planning-report",
    title: "MISO Planning Report",
    subtitle: "PDF · 300 pages",
    kind: "document",
    keywords: ["planning", "transmission", "document"],
    build: () =>
      makeNode("document", "MISO Planning Report", {
        description: "Transmission expansion planning study",
        tags: ["PDF", "300 pages"],
      }),
  },
  {
    id: "load-docs",
    title: "Load Documentation",
    subtitle: "Reference · Unknown schema",
    kind: "document",
    keywords: ["documentation", "load", "reference"],
    build: () =>
      makeNode("document", "Load Documentation", {
        description: "Field definitions for load data products",
        tags: ["Reference"],
        meta: { schemaUnknown: true },
      }),
  },
  {
    id: "loc-indiana",
    title: "Indiana",
    subtitle: "Location",
    kind: "location",
    keywords: ["indiana", "state", "location"],
    build: () => makeNode("location", "Indiana", { tags: ["State"] }),
  },
  {
    id: "loc-michigan",
    title: "Michigan",
    subtitle: "Location",
    kind: "location",
    keywords: ["michigan", "state", "location"],
    build: () => makeNode("location", "Michigan", { tags: ["State"] }),
  },
  {
    id: "time-30",
    title: "Last 30 Days",
    subtitle: "Time range",
    kind: "timeRange",
    keywords: ["time", "30", "range", "month"],
    build: () => makeNode("timeRange", "Last 30 Days", { tags: ["Rolling"] }),
  },
];

export const misoService = {
  async search(query: string): Promise<CanvasResource[]> {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        r.keywords.some((k) => k.includes(q)),
    );
  },

  async preview(node: MisoNodeData): Promise<DatasetPreviewRow[]> {
    const location = node.name.split(" ")[0] ?? "MISO";
    const unit = node.meta.unit ?? "MW";
    const base = 12000 + location.length * 210;
    return Array.from({ length: 8 }, (_, i) => ({
      timestamp: `2026-08-${String(24 + Math.floor(i / 4)).padStart(2, "0")} ${String(i * 3).padStart(2, "0")}:00`,
      location,
      metric: node.name,
      value: Math.round(base + Math.sin(i / 1.7) * 1450 + i * 37),
      unit,
    }));
  },

  seriesFor(name: string, points = 30): { day: string; value: number }[] {
    const seed = name.length * 13;
    return Array.from({ length: points }, (_, i) => ({
      day: `D${i + 1}`,
      value: Math.round(11000 + seed * 9 + Math.sin((i + seed) / 3.4) * 1800 + i * 24),
    }));
  },
};
