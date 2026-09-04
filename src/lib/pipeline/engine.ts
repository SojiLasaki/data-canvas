import type {
  AttributeRef,
  ParamSpec,
  Pipeline,
  PipelineResult,
  PipelineStep,
  ResultRow,
  SourceRef,
  StepKind,
} from "./types";

let seq = 0;
export function stepId(prefix = "s"): string {
  seq += 1;
  return `${prefix}-${seq}-${Math.random().toString(36).slice(2, 7)}`;
}

export const STEP_LABEL: Record<StepKind, string> = {
  source: "Data source",
  filter: "Filter",
  timeRange: "Time range",
  aggregate: "Aggregation",
  transform: "Transform",
  sort: "Sort",
  missing: "Missing data",
  compare: "Compare",
  join: "Join",
  visualization: "Visualization",
  output: "Output",
};

export const LOCATIONS = [
  "Indiana",
  "Michigan",
  "Illinois",
  "Minnesota",
  "Missouri",
  "Louisiana",
  "All MISO",
];

export const RANGES = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "Year to Date"];
export const FREQUENCIES = ["Hourly", "Daily", "Weekly", "Monthly"];
export const OPERATIONS = ["Average", "Sum", "Minimum", "Maximum", "Median"];
export const CHART_TYPES = ["Line chart", "Area chart", "Bar chart", "Table"];

const SPECS: Record<StepKind, ParamSpec[]> = {
  source: [
    { key: "dataset", label: "Dataset", options: ["MISO Load Data", "MISO LMP Pricing", "Wind Generation"] },
    { key: "connection", label: "Connection", options: ["MISO API", "Cached snapshot"] },
  ],
  filter: [
    { key: "location", label: "Location", options: LOCATIONS },
    { key: "market", label: "Market", options: ["All", "Day-ahead", "Real-time"] },
    { key: "status", label: "Status", options: ["Active", "All records"] },
  ],
  timeRange: [
    { key: "range", label: "Range", options: RANGES },
    { key: "timezone", label: "Time zone", options: ["EPT", "UTC", "Local"] },
  ],
  aggregate: [
    { key: "operation", label: "Operation", options: OPERATIONS },
    { key: "frequency", label: "Frequency", options: FREQUENCIES },
    { key: "groupBy", label: "Group by", options: ["Timestamp", "Location", "Day"] },
    { key: "unit", label: "Unit", options: ["MW", "GW", "$/MWh"] },
  ],
  transform: [
    { key: "operation", label: "Operation", options: ["None", "Normalize", "Percent change", "Difference", "Convert units", "Resample"] },
    { key: "basis", label: "Basis", options: ["Absolute", "Indexed to 100"] },
  ],
  sort: [
    { key: "field", label: "Field", options: ["Timestamp", "Value", "Location"] },
    { key: "direction", label: "Direction", options: ["Ascending", "Descending"] },
  ],
  missing: [
    { key: "strategy", label: "Strategy", options: ["Ignore", "Interpolate", "Zero fill", "Drop rows"] },
  ],
  compare: [
    { key: "against", label: "Compare with", options: LOCATIONS },
    { key: "basis", label: "Basis", options: ["Absolute", "Difference", "Percent"] },
  ],
  join: [
    { key: "on", label: "Join on", options: ["Timestamp", "Location"] },
    { key: "type", label: "Type", options: ["Inner", "Left", "Outer"] },
  ],
  visualization: [
    { key: "type", label: "Chart type", options: CHART_TYPES },
    { key: "xAxis", label: "X axis", options: ["Timestamp", "Location"] },
    { key: "yAxis", label: "Y axis", options: ["Load", "Price", "Value"] },
    { key: "groupBy", label: "Group by", options: ["Location", "None"] },
    { key: "title", label: "Title" },
    { key: "legend", label: "Legend", options: ["Enabled", "Disabled"] },
    { key: "grid", label: "Grid", options: ["Enabled", "Disabled"] },
  ],
  output: [
    { key: "format", label: "Format", options: ["CSV", "Excel", "JSON", "PNG"] },
  ],
};

export function specsFor(kind: StepKind): ParamSpec[] {
  return SPECS[kind];
}

export function makeStep(
  kind: StepKind,
  params: Record<string, string> = {},
  opts: { title?: string; enabled?: boolean } = {},
): PipelineStep {
  const specs = SPECS[kind];
  const base = Object.fromEntries(specs.map((s) => [s.key, s.options?.[0] ?? ""]));
  return {
    id: stepId(kind),
    kind,
    title: opts.title ?? STEP_LABEL[kind],
    params: { ...base, ...params },
    specs,
    enabled: opts.enabled ?? true,
    inputs: [],
  };
}

/** Short one-line summary shown on the collapsed modifier card. */
export function summarize(step: PipelineStep): string {
  const p = step.params;
  switch (step.kind) {
    case "source":
      return `${p["dataset"]} · ${p["connection"]}`;
    case "filter":
      return `Location = ${p["location"]}`;
    case "timeRange":
      return `${p["range"]}`;
    case "aggregate":
      return `${p["operation"]} · ${p["frequency"]}`;
    case "transform":
      return p["operation"] === "None" ? "Pass-through" : `${p["operation"]}`;
    case "sort":
      return `${p["field"]} · ${p["direction"]}`;
    case "missing":
      return `${p["strategy"]}`;
    case "compare":
      return `${p["basis"]}`;
    case "join":
      return `On ${p["on"]} · ${p["type"]}`;
    case "visualization":
      return `${p["type"]}`;
    case "output":
      return `${p["format"]}`;
    default:
      return "";
  }
}

/* ---------------- deterministic mock data ---------------- */

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) % 100000;
  return h;
}

function bucketsFor(range: string, frequency: string): string[] {
  const days = range === "Last 7 Days" ? 7 : range === "Last 90 Days" ? 90 : range === "Year to Date" ? 240 : 30;
  const start = new Date("2026-09-04T00:00:00Z").getTime() - days * 86400000;
  const fmt = (t: number, withHour: boolean) => {
    const d = new Date(t);
    const base = d.toISOString().slice(0, 10);
    return withHour ? `${base} ${String(d.getUTCHours()).padStart(2, "0")}:00` : base;
  };
  if (frequency === "Hourly") {
    const stepH = days > 30 ? 6 : 3;
    const n = Math.min(160, Math.floor((days * 24) / stepH));
    return Array.from({ length: n }, (_, i) => fmt(start + i * stepH * 3600000, true));
  }
  if (frequency === "Weekly") {
    const n = Math.max(2, Math.ceil(days / 7));
    return Array.from({ length: n }, (_, i) => `Week of ${fmt(start + i * 7 * 86400000, false)}`);
  }
  if (frequency === "Monthly") {
    const n = Math.max(2, Math.ceil(days / 30));
    return Array.from({ length: n }, (_, i) => fmt(start + i * 30 * 86400000, false).slice(0, 7));
  }
  return Array.from({ length: days }, (_, i) => fmt(start + i * 86400000, false));
}

function value(location: string, i: number, op: string, pricing: boolean): number {
  const seed = hash(location);
  const base = pricing ? 34 + (seed % 11) : 9800 + (seed % 40) * 78;
  const wave = Math.sin((i + seed) / 3.6) * (pricing ? 7 : 1450) + Math.cos((i + seed) / 11) * (pricing ? 3 : 620);
  const raw = base + wave + i * (pricing ? 0.02 : 3);
  const mult =
    op === "Sum" ? 1.94 : op === "Maximum" ? 1.16 : op === "Minimum" ? 0.83 : op === "Median" ? 0.99 : 1;
  return Math.round(raw * mult * 100) / 100;
}

/* ---------------- execution ---------------- */

export function runPipeline(pipeline: Pipeline): PipelineResult {
  const active = pipeline.steps.filter((s) => s.enabled);
  const get = (kind: StepKind) => active.find((s) => s.kind === kind);

  const source = pipeline.steps.find((s) => s.kind === "source");
  const pricing = (source?.params["dataset"] ?? "").includes("LMP");

  const filter = get("filter");
  const compare = get("compare");
  const time = get("timeRange");
  const agg = get("aggregate");
  const transform = get("transform");
  const sort = get("sort");
  const viz = pipeline.steps.find((s) => s.kind === "visualization");

  const primary = filter?.params["location"] ?? "All MISO";
  const secondary = compare?.params["against"];
  const locations = filter
    ? [primary, ...(secondary && secondary !== primary ? [secondary] : [])]
    : ["All MISO"];

  const range = time?.params["range"] ?? "Last 90 Days";
  const frequency = agg?.params["frequency"] ?? "Hourly";
  const operation = agg?.params["operation"] ?? "Average";
  const unit = pricing ? "$/MWh" : (agg?.params["unit"] ?? "MW");

  const buckets = bucketsFor(range, frequency);

  const scale = unit === "GW" ? 0.001 : 1;
  let chartRows = buckets.map((bucket, i) => {
    const row: Record<string, string | number> = { bucket };
    locations.forEach((loc) => {
      row[loc] = Math.round(value(loc, i, operation, pricing) * scale * 100) / 100;
    });
    return row;
  });

  const op = transform?.params["operation"];
  if (op === "Normalize" || transform?.params["basis"] === "Indexed to 100") {
    const firsts = Object.fromEntries(locations.map((l) => [l, Number(chartRows[0]?.[l] ?? 1) || 1]));
    chartRows = chartRows.map((r) => {
      const next: Record<string, string | number> = { bucket: r["bucket"] as string };
      locations.forEach((l) => {
        next[l] = Math.round((Number(r[l]) / (firsts[l] as number)) * 100 * 100) / 100;
      });
      return next;
    });
  } else if (op === "Percent change") {
    chartRows = chartRows.map((r, i) => {
      const prev = chartRows[Math.max(0, i - 1)];
      const next: Record<string, string | number> = { bucket: r["bucket"] as string };
      locations.forEach((l) => {
        const p = Number(prev?.[l] ?? r[l]) || 1;
        next[l] = Math.round(((Number(r[l]) - p) / p) * 10000) / 100;
      });
      return next;
    });
  }

  if (sort?.params["direction"] === "Descending") chartRows = [...chartRows].reverse();

  const rows: ResultRow[] = chartRows.flatMap((r) =>
    locations.map((loc) => ({
      bucket: r["bucket"] as string,
      location: loc,
      value: Number(r[loc]),
      unit,
    })),
  );

  const nums = rows.map((r) => r.value);
  const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  const fmt = (n: number) => `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;

  const label = pricing ? "Price" : "Load";
  const disabled = pipeline.steps.filter((s) => !s.enabled);

  return {
    title:
      viz?.params["title"]?.trim() ||
      `${locations.join(" vs ")} Electricity ${label}`,
    subtitle: `${range} · ${frequency} · ${unit}`,
    unit,
    locations,
    chartRows,
    rows,
    stats: [
      { label: `${operation} ${label.toLowerCase()}`, value: fmt(Math.round(avg * 100) / 100) },
      { label: "Peak", value: fmt(nums.length ? Math.max(...nums) : 0) },
      { label: "Minimum", value: fmt(nums.length ? Math.min(...nums) : 0) },
      { label: "Data points", value: String(rows.length) },
    ],
    narrative: `${locations.join(" and ")} ${label.toLowerCase()} over the ${range.toLowerCase()}, aggregated ${frequency.toLowerCase()} using the ${operation.toLowerCase()} of each interval. Values are reported in ${unit} and sourced live from the MISO ${pricing ? "pricing" : "load"} API.`,
    disabledNote: disabled.length
      ? `${disabled.map((s) => s.title).join(", ")} ${disabled.length === 1 ? "is" : "are"} disabled and not affecting this result.`
      : null,
  };
}

/* ---------------- pipeline construction from a question ---------------- */

function locationFromPrompt(prompt: string): string[] {
  const found = LOCATIONS.filter((l) => prompt.toLowerCase().includes(l.toLowerCase()));
  return found.length ? found : ["Indiana"];
}

function rangeFromPrompt(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("7 day") || p.includes("week")) return "Last 7 Days";
  if (p.includes("90") || p.includes("quarter")) return "Last 90 Days";
  if (p.includes("year")) return "Year to Date";
  return "Last 30 Days";
}

const ATTRIBUTES: AttributeRef[] = [
  { name: "Timestamp", type: "Datetime", unit: "EPT", source: "MISO Load API", usedBy: ["Time range", "Aggregation", "Visualization"] },
  { name: "Location", type: "Categorical", unit: "—", source: "MISO Load API", usedBy: ["Filter", "Visualization"] },
  { name: "Load", type: "Numeric", unit: "MW", source: "MISO Load API", usedBy: ["Aggregation", "Visualization"] },
  { name: "Unit", type: "Text", unit: "—", source: "MISO Load API", usedBy: ["Visualization"] },
  { name: "Market", type: "Categorical", unit: "—", source: "MISO Load API", usedBy: ["Filter"] },
  { name: "Node", type: "Text", unit: "—", source: "MISO Load API", usedBy: ["Filter"] },
  { name: "Interval", type: "Numeric", unit: "min", source: "MISO Load API", usedBy: ["Aggregation"] },
];

export function buildPipeline(prompt: string): Pipeline {
  const locations = locationFromPrompt(prompt);
  const range = rangeFromPrompt(prompt);
  const pricing = /price|lmp|market cost/i.test(prompt);
  const compareRequested = /compare|versus| vs /i.test(prompt) || locations.length > 1;
  const unit = pricing ? "$/MWh" : "MW";

  const sources: SourceRef[] = [
    {
      id: "miso-api",
      name: pricing ? "MISO Pricing API" : "MISO Load API",
      type: "API",
      status: "Connected",
      updated: "12 seconds ago",
      dataType: "Time series",
      unit,
      frequency: "Hourly",
      coverage: "MISO Market",
      url: pricing ? "https://api.misoenergy.org/pricing/lmp" : "https://api.misoenergy.org/load/hourly",
    },
    {
      id: "miso-dataset",
      name: "MISO Market Data",
      type: "Dataset",
      status: "Cached",
      updated: "4 minutes ago",
      dataType: "Tabular",
      unit,
      frequency: "Hourly",
      coverage: locations.join(", "),
      url: "https://data.misoenergy.org/market-data",
    },
    {
      id: "miso-report",
      name: "MISO Market Report.pdf",
      type: "PDF",
      status: "Referenced",
      updated: "Quarterly",
      dataType: "Document",
      unit: "—",
      frequency: "Quarterly",
      coverage: "MISO Market",
      url: "https://docs.misoenergy.org/market-report.pdf",
      section: "Pages 82–87",
    },
  ];

  const steps: PipelineStep[] = [
    makeStep("source", { dataset: pricing ? "MISO LMP Pricing" : "MISO Load Data", connection: "MISO API" }),
    makeStep("filter", { location: locations[0] as string }),
    makeStep("timeRange", { range }),
    makeStep("aggregate", { operation: "Average", frequency: "Hourly", unit }),
    makeStep("transform", { operation: "None" }, { enabled: false }),
    makeStep("visualization", {
      type: "Line chart",
      xAxis: "Timestamp",
      yAxis: pricing ? "Price" : "Load",
      groupBy: "Location",
      title: "",
    }),
  ];

  if (compareRequested && locations[1]) {
    const cmp = makeStep("compare", { basis: "Absolute" });
    cmp.specs = [
      { key: "basis", label: "Basis", options: ["Absolute", "Difference", "Percent"] },
      { key: "against", label: "Compare against", options: LOCATIONS },
    ];
    cmp.params["against"] = locations[1];
    steps.splice(4, 0, cmp);
  }

  // linear chain by default
  steps.forEach((s, i) => {
    const prev = steps[i - 1];
    s.inputs = prev ? [prev.id] : [];
  });

  return {
    id: stepId("pipeline"),
    prompt,
    steps,
    sources,
    attributes: ATTRIBUTES.map((a) => (pricing && a.name === "Load" ? { ...a, name: "Price", unit: "$/MWh" } : a)),
    channels: { Timestamp: "X axis", Load: "Y axis", Price: "Y axis", Location: "Group by" },
    branches: [],
  };
}
