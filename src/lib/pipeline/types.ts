/**
 * The pipeline is the single source of truth shared by the simple result view,
 * the Blender-style modifier stack, the AI assistant and the node canvas.
 */

export type StepKind =
  | "source"
  | "filter"
  | "timeRange"
  | "aggregate"
  | "transform"
  | "sort"
  | "missing"
  | "compare"
  | "join"
  | "visualization"
  | "output";

export interface ParamSpec {
  key: string;
  label: string;
  /** when omitted the param is free text */
  options?: string[];
}

export interface PipelineStep {
  id: string;
  kind: StepKind;
  /** e.g. "Filter", "Aggregate" */
  title: string;
  /** short human summary, e.g. "Location = Indiana" */
  params: Record<string, string>;
  specs: ParamSpec[];
  enabled: boolean;
  /** ids of steps feeding this one (defaults to the previous enabled step) */
  inputs: string[];
}

export interface SourceRef {
  id: string;
  name: string;
  type: "API" | "Dataset" | "PDF";
  status: string;
  updated: string;
  dataType: string;
  unit: string;
  frequency: string;
  coverage: string;
  url: string;
  section?: string;
}

export interface AttributeRef {
  name: string;
  type: string;
  unit: string;
  source: string;
  usedBy: string[];
}

export interface Branch {
  id: string;
  stepId: string;
  /** where this intermediate result is sent */
  target: string;
}

export interface Pipeline {
  id: string;
  prompt: string;
  steps: PipelineStep[];
  sources: SourceRef[];
  attributes: AttributeRef[];
  /** attribute -> visualization channel mapping */
  channels: Record<string, string>;
  /** side outputs taken from an intermediate step */
  branches: Branch[];
}

export interface ResultRow {
  bucket: string;
  location: string;
  value: number;
  unit: string;
}

export interface PipelineResult {
  title: string;
  subtitle: string;
  unit: string;
  locations: string[];
  /** chart-ready wide rows: { bucket, [location]: value } */
  chartRows: Record<string, string | number>[];
  rows: ResultRow[];
  stats: { label: string; value: string }[];
  narrative: string;
  disabledNote: string | null;
}
