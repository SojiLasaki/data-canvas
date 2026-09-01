/**
 * Core domain types for the MISO Data Canvas.
 * These shapes are intentionally backend-agnostic: the mock services in
 * `src/services` can later be swapped for FastAPI / LLM / MCP calls without
 * touching the canvas UI.
 */

export type NodeKind =
  | "dataSource"
  | "dataset"
  | "location"
  | "timeRange"
  | "filter"
  | "transform"
  | "compare"
  | "document"
  | "visualization"
  | "output";

export type DataType =
  | "time-series"
  | "tabular"
  | "geographic"
  | "categorical"
  | "document"
  | "pricing"
  | "chart"
  | "parameter"
  | "any";

export type NodeStatus = "idle" | "ready" | "running" | "complete" | "error" | "warning";

export interface NodeMeta {
  dataType: DataType;
  format?: string | undefined;
  unit?: string | undefined;
  timeSeries: boolean;
  geographic: boolean;
  structured: boolean;
  supportsVisualization: boolean;
  supportedInputs: DataType[];
  supportedOutputs: DataType[];
  /** true when the resource schema is unknown and compatibility can't be proven */
  schemaUnknown?: boolean | undefined;
}

export interface MisoNodeFields {
  kind: NodeKind;
  name: string;
  description?: string | undefined;
  tags: string[];
  status: NodeStatus;
  meta: NodeMeta;
  config: Record<string, string>;
  collapsed?: boolean | undefined;
  note?: string | undefined;
}

export type CompatibilityState = "valid" | "invalid" | "uncertain";

export interface CompatibilityResult {
  state: CompatibilityState;
  /** Short accessible label, e.g. "Compatible" */
  label: string;
  /** Human explanation of WHY */
  reason: string;
}

export type MisoNodeData = MisoNodeFields & Record<string, unknown>;

export type ModifierKind = "time-series" | "pricing" | "geographic" | "document" | "generic";

export interface EdgeModifier {
  key: string;
  label: string;
  options: string[];
}

export interface MisoEdgeFields {
  compatibility: CompatibilityResult;
  modifierKind: ModifierKind;
  settings: Record<string, string>;
}

export interface CanvasResource {
  id: string;
  title: string;
  subtitle: string;
  kind: NodeKind;
  keywords: string[];
  build: () => MisoNodeData;
}

export type MisoEdgeData = MisoEdgeFields & Record<string, unknown>;
