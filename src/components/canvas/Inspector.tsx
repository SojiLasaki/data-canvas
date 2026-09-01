import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, Download, ExternalLink, Sparkles } from "lucide-react";
import type { MisoNode } from "@/lib/canvas/graph";
import type { MisoNodeData } from "@/lib/canvas/types";
import { KIND_LABEL } from "@/lib/canvas/nodeFactory";
import { misoService, type DatasetPreviewRow } from "@/services/misoService";
import { documentService, type DocumentSection } from "@/services/documentService";
import { visualizationService, CHART_TYPES } from "@/services/visualizationService";
import { aiService } from "@/services/aiService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NODE_ICON } from "./nodeVisuals";

const SUGGESTIONS = ["Compare", "Filter", "Aggregate", "Visualize", "Download", "Find related data"];
const OUTPUT_FORMATS = ["CSV", "Excel", "PNG", "SVG", "JSON", "PDF"];

export function Inspector({
  node,
  upstream,
  onPatch,
  onSuggestion,
}: {
  node: MisoNode | null;
  upstream: MisoNodeData[];
  onPatch: (id: string, patch: Partial<MisoNodeData>) => void;
  onSuggestion: (action: string, node: MisoNode) => void;
}) {
  const [rows, setRows] = useState<DatasetPreviewRow[]>([]);
  const [sections, setSections] = useState<DocumentSection[]>([]);

  useEffect(() => {
    if (!node) return;
    if (node.data.kind === "dataset" || node.data.kind === "dataSource") {
      void misoService.preview(node.data).then(setRows);
    }
    if (node.data.kind === "document") {
      void documentService.sections(node.data.name).then(setSections);
    }
  }, [node]);

  if (!node) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Select a node to inspect its data, settings and suggested next steps.
      </div>
    );
  }

  const Icon = NODE_ICON[node.data.kind];
  const cfg = node.data.config;
  const setCfg = (key: string, value: string) =>
    onPatch(node.id, { config: { ...cfg, [key]: value } });

  const seriesNames = upstream.length ? upstream.map((u) => u.name) : [node.data.name];
  const chartData = visualizationService.build(seriesNames, 24);
  const recommendation = aiService.recommendVisualization(upstream[0] ?? node.data);

  return (
    <div className="space-y-5 px-4 py-4">
      <div>
        <div className="flex items-center gap-1.5 text-navy">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          <span className="label-caps">{KIND_LABEL[node.data.kind]}</span>
        </div>
        <Input
          value={node.data.name}
          onChange={(e) => onPatch(node.id, { name: e.target.value })}
          className="mt-2 h-9"
          aria-label="Node name"
        />
        {node.data.description && (
          <p className="mt-2 text-xs text-muted-foreground">{node.data.description}</p>
        )}
      </div>

      {(node.data.kind === "dataset" || node.data.kind === "dataSource") && (
        <section>
          <p className="label-caps text-navy">Data preview</p>
          <div className="mt-2 max-h-56 overflow-auto border border-border">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-secondary text-muted-foreground">
                <tr>
                  <th className="px-2 py-1 text-left font-medium">Timestamp</th>
                  <th className="px-2 py-1 text-left font-medium">Location</th>
                  <th className="px-2 py-1 text-right font-medium">Value</th>
                  <th className="px-2 py-1 text-left font-medium">Unit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.timestamp} className="border-t border-border">
                    <td className="px-2 py-1">{r.timestamp}</td>
                    <td className="px-2 py-1">{r.location}</td>
                    <td className="px-2 py-1 text-right tabular-nums">{r.value.toLocaleString()}</td>
                    <td className="px-2 py-1">{r.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => onSuggestion("Open full dataset", node)}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open full dataset
            </Button>
            <Button size="sm" variant="outline" onClick={() => onSuggestion("Download", node)}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download
            </Button>
            <Button size="sm" onClick={() => onSuggestion("Visualize", node)}>
              Visualize
            </Button>
          </div>
        </section>
      )}

      {node.data.kind === "document" && (
        <section>
          <p className="label-caps text-navy">Sections</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Only the relevant section is loaded — no full download required.
          </p>
          <div className="mt-2 space-y-2">
            {sections.map((s) => (
              <button
                key={s.title}
                type="button"
                onClick={() => onSuggestion(`Extract: ${s.title}`, node)}
                className="block w-full border border-border px-3 py-2 text-left hover:border-primary"
              >
                <p className="text-xs font-semibold text-navy">{s.title}</p>
                <p className="text-[11px] text-muted-foreground">{s.pages}</p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{s.snippet}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {node.data.kind === "visualization" && (
        <section className="space-y-3">
          <div className="border border-primary/30 bg-accent/40 px-3 py-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-navy">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Recommended: {recommendation.type}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{recommendation.reason}</p>
          </div>
          <ConfigSelect label="Type" value={cfg["type"] ?? "Line chart"} options={CHART_TYPES} onChange={(v) => setCfg("type", v)} />
          <ConfigSelect label="X axis" value={cfg["xAxis"] ?? "Timestamp"} options={["Timestamp", "Location", "Hour"]} onChange={(v) => setCfg("xAxis", v)} />
          <ConfigSelect label="Y axis" value={cfg["yAxis"] ?? "Load MW"} options={["Load MW", "Price $/MWh", "Generation MW"]} onChange={(v) => setCfg("yAxis", v)} />
          <ConfigSelect label="Group by" value={cfg["groupBy"] ?? "Location"} options={["Location", "None", "Market"]} onChange={(v) => setCfg("groupBy", v)} />
          <ConfigSelect label="Aggregation" value={cfg["aggregation"] ?? "Average"} options={["Average", "Sum", "Peak"]} onChange={(v) => setCfg("aggregation", v)} />
          <div>
            <label className="mb-1 block text-[11px] text-muted-foreground">Title</label>
            <Input className="h-8 text-xs" value={cfg["title"] ?? ""} onChange={(e) => setCfg("title", e.target.value)} />
          </div>
          <div className="h-44 border border-border p-2">
            <ResponsiveContainer width="100%" height="100%">
              {(cfg["type"] ?? "Line chart") === "Bar chart" ? (
                <BarChart data={chartData}>
                  <CartesianGrid stroke="var(--canvas-grid)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} width={38} />
                  <RTooltip />
                  {seriesNames.map((s, i) => (
                    <Bar key={s} dataKey={s} fill={`var(--chart-${(i % 5) + 1})`} />
                  ))}
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid stroke="var(--canvas-grid)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} width={38} />
                  <RTooltip />
                  {seriesNames.map((s, i) => (
                    <Line key={s} type="monotone" dataKey={s} dot={false} stroke={`var(--chart-${(i % 5) + 1})`} strokeWidth={2} />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {node.data.kind === "output" && (
        <section>
          <p className="label-caps text-navy">Export format</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {OUTPUT_FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onPatch(node.id, { config: { ...cfg, format: f }, tags: [f] })}
                className={`border px-2 py-1.5 text-xs ${
                  (cfg["format"] ?? "CSV") === f ? "border-primary bg-accent text-navy" : "border-border text-muted-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="label-caps text-navy">What would you like to do?</p>
        <div className="mt-2 space-y-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestion(s, node)}
              className="flex w-full items-center gap-2 border border-transparent px-2 py-1.5 text-left text-xs text-foreground hover:border-border hover:bg-secondary"
            >
              <ArrowRight className="h-3 w-3 text-primary" /> {s}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="label-caps text-navy">Metadata</p>
        <dl className="mt-2 space-y-1 text-[11px]">
          {Object.entries({
            dataType: node.data.meta.dataType,
            unit: node.data.meta.unit ?? "—",
            timeSeries: String(node.data.meta.timeSeries),
            geographic: String(node.data.meta.geographic),
            structured: String(node.data.meta.structured),
            accepts: node.data.meta.supportedInputs.join(", ") || "—",
            emits: node.data.meta.supportedOutputs.join(", ") || "—",
          }).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-border/60 pb-1">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right text-navy">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function ConfigSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o} className="text-xs">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
