import { Plus } from "lucide-react";
import { makeNode, KIND_LABEL } from "@/lib/canvas/nodeFactory";
import type { MisoNodeData, NodeKind } from "@/lib/canvas/types";
import { NODE_ICON } from "./nodeVisuals";
import { Button } from "@/components/ui/button";

const PALETTE: { kind: NodeKind; build: () => MisoNodeData }[] = [
  { kind: "dataSource", build: () => makeNode("dataSource", "MISO Load API", { description: "Real-time system load endpoint", tags: ["Public", "Real-time"] }) },
  { kind: "dataset", build: () => makeNode("dataset", "New Dataset", { description: "Hourly measurements", tags: ["Hourly", "MW"] }) },
  { kind: "document", build: () => makeNode("document", "MISO Document", { description: "PDF report", tags: ["PDF"] }) },
  { kind: "location", build: () => makeNode("location", "Location", { tags: ["State"] }) },
  { kind: "timeRange", build: () => makeNode("timeRange", "Last 30 Days", { tags: ["Rolling"] }) },
  { kind: "filter", build: () => makeNode("filter", "Filter", { description: "Location = Indiana", tags: ["Filter"] }) },
  { kind: "transform", build: () => makeNode("transform", "Transform", { description: "Hourly → Daily average", tags: ["Transform"] }) },
  { kind: "compare", build: () => makeNode("compare", "Compare", { description: "Indiana vs Michigan", tags: ["Compare"] }) },
  { kind: "visualization", build: () => makeNode("visualization", "Line Chart", { tags: ["Line chart"], config: { type: "Line chart", xAxis: "Timestamp", yAxis: "Load MW", groupBy: "Location", aggregation: "Average", title: "Untitled chart" } }) },
  { kind: "output", build: () => makeNode("output", "Output", { tags: ["CSV", "PNG"], config: { format: "CSV" } }) },
];

export function NodePalette({
  onAdd,
  onSearch,
}: {
  onAdd: (data: MisoNodeData) => void;
  onSearch: () => void;
}) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-sidebar" aria-label="Add nodes">
      <div className="border-b border-border px-4 py-3">
        <p className="label-caps text-navy">Add</p>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {PALETTE.map((item) => {
          const Icon = NODE_ICON[item.kind];
          return (
            <button
              key={`${item.kind}-${item.build().name}`}
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/miso-node", JSON.stringify(item.build()));
                e.dataTransfer.effectAllowed = "move";
              }}
              onClick={() => onAdd(item.build())}
              className="group flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
            >
              <Icon className="h-4 w-4 text-primary" aria-hidden />
              <span className="flex-1 truncate">{KIND_LABEL[item.kind]}</span>
              <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          );
        })}
      </div>
      <div className="border-t border-border p-3">
        <Button variant="outline" size="sm" className="w-full" onClick={onSearch}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add node
        </Button>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          Search MISO resources, or drag any item onto the canvas.
        </p>
      </div>
    </aside>
  );
}
