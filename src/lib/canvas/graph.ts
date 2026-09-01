import type { Edge, Node } from "@xyflow/react";
import type { MisoEdgeData, MisoNodeData } from "./types";
import { defaultSettings, evaluateConnection, modifierKindFor } from "./compatibility";

export type MisoNode = Node<MisoNodeData, "miso">;
export type MisoEdge = Edge<MisoEdgeData, "miso">;

let counter = 0;
export function nextId(prefix = "n"): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function createNode(data: MisoNodeData, position: { x: number; y: number }): MisoNode {
  return { id: nextId(data.kind), type: "miso", position, data };
}

export function createEdge(
  source: MisoNode,
  target: MisoNode,
  overrides: Partial<MisoEdgeData> = {},
): MisoEdge {
  const compatibility = evaluateConnection(source.data, target.data);
  const modifierKind = modifierKindFor(source.data);
  return {
    id: nextId("e"),
    source: source.id,
    target: target.id,
    type: "miso",
    data: {
      compatibility,
      modifierKind,
      settings: defaultSettings(modifierKind),
      ...overrides,
    },
  };
}

export function recomputeEdges(nodes: MisoNode[], edges: MisoEdge[]): MisoEdge[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return edges.map((e) => {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    const compatibility = evaluateConnection(s?.data, t?.data);
    return { ...e, data: { ...(e.data as MisoEdgeData), compatibility } };
  });
}

export function describeWorkflow(nodes: MisoNode[], edges: MisoEdge[]): string[] {
  if (nodes.length === 0) return [];
  const incoming = new Set(edges.map((e) => e.target));
  const roots = nodes.filter((n) => !incoming.has(n.id));
  const lines: string[] = [];
  const seen = new Set<string>();
  const walk = (node: MisoNode, depth: number) => {
    if (seen.has(node.id)) return;
    seen.add(node.id);
    lines.push(`${"  ".repeat(depth)}${depth ? "↓ " : ""}${node.data.name}`);
    edges
      .filter((e) => e.source === node.id)
      .forEach((e) => {
        const next = nodes.find((n) => n.id === e.target);
        if (next) walk(next, depth + 1);
      });
  };
  roots.forEach((r) => walk(r, 0));
  nodes.forEach((n) => walk(n, 0));
  return lines;
}
