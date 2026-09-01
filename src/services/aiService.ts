import { makeNode } from "@/lib/canvas/nodeFactory";
import { createEdge, createNode, type MisoEdge, type MisoNode } from "@/lib/canvas/graph";
import type { MisoNodeData } from "@/lib/canvas/types";
import { CATALOG } from "./misoService";

export interface GeneratedWorkflow {
  nodes: MisoNode[];
  edges: MisoEdge[];
  message: string;
  summary: string[];
  steps: string[];
}

export interface VizRecommendation {
  type: string;
  reason: string;
}

function locationsIn(prompt: string): string[] {
  const known = ["Indiana", "Michigan", "Illinois", "Minnesota", "Missouri", "Louisiana"];
  const found = known.filter((s) => prompt.toLowerCase().includes(s.toLowerCase()));
  return found.length ? found : ["Indiana", "Michigan"];
}

function timeRangeIn(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("7 day") || p.includes("week")) return "Last 7 Days";
  if (p.includes("90") || p.includes("quarter")) return "Last 90 Days";
  if (p.includes("year")) return "Year to Date";
  return "Last 30 Days";
}

/**
 * Mock AI planner. Replace with an LLM / MCP call that returns the same
 * GeneratedWorkflow shape.
 */
export const aiService = {
  async generateWorkflow(prompt: string): Promise<GeneratedWorkflow> {
    const locations = locationsIn(prompt).slice(0, 2);
    const range = timeRangeIn(prompt);
    const isPricing = /price|lmp|market cost/i.test(prompt);
    const unit = isPricing ? "$/MWh" : "MW";

    const sources = locations.map((loc, i) =>
      createNode(
        makeNode("dataset", `${loc} ${isPricing ? "LMP" : "Load"}`, {
          description: `Hourly ${isPricing ? "locational marginal price" : "metered load"} for ${loc}`,
          tags: ["Hourly", unit],
          meta: {
            geographic: true,
            unit,
            ...(isPricing ? ({ dataType: "pricing" as const } as const) : {}),
          },
        }),
        { x: 40, y: 60 + i * 190 },
      ),
    );

    const time = createNode(
      makeNode("timeRange", range, { tags: ["Rolling"], description: "Applied to all inputs" }),
      { x: 40, y: 60 + sources.length * 190 },
    );

    const compare = createNode(
      makeNode("compare", "Compare", {
        description: `${locations.join(" vs ")}`,
        tags: [locations.join(" vs ")],
        config: { basis: "Absolute" },
        meta: { unit },
      }),
      { x: 420, y: 150 },
    );

    const viz = createNode(
      makeNode("visualization", "Line Chart", {
        description: `${locations.join(" vs ")} · ${range}`,
        tags: ["Line chart"],
        config: {
          type: "Line chart",
          xAxis: "Timestamp",
          yAxis: isPricing ? "Price $/MWh" : "Load MW",
          groupBy: "Location",
          aggregation: "Average",
          title: `${locations.join(" vs ")} ${isPricing ? "Prices" : "Load"}`,
        },
      }),
      { x: 760, y: 150 },
    );

    const out = createNode(
      makeNode("output", "Output", { tags: ["CSV", "PNG"], config: { format: "PNG" } }),
      { x: 1080, y: 150 },
    );

    const nodes = [...sources, time, compare, viz, out];
    const edges = [
      ...sources.map((s) => createEdge(s, compare)),
      createEdge(time, compare),
      createEdge(compare, viz),
      createEdge(viz, out),
    ];

    return {
      nodes,
      edges,
      message: `I found compatible MISO ${isPricing ? "pricing" : "load"} datasets for ${locations.join(" and ")}. I connected them to a comparison node and selected a line chart because this is time-series data.`,
      summary: [...locations.map((l) => `${l} ${isPricing ? "LMP" : "Load"}`), "Compare", "Line Chart", "Output"],
      steps: [
        "Understood the request",
        `Located MISO resources for ${locations.join(" and ")}`,
        "Checked schema compatibility",
        `Applied the ${range.toLowerCase()} time range`,
        "Recommended a line chart",
      ],
    };
  },

  recommendVisualization(data: MisoNodeData | undefined): VizRecommendation {
    if (!data) {
      return { type: "Line chart", reason: "No data is connected yet, so a line chart is the safe default." };
    }
    if (data.meta.geographic && !data.meta.timeSeries) {
      return { type: "Map", reason: "Your data is geographic, so a map shows regional differences most clearly." };
    }
    if (data.meta.timeSeries) {
      return {
        type: "Line chart",
        reason:
          "Your dataset contains hourly measurements over time, making a line chart the clearest way to show changes.",
      };
    }
    if (data.meta.dataType === "categorical") {
      return { type: "Bar chart", reason: "Categorical values compare best side by side in a bar chart." };
    }
    if (data.kind === "compare") {
      return { type: "Line chart", reason: "Comparisons across the same time axis read best as overlaid lines." };
    }
    return { type: "Table", reason: "The schema is unstructured, so a table preserves the raw values." };
  },

  /** Natural-language command bar handling. */
  async interpretCommand(command: string): Promise<{ reply: string; add?: MisoNodeData }> {
    const q = command.toLowerCase();
    const match = CATALOG.find((r) => r.keywords.some((k) => q.includes(k)) || q.includes(r.title.toLowerCase()));
    if (/line chart|visuali[sz]e|chart|graph/.test(q)) {
      return {
        reply: "Added a line chart node. Connect your data to it and I'll validate the schema.",
        add: makeNode("visualization", "Line Chart", {
          tags: ["Line chart"],
          config: { type: "Line chart", xAxis: "Timestamp", yAxis: "Load MW", aggregation: "Average", title: "Untitled" },
        }),
      };
    }
    if (/aggregat|weekly|daily average|resample/.test(q)) {
      return {
        reply: "Added an aggregation transform. It converts hourly readings into the period you choose.",
        add: makeNode("transform", "Aggregate", { description: "Hourly → Daily average", tags: ["Aggregate"] }),
      };
    }
    if (/filter/.test(q)) {
      return {
        reply: "Added a filter node.",
        add: makeNode("filter", "Filter", { description: "Location = Indiana", tags: ["Filter"] }),
      };
    }
    if (/export|download|csv|png/.test(q)) {
      return {
        reply: "Added an output node. Connect a chart or dataset to export it.",
        add: makeNode("output", "Output", { tags: ["CSV", "PNG"], config: { format: "CSV" } }),
      };
    }
    if (match) {
      return { reply: `Added ${match.title} to the canvas.`, add: match.build() };
    }
    return {
      reply:
        "I couldn't match that to a MISO resource yet. Try naming a dataset (\"Indiana load\"), a transform, or a chart type.",
    };
  },
};
