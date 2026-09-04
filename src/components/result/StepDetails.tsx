import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { STEP_LABEL, summarize } from "@/lib/pipeline/engine";
import type { Pipeline, PipelineStep } from "@/lib/pipeline/types";
import { BRANCH_TARGETS, branchState } from "./PipelineStack";

export function StepDetails({
  pipeline,
  step,
  onParam,
  onToggle,
  onAddBranch,
  onClose,
}: {
  pipeline: Pipeline;
  step: PipelineStep;
  onParam: (key: string, value: string) => void;
  onToggle: (enabled: boolean) => void;
  onAddBranch: (target: string) => void;
  onClose: () => void;
}) {
  const index = pipeline.steps.findIndex((s) => s.id === step.id);
  const inputs = step.inputs.length
    ? step.inputs.map((id) => pipeline.steps.find((s) => s.id === id)?.title ?? "Detached")
    : ["No input connected"];
  const downstream = pipeline.steps.filter((s) => s.inputs.includes(step.id)).map((s) => s.title);
  const branches = pipeline.branches.filter((b) => b.stepId === step.id).map((b) => b.target);

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div>
          <p className="label-caps text-muted-foreground">{STEP_LABEL[step.kind]}</p>
          <p className="text-sm font-semibold text-navy">{step.title}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
          Close
        </Button>
      </div>

      <div className="space-y-3 px-3 py-3">
        {step.specs.map((spec) => (
          <div key={spec.key}>
            <label className="mb-1 block text-[11px] text-muted-foreground" htmlFor={`${step.id}-${spec.key}`}>
              {spec.label}
            </label>
            {spec.options ? (
              <Select value={step.params[spec.key] ?? ""} onValueChange={(v) => onParam(spec.key, v)}>
                <SelectTrigger id={`${step.id}-${spec.key}`} className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {spec.options.map((o) => (
                    <SelectItem key={o} value={o} className="text-xs">
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`${step.id}-${spec.key}`}
                value={step.params[spec.key] ?? ""}
                onChange={(e) => onParam(spec.key, e.target.value)}
                placeholder={summarize(step)}
                className="h-8 text-xs"
              />
            )}
          </div>
        ))}

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-navy">{step.enabled ? "Enabled" : "Disabled"}</span>
          <Switch checked={step.enabled} onCheckedChange={onToggle} aria-label="Toggle modifier" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-border bg-border">
        <div className="bg-card px-3 py-2">
          <p className="label-caps text-muted-foreground">Inputs</p>
          {inputs.map((t) => (
            <p key={t} className="mt-1 text-xs text-navy">{t}</p>
          ))}
        </div>
        <div className="bg-card px-3 py-2">
          <p className="label-caps text-muted-foreground">Outputs</p>
          {[...downstream, ...branches].length ? (
            [...downstream, ...branches].map((t) => (
              <p key={t} className="mt-1 text-xs text-navy">{t}</p>
            ))
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Not connected</p>
          )}
          <p className="mt-1 text-[10px] text-muted-foreground">Step {index + 1} of {pipeline.steps.length}</p>
        </div>
      </div>

      <div className="border-t border-border px-3 py-2">
        <p className="label-caps text-muted-foreground">Connect output to</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {BRANCH_TARGETS.map((t) => {
            const state = branchState(step, t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => onAddBranch(t)}
                className={cn(
                  "border px-1.5 py-0.5 text-[10px] transition-colors hover:bg-secondary",
                  state === "valid" && "border-valid text-valid",
                  state === "invalid" && "border-invalid text-invalid",
                  state === "uncertain" && "border-uncertain text-uncertain",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
