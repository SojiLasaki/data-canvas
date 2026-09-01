import { memo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { Plus } from "lucide-react";
import type { MisoEdge } from "@/lib/canvas/graph";
import { nextId } from "@/lib/canvas/graph";
import { MODIFIERS, defaultSettings, evaluateConnection, modifierKindFor } from "@/lib/canvas/compatibility";
import { makeNode } from "@/lib/canvas/nodeFactory";
import type { MisoNodeData, NodeKind } from "@/lib/canvas/types";
import { STATE_TOKEN } from "./nodeVisuals";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const INSERTABLE: { label: string; kind: NodeKind; build: () => MisoNodeData }[] = [
  { label: "Filter", kind: "filter", build: () => makeNode("filter", "Filter", { description: "Location = Indiana", tags: ["Filter"] }) },
  { label: "Transform", kind: "transform", build: () => makeNode("transform", "Transform", { description: "Hourly → Daily average", tags: ["Transform"] }) },
  { label: "Aggregate", kind: "transform", build: () => makeNode("transform", "Aggregate", { description: "Hourly → Weekly average", tags: ["Aggregate"] }) },
  { label: "Compare", kind: "compare", build: () => makeNode("compare", "Compare", { description: "A vs B", tags: ["Compare"] }) },
  { label: "Normalize", kind: "transform", build: () => makeNode("transform", "Normalize", { description: "Scale 0–1", tags: ["Normalize"] }) },
  { label: "Calculate", kind: "transform", build: () => makeNode("transform", "Calculate", { description: "Derived metric", tags: ["Calculate"] }) },
  { label: "Convert Units", kind: "transform", build: () => makeNode("transform", "Convert Units", { description: "MW → GW", tags: ["Units"] }) },
  { label: "Resample", kind: "transform", build: () => makeNode("transform", "Resample", { description: "5-min → Hourly", tags: ["Resample"] }) },
];

function MisoEdgeLineInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<MisoEdge>) {
  const { setEdges, setNodes, getNode } = useReactFlow();
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const state = data?.compatibility.state ?? "uncertain";
  const token = STATE_TOKEN[state];
  const modifierKind = data?.modifierKind ?? "generic";
  const settings = data?.settings ?? {};

  const setSetting = (key: string, value: string) =>
    setEdges((edges) =>
      edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, settings: { ...(e.data?.["settings"] ?? {}), [key]: value } } } : e,
      ),
    );

  const insert = (item: (typeof INSERTABLE)[number]) => {
    const edge = { sourceX, sourceY, targetX, targetY };
    const newId = nextId(item.kind);
    const data0 = item.build();
    setNodes((nodes) => {
      const src = nodes.find((n) => n.id === (getNode(id)?.id ?? ""));
      void src;
      return [
        ...nodes,
        {
          id: newId,
          type: "miso",
          position: { x: (edge.sourceX + edge.targetX) / 2 - 124, y: (edge.sourceY + edge.targetY) / 2 - 40 },
          data: data0,
        },
      ];
    });
    setEdges((edges) => {
      const current = edges.find((e) => e.id === id);
      if (!current) return edges;
      const mk = modifierKindFor(data0);
      const rest = edges.filter((e) => e.id !== id);
      return [
        ...rest,
        {
          ...current,
          id: nextId("e"),
          target: newId,
          data: {
            ...current.data,
            compatibility: evaluateConnection(getNode(current.source)?.data as MisoNodeData | undefined, data0),
          },
        },
        {
          id: nextId("e"),
          source: newId,
          target: current.target,
          type: "miso",
          data: {
            compatibility: evaluateConnection(data0, getNode(current.target)?.data as MisoNodeData | undefined),
            modifierKind: mk,
            settings: defaultSettings(mk),
          },
        },
      ];
    });
    setMenuOpen(false);
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: token.stroke,
          strokeWidth: selected || hover ? 2.75 : 1.75,
          strokeDasharray: state === "uncertain" ? "6 4" : undefined,
        }}
      />
      <path
        d={path}
        fill="none"
        strokeWidth={18}
        stroke="transparent"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ cursor: "pointer" }}
      />
      <EdgeLabelRenderer>
        <div
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          className="pointer-events-auto absolute flex items-center gap-1"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${token.label}: ${data?.compatibility.reason ?? ""} Open connection settings.`}
                    className={cn(
                      "flex h-5 items-center gap-1 border bg-card px-1.5 text-[10px] font-semibold transition-colors",
                      state === "valid" && "border-valid text-valid",
                      state === "invalid" && "border-invalid text-invalid",
                      state === "uncertain" && "border-uncertain text-uncertain",
                    )}
                  >
                    <span aria-hidden>{token.icon}</span>
                    <span>{token.label}</span>
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">{data?.compatibility.reason}</TooltipContent>
            </Tooltip>
            <PopoverContent align="center" className="w-64 p-0">
              <div className="border-b border-border px-3 py-2">
                <p className="label-caps text-navy">Connection settings</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{data?.compatibility.reason}</p>
              </div>
              <div className="max-h-72 space-y-2.5 overflow-y-auto px-3 py-3">
                {MODIFIERS[modifierKind].map((m) => (
                  <div key={m.key}>
                    <label className="mb-1 block text-[11px] text-muted-foreground">{m.label}</label>
                    <Select value={settings[m.key] ?? m.options[0] ?? ""} onValueChange={(v) => setSetting(m.key, v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {m.options.map((o) => (
                          <SelectItem key={o} value={o} className="text-xs">
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div className="border-t border-border px-3 py-2">
                <Button size="sm" className="w-full" onClick={() => setSettingsOpen(false)}>
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {(hover || menuOpen) && (
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Add a node to this connection"
                  className="flex h-5 w-5 items-center justify-center border border-navy bg-card text-navy hover:bg-secondary"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-48 p-0">
                <p className="label-caps border-b border-border px-3 py-2 text-navy">Add to connection</p>
                <div className="py-1">
                  {INSERTABLE.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => insert(item)}
                      className="block w-full px-3 py-1.5 text-left text-xs hover:bg-secondary"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const MisoEdgeLine = memo(MisoEdgeLineInner);
