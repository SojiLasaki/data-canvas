import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ChevronDown, Layers, Send, Sparkles, Workflow } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/SiteHeader";
import { ResultChart } from "@/components/result/ResultChart";
import { ResultTable } from "@/components/result/ResultTable";
import { PipelineStack } from "@/components/result/PipelineStack";
import { StepDetails } from "@/components/result/StepDetails";
import { SourcePanel } from "@/components/result/SourcePanel";
import { InlineCanvas } from "@/components/result/InlineCanvas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { buildPipeline, makeStep, runPipeline, stepId } from "@/lib/pipeline/engine";
import { applyCommand } from "@/lib/pipeline/nl";
import { pipelineStore } from "@/lib/pipeline/store";
import type { Pipeline, StepKind } from "@/lib/pipeline/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/result")({
  validateSearch: z.object({ q: z.string().optional() }),
  component: ResultPage,
  head: () => ({
    meta: [
      { title: "Data Answer · MISO Navigator" },
      {
        name: "description",
        content:
          "Get the MISO data you asked for as a chart, table and download — then open the modifier stack to see exactly how it was created.",
      },
      { property: "og:title", content: "Data Answer · MISO Navigator" },
      {
        property: "og:description",
        content: "Charts, tables and downloads for MISO market data, with a fully inspectable modifier stack.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ResultPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const prompt = q?.trim() || "MISO load over the last 30 days";

  const [pipeline, setPipeline] = useState<Pipeline>(() => buildPipeline(prompt));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [command, setCommand] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [canvasOpen, setCanvasOpen] = useState(false);


  useEffect(() => {
    setPipeline(buildPipeline(prompt));
    setSelectedId(null);
    setLog([]);
  }, [prompt]);

  const result = useMemo(() => runPipeline(pipeline), [pipeline]);
  const viz = pipeline.steps.find((s) => s.kind === "visualization");
  const chartType = viz?.params["type"] ?? "Line chart";
  const selected = pipeline.steps.find((s) => s.id === selectedId) ?? null;

  const update = useCallback((next: Pipeline) => setPipeline({ ...next, steps: [...next.steps] }), []);

  const setParam = (id: string, key: string, value: string) =>
    setPipeline((p) => ({
      ...p,
      steps: p.steps.map((s) => (s.id === id ? { ...s, params: { ...s.params, [key]: value } } : s)),
    }));

  const toggleStep = (id: string, enabled: boolean) =>
    setPipeline((p) => ({ ...p, steps: p.steps.map((s) => (s.id === id ? { ...s, enabled } : s)) }));

  const moveStep = (id: string, direction: -1 | 1) =>
    setPipeline((p) => {
      const i = p.steps.findIndex((s) => s.id === id);
      const j = i + direction;
      if (i < 0 || j < 0 || j >= p.steps.length) return p;
      const steps = [...p.steps];
      const a = steps[i]!;
      const b = steps[j]!;
      steps[i] = b;
      steps[j] = a;
      return { ...p, steps: relink(steps) };
    });

  const removeStep = (id: string) =>
    setPipeline((p) => ({
      ...p,
      steps: relink(p.steps.filter((s) => s.id !== id)),
      branches: p.branches.filter((b) => b.stepId !== id),
    }));

  const disconnect = (id: string) =>
    setPipeline((p) => ({ ...p, steps: p.steps.map((s) => (s.id === id ? { ...s, inputs: [] } : s)) }));

  const reconnect = (id: string, sourceId: string) =>
    setPipeline((p) => ({
      ...p,
      steps: p.steps.map((s) => (s.id === id ? { ...s, inputs: [sourceId] } : s)),
    }));

  const addProcessor = (afterId: string, kind: StepKind) =>
    setPipeline((p) => {
      const i = p.steps.findIndex((s) => s.id === afterId);
      const steps = [...p.steps];
      steps.splice(i + 1, 0, makeStep(kind));
      return { ...p, steps: relink(steps) };
    });

  const addBranch = (stepIdValue: string, target: string) =>
    setPipeline((p) =>
      p.branches.some((b) => b.stepId === stepIdValue && b.target === target)
        ? p
        : { ...p, branches: [...p.branches, { id: stepId("branch"), stepId: stepIdValue, target }] },
    );

  const removeBranch = (branchId: string) =>
    setPipeline((p) => ({ ...p, branches: p.branches.filter((b) => b.id !== branchId) }));

  const setChannel = (attribute: string, channel: string) =>
    setPipeline((p) => ({ ...p, channels: { ...p.channels, [attribute]: channel } }));

  const ask = (text: string) => {
    const res = applyCommand(pipeline, text);
    update(res.pipeline);
    if (res.changedStepId) setSelectedId(res.changedStepId);
    setLog((l) => [...l, `You: ${text}`, `MISO AI: ${res.reply}`]);
  };

  const openInCanvas = () => {
    pipelineStore.save(pipeline);
    toast.success("Workflow sent to the Data Canvas");
    void navigate({ to: "/canvas", search: { from: "result" } });
  };

  const advancedPanel = (
    <Tabs defaultValue="modifiers" className="flex min-h-0 flex-1 flex-col gap-0">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="modifiers">Modifiers</TabsTrigger>
        <TabsTrigger value="sources">Sources</TabsTrigger>
      </TabsList>
      <TabsContent value="modifiers" className="min-h-0 flex-1 space-y-3 overflow-y-auto pt-3">
        <PipelineStack
          pipeline={pipeline}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
          onToggle={toggleStep}
          onMove={moveStep}
          onRemove={removeStep}
          onDisconnect={disconnect}
          onReconnect={reconnect}
          onAddBranch={addBranch}
          onRemoveBranch={removeBranch}
          onAddProcessor={addProcessor}
        />
        {selected && (
          <StepDetails
            pipeline={pipeline}
            step={selected}
            onParam={(k, v) => setParam(selected.id, k, v)}
            onToggle={(v) => toggleStep(selected.id, v)}
            onAddBranch={(t) => addBranch(selected.id, t)}
            onClose={() => setSelectedId(null)}
          />
        )}
        <Button variant="outline" size="sm" className="w-full" onClick={openInCanvas}>
          <Workflow className="mr-1.5 h-3.5 w-3.5" /> Open this workflow in Canvas
        </Button>
      </TabsContent>
      <TabsContent value="sources" className="min-h-0 flex-1 overflow-y-auto pt-3">
        <SourcePanel pipeline={pipeline} onChannel={setChannel} />
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <div className="min-w-0 flex-1 space-y-5">
          <div>
            <p className="label-caps text-muted-foreground">Your question</p>
            <h1 className="mt-1 text-xl font-semibold text-navy">{result.title}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{result.subtitle}</p>
          </div>

          {/* AI answer */}
          <section className="border border-border bg-card px-4 py-3">
            <p className="label-caps flex items-center gap-1.5 text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" aria-hidden /> Answer
            </p>
            <p className="mt-1.5 text-sm text-navy">{result.narrative}</p>
            {result.disabledNote && (
              <p className="mt-1.5 border-l-2 border-uncertain pl-2 text-xs text-uncertain">{result.disabledNote}</p>
            )}
            <dl className="mt-3 grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
              {result.stats.map((s) => (
                <div key={s.label} className="bg-card px-3 py-2">
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</dt>
                  <dd className="text-sm font-semibold tabular-nums text-navy">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Primary result */}
          {chartType !== "Table" && (
            <section className="border border-border bg-card px-4 py-3" aria-label="Result chart">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-navy">
                  {viz?.params["title"] || result.title}
                </h2>
                <span className="text-[11px] text-muted-foreground">{result.unit}</span>
              </div>
              <ResultChart
                result={result}
                type={chartType}
                legend={viz?.params["legend"] !== "Disabled"}
                grid={viz?.params["grid"] !== "Disabled"}
              />
            </section>
          )}

          <section className="border border-border bg-card px-4 py-3">
            <ResultTable result={result} onOpenInCanvas={openInCanvas} />
          </section>

          {/* Ask a follow-up — same pipeline the controls edit */}
          <section className="border border-border bg-card px-4 py-3">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!command.trim()) return;
                ask(command.trim());
                setCommand("");
              }}
            >
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Refine in plain language — e.g. “make this weekly” or “only show Michigan”"
                aria-label="Refine this result"
              />
              <Button type="submit" size="sm">
                <Send className="mr-1.5 h-3.5 w-3.5" /> Ask
              </Button>
            </form>
            {log.length > 0 && (
              <div className="mt-2 space-y-1">
                {log.slice(-6).map((line, i) => (
                  <p
                    key={`${line}-${i}`}
                    className={cn("text-xs", line.startsWith("You:") ? "text-muted-foreground" : "text-navy")}
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}
          </section>

          {/* Progressive disclosure */}
          <div className="lg:hidden">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Layers className="mr-1.5 h-4 w-4" /> Show how this data was created
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85vh]">
                <DrawerHeader>
                  <DrawerTitle className="text-sm">How this data was created</DrawerTitle>
                </DrawerHeader>
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6">{advancedPanel}</div>
              </DrawerContent>
            </Drawer>
          </div>

          <div className="hidden lg:block">
            <Button variant="ghost" size="sm" onClick={() => setAdvanced((a) => !a)} aria-expanded={advanced}>
              <ChevronDown className={cn("mr-1.5 h-4 w-4 transition-transform", advanced && "rotate-180")} />
              {advanced ? "Hide" : "Show"} how this data was created
            </Button>
            <span className="ml-2 text-xs text-muted-foreground">
              {pipeline.steps.filter((s) => s.enabled).length} active steps ·{" "}
              {pipeline.sources.length} sources ·{" "}
              <Link to="/canvas" search={{}} className="text-primary hover:underline">
                node canvas
              </Link>
            </span>
          </div>

          {/* Hidden node canvas — expands in place at the bottom of the page */}
          <section className="border border-border bg-card" aria-label="Node canvas">
            <button
              type="button"
              onClick={() => setCanvasOpen((c) => !c)}
              aria-expanded={canvasOpen}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-navy">
                <Workflow className="h-4 w-4 text-primary" aria-hidden /> Node canvas
                <span className="text-xs font-normal text-muted-foreground">
                  {pipeline.steps.length} nodes · same workflow as above
                </span>
              </span>
              <ChevronDown
                className={cn("h-4 w-4 text-muted-foreground transition-transform", canvasOpen && "rotate-180")}
                aria-hidden
              />
            </button>
            {canvasOpen && (
              <div className="space-y-2 border-t border-border p-3">
                <InlineCanvas pipeline={pipeline} />
                <Button variant="outline" size="sm" onClick={openInCanvas}>
                  <Workflow className="mr-1.5 h-3.5 w-3.5" /> Open in full canvas
                </Button>
              </div>
            )}
          </section>

        </div>

        {/* Advanced column */}
        {advanced && (
          <aside
            className="hidden w-96 shrink-0 flex-col border-l border-border pl-4 lg:flex"
            aria-label="How this data was created"
          >
            <p className="label-caps pb-2 text-muted-foreground">How this data was created</p>
            {advancedPanel}
          </aside>
        )}
      </main>
    </div>
  );
}

/** Keep the linear chain intact after inserts, deletes and reorders. */
function relink(steps: Pipeline["steps"]): Pipeline["steps"] {
  return steps.map((s, i) => {
    const prev = steps[i - 1];
    const keep = s.inputs.filter((id) => steps.some((o, j) => o.id === id && j < i));
    return { ...s, inputs: keep.length ? keep : prev ? [prev.id] : [] };
  });
}
