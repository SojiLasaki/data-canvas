import { useState } from "react";
import {
  ArrowDown,
  BarChart3,
  ChevronDown,
  Database,
  Filter as FilterIcon,
  FileDown,
  GitCompare,
  MoreHorizontal,
  Plus,
  Sigma,
  SlidersHorizontal,
  Table as TableIcon,
  Timer,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { STEP_LABEL, summarize } from "@/lib/pipeline/engine";
import type { Pipeline, PipelineStep, StepKind } from "@/lib/pipeline/types";

const ICONS: Record<StepKind, typeof Database> = {
  source: Database,
  filter: FilterIcon,
  timeRange: Timer,
  aggregate: Sigma,
  transform: SlidersHorizontal,
  sort: SlidersHorizontal,
  missing: SlidersHorizontal,
  compare: GitCompare,
  join: GitCompare,
  visualization: BarChart3,
  output: FileDown,
};

export const BRANCH_TARGETS = ["Table", "Line chart", "Bar chart", "CSV", "Processor", "AI summary"];

/** Branch compatibility mirrors the canvas connector colour system. */
export function branchState(step: PipelineStep, target: string): "valid" | "invalid" | "uncertain" {
  if (!step.enabled) return "uncertain";
  if (step.kind === "visualization" && target !== "CSV") return "invalid";
  if (step.kind === "source" && target === "Line chart") return "uncertain";
  return "valid";
}

const STATE_CLASS = {
  valid: "border-valid text-valid",
  invalid: "border-invalid text-invalid",
  uncertain: "border-uncertain text-uncertain",
} as const;

export function PipelineStack({
  pipeline,
  selectedId,
  onSelect,
  onToggle,
  onMove,
  onRemove,
  onDisconnect,
  onReconnect,
  onAddBranch,
  onRemoveBranch,
  onAddProcessor,
}: {
  pipeline: Pipeline;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onDisconnect: (id: string) => void;
  onReconnect: (id: string, sourceId: string) => void;
  onAddBranch: (stepId: string, target: string) => void;
  onRemoveBranch: (branchId: string) => void;
  onAddProcessor: (afterId: string, kind: StepKind) => void;
}) {
  return (
    <div className="space-y-0">
      {pipeline.steps.map((step, i) => {
        const prev = pipeline.steps[i - 1];
        return (
          <div key={step.id}>
            {prev && (
              <Connector
                connected={step.inputs.includes(prev.id)}
                enabled={prev.enabled && step.enabled}
                label={`${prev.title} → ${step.title}`}
                sources={pipeline.steps.slice(0, i).map((s) => ({ id: s.id, title: s.title }))}
                onDisconnect={() => onDisconnect(step.id)}
                onReconnect={(sourceId) => onReconnect(step.id, sourceId)}
                onInsert={(kind) => onAddProcessor(prev.id, kind)}
              />
            )}
            <StepCard
              step={step}
              selected={selectedId === step.id}
              branches={pipeline.branches.filter((b) => b.stepId === step.id)}
              onSelect={() => onSelect(step.id)}
              onToggle={(v) => onToggle(step.id, v)}
              onMove={(d) => onMove(step.id, d)}
              onRemove={() => onRemove(step.id)}
              onAddBranch={(t) => onAddBranch(step.id, t)}
              onRemoveBranch={onRemoveBranch}
            />
          </div>
        );
      })}
    </div>
  );
}

function Connector({
  connected,
  enabled,
  label,
  sources,
  onDisconnect,
  onReconnect,
  onInsert,
}: {
  connected: boolean;
  enabled: boolean;
  label: string;
  sources: { id: string; title: string }[];
  onDisconnect: () => void;
  onReconnect: (sourceId: string) => void;
  onInsert: (kind: StepKind) => void;
}) {
  const [hover, setHover] = useState(false);
  const state = !connected ? "invalid" : enabled ? "valid" : "uncertain";

  return (
    <div
      className="group relative flex h-9 items-center justify-center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span
        aria-hidden
        className={cn(
          "absolute h-full w-px transition-colors",
          state === "valid" && "bg-valid",
          state === "uncertain" && "bg-uncertain",
          state === "invalid" && "bg-border",
          hover && "w-0.5",
        )}
      />
      {connected ? (
        <div className="relative z-10 flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center border bg-card",
                  STATE_CLASS[state],
                )}
              >
                <ArrowDown className="h-2.5 w-2.5" aria-hidden />
              </span>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
          {hover && (
            <>
              <button
                type="button"
                aria-label={`Remove connection ${label}`}
                onClick={onDisconnect}
                className="flex h-4 w-4 items-center justify-center border border-invalid bg-card text-invalid hover:bg-invalid/10"
              >
                <X className="h-2.5 w-2.5" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Insert a processor into this connection"
                    className="flex h-4 w-4 items-center justify-center border border-navy bg-card text-navy hover:bg-secondary"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  {(["filter", "aggregate", "transform", "sort", "missing", "join", "compare"] as StepKind[]).map((k) => (
                    <DropdownMenuItem key={k} onSelect={() => onInsert(k)} className="text-xs">
                      {STEP_LABEL[k]} processor
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative z-10 border border-dashed border-invalid bg-card px-2 py-0.5 text-[10px] font-semibold text-invalid"
            >
              Disconnected · reconnect
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {sources.map((s) => (
              <DropdownMenuItem key={s.id} onSelect={() => onReconnect(s.id)} className="text-xs">
                <span className="mr-2 inline-block h-2 w-2 bg-valid" aria-hidden /> Connect from {s.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function StepCard({
  step,
  selected,
  branches,
  onSelect,
  onToggle,
  onMove,
  onRemove,
  onAddBranch,
  onRemoveBranch,
}: {
  step: PipelineStep;
  selected: boolean;
  branches: { id: string; target: string }[];
  onSelect: () => void;
  onToggle: (v: boolean) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
  onAddBranch: (target: string) => void;
  onRemoveBranch: (branchId: string) => void;
}) {
  const Icon = ICONS[step.kind];

  return (
    <div
      className={cn(
        "border bg-card transition-colors",
        selected ? "border-primary" : "border-border",
        !step.enabled && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={onSelect}
          aria-expanded={selected}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0">
            <span className="label-caps block text-muted-foreground">{STEP_LABEL[step.kind]}</span>
            <span className="mt-0.5 block truncate text-sm font-medium text-navy">{step.title}</span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">{summarize(step)}</span>
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="hidden text-[10px] text-muted-foreground sm:inline">
            {step.enabled ? "Enabled" : "Disabled"}
          </span>
          <Switch
            checked={step.enabled}
            onCheckedChange={onToggle}
            aria-label={`${step.enabled ? "Disable" : "Enable"} ${step.title}`}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" aria-label={`${step.title} options`}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onSelect} className="text-xs">Open configuration</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onMove(-1)} className="text-xs">Move up</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onMove(1)} className="text-xs">Move down</DropdownMenuItem>
              <DropdownMenuSeparator />
              {BRANCH_TARGETS.map((t) => (
                <DropdownMenuItem key={t} onSelect={() => onAddBranch(t)} className="text-xs">
                  <span
                    className={cn(
                      "mr-2 inline-block h-2 w-2",
                      branchState(step, t) === "valid" && "bg-valid",
                      branchState(step, t) === "invalid" && "bg-invalid",
                      branchState(step, t) === "uncertain" && "bg-uncertain",
                    )}
                    aria-hidden
                  />
                  Send output to {t}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onRemove} className="text-xs text-invalid">
                Remove modifier
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {branches.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
          {branches.map((b) => {
            const state = branchState(step, b.target);
            return (
              <span
                key={b.id}
                className={cn("flex items-center gap-1 border bg-card px-1.5 py-0.5 text-[10px]", STATE_CLASS[state])}
              >
                {b.target === "Table" ? (
                  <TableIcon className="h-2.5 w-2.5" aria-hidden />
                ) : b.target === "CSV" ? (
                  <FileDown className="h-2.5 w-2.5" aria-hidden />
                ) : (
                  <BarChart3 className="h-2.5 w-2.5" aria-hidden />
                )}
                {b.target}
                <button
                  type="button"
                  aria-label={`Remove ${b.target} connection`}
                  onClick={() => onRemoveBranch(b.id)}
                  className="ml-0.5 hover:text-invalid"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {selected && (
        <p className="flex items-center gap-1 border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
          <ChevronDown className="h-3 w-3" aria-hidden /> Configuration open in the panel
        </p>
      )}
    </div>
  );
}
