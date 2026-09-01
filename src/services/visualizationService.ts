import { misoService } from "./misoService";

export type ChartType = "Line chart" | "Bar chart" | "Area chart" | "Scatter plot" | "Map" | "Table";

export const CHART_TYPES: ChartType[] = [
  "Line chart",
  "Bar chart",
  "Area chart",
  "Scatter plot",
  "Map",
  "Table",
];

export interface SeriesBundle {
  key: string;
  points: { day: string; value: number }[];
}

/** Mock visualization data assembly. Later: server-side aggregation. */
export const visualizationService = {
  build(seriesNames: string[], points = 30): { day: string; [k: string]: number | string }[] {
    const bundles: SeriesBundle[] = (seriesNames.length ? seriesNames : ["Series"]).map((name) => ({
      key: name,
      points: misoService.seriesFor(name, points),
    }));
    const first = bundles[0];
    if (!first) return [];
    return first.points.map((p, i) => {
      const row: { day: string; [k: string]: number | string } = { day: p.day };
      bundles.forEach((b) => {
        row[b.key] = b.points[i]?.value ?? 0;
      });
      return row;
    });
  },
};
