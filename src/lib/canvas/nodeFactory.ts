import type { DataType, MisoNodeData, MisoNodeFields, NodeKind, NodeMeta } from "./types";

const baseMeta: NodeMeta = {
  dataType: "any",
  timeSeries: false,
  geographic: false,
  structured: false,
  supportsVisualization: false,
  supportedInputs: [],
  supportedOutputs: [],
};

export const KIND_LABEL: Record<NodeKind, string> = {
  dataSource: "Data source",
  dataset: "Dataset",
  location: "Location",
  timeRange: "Time range",
  filter: "Filter",
  transform: "Transform",
  compare: "Compare",
  document: "Document",
  visualization: "Visualization",
  output: "Output",
};

export function makeNode(
  kind: NodeKind,
  name: string,
  opts: Omit<Partial<MisoNodeFields>, "meta"> & { meta?: Partial<NodeMeta> } = {},
): MisoNodeData {
  const presets: Record<NodeKind, Partial<NodeMeta>> = {
    dataSource: {
      dataType: "time-series",
      timeSeries: true,
      structured: true,
      supportedOutputs: ["time-series", "tabular"],
    },
    dataset: {
      dataType: "time-series",
      unit: "MW",
      timeSeries: true,
      structured: true,
      supportsVisualization: true,
      supportedOutputs: ["time-series", "tabular"],
    },
    location: {
      dataType: "geographic",
      geographic: true,
      structured: true,
      supportedOutputs: ["geographic", "parameter"],
    },
    timeRange: {
      dataType: "parameter",
      supportedOutputs: ["parameter"],
    },
    filter: {
      dataType: "time-series",
      structured: true,
      supportedInputs: ["time-series", "tabular", "geographic", "pricing", "parameter"],
      supportedOutputs: ["time-series", "tabular", "geographic", "pricing"],
    },
    transform: {
      dataType: "time-series",
      structured: true,
      supportedInputs: ["time-series", "tabular", "pricing"],
      supportedOutputs: ["time-series", "tabular", "pricing"],
    },
    compare: {
      dataType: "time-series",
      structured: true,
      supportsVisualization: true,
      supportedInputs: ["time-series", "tabular", "pricing", "categorical", "parameter"],
      supportedOutputs: ["time-series", "tabular", "categorical"],
    },
    document: {
      dataType: "document",
      format: "PDF",
      structured: false,
      supportedOutputs: ["document"],
    },
    visualization: {
      dataType: "chart",
      supportsVisualization: true,
      supportedInputs: ["time-series", "tabular", "categorical", "geographic", "pricing"],
      supportedOutputs: ["chart"],
    },
    output: {
      dataType: "tabular",
      supportedInputs: ["chart", "time-series", "tabular", "categorical", "pricing", "document"],
      supportedOutputs: [],
    },
  };

  return {
    kind,
    name,
    description: opts.description,
    tags: opts.tags ?? [],
    status: opts.status ?? "ready",
    config: opts.config ?? {},
    note: opts.note,
    meta: { ...baseMeta, ...presets[kind], ...opts.meta } as NodeMeta,
  };
}

export function acceptedTypes(meta: NodeMeta): DataType[] {
  return meta.supportedInputs;
}
