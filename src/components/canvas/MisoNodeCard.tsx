import { memo, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight, Copy, MoreHorizontal, Trash2 } from "lucide-react";
import type { MisoNode } from "@/lib/canvas/graph";
import { nextId } from "@/lib/canvas/graph";
import { KIND_LABEL } from "@/lib/canvas/nodeFactory";
import { NODE_ICON } from "./nodeVisuals";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const STATUS_STYLE: Record<string, string> = {
  idle: "bg-muted-foreground",
  ready: "bg-primary",
  running: "bg-uncertain animate-pulse",
  complete: "bg-valid",
  warning: "bg-uncertain",
  error: "bg-invalid",
};

function MisoNodeCardInner({ id, data, selected }: NodeProps<MisoNode>) {
  const { setNodes, setEdges, getNode } = useReactFlow();
  const [hover, setHover] = useState(false);
  const Icon = NODE_ICON[data.kind];
  const collapsed = Boolean(data.collapsed);
  const hasInput = data.meta.supportedInputs.length > 0;
  const hasOutput = data.meta.supportedOutputs.length > 0 || data.kind === "visualization";

  const patch = (next: Partial<typeof data>) =>
    setNodes((nodes) => nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...next } } : n)));

  const duplicate = () => {
    const node = getNode(id);
    if (!node) return;
    setNodes((nodes) => [
      ...nodes,
      { ...node, id: nextId(data.kind), selected: false, position: { x: node.position.x + 60, y: node.position.y + 60 } },
    ]);
  };

  const remove = () => {
    setNodes((nodes) => nodes.filter((n) => n.id !== id));
    setEdges((edges) => edges.filter((e) => e.source !== id && e.target !== id));
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "w-[248px] border bg-card text-card-foreground transition-colors",
        selected ? "border-primary shadow-[0_0_0_1px_var(--primary)]" : "border-border",
        hover && !selected && "border-navy/40",
      )}
    >
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !border-2 !border-card !bg-navy transition-all hover:!h-4 hover:!w-4"
          aria-label={`Input for ${data.name}`}
        />
      )}

      <div className="flex items-center justify-between border-b border-border bg-secondary px-3 py-1.5">
        <div className="flex items-center gap-1.5 text-navy">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          <span className="label-caps">{KIND_LABEL[data.kind]}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={collapsed ? "Expand node" : "Collapse node"}
            onClick={() => patch({ collapsed: !collapsed })}
            className="text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Actions for ${data.name}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onSelect={duplicate}>
                <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setEdges((edges) => edges.filter((e) => e.source !== id && e.target !== id))}
              >
                Disconnect all
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={remove} className="text-invalid focus:text-invalid">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight text-navy">{data.name}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn("mt-1 h-2 w-2 shrink-0", STATUS_STYLE[data.status] ?? "bg-muted-foreground")}
                aria-label={`Status: ${data.status}`}
              />
            </TooltipTrigger>
            <TooltipContent>Status: {data.status}</TooltipContent>
          </Tooltip>
        </div>

        {!collapsed && (
          <>
            {data.description && (
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{data.description}</p>
            )}
            {data.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1">
                {data.tags.map((t) => (
                  <span key={t} className="border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{hasInput ? "● Input" : ""}</span>
              <span>{hasOutput ? "Output ●" : ""}</span>
            </div>
          </>
        )}
      </div>

      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !border-card !bg-primary transition-all hover:!h-4 hover:!w-4"
          aria-label={`Output from ${data.name}`}
        />
      )}
    </div>
  );
}

export const MisoNodeCard = memo(MisoNodeCardInner);
