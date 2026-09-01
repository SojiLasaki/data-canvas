import type { CompatibilityResult, MisoNodeData, ModifierKind } from "./types";
import { KIND_LABEL } from "./nodeFactory";

/**
 * Frontend compatibility engine (mock).
 * Deliberately pure + metadata driven so a real backend/AI engine can replace
 * `evaluateConnection` with a network call returning the same shape.
 */
export function evaluateConnection(
  source: MisoNodeData | undefined,
  target: MisoNodeData | undefined,
): CompatibilityResult {
  if (!source || !target) {
    return {
      state: "uncertain",
      label: "Needs review",
      reason: "Additional information is needed to determine whether these resources are compatible.",
    };
  }

  const outputs = source.meta.supportedOutputs;
  const inputs = target.meta.supportedInputs;

  if (target.kind === "output") {
    return {
      state: "valid",
      label: "Compatible",
      reason: `${source.name} can be exported from this output node.`,
    };
  }

  if (inputs.length === 0) {
    return {
      state: "invalid",
      label: "Incompatible",
      reason: `${KIND_LABEL[target.kind]} nodes do not accept incoming data. Connect ${target.name} as a source instead.`,
    };
  }

  if (source.meta.schemaUnknown || target.meta.schemaUnknown) {
    return {
      state: "uncertain",
      label: "Needs review",
      reason:
        "Additional information is needed to determine whether these resources are compatible. Ask the Canvas Assistant to inspect the schema.",
    };
  }

  if (source.kind === "document" && target.kind === "visualization") {
    return {
      state: "invalid",
      label: "Incompatible",
      reason:
        "This document does not contain structured time-series data required for this visualization. Add an extraction transform first.",
    };
  }

  if (source.kind === "document" && !inputs.includes("document")) {
    return {
      state: "invalid",
      label: "Incompatible",
      reason: `${target.name} expects structured data, but ${source.name} is an unstructured ${source.meta.format ?? "document"}.`,
    };
  }

  const match = outputs.find((o) => inputs.includes(o) || o === "any" || inputs.includes("any"));
  if (match) {
    return {
      state: "valid",
      label: "Compatible",
      reason: `${source.name} emits ${match} data, which ${target.name} accepts.`,
    };
  }

  if (target.kind === "visualization" && !source.meta.structured) {
    return {
      state: "invalid",
      label: "Incompatible",
      reason: `${source.name} is not structured, so it cannot be plotted directly.`,
    };
  }

  return {
    state: "invalid",
    label: "Incompatible",
    reason: `${source.name} emits ${outputs.join(", ") || "no"} data, but ${target.name} accepts ${inputs.join(", ")}.`,
  };
}

export function modifierKindFor(source: MisoNodeData | undefined): ModifierKind {
  if (!source) return "generic";
  if (source.kind === "document") return "document";
  if (source.meta.dataType === "pricing") return "pricing";
  if (source.meta.dataType === "geographic") return "geographic";
  if (source.meta.timeSeries) return "time-series";
  return "generic";
}

export const MODIFIERS: Record<ModifierKind, { key: string; label: string; options: string[] }[]> = {
  "time-series": [
    { key: "timeRange", label: "Time range", options: ["Last 7 days", "Last 30 days", "Last 90 days", "Year to date"] },
    { key: "frequency", label: "Frequency", options: ["5-minute", "Hourly", "Daily", "Weekly"] },
    { key: "aggregation", label: "Aggregation", options: ["Average", "Sum", "Peak", "Minimum"] },
    { key: "movingAverage", label: "Moving average", options: ["None", "3-point", "7-point"] },
    { key: "missing", label: "Missing values", options: ["Ignore", "Interpolate", "Zero fill"] },
    { key: "timezone", label: "Time zone", options: ["EPT", "UTC", "Local"] },
  ],
  pricing: [
    { key: "market", label: "Market", options: ["Day-ahead", "Real-time"] },
    { key: "location", label: "Location", options: ["Hub", "Zone", "Node"] },
    { key: "priceType", label: "Price type", options: ["LMP", "Congestion", "Loss", "Energy"] },
    { key: "interval", label: "Interval", options: ["5-minute", "Hourly"] },
    { key: "unit", label: "Unit", options: ["$/MWh", "$/kWh"] },
  ],
  geographic: [
    { key: "region", label: "Region", options: ["MISO North", "MISO Central", "MISO South", "All"] },
    { key: "boundary", label: "Boundary", options: ["State", "Local resource zone", "Balancing authority"] },
    { key: "geoAggregation", label: "Geographic aggregation", options: ["None", "By state", "By zone"] },
    { key: "coordinates", label: "Coordinates", options: ["WGS84", "Web Mercator"] },
  ],
  document: [
    { key: "pages", label: "Page range", options: ["All pages", "1–25", "26–100", "Custom"] },
    { key: "section", label: "Section", options: ["Auto-detect", "Transmission planning", "Market results", "Appendix"] },
    { key: "keyword", label: "Keyword", options: ["None", "Load forecast", "Congestion", "Interconnection"] },
    { key: "extraction", label: "Extraction mode", options: ["Semantic", "Tables only", "Full text"] },
  ],
  generic: [
    { key: "unit", label: "Units", options: ["MW", "GW", "MWh"] },
    { key: "missing", label: "Missing values", options: ["Ignore", "Interpolate"] },
  ],
};

export function defaultSettings(kind: ModifierKind): Record<string, string> {
  return Object.fromEntries(MODIFIERS[kind].map((m) => [m.key, m.options[0] as string]));
}
