import type { Pipeline, PipelineStep } from "./types";
import { FREQUENCIES, LOCATIONS, OPERATIONS, makeStep, summarize } from "./engine";

export interface CommandResult {
  pipeline: Pipeline;
  reply: string;
  changedStepId?: string;
}

const patch = (p: Pipeline, id: string, params: Record<string, string>): Pipeline => ({
  ...p,
  steps: p.steps.map((s) => (s.id === id ? { ...s, params: { ...s.params, ...params } } : s)),
});

/**
 * Natural language edits operate on exactly the same pipeline object the
 * modifier stack and canvas mutate — there is only one workflow state.
 */
export function applyCommand(pipeline: Pipeline, text: string): CommandResult {
  const q = text.toLowerCase();
  const find = (kind: PipelineStep["kind"]) => pipeline.steps.find((s) => s.kind === kind);

  // frequency: "make this weekly"
  const freq = FREQUENCIES.find((f) => q.includes(f.toLowerCase()) || q.includes(f.toLowerCase().replace("ly", "")));
  if (freq && /week|day|daily|month|hour|aggregat|resample|instead/.test(q)) {
    const agg = find("aggregate");
    if (agg) {
      const from = agg.params["frequency"];
      return {
        pipeline: patch(pipeline, agg.id, { frequency: freq }),
        reply: `I've changed the aggregation from ${String(from).toLowerCase()} to ${freq.toLowerCase()}. The chart and table have been updated.`,
        changedStepId: agg.id,
      };
    }
  }

  // operation: "show the sum"
  const op = OPERATIONS.find((o) => q.includes(o.toLowerCase()));
  if (op && /average|sum|min|max|median|aggregat/.test(q)) {
    const agg = find("aggregate");
    if (agg) {
      return {
        pipeline: patch(pipeline, agg.id, { operation: op }),
        reply: `Aggregation operation is now ${op.toLowerCase()}.`,
        changedStepId: agg.id,
      };
    }
  }

  // location: "only show Michigan"
  const loc = LOCATIONS.find((l) => q.includes(l.toLowerCase()));
  if (loc) {
    const filter = find("filter");
    if (filter) {
      return {
        pipeline: patch(pipeline, filter.id, { location: loc }),
        reply: `Filtering to ${loc}. The visualization and data table now show ${loc} only.`,
        changedStepId: filter.id,
      };
    }
  }

  // time range
  const rangeMap: [RegExp, string][] = [
    [/7 day|last week|past week/, "Last 7 Days"],
    [/30 day|last month|past month/, "Last 30 Days"],
    [/90 day|quarter/, "Last 90 Days"],
    [/year/, "Year to Date"],
  ];
  const range = rangeMap.find(([re]) => re.test(q))?.[1];
  if (range) {
    const time = find("timeRange");
    if (time) {
      return {
        pipeline: patch(pipeline, time.id, { range }),
        reply: `Time range set to ${range.toLowerCase()}.`,
        changedStepId: time.id,
      };
    }
  }

  // chart type
  const chart = ["Line chart", "Bar chart", "Area chart", "Table"].find((c) =>
    q.includes(c.toLowerCase().replace(" chart", "")),
  );
  if (chart && /chart|graph|plot|table|visuali/.test(q)) {
    const viz = find("visualization");
    if (viz) {
      return {
        pipeline: patch(pipeline, viz.id, { type: chart }),
        reply: `Switched the visualization to a ${chart.toLowerCase()}.`,
        changedStepId: viz.id,
      };
    }
  }

  // normalize / percent change
  if (/normali[sz]e|percent change|index/.test(q)) {
    const t = find("transform");
    if (t) {
      const operation = /percent change/.test(q) ? "Percent change" : "Normalize";
      return {
        pipeline: {
          ...pipeline,
          steps: pipeline.steps.map((s) => (s.id === t.id ? { ...s, enabled: true, params: { ...s.params, operation } } : s)),
        },
        reply: `Enabled the transform modifier and set it to ${operation.toLowerCase()}.`,
        changedStepId: t.id,
      };
    }
  }

  // add a comparison
  if (/compare|versus| vs /.test(q)) {
    const target = LOCATIONS.find((l) => q.includes(l.toLowerCase()) && l !== find("filter")?.params["location"]);
    const existing = find("compare");
    if (existing) {
      return {
        pipeline: patch(pipeline, existing.id, target ? { against: target } : {}),
        reply: target ? `Comparing against ${target}.` : "Comparison modifier is already in the pipeline.",
        changedStepId: existing.id,
      };
    }
    const cmp = makeStep("compare", { basis: "Absolute", against: target ?? "Michigan" });
    cmp.specs = [
      { key: "basis", label: "Basis", options: ["Absolute", "Difference", "Percent"] },
      { key: "against", label: "Compare against", options: LOCATIONS },
    ];
    const vizIndex = pipeline.steps.findIndex((s) => s.kind === "visualization");
    const steps = [...pipeline.steps];
    steps.splice(vizIndex < 0 ? steps.length : vizIndex, 0, cmp);
    return {
      pipeline: { ...pipeline, steps },
      reply: `Added a compare modifier against ${target ?? "Michigan"}.`,
      changedStepId: cmp.id,
    };
  }

  // disable / enable by name
  const toggle = /disable|turn off|remove the/.test(q) ? false : /enable|turn on/.test(q) ? true : null;
  if (toggle !== null) {
    const target = pipeline.steps.find((s) => q.includes(s.title.toLowerCase()));
    if (target) {
      return {
        pipeline: {
          ...pipeline,
          steps: pipeline.steps.map((s) => (s.id === target.id ? { ...s, enabled: toggle } : s)),
        },
        reply: `${target.title} is now ${toggle ? "enabled" : "disabled"}. Its configuration is preserved.`,
        changedStepId: target.id,
      };
    }
  }

  return {
    pipeline,
    reply: `I understand the current workflow as: ${pipeline.steps
      .map((s) => `${s.title} (${summarize(s)})${s.enabled ? "" : " — disabled"}`)
      .join(" → ")}. Try "make this weekly", "only show Michigan", or "compare against Illinois".`,
  };
}
