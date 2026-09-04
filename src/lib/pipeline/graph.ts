import { createNode, type MisoEdge, type MisoNode } from "@/lib/canvas/graph";
import { evaluateConnection, defaultSettings, modifierKindFor } from "@/lib/canvas/compatibility";
import { makeNode } from "@/lib/canvas/nodeFactory";
import type { MisoNodeData, NodeKind } from "@/lib/canvas/types";
import { summarize } from "./engine";
import type { Pipeline, PipelineStep } from "./types";

const KIND_MAP: Record<PipelineStep["kind"], NodeKind> = {
  source: "dataSource",
  filter: "filter",
  timeRange: "timeRange",
  aggregate: "transform",
  transform: "transform",
  sort: "transform",
  missing: "transform",
  compare: "compare",
  join: "transform",
  visualization: "visualization",
  output: "output",
};

function toNodeData(step: PipelineStep): MisoNodeData {
  return makeNode(KIND_MAP[step.kind], step.title, {
    description: summarize(step),
    tags: Object.values(step.params).filter(Boolean).slice(0, 2),
    status: step.enabled ? "ready" : "idle",
    config: step.params,
  });
}

/** Project the shared pipeline into canvas nodes/edges. */
export function pipelineToGraph(pipeline: Pipeline): { nodes: MisoNode[]; edges: MisoEdge[] } {
  const nodes: MisoNode[] = [];
  const byStep = new Map<string, MisoNode>();

  pipeline.steps.forEach((step, i) => {
    const node = createNode(toNodeData(step), { x: 60 + i * 300, y: 120 + (i % 2) * 90 });
    nodes.push(node);
    byStep.set(step.id, node);
  });

  const edges: MisoEdge[] = [];
  pipeline.steps.forEach((step, i) => {
    const target = byStep.get(step.id);
    if (!target) return;
    const inputs = step.inputs.length ? step.inputs : pipeline.steps[i - 1] ? [pipeline.steps[i - 1]!.id] : [];
    inputs.forEach((inputId) => {
      const source = byStep.get(inputId);
      if (!source) return;
      const modifierKind = modifierKindFor(source.data);
      edges.push({
        id: `${source.id}->${target.id}`,
        source: source.id,
        target: target.id,
        type: "miso",
        data: {
          compatibility: evaluateConnection(source.data, target.data),
          modifierKind,
          settings: defaultSettings(modifierKind),
        },
      });
    });
  });

  return { nodes, edges };
}
